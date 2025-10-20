import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import {
  checkTaskReminders,
  sendPendingTasksDigest,
  sendTelegramTestMessage,
} from '../services/notificationService';

const router = Router();

// GET /api/notifications/send - Manual trigger for testing
router.get(
  '/send',
  authMiddleware,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      await checkTaskReminders();
      res.status(200).json({
        success: true,
        message: 'Notification check triggered successfully',
      });
    } catch (error) {
      console.error('Notification trigger error:', error);
      res.status(500).json({
        success: false,
        message: 'Error triggering notifications',
      });
    }
  }
);

router.get(
  '/send-digest',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const targetEmailRaw = req.query.targetEmail;
      const targetEmail = typeof targetEmailRaw === 'string' ? targetEmailRaw : undefined;

      await sendPendingTasksDigest(targetEmail);

      res.status(200).json({
        success: true,
        message: targetEmail
          ? `Resumo enviado para ${targetEmail}`
          : 'Resumo enviado para usuários elegíveis',
      });
    } catch (error) {
      console.error('Notification digest trigger error:', error);
      res.status(500).json({
        success: false,
        message: 'Error triggering digest notifications',
      });
    }
  }
);

router.post(
  '/telegram/test',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { message, chatId } = (req.body ?? {}) as {
        message?: unknown;
        chatId?: unknown;
      };

      if (typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message is required',
        });
        return;
      }

      const normalizedChatId = typeof chatId === 'string' ? chatId.trim() : undefined;
      await sendTelegramTestMessage(message, normalizedChatId);

      res.status(200).json({
        success: true,
        message: 'Telegram message sent successfully',
      });
    } catch (error) {
      console.error('Telegram send error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send Telegram message',
      });
    }
  }
);

export default router;