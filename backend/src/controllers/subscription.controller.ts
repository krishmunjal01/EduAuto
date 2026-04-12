import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

/**
 * Get current school subscription status
 */
export const getSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.school_id;

    const schoolData = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        subscription_plan: true,
        plan_valid_till: true,
        // messages_used_this_month: true // Temp: bypassing typed select to fix the 500 error
      }
    }) as any;

    if (!schoolData) return res.status(404).json({ error: 'School not found' });

    // Fetch the full record to read the new field without selection validation
    const schoolFull = await prisma.school.findUnique({ where: { id: schoolId } }) as any;
    const messagesUsed = schoolFull?.messages_used_this_month || 0;

    // Fetch real student count
    const studentCount = await prisma.student.count({
      where: { school_id: schoolId }
    });

    // Map to frontend expectation
    const planLimits: Record<string, { maxStudents: number; maxMessages: number; ai: boolean }> = {
      free: { maxStudents: 50, maxMessages: 100, ai: false },
      pro: { maxStudents: 500, maxMessages: 2000, ai: true },
      enterprise: { maxStudents: 99999, maxMessages: 99999, ai: true }
    };

    const limits = planLimits[schoolData.subscription_plan as keyof typeof planLimits] || planLimits.free;

    res.json({
      plan: schoolData.subscription_plan,
      maxStudents: limits.maxStudents,
      maxMessagesPerMonth: limits.maxMessages,
      messagesUsedThisMonth: messagesUsed,
      studentCount: studentCount,
      validTill: schoolData.plan_valid_till?.toISOString().split('T')[0] || 'N/A',
      aiInsightsEnabled: limits.ai
    });
  } catch (err) {
    console.error('Subscription fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription status: ' + (err as any).message });
  }
};

/**
 * Upgrade subscription
 */
export const upgradeSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body;
    
    if (!['free', 'pro', 'enterprise'].includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const validTill = new Date();
    validTill.setMonth(validTill.getMonth() + 1);

    const updated = await prisma.school.update({
      where: { id: req.user!.school_id },
      data: {
        subscription_plan: planId,
        plan_valid_till: validTill
      }
    });

    await prisma.auditLog.create({
      data: {
        school_id: req.user!.school_id,
        user_id: req.user!.id,
        action: 'subscription_upgrade',
        entity: 'School',
        entity_id: req.user!.school_id
      }
    });

    res.json({ success: true, plan: updated.subscription_plan });
  } catch (err) {
    console.error('Subscription upgrade error:', err);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
};
