import { Router } from 'express';
import { telegramWebhook } from '../controllers/telegramController';

const router = Router();

router.post('/webhook', telegramWebhook);

export default router;
