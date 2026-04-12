import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import axios from 'axios';

const prisma = new PrismaClient();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

/**
 * Normalize a phone number to E.164 format.
 * Handles Indian 10-digit numbers, numbers with country codes, and various separators.
 */
function normalizePhone(phone: string): string {
  if (!phone || phone.trim() === '') return '';

  // Strip spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Already in E.164 with +
  if (cleaned.startsWith('+')) return cleaned;

  // 12 digits starting with 91 (India, no +)
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;

  // 10-digit Indian mobile number
  if (cleaned.length === 10) return `+91${cleaned}`;

  // Fallback: just add +
  return `+${cleaned}`;
}

/**
 * Send a WhatsApp text message via the Meta Cloud API (v21.0)
 */
async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; whatsappTo?: string; error?: string }> {
  const whatsappTo = normalizePhone(phone);

  if (!whatsappTo || whatsappTo === '+') {
    return { success: false, error: 'Invalid or missing phone number' };
  }

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return { success: false, error: 'WhatsApp API credentials not configured' };
  }

  try {
    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: whatsappTo,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10s timeout
      }
    );

    const messageId = response.data?.messages?.[0]?.id;
    console.log(`✅ WhatsApp sent to ${whatsappTo} | msgId: ${messageId}`);
    return { success: true, messageId, whatsappTo };
  } catch (err: any) {
    const apiError = err.response?.data?.error?.message || err.message || 'WhatsApp API error';
    console.error(`❌ WhatsApp failed to ${whatsappTo}:`, apiError);
    return { success: false, whatsappTo, error: apiError };
  }
}

/**
 * GET /messages
 * Returns the school's notification queue
 */
export const getMessagesQueue = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { school_id: req.user!.school_id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const messages = notifications.map(n => ({
      id: n.id,
      parentName: n.user?.name || 'Unknown',
      phone: '',
      studentName: '',
      status: n.is_read ? 'sent' : 'pending',
      message: n.message,
      title: n.title,
      createdAt: n.createdAt.toISOString()
    }));

    res.json({ messages });
  } catch (err) {
    console.error('Messages queue error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * POST /messages/:id/retry
 * Re-triggers a pending/failed notification
 */
export const retryMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as unread to indicate "pending retry"
    await prisma.notification.update({
      where: { id },
      data: { is_read: false }
    });

    await prisma.auditLog.create({
      data: {
        school_id: req.user!.school_id,
        user_id: req.user!.id,
        action: 'message_retry',
        entity: 'Notification',
        entity_id: id
      }
    });

    res.json({ success: true, status: 'pending' });
  } catch (err) {
    console.error('Retry error:', err);
    res.status(500).json({ error: 'Failed to retry message' });
  }
};

/**
 * POST /messages/send-bulk
 * Sends WhatsApp messages to all parents in a section via Meta Cloud API.
 * Processes template variables, creates notification records, and delivers via WhatsApp.
 */
export const sendBulkMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { template, sectionId, includeAI } = req.body;

    if (!template || !sectionId) {
      return res.status(400).json({ error: 'Template and section required' });
    }

    // Fetch section students with their latest results and parent info
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        students: {
          include: {
            results: {
              include: { test: true },
              orderBy: { test: { date: 'desc' } },
              take: 1
            },
            parentStudents: {
              include: { parent: true }
            }
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    for (const student of section.students) {
      const latestResult = student.results[0];
      const marks = latestResult ? `${latestResult.marks}` : 'N/A';
      const subject = section.subject || 'General';
      const parentName = student.parent_name || 'Parent';
      const parentPhone = student.parent_phone || '';
      const parentUser = student.parentStudents[0]?.parent;

      // Render message template with student data
      const message = template
        .replace(/\{\{ParentName\}\}/g, parentName)
        .replace(/\{\{StudentName\}\}/g, student.name)
        .replace(/\{\{Marks\}\}/g, marks)
        .replace(/\{\{Subject\}\}/g, subject)
        .replace(/\{\{RollNo\}\}/g, student.roll_number)
        .replace(
          /\{\{AIFeedback\}\}/g,
          includeAI && latestResult
            ? `\n\n📊 AI Insight: ${generateQuickInsight(student.name, latestResult.marks)}`
            : ''
        );

      let whatsappStatus: 'sent' | 'failed' | 'no_phone' = 'no_phone';
      let whatsappError = '';
      let whatsappMessageId = '';

      // Attempt WhatsApp delivery if phone number exists
      if (parentPhone) {
        const waResult = await sendWhatsAppMessage(parentPhone, message);
        if (waResult.success) {
          whatsappStatus = 'sent';
          whatsappMessageId = waResult.messageId || '';
        } else {
          whatsappStatus = 'failed';
          whatsappError = waResult.error || '';
        }
      }

      // Save notification record to DB regardless of WhatsApp status
      try {
        if (parentUser) {
          await prisma.notification.create({
            data: {
              school_id: req.user!.school_id,
              user_id: parentUser.id,
              title: `Results: ${subject}`,
              message: message,
              is_read: whatsappStatus === 'sent'
            }
          });
        }

        if (whatsappStatus === 'sent') {
          successCount++;
        } else {
          failCount++;
        }

        results.push({
          student: student.name,
          phone: parentPhone || 'N/A',
          whatsappTo: normalizePhone(parentPhone),
          status: whatsappStatus,
          whatsappMessageId: whatsappMessageId || null,
          error: whatsappError || null
        });
      } catch (dbErr) {
        failCount++;
        results.push({
          student: student.name,
          phone: parentPhone,
          status: 'failed',
          error: 'Database error'
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        school_id: req.user!.school_id,
        user_id: req.user!.id,
        action: 'bulk_whatsapp_sent',
        entity: 'Section',
        entity_id: sectionId
      }
    });

    res.json({
      success: true,
      totalSent: successCount,
      totalFailed: failCount,
      details: results
    });
  } catch (err) {
    console.error('Bulk send error:', err);
    res.status(500).json({ error: 'Failed to send messages' });
  }
};

function generateQuickInsight(name: string, marks: number): string {
  if (marks >= 90) return `${name} is performing exceptionally well. Consider advanced enrichment activities.`;
  if (marks >= 75) return `${name} shows strong understanding. Focus on strengthening weaker areas for top results.`;
  if (marks >= 60) return `${name} has a solid foundation. Regular revision and practice will help improve further.`;
  if (marks >= 40) return `${name} needs focused attention. Recommend extra practice sessions and guided study.`;
  return `${name} requires immediate support. One-on-one tutoring and structured revision plan recommended.`;
}
