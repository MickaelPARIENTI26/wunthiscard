/**
 * Database client export for the public web app
 * Re-exports the Prisma client from the shared database package
 */
export { prisma } from '@winucard/database';
export type { PrismaClient } from '@winucard/database';
