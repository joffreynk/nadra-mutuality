import { PrismaClient } from '@prisma/client';

// 1. Define a global for the Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Instantiate the client
// We check if a global instance already exists, otherwise create a new one.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Enable verbose logging in development for easier debugging
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// 3. Save the instance to the global object if we are NOT in production
// This prevents multiple connections during Next.js hot-reloading.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

