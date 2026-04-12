import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const saveVerifiedResult = async (req: AuthRequest, res: Response) => {
  try {
    const { testId, sectionId, studentRoll, marks, imageUrl } = req.body;
    
    // Find Student by Roll
    const student = await prisma.student.findFirst({
      where: { 
        school_id: req.user!.school_id, 
        section_id: sectionId,
        roll_number: String(studentRoll) // match precise string
      }
    });

    if (!student) return res.status(404).json({ error: 'Student not found in this section' });

    // Group by section and date (to prevent duplicate test entities for a single report batch)
    const today = new Date();
    today.setHours(0,0,0,0);

    let test = await prisma.test.findFirst({
      where: {
        section_id: sectionId,
        date: { gte: today },
        title: 'Report Upload'
      }
    });

    if (!test) {
      test = await prisma.test.create({
        data: {
          teacher_id: req.user!.id,
          section_id: sectionId,
          title: 'Report Upload',
          date: new Date()
        }
      });
    }

    const result = await prisma.result.create({
      data: {
        test_id: test.id,
        student_id: student.id,
        marks: parseInt(marks, 10),
        image_url: imageUrl,
        verified: true
      }
    });

    await prisma.auditLog.create({
      data: {
        school_id: req.user!.school_id,
        user_id: req.user!.id,
        action: 'result_saved',
        entity: 'Result',
        entity_id: result.id
      }
    });

    // Create Notification for the Parent (students are linked to parents via parentStudents)
    const parentStudent = await prisma.parentStudent.findFirst({
      where: { student_id: student.id },
      include: { parent: true }
    });

    if (parentStudent?.parent) {
      await prisma.notification.create({
        data: {
          school_id: req.user!.school_id,
          user_id: parentStudent.parent.id,
          title: `Result Published: ${student.name}`,
          message: `${student.name}'s result for ${test.title} has been verified and published. Marks: ${marks}%`
        }
      });
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving result' });
  }
};
