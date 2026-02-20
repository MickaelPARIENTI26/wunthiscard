import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@winucard/database';

/**
 * GET /api/admin/email-templates
 * Returns all email templates (slug, name, subject, isActive, trigger, updatedAt)
 * Protected by admin auth
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templates = await prisma.emailTemplate.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        subject: true,
        isActive: true,
        trigger: true,
        triggerDescription: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}
