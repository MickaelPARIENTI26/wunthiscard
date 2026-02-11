'use server';

import { revalidatePath } from 'next/cache';
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

export async function updateStaticPage(slug: string, formData: FormData) {
  const session = await auth();
  const adminId = requireAdmin(session);

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const page = await prisma.staticPage.upsert({
    where: { slug },
    update: {
      title,
      content,
    },
    create: {
      slug,
      title,
      content,
    },
  });

  await createAuditLog({
    action: 'STATIC_PAGE_UPDATED',
    entityType: 'StaticPage',
    entityId: page.id,
    adminId,
    details: { slug, title },
  });

  revalidatePath('/dashboard/pages');
  revalidatePath(`/dashboard/pages/${slug}`);
  revalidatePath(`/${slug}`);
}
