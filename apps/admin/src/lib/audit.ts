import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  adminId: string;
  details?: Record<string, unknown>;
}

export async function createAuditLog({
  action,
  entityType,
  entityId,
  adminId,
  details,
}: AuditLogParams) {
  await prisma.auditLog.create({
    data: {
      action,
      entity: entityType,
      entityId,
      userId: adminId,
      metadata: (details ?? {}) as Prisma.InputJsonValue,
    },
  });
}
