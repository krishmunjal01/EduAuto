import { Router } from 'express';
import { applyLeave, getLeaves, approveLeave } from '../controllers/leave.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.post('/', applyLeave);
router.get('/', getLeaves);
router.put('/:id/status', requireRole(['admin', 'teacher']), approveLeave);

export default router;
