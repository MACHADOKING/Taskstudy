import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth';

export const listNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const take = Math.min(parseInt(String(req.query.take ?? '50'), 10) || 50, 100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications = await (prisma as any).notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unreadCount = await (prisma as any).notification.count({ where: { userId, read: false } });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error listing notifications:', error);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id, all } = req.body as { id?: string; all?: boolean };

    if (all) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).notification.updateMany({ where: { userId, read: false }, data: { read: true } });
      res.status(200).json({ success: true });
      return;
    }

    if (!id) {
      res.status(400).json({ message: 'Notification id is required' });
      return;
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).notification.update({ where: { id }, data: { read: true } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};
