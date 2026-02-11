'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

function requireAdmin(session: { user?: { id?: string; role?: string } } | null) {
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return session.user.id;
}

export async function banUser(userId: string) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true },
  });

  await createAuditLog({
    action: 'USER_BANNED',
    entityType: 'User',
    entityId: userId,
    adminId,
    details: { email: user.email },
  });

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}

export async function unbanUser(userId: string) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false },
  });

  await createAuditLog({
    action: 'USER_UNBANNED',
    entityType: 'User',
    entityId: userId,
    adminId,
    details: { email: user.email },
  });

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  const session = await auth();
  const adminId = requireAdmin(session);

  // Only SUPER_ADMIN can change roles
  if (session?.user?.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super admin access required to change roles');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await createAuditLog({
    action: 'USER_ROLE_CHANGED',
    entityType: 'User',
    entityId: userId,
    adminId,
    details: { email: user.email, newRole: role },
  });

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}
