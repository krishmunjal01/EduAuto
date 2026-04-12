import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const applyLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { type, fromDate, toDate, reason } = req.body;
    const leave = await prisma.leave.create({
      data: {
        school_id: req.user!.school_id,
        user_id: req.user!.id,
        type, 
        from_date: new Date(fromDate),
        to_date: new Date(toDate),
        reason
      }
    });

    res.json({ leave });
  } catch (err) {
    res.status(500).json({ error: 'Server error creating leave' });
  }
};

export const getLeaves = async (req: AuthRequest, res: Response) => {
  try {
    let leaves;
    if (req.user!.role === 'admin') {
      leaves = await prisma.leave.findMany({
        where: { school_id: req.user!.school_id },
        include: { user: true }
      });
    } else {
      leaves = await prisma.leave.findMany({
        where: { user_id: req.user!.id, school_id: req.user!.school_id },
        include: { user: true }
      });
    }

    const formatted = leaves.map(l => ({
      id: l.id,
      applicantId: l.user_id,
      applicantName: l.user.name,
      applicantEmail: l.user.email,
      type: l.type,
      fromDate: l.from_date.toISOString().split('T')[0],
      toDate: l.to_date.toISOString().split('T')[0],
      reason: l.reason,
      status: l.status,
    }));

    res.json({ leaves: formatted });
  } catch(e) {
    res.status(500).json({ error: 'Server error fetching leaves' });
  }
};

export const approveLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const leaveId = req.params.id;

    const leave = await prisma.leave.update({
      where: { id: leaveId },
      data: { status, approved_by: req.user!.id }
    });

    // If leave is approved and is a teacher, we might trigger substitutions.
    // However, I designed Substitution generation dynamically on frontend or via admin.
    // In a real app we'd auto-generate substitution records here.

    res.json({ leave });
  } catch(e) {
    res.status(500).json({ error: 'Failed to update leave' });
  }
};
