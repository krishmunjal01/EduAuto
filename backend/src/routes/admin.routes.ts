import { Router } from 'express';
import multer from 'multer';
import { getSections, createSection, getTeachers, createTeacher, updateTeacher, deleteTeacher, uploadStudentsCsv, deleteSection } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import fs from 'fs';

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(requireAuth);

// GET sections accessible by admin AND teacher
router.get('/sections', getSections);

// All other routes: admin only
router.post('/sections', requireRole(['admin']), createSection);
router.delete('/sections/:id', requireRole(['admin']), deleteSection);

router.get('/teachers', requireRole(['admin']), getTeachers);
router.post('/teachers', requireRole(['admin']), createTeacher);
router.put('/teachers/:id', requireRole(['admin']), updateTeacher);
router.delete('/teachers/:id', requireRole(['admin']), deleteTeacher);

router.post('/sections/:id/upload-csv', requireRole(['admin']), upload.single('file'), uploadStudentsCsv);

export default router;
