import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

export const cleanDatabase = async (): Promise<void> => {
  try {
    // Delete in order due to foreign key constraints
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    
    // Reset auto-increment sequences if needed
    await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name IN ('User', 'Task')`;
  } catch (error) {
    // Silently handle errors - database might not exist yet
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

// Helper to create test user with unique email and properly hashed password
export const createTestUser = async (overrides: {
  name?: string;
  email?: string;
  password?: string;
} = {}): Promise<{ id: string; name: string; email: string; password: string }> => {
  const timestamp = Date.now();
  const plainPassword = overrides.password || 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  const user = await prisma.user.create({
    data: {
      name: overrides.name || `Test User ${timestamp}`,
      email: overrides.email || `test${timestamp}@example.com`,
      password: hashedPassword
    }
  });
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: plainPassword  // Return the plain password for testing
  };
};

// Aliases for integration tests
export const setupTestDatabase = cleanDatabase;
export const cleanupTestDatabase = async (): Promise<void> => {
  await cleanDatabase();
  await disconnectDatabase();
};