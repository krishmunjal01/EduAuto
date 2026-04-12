import { Router } from 'express';
import { getTimetables, saveTimetable, deleteTimetable, getSubstitutions, updateSubstitution } from '../controllers/timetable.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getTimetables);
router.post('/', requireRole(['admin']), saveTimetable);
router.delete('/:id', requireRole(['admin']), deleteTimetable);

router.get('/substitutions', getSubstitutions);
router.put('/substitutions/:id', requireRole(['admin']), updateSubstitution);

export default router;
