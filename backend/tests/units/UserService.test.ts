import { UserService, AUTH_PROVIDERS } from '../../src/models/User';
import { cleanDatabase, disconnectDatabase } from '../helpers/database';
import bcrypt from 'bcrypt';

describe('UserService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('create', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      const user = await UserService.create(userData);
      
      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(userData.password); // should be hashed
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });

    it('should hash the password', async () => {
      const plainPassword = 'password123';
      const user = await UserService.create({
        name: 'Test User',
        email: 'test@example.com',
        password: plainPassword
      });
      
      const isPasswordHashed = await bcrypt.compare(plainPassword, user.password);
      expect(isPasswordHashed).toBe(true);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'password123'
      };
      
      await UserService.create(userData);
      
      await expect(UserService.create({
        name: 'User 2',
        email: 'duplicate@example.com',
        password: 'password456'
      })).rejects.toThrow();
    });

    it('should create a user via Google provider without password', async () => {
      const user = await UserService.create({
        name: 'Google User',
        email: 'google.user@example.com',
        provider: AUTH_PROVIDERS.GOOGLE,
        googleId: 'google-user-123',
      });

    expect(user).toBeDefined();
    expect(user.email).toBe('google.user@example.com');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((user as any).googleId).toBe('google-user-123');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((user as any).provider).toBe(AUTH_PROVIDERS.GOOGLE);
    expect(user.password).toBeDefined();
    });

    it('should require googleId when provider is Google', async () => {
      await expect(
        UserService.create({
          name: 'Missing Google ID',
          email: 'missing.google@example.com',
          provider: AUTH_PROVIDERS.GOOGLE,
        })
      ).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      await expect(UserService.create({
        name: '',
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow();

      await expect(UserService.create({
        name: 'Test User',
        email: '',
        password: 'password123'
      })).rejects.toThrow();

      await expect(UserService.create({
        name: 'Test User',
        email: 'test@example.com',
        password: ''
      })).rejects.toThrow();
    });

    it('should validate email format', async () => {
      await expect(UserService.create({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      })).rejects.toThrow();
    });

    it('should validate password length', async () => {
      await expect(UserService.create({
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // too short
      })).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };
      
      const createdUser = await UserService.create(userData);
      const foundUser = await UserService.findByEmail(userData.email);
      
      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await UserService.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should be case insensitive', async () => {
      await UserService.create({
        name: 'Test User',
        email: 'test@EXAMPLE.com',
        password: 'password123'
      });
      
      const foundUser = await UserService.findByEmail('TEST@example.com');
      expect(foundUser).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = await UserService.create({
        name: 'Find Test',
        email: 'find@example.com',
        password: 'password123'
      });
      
      const foundUser = await UserService.findById(user.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(user.id);
      expect(foundUser!.name).toBe('Find Test');
    });

    it('should return null for non-existent id', async () => {
      const user = await UserService.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('validatePassword', () => {
    let testUser: { id: string; name: string; email: string; password: string };
    const plainPassword = 'testpassword123';

    beforeEach(async () => {
      testUser = await UserService.create({
        name: 'Password Test User',
        email: 'password@example.com',
        password: plainPassword
      });
    });

    it('should validate correct password', async () => {
      const isValid = await UserService.validatePassword(testUser.id, plainPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await UserService.validatePassword(testUser.id, 'wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const isValid = await UserService.validatePassword('non-existent-id', plainPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await UserService.create({
        name: 'Original Name',
        email: 'original@example.com',
        password: 'password123'
      });
      
      const updatedUser = await UserService.update(user.id, {
        name: 'Updated Name',
        email: 'updated@example.com'
      });
      
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe('updated@example.com');
    });

    it('should hash new password when updating', async () => {
      const user = await UserService.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'oldpassword'
      });
      
      const newPassword = 'newpassword123';
      const updatedUser = await UserService.update(user.id, {
        password: newPassword
      });
      
      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isNewPasswordValid).toBe(true);
      
      const isOldPasswordValid = await bcrypt.compare('oldpassword', updatedUser.password);
      expect(isOldPasswordValid).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      const user = await UserService.create({
        name: 'Delete Test',
        email: 'delete@example.com',
        password: 'password123'
      });
      
      await UserService.delete(user.id);
      
      const deletedUser = await UserService.findById(user.id);
      expect(deletedUser).toBeNull();
    });
  });
});