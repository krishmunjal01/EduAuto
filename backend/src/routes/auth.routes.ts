import { Router } from 'express';
import { signup, parentSignup, login, getMe, resetAdmin, cleanupPhantomSections } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.post('/signup', signup);
router.post('/parent-signup', parentSignup);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.get('/resetAdmin', resetAdmin);
router.get('/cleanupSections', cleanupPhantomSections);

export default router;
