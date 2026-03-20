import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Conserve l'instance entre les hot-reloads en dev ET entre les invocations
// dans le même conteneur serverless en production (optimisation Vercel)
globalForPrisma.prisma = prisma;
