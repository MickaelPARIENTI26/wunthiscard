'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function toggleTemplateActive(id: string, isActive: boolean) {
  const session = await auth();

  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized');
  }

  await prisma.emailTemplate.update({
    where: { id },
    data: { isActive },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: isActive ? 'EMAIL_TEMPLATE_ACTIVATED' : 'EMAIL_TEMPLATE_DEACTIVATED',
      entity: 'emailTemplate',
      entityId: id,
    },
  });

  revalidatePath('/dashboard/email-templates');
}
