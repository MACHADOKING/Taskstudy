import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

// Helper function to clean database between tests
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

// Helper function to create test user with unique email
export const createTestUser = async (overrides: {
  name?: string;
  email?: string;
  password?: string;
} = {}): Promise<{ id: string; name: string; email: string; password: string }> => {
  const timestamp = Date.now();
  const user = await prisma.user.create({
    data: {
      name: overrides.name || `Test User ${timestamp}`,
      email: overrides.email || `test${timestamp}@example.com`,
      password: overrides.password || 'hashedpassword123'
    }
  });
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: overrides.password || 'hashedpassword123'
  };
};

// Helper function to close database connection
export const closeDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

export { prisma };