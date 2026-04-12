import { Router } from 'express';
import { getSubscription, upgradeSubscription } from '../controllers/subscription.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getSubscription);
router.post('/upgrade', requireRole(['admin']), upgradeSubscription);

export default router;
