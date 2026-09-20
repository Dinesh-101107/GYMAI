import { Router } from 'express';
import { login, registerMember, refreshToken, getMe, forgotPassword } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { authLimiter, forgotPasswordLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, registerMember);
router.post('/refresh', refreshToken);
router.get('/me', requireAuth, getMe);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

export default router;
