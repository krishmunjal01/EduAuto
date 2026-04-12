import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getTimetables = async (req: AuthRequest, res: Response) => {
  try {
    const timetables = await prisma.timetable.findMany({
      where: { school_id: req.user!.school_id },
      include: { section: true, teacher: true }
    });

    // Need to map flat DB timetables into the 2D grid structure the UI expects
    // Frontend expects: { id, sectionId, sectionName, grid: { "Monday": [{subject, teacherName}], ... } }
    
    // Group by section
    const grouped: Record<string, any> = {};
    
    for (const tt of timetables) {
      if (!grouped[tt.section.id]) {
        grouped[tt.section.id] = {
          id: tt.section.id,
          sectionId: tt.section.id,
          sectionName: tt.section.section_name,
          periodsPerDay: 8,
          days: new Set<string>(),
          grid: {}
        };
      }
      
      const g = grouped[tt.section.id];
      g.days.add(tt.day_of_week);
      
      if (!g.grid[tt.day_of_week]) {
        g.grid[tt.day_of_week] = Array.from({ length: 8 }, () => ({ subject: 'Free', teacherEmail: '', teacherName: '-' }));
      }
      
      g.grid[tt.day_of_week][tt.period_number - 1] = {
        subject: tt.subject,
        teacherEmail: tt.teacher?.email.toLowerCase() || '',
        teacherName: tt.teacher?.name || '-'
      };
    }
    
    // Convert days Sets to sorted arrays
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const key of Object.keys(grouped)) {
      grouped[key].days = [...grouped[key].days].sort((a: string, b: string) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    }

    res.json({ timetables: Object.values(grouped) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching timetables' });
  }
};

export const saveTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, grid } = req.body;
    
    // Grid format: { "Monday": [ { subject, teacherEmail, teacherName } ] }
    if (!sectionId || !grid) return res.status(400).json({ error: "Missing sectionId or grid" });

    // Clean old timetable for this section
    await prisma.timetable.deleteMany({
      where: { school_id: req.user!.school_id, section_id: sectionId }
    });

    // Rebuild
    const creations: any[] = [];
    for (const day of Object.keys(grid)) {
      const periods = grid[day];
      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        if (p.subject && p.subject !== 'Free') {
          let teacherId = null;
          if (p.teacherEmail) {
             const t = await prisma.user.findUnique({ where: { email: p.teacherEmail.toLowerCase() } });
             if (t) teacherId = t.id;
          }

          creations.push({
            school_id: req.user!.school_id,
            section_id: sectionId,
            day_of_week: day,
            period_number: i + 1,
            subject: p.subject,
            teacher_id: teacherId
          });
        }
      }
    }

    // Use individual creates in a transaction for SQLite compatibility
    if (creations.length > 0) {
      await prisma.$transaction(
        creations.map(c => prisma.timetable.create({ data: c }))
      );
    }

    // Auto-create TeacherSection links for all teachers assigned to this section's timetable
    const uniqueTeacherIds = [...new Set(creations.map(c => c.teacher_id).filter(Boolean))];
    for (const teacherId of uniqueTeacherIds) {
      const exists = await prisma.teacherSection.findFirst({
        where: { teacher_id: teacherId as string, section_id: sectionId }
      });
      if (!exists) {
        await prisma.teacherSection.create({
          data: { teacher_id: teacherId as string, section_id: sectionId }
        });
      }
    }

    console.log(`Timetable saved: ${creations.length} slots for section ${sectionId}, linked ${uniqueTeacherIds.length} teachers`);
    res.json({ message: 'Timetable saved successfully', count: creations.length });
  } catch (err) {
    console.error('Timetable save error:', err);
    res.status(500).json({ error: 'Server error saving timetable' });
  }
};

export const deleteTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const sectionId = req.params.id;
    
    await prisma.timetable.deleteMany({
      where: { school_id: req.user!.school_id, section_id: sectionId }
    });

    res.json({ message: 'Timetable deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting timetable' });
  }
};

export const getSubstitutions = async (req: AuthRequest, res: Response) => {
  try {
    const substitutions = await prisma.substitution.findMany({
      where: { school_id: req.user!.school_id },
      include: {
        section: true,
        absent_teacher: true,
        substitute_teacher: true
      }
    });

    const formatted = substitutions.map(sub => ({
      id: sub.id,
      timetableId: sub.timetable_id || '',
      sectionName: sub.section.section_name,
      day: sub.day,
      periodIndex: sub.period_index,
      subject: sub.subject,
      absentTeacherEmail: sub.absent_teacher.email,
      absentTeacherName: sub.absent_teacher.name,
      substituteTeacherEmail: sub.substitute_teacher?.email || '',
      substituteTeacherName: sub.substitute_teacher?.name || '',
      status: sub.status,
      leaveRequestId: sub.leave_request_id || '',
      date: sub.date.toISOString(),
    }));

    res.json({ substitutions: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching substitutions' });
  }
};

export const updateSubstitution = async (req: AuthRequest, res: Response) => {
  try {
    const subId = req.params.id;
    const { substituteTeacherEmail } = req.body;
    
    // Find substitute
    let subUserId = null;
    if (substituteTeacherEmail) {
      const user = await prisma.user.findFirst({
        where: { email: substituteTeacherEmail, school_id: req.user!.school_id }
      });
      if (!user) return res.status(404).json({ error: 'Substitute teacher not found' });
      subUserId = user.id;
    }

    const updated = await prisma.substitution.update({
      where: { id: subId },
      data: {
        substitute_teacher_id: subUserId,
        status: subUserId ? 'assigned' : 'pending'
      }
    });

    res.json({ message: 'Substitution assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating substitution' });
  }
};
