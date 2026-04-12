import { Router } from 'express';
import { getSchoolInfo, getStudents, getAuditLogs, getNotifications, markNotificationRead } from '../controllers/school.controller';
import { getAnalyticsData, generateAIFeedback } from '../controllers/analytics.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/info', getSchoolInfo);
router.get('/students', getStudents);
router.get('/analytics', getAnalyticsData);
router.post('/ai-feedback', generateAIFeedback);
router.get('/audit-logs', requireRole(['admin']), getAuditLogs);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

export default router;

