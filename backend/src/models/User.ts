import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { User as PrismaUser } from '@prisma/client';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithMethods extends IUser {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export const AUTH_PROVIDERS = {
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

export class UserService {
  static async create(data: {
    name: string;
    email: string;
    password?: string;
    provider?: AuthProvider;
    googleId?: string;
    avatarUrl?: string | null;
    googlePictureUrl?: string | null;
  }): Promise<PrismaUser> {
  const provider = data.provider ?? AUTH_PROVIDERS.LOCAL;
  const sanitizedGoogleId = data.googleId?.trim() || undefined;

    if (!Object.values(AUTH_PROVIDERS).includes(provider)) {
      throw new Error('Invalid authentication provider');
    }

    // Validate input
    if (!data.name || data.name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Please provide a valid email address');
    }
    
    if (provider === AUTH_PROVIDERS.LOCAL) {
      if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
    }

    if (provider === AUTH_PROVIDERS.GOOGLE) {
      if (!sanitizedGoogleId) {
        throw new Error('Google account identifier is required');
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    if (sanitizedGoogleId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingGoogleAccount = await (prisma.user as any).findUnique({
        where: { googleId: sanitizedGoogleId },
      });

      if (existingGoogleAccount) {
        throw new Error('Google account already linked to another user');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordToHash =
      provider === AUTH_PROVIDERS.LOCAL
        ? data.password!
        : crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    // Create user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma.user as any).create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        password: hashedPassword,
        provider,
        googleId: sanitizedGoogleId,
        avatarUrl: data.avatarUrl?.trim() || undefined,
        googlePictureUrl: data.googlePictureUrl?.trim() || undefined,
        googleConnected: provider === AUTH_PROVIDERS.GOOGLE || !!sanitizedGoogleId,
      },
    });
  }

  static async findByEmail(email: string): Promise<PrismaUser | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  static async findById(id: string): Promise<PrismaUser | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  static async findByGoogleId(googleId: string): Promise<PrismaUser | null> {
    const normalizedGoogleId = googleId.trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma.user as any).findUnique({
      where: { googleId: normalizedGoogleId },
    });
  }

  static async comparePassword(
    candidatePassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return false;
      }
      if (!user.password) {
        return false;
      }
      return this.comparePassword(password, user.password);
    } catch (error) {
      return false;
    }
  }

  static async update(id: string, data: {
    name?: string;
    email?: string;
    password?: string;
    provider?: AuthProvider;
    googleId?: string | null;
    avatarUrl?: string | null;
    googlePictureUrl?: string | null;
    googleConnected?: boolean;
    notificationEmail?: string | null;
  }): Promise<PrismaUser> {
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      provider?: AuthProvider;
      googleId?: string | null;
      avatarUrl?: string | null;
      googlePictureUrl?: string | null;
      googleConnected?: boolean;
      notificationEmail?: string | null;
    } = {};

    if (data.name !== undefined) {
      if (!data.name || data.name.length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }
      updateData.name = data.name.trim();
    }

    if (data.email !== undefined) {
      if (!data.email || !this.isValidEmail(data.email)) {
        throw new Error('Please provide a valid email address');
      }
      updateData.email = data.email.toLowerCase();
    }

    if (data.password !== undefined) {
      if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(data.password, salt);
    }

    if (data.provider !== undefined) {
      if (!Object.values(AUTH_PROVIDERS).includes(data.provider)) {
        throw new Error('Invalid authentication provider');
      }
      updateData.provider = data.provider;
    }

    if (data.googleId !== undefined) {
      const sanitizedGoogleId = data.googleId?.trim();

      if (sanitizedGoogleId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingGoogleAccount = await (prisma.user as any).findUnique({
          where: { googleId: sanitizedGoogleId },
        });

        if (existingGoogleAccount && existingGoogleAccount.id !== id) {
          throw new Error('Google account already linked to another user');
        }
      }

      updateData.googleId = sanitizedGoogleId ?? null;
    }

    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl?.trim() ?? null;
    }

    if (data.googlePictureUrl !== undefined) {
      updateData.googlePictureUrl = data.googlePictureUrl?.trim() ?? null;
    }

    if (data.googleConnected !== undefined) {
      updateData.googleConnected = data.googleConnected;
    }

    if (data.notificationEmail !== undefined) {
      updateData.notificationEmail = data.notificationEmail?.trim() ?? null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma.user as any).update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  static async linkGoogleAccount(userId: string, googleId: string, options?: { pictureUrl?: string | null; name?: string | null; email?: string | null; }): Promise<PrismaUser> {
    const normalizedGoogleId = googleId.trim();

    const [user, existing] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.user as any).findUnique({ where: { googleId: normalizedGoogleId } }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    if (existing && existing.id !== userId) {
      throw new Error('Google account already linked to another user');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, unknown> = {
      googleId: normalizedGoogleId,
      googleConnected: true,
      provider:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((user as any).provider === AUTH_PROVIDERS.LOCAL
          ? AUTH_PROVIDERS.LOCAL
          : AUTH_PROVIDERS.GOOGLE),
    };

    if (options?.pictureUrl) {
      updatePayload.googlePictureUrl = options.pictureUrl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(user as any).avatarUrl) {
        updatePayload.avatarUrl = options.pictureUrl;
      }
    }

    if (options?.name && (!user.name || user.name.trim().length === 0)) {
      updatePayload.name = options.name.trim();
    }

    if (options?.email && user.email.toLowerCase() !== options.email.toLowerCase()) {
      // Preserve existing email for login; do not overwrite
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma.user as any).update({
      where: { id: userId },
      data: updatePayload,
    });
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }
}

// For backward compatibility, export User as the service
export const User = UserService;