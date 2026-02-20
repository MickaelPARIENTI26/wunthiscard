import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@winucard/database';
import { z } from 'zod';
import { sendEmail, replaceVariables, getTestData } from '@/lib/email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const testEmailSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/admin/email-templates/[id]/test
 * Sends a test email using the specified template with test data
 * Protected by admin auth
 */
export async function POST(
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

    // Get the template
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validationResult = testEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Get test data and replace variables
    const testData = getTestData();
    const subject = `[TEST] ${replaceVariables(template.subject, testData)}`;
    const html = replaceVariables(template.htmlContent, testData);

    // Send the test email
    const result = await sendEmail({
      to: email,
      subject,
      html,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send test email', details: result.error },
        { status: 500 }
      );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EMAIL_TEMPLATE_TEST_SENT',
        entity: 'emailTemplate',
        entityId: id,
        metadata: {
          templateSlug: template.slug,
          testEmail: email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      mock: result.mock ?? false,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
