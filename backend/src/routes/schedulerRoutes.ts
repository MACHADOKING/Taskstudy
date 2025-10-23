import { Router } from 'express';
import { runScheduledNotifications } from '../controllers/schedulerController';

const router = Router();

router.post('/notifications', runScheduledNotifications);

export default router;
