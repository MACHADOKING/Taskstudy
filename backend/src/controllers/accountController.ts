import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { verifyGoogleIdToken } from '../utils/googleAuth';
import { User } from '../models/User';

const generateTelegramLinkCode = async (): Promise<string> => {
  const attempts = 8;

  for (let i = 0; i < attempts; i += 1) {
    const candidate = `TS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).user.findFirst({
      where: { telegramLinkCode: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Failed to generate a unique Telegram link code');
};

export const getNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
  // Cast prisma to any to avoid TS schema lag during migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userRecord = user as unknown as Record<string, unknown>;
    const notificationEmail = user.notificationEmail && user.notificationEmail.trim().length > 0
      ? user.notificationEmail
      : user.email;

    const telegramChatId = (user as unknown as Record<string, unknown>)['telegramChatId'] as string | undefined;
    const telegramLinkCode = (user as unknown as Record<string, unknown>)['telegramLinkCode'] as string | undefined;
    const telegramLinked = Boolean(telegramChatId && telegramChatId.trim().length > 0);

    res.status(200).json({
      notificationEmail,
      phone: user.phone ?? '',
      notifyByEmail: user.notifyByEmail,
      notifyByTelegram: user.notifyByTelegram,
      notifyByWhatsApp: user.notifyByWhatsApp,
      consentGiven: user.consentGiven,
      avatarUrl: (userRecord['avatarUrl'] as string | undefined) ?? undefined,
      googleConnected: Boolean(userRecord['googleConnected']),
      googlePictureUrl: (userRecord['googlePictureUrl'] as string | undefined) ?? undefined,
      telegramLinked,
      telegramLinkCode: telegramLinked ? undefined : telegramLinkCode,
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME ?? '',
    });
  } catch (error) {
    console.error('Error loading notification settings:', error);
    res.status(500).json({ message: 'Failed to load settings' });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      notificationEmail,
      phone,
      notifyByEmail,
      notifyByTelegram,
      notifyByWhatsApp,
      consentGiven,
    } = req.body as {
      notificationEmail?: string;
      phone?: string;
      notifyByEmail?: boolean;
      notifyByTelegram?: boolean;
      notifyByWhatsApp?: boolean;
      consentGiven?: boolean;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingUser = await (prisma as any).user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Gate channels by consent
    const effectiveNotifyByEmail = consentGiven ? !!notifyByEmail : false;
    const effectiveNotifyByTelegram = consentGiven ? !!notifyByTelegram : false;
    const effectiveNotifyByWhatsApp = consentGiven ? !!notifyByWhatsApp : false;

    let telegramLinkCode: string | undefined;

    const updateData: Record<string, unknown> = {
      notificationEmail: notificationEmail?.trim() ?? undefined,
      phone: phone?.trim() ?? undefined,
      notifyByEmail: effectiveNotifyByEmail,
      notifyByTelegram: effectiveNotifyByTelegram,
      notifyByWhatsApp: effectiveNotifyByWhatsApp,
      consentGiven: !!consentGiven,
    };

    const existingChatId = (existingUser as unknown as Record<string, unknown>)['telegramChatId'] as string | undefined;
    const existingLinkCode = (existingUser as unknown as Record<string, unknown>)['telegramLinkCode'] as string | undefined;

    if (effectiveNotifyByTelegram) {
      if (existingChatId && existingChatId.trim().length > 0) {
        updateData.telegramLinkCode = null;
        updateData.telegramLinkCodeGeneratedAt = null;
      } else {
        const codeToReuse = existingLinkCode && existingLinkCode.trim().length > 0 ? existingLinkCode : undefined;
        const code = codeToReuse ?? (await generateTelegramLinkCode());
        telegramLinkCode = code;
        updateData.telegramLinkCode = code;
        updateData.telegramLinkCodeGeneratedAt = new Date();
      }
    } else {
      updateData.telegramLinkCode = null;
      updateData.telegramLinkCodeGeneratedAt = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data: updateData,
    });

    const updatedChatId = (updatedUser as unknown as Record<string, unknown>)['telegramChatId'] as string | undefined;
    const telegramLinked = Boolean(updatedChatId && updatedChatId.trim().length > 0);

    if (telegramLinked) {
      telegramLinkCode = undefined;
    }

    res.status(200).json({
      success: true,
      telegramLinked,
      telegramLinkCode,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma as any).user.findUnique({ where: { id: req.userId! } });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const profileRecord = user as unknown as Record<string, unknown>;

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      notificationEmail:
        user.notificationEmail && user.notificationEmail.trim().length > 0
          ? user.notificationEmail
          : user.email,
      avatarUrl: (profileRecord['avatarUrl'] as string | undefined) ?? undefined,
      googleConnected: Boolean(profileRecord['googleConnected']),
      googlePictureUrl: (profileRecord['googlePictureUrl'] as string | undefined) ?? undefined,
      phone: user.phone ?? '',
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

export const connectGoogleAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      res.status(400).json({ message: 'Google ID token is required' });
      return;
    }

    const payload = await verifyGoogleIdToken(idToken);

    if (!payload) {
      res.status(401).json({ message: 'Invalid Google token' });
      return;
    }

    const { sub, email, name, picture } = payload;

    if (!sub || !email) {
      res.status(400).json({ message: 'Google account is missing required data' });
      return;
    }

    // Link Google account
    const linkedUser = await User.linkGoogleAccount(req.userId!, sub, {
      pictureUrl: picture ?? null,
      name: name ?? null,
      email,
    });

    const shouldUpdateNotificationEmail = !linkedUser.notificationEmail || linkedUser.notificationEmail.trim().length === 0;

    if (shouldUpdateNotificationEmail) {
      await User.update(linkedUser.id, {
        notificationEmail: email,
      });
    }

    const refreshed = await User.findById(linkedUser.id);

    const record = (refreshed ?? linkedUser) as unknown as Record<string, unknown>;

    const notificationEmailValue =
      typeof record['notificationEmail'] === 'string' && record['notificationEmail'].trim().length > 0
        ? (record['notificationEmail'] as string).trim()
        : (record['email'] as string);

    res.status(200).json({
      id: record['id'],
      name: record['name'],
      email: record['email'],
      avatarUrl: record['avatarUrl'] as string | undefined,
      googleConnected: Boolean(record['googleConnected'] ?? true),
      googlePictureUrl: (record['googlePictureUrl'] as string | undefined) ?? undefined,
      notificationEmail: notificationEmailValue,
    });
  } catch (error) {
    console.error('Failed to connect Google account:', error);
    res.status(500).json({ message: 'Failed to connect Google account' });
  }
};

export const updateProfilePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { imageData } = req.body as { imageData?: string };

    if (!imageData || typeof imageData !== 'string') {
      res.status(400).json({ message: 'Invalid image payload' });
      return;
    }

    const isDataUrl = imageData.startsWith('data:image/');

    if (!isDataUrl) {
      res.status(400).json({ message: 'Image must be a base64 data URL' });
      return;
    }

    if (imageData.length > 2_000_000) {
      res.status(413).json({ message: 'Image is too large' });
      return;
    }

    await User.update(req.userId!, {
      avatarUrl: imageData,
    });

    const updated = await User.findById(req.userId!);
    const record = updated as unknown as Record<string, unknown>;

    res.status(200).json({
      avatarUrl: record?.['avatarUrl'] as string | undefined,
    });
  } catch (error) {
    console.error('Failed to update profile photo:', error);
    res.status(500).json({ message: 'Failed to update profile photo' });
  }
};
