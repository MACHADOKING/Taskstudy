import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, AUTH_PROVIDERS } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { verifyGoogleIdToken } from '../utils/googleAuth';
import { prisma } from '../config/database';

// Generate JWT Token
const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const resolveNotificationEmail = (record: Record<string, unknown>, fallback: string): string => {
  const candidate = record['notificationEmail'];
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate;
  }
  return fallback;
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Create new user (validation is handled in the service)
    const user = await User.create({
      name,
      email,
      password,
      provider: AUTH_PROVIDERS.LOCAL,
    });

    // Generate token
    const token = generateToken(user.id);

    // Create a welcome notification asking user to complete account settings
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).notification.create({
        data: {
          userId: user.id,
          type: 'DAILY_SUMMARY',
          title: 'Complete suas configurações',
          message:
            'Para usar todos os recursos do TaskStudy, acesse as Configurações da conta e finalize suas preferências de notificação.',
          payload: { navigateTo: '/account' },
        },
      });
    } catch (e) {
      console.warn('Falha ao criar notificação de boas-vindas', e);
    }

    const userRecord = user as unknown as Record<string, unknown>;

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: (userRecord['avatarUrl'] as string | undefined) ?? undefined,
        googleConnected: Boolean(userRecord['googleConnected']),
        googlePictureUrl: (userRecord['googlePictureUrl'] as string | undefined) ?? undefined,
  notificationEmail: resolveNotificationEmail(userRecord, user.email),
      },
    });
  } catch (error: unknown) {
    console.error('Register error:', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          message: error.message,
        });
        return;
      }
      
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      message: 'Server error during registration',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        message: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      res.status(401).json({
        message: 'Invalid email or password',
      });
      return;
    }

    if ('provider' in user && user.provider !== AUTH_PROVIDERS.LOCAL) {
      res.status(400).json({
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
      return;
    }

    // Check password
    const isPasswordValid = await User.comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id);
    const userRecord = user as unknown as Record<string, unknown>;

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: (userRecord['avatarUrl'] as string | undefined) ?? undefined,
        googleConnected: Boolean(userRecord['googleConnected']),
        googlePictureUrl: (userRecord['googlePictureUrl'] as string | undefined) ?? undefined,
  notificationEmail: resolveNotificationEmail(userRecord, user.email),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
    });
  }
};

// Get current user profile
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId!);

    if (!user) {
      res.status(404).json({
        message: 'User not found',
      });
      return;
    }

    const userRecord = user as unknown as Record<string, unknown>;

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: (userRecord['avatarUrl'] as string | undefined) ?? undefined,
        googleConnected: Boolean(userRecord['googleConnected']),
        googlePictureUrl: (userRecord['googlePictureUrl'] as string | undefined) ?? undefined,
  notificationEmail: resolveNotificationEmail(userRecord, user.email),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Server error getting profile',
    });
  }
};

// Google Sign-In / Sign-Up
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({
        message: 'Google ID token is required',
      });
      return;
    }

    const payload = await verifyGoogleIdToken(idToken);

    if (!payload) {
      res.status(401).json({
        message: 'Invalid Google token',
      });
      return;
    }

  const { email, sub, name, picture } = payload;

    if (!email || !sub) {
      res.status(400).json({
        message: 'Google account is missing required data',
      });
      return;
    }

    let user = await User.findByGoogleId(sub);

    if (!user) {
      user = await User.findByEmail(email);

      if (user) {
        user = await User.linkGoogleAccount(user.id, sub);
      } else {
        user = await User.create({
          name: name || email.split('@')[0],
          email,
          provider: AUTH_PROVIDERS.GOOGLE,
          googleId: sub,
          googlePictureUrl: picture ?? undefined,
          avatarUrl: picture ?? undefined,
        });
      }
    }

    const token = generateToken(user.id);
    const userRecordForPicture = user as unknown as Record<string, unknown>;

    if (!userRecordForPicture['avatarUrl'] && picture) {
      try {
        await User.update(user.id, {
          avatarUrl: picture,
          googlePictureUrl: picture,
          googleConnected: true,
        });
          const refreshed = await User.findById(user.id);
          if (refreshed) {
            user = refreshed;
          }
      } catch (err) {
        console.warn('Failed to persist Google picture on login', err);
      }
    }

    const responseUser = user as unknown as Record<string, unknown>;

    res.status(200).json({
      token,
      user: {
        id: responseUser['id'] as string,
        name: responseUser['name'] as string,
        email: responseUser['email'] as string,
        avatarUrl: (responseUser['avatarUrl'] as string | undefined) ?? (picture ?? undefined),
        googleConnected: Boolean(responseUser['googleConnected'] ?? true),
        googlePictureUrl: (responseUser['googlePictureUrl'] as string | undefined) ?? picture ?? undefined,
  notificationEmail: resolveNotificationEmail(responseUser, responseUser['email'] as string),
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      message: 'Failed to authenticate with Google',
    });
  }
};