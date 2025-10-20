import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { listNotifications, markAsRead } from '../controllers/notificationController';

const router = Router();

router.use(authMiddleware);

router.get('/', listNotifications);
router.post('/read', markAsRead);

export default router;
