import { Router } from 'express';
import { register, login, me, googleAuth } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google
router.post('/google', googleAuth);

// GET /api/auth/me - Get current user profile
router.get('/me', authMiddleware, me);

export default router;