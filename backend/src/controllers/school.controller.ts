import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

// Get whole school's info
export const getSchoolInfo = async (req: AuthRequest, res: Response) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.user!.school_id }
    });
    // Add stats
    const studentCount = await prisma.student.count({ where: { school_id: req.user!.school_id } });
    const teacherCount = await prisma.user.count({ where: { school_id: req.user!.school_id, role: 'teacher' } });
    const sectionCount = await prisma.section.count({ where: { school_id: req.user!.school_id } });

    res.json({
      school: {
        ...school,
        name: school?.school_name, // Map for UI compatibility
        attendanceMode: 'subject_wise' // UI compatibility fallback
      },
      stats: {
        studentCount,
        teacherCount,
        sectionCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Global students view
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      where: { school_id: req.user!.school_id },
      include: { section: true }
    });
    
    // Map to frontend expectation
    const formatted = students.map(st => ({
      id: st.student_id,
      studentId: st.student_id,
      name: st.name,
      rollNo: st.roll_number,
      parentName: st.parent_name,
      parentPhone: st.parent_phone,
      sectionId: st.section_id,
      sectionName: st.section?.section_name
    }));

    res.json({ students: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching students' });
  }
};

// Audit Logs
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { school_id: req.user!.school_id },
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: 100 // limit
    });
    
    const formatted = logs.map(l => ({
      id: l.id,
      action: l.action,
      user: l.user?.name || 'System',
      role: l.user?.role || 'system',
      details: l.entity_id ? `${l.entity} (${l.entity_id})` : '',
      timestamp: l.timestamp.toISOString()
    }));

    res.json({ logs: formatted });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    const formatted = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: 'info', // schema currently doesn't store type
      roleTarget: req.user!.role,
      read: n.is_read,
      timestamp: n.createdAt.toISOString()
    }));

    res.json({ notifications: formatted });
  } catch(e) {
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, user_id: req.user!.id },
      data: { is_read: true }
    });
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Failed to update' });
  }
};
