import { Router } from 'express';
import { getAttendanceRecords, markAttendance, getCorrections, createCorrection, updateCorrectionStatus } from '../controllers/attendance.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/records', getAttendanceRecords);
router.post('/mark', markAttendance);

router.get('/corrections', getCorrections);
router.post('/corrections', createCorrection);
router.put('/corrections/:id/status', requireRole(['admin']), updateCorrectionStatus);

export default router;
