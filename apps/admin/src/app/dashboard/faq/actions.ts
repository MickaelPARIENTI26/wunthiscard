'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

function requireAdmin(session: { user?: { id?: string; role?: string } } | null): string {
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return session.user.id;
}

export async function createFaq(formData: FormData) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const question = formData.get('question') as string;
  const answer = formData.get('answer') as string;
  const category = formData.get('category') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
  const isActive = formData.get('isActive') === 'true';

  const faq = await prisma.faqItem.create({
    data: {
      question,
      answer,
      category,
      sortOrder,
      isActive,
    },
  });

  await createAuditLog({
    action: 'FAQ_CREATED',
    entityType: 'Faq',
    entityId: faq.id,
    adminId,
    details: { question },
  });

  revalidatePath('/dashboard/faq');
  redirect('/dashboard/faq');
}

export async function updateFaq(id: string, formData: FormData) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const question = formData.get('question') as string;
  const answer = formData.get('answer') as string;
  const category = formData.get('category') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
  const isActive = formData.get('isActive') === 'true';

  const faq = await prisma.faqItem.update({
    where: { id },
    data: {
      question,
      answer,
      category,
      sortOrder,
      isActive,
    },
  });

  await createAuditLog({
    action: 'FAQ_UPDATED',
    entityType: 'Faq',
    entityId: faq.id,
    adminId,
    details: { question },
  });

  revalidatePath('/dashboard/faq');
  redirect('/dashboard/faq');
}

export async function deleteFaq(id: string) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const faq = await prisma.faqItem.delete({
    where: { id },
  });

  await createAuditLog({
    action: 'FAQ_DELETED',
    entityType: 'Faq',
    entityId: id,
    adminId,
    details: { question: faq.question },
  });

  revalidatePath('/dashboard/faq');
}

export async function toggleFaqActive(id: string) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('FAQ not found');
  }

  const faq = await prisma.faqItem.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  await createAuditLog({
    action: faq.isActive ? 'FAQ_ACTIVATED' : 'FAQ_DEACTIVATED',
    entityType: 'Faq',
    entityId: id,
    adminId,
    details: { question: faq.question },
  });

  revalidatePath('/dashboard/faq');
}

export async function reorderFaqs(orderedIds: string[]) {
  const session = await auth();
  requireAdmin(session);

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.faqItem.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath('/dashboard/faq');
}
