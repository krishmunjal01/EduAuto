import { Router } from 'express';
import multer from 'multer';
import { extractTextFromImage } from '../controllers/ocr.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import fs from 'fs';

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(requireAuth);
router.use(requireRole(['teacher', 'admin']));

router.post('/extract', upload.single('image'), extractTextFromImage);

export default router;
