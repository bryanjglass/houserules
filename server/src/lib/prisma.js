import { PrismaClient } from '@prisma/client';

// Single shared client for the whole server. Multiple PrismaClient instances
// each open their own connection pool, which is wasteful and bites hard the
// moment we move off single-file SQLite.
export const prisma = new PrismaClient();
