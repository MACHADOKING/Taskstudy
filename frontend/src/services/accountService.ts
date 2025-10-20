import api from './api';

export interface NotificationSettingsPayload {
  notificationEmail: string;
  phone: string;
  notifyByEmail: boolean;
  notifyByTelegram: boolean;
  notifyByWhatsApp: boolean;
  consentGiven: boolean;
}

export interface NotificationSettingsResponse extends NotificationSettingsPayload {
  telegramLinked: boolean;
  telegramLinkCode?: string | null;
  telegramBotUsername?: string;
}

export interface NotificationSettingsUpdateResult {
  success: boolean;
  telegramLinked: boolean;
  telegramLinkCode?: string;
}

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  notificationEmail: string;
  avatarUrl?: string;
  googleConnected: boolean;
  googlePictureUrl?: string;
  phone?: string;
}

export const accountService = {
  async getNotificationSettings(): Promise<NotificationSettingsResponse> {
    const response = await api.get('/account/notification-settings');
    return response.data as NotificationSettingsResponse;
  },

  async updateNotificationSettings(payload: NotificationSettingsPayload): Promise<NotificationSettingsUpdateResult> {
    const response = await api.put('/account/notification-settings', payload);
    return response.data as NotificationSettingsUpdateResult;
  },

  async getProfile(): Promise<AccountProfile> {
    const response = await api.get('/account/profile');
    return response.data as AccountProfile;
  },

  async connectGoogleAccount(idToken: string) {
    const response = await api.post('/account/connect-google', { idToken });
    return response.data as AccountProfile;
  },

  async updateProfilePhoto(imageData: string) {
    const response = await api.put('/account/profile-photo', { imageData });
    return response.data as { avatarUrl: string };
  },
};
