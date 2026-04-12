import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getAttendanceRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { date, sectionId } = req.query;
    let whereClause: any = { school_id: req.user!.school_id };
    
    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setUTCHours(0,0,0,0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      whereClause.date = { gte: targetDate, lt: nextDay };
    }
    if (sectionId) {
      whereClause.section_id = sectionId;
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: { student: true, section: true }
    });

    const formatted = records.map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student.name,
      sectionId: r.section_id,
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      markedBy: r.marked_by
    }));

    res.json({ records: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error API' });
  }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, date, records, mode } = req.body;
    let targetDate = new Date();
    if (date) targetDate = new Date(date);
    targetDate.setUTCHours(12,0,0,0); // normalize

    let created = 0;
    let updated = 0;

    for (const r of records) {
      // Find existing
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      const prevDay = new Date(targetDate);
      prevDay.setDate(targetDate.getDate() - 1);

      let whereFilter: any = { 
        student_id: r.studentId, 
        date: { gte: prevDay, lt: nextDay },
        section_id: sectionId
      };
      
      if (mode === 'subject_wise') {
        whereFilter.marked_by = req.user!.id;
      }

      const existing = await prisma.attendance.findFirst({
         where: whereFilter
      });
      if (existing) {
         await prisma.attendance.update({ where: { id: existing.id }, data: { status: r.status }});
         updated++;
      } else {
         await prisma.attendance.create({
           data: {
             school_id: req.user!.school_id,
             student_id: r.studentId,
             section_id: sectionId,
             date: targetDate,
             status: r.status,
             marked_by: req.user!.id
           }
         });
         created++;
      }
    }
    
    // Log
    await prisma.auditLog.create({
      data: {
        school_id: req.user!.school_id,
        user_id: req.user!.id,
        action: 'attendance_marked',
        entity: 'Section',
        entity_id: sectionId
      }
    });

    res.json({ message: `Attendance saved. ${created} new, ${updated} updated.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error marking attendance' });
  }
};

export const getCorrections = async (req: AuthRequest, res: Response) => {
  try {
    const corrections = await prisma.attendanceCorrection.findMany({
      where: { school_id: req.user!.school_id },
      include: { attendance: { include: { student: true, section: true } } }
    });

    const formatted = corrections.map(c => ({
      id: c.id,
      attendanceId: c.attendance_id,
      studentName: c.attendance.student.name,
      date: c.attendance.date.toISOString().split('T')[0],
      oldStatus: c.attendance.status,
      newStatus: c.new_status || '',
      reason: c.reason,
      status: c.status,
      requestedBy: c.requested_by,
      reviewedBy: c.reviewed_by || undefined
    }));
    res.json({ corrections: formatted });
  } catch(e) {
    res.status(500).json({ error: 'Server error fetching corrections' });
  }
};

export const createCorrection = async (req: AuthRequest, res: Response) => {
  try {
    const { attendanceId, newStatus, reason } = req.body;
    
    const c = await prisma.attendanceCorrection.create({
      data: {
        school_id: req.user!.school_id,
        attendance_id: attendanceId,
        new_status: newStatus,
        reason,
        requested_by: req.user!.id
      }
    });
    res.json({ correction: c });
  } catch(e) {
    res.status(500).json({ error: 'Failed to create correction' });
  }
};

export const updateCorrectionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    
    const corr = await prisma.attendanceCorrection.update({
      where: { id },
      data: { status, reviewed_by: req.user!.id }
    });

    if (status === 'approved' && corr.new_status) {
      await prisma.attendance.update({
        where: { id: corr.attendance_id },
        data: { status: corr.new_status }
      });
    }

    res.json({ message: 'Status updated' });
  } catch(e) {
    res.status(500).json({ error: 'Failed to update' });
  }
};
