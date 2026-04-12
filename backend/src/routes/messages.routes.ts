import { Router } from 'express';
import { getMessagesQueue, retryMessage, sendBulkMessages } from '../controllers/messages.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getMessagesQueue);
router.post('/send-bulk', requireRole(['teacher', 'admin']), sendBulkMessages);
router.post('/:id/retry', retryMessage);

export default router;
