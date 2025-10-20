import api from './api';

export interface NotificationItem {
  id: string;
  type: 'DAILY_SUMMARY' | 'URGENT_ALERT' | string;
  title: string;
  message: string;
  payload?: unknown;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  async list(take = 50): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await api.get(`/notification-center?take=${take}`);
    return res.data;
  },

  async markAllRead(): Promise<void> {
    await api.post('/notification-center/read', { all: true });
  },

  async markRead(id: string): Promise<void> {
    await api.post('/notification-center/read', { id });
  },
};
