import { Router } from 'express';
import { saveVerifiedResult } from '../controllers/results.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['teacher', 'admin']));

router.post('/save-verified', saveVerifiedResult);

export default router;
