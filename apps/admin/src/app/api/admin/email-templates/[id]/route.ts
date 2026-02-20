import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@winucard/database';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/email-templates/[id]
 * Returns a single email template by ID
 * Protected by admin auth
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

const updateTemplateSchema = z.object({
  subject: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/email-templates/[id]
 * Updates subject, htmlContent, and/or isActive
 * Protected by admin auth
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = updateTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Update the template
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.htmlContent !== undefined && { htmlContent: data.htmlContent }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        // updatedAt is automatically set by Prisma @updatedAt
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EMAIL_TEMPLATE_UPDATED',
        entity: 'emailTemplate',
        entityId: id,
        metadata: {
          templateSlug: existingTemplate.slug,
          changes: data,
        },
      },
    });

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}
