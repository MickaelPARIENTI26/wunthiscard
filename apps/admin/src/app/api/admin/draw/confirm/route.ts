import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendEmail, replaceVariables } from '@/lib/email';

/**
 * POST /api/admin/draw/confirm
 * Confirm the draw and send winner notification email
 * Called AFTER the animation is complete
 * Protected: DRAW_MASTER or SUPER_ADMIN only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DRAW_MASTER and SUPER_ADMIN can confirm draws
    if (session.user.role !== 'DRAW_MASTER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { competition_id } = body;

    if (!competition_id) {
      return NextResponse.json(
        { error: 'competition_id is required' },
        { status: 400 }
      );
    }

    // Get the competition with win info
    const competition = await prisma.competition.findUnique({
      where: { id: competition_id },
      include: {
        wins: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Validate competition has been drawn
    if (!competition.actualDrawDate || competition.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Competition has not been drawn yet' },
        { status: 400 }
      );
    }

    // Check if winner has already been notified
    if (competition.winnerNotified) {
      return NextResponse.json(
        { error: 'Winner has already been notified' },
        { status: 400 }
      );
    }

    // Get the win record
    const win = competition.wins[0];
    if (!win || !win.user) {
      return NextResponse.json(
        { error: 'Winner information not found' },
        { status: 404 }
      );
    }

    const winner = win.user;

    // Get the winner_notification email template from database
    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: 'winner_notification' },
    });

    let emailSent = false;
    let emailError: string | null = null;

    if (emailTemplate && emailTemplate.isActive) {
      // Prepare template variables
      const templateData: Record<string, string> = {
        user_firstname: winner.firstName,
        user_lastname: winner.lastName,
        user_email: winner.email,
        competition_title: competition.title,
        competition_card_name: competition.title,
        competition_card_image: competition.mainImageUrl,
        competition_card_value: formatCurrency(Number(competition.prizeValue)),
        draw_winning_ticket: String(competition.winningTicketNumber),
        draw_date: formatDate(competition.actualDrawDate),
        site_url: process.env.NEXT_PUBLIC_APP_URL || 'https://winthiscard.co.uk',
        site_logo_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://winthiscard.co.uk'}/logo-email.png`,
        current_year: new Date().getFullYear().toString(),
      };

      // Replace variables in template
      const subject = replaceVariables(emailTemplate.subject, templateData);
      const html = replaceVariables(emailTemplate.htmlContent, templateData);

      // Send the email
      const result = await sendEmail({
        to: winner.email,
        subject,
        html,
      });

      emailSent = result.success;
      if (!result.success) {
        emailError = String(result.error || 'Unknown error');
      }
    } else {
      // Fallback: Use the built-in winner notification function if template not found
      const { sendWinnerNotificationEmail } = await import('@/lib/email');
      const result = await sendWinnerNotificationEmail(winner.email, winner.firstName, {
        competitionTitle: competition.title,
        ticketNumber: competition.winningTicketNumber!,
        prizeValue: Number(competition.prizeValue),
      });
      emailSent = result.success;
      if (!result.success) {
        emailError = String(result.error || 'Unknown error');
      }
    }

    const confirmedAt = new Date();

    // Update competition to mark winner as notified
    await prisma.competition.update({
      where: { id: competition_id },
      data: { winnerNotified: true },
    });

    // Update DrawLog with confirmation and email timestamps
    await prisma.drawLog.updateMany({
      where: { competitionId: competition_id },
      data: {
        confirmedAt,
        emailSentAt: emailSent ? confirmedAt : null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DRAW_CONFIRMED',
        entity: 'competition',
        entityId: competition_id,
        metadata: {
          winnerId: winner.id,
          winnerEmail: winner.email,
          emailSent,
          emailError,
          confirmedAt: confirmedAt.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      email_sent: emailSent,
      email_error: emailError,
      winner: {
        id: winner.id,
        email: winner.email,
        name: winner.displayName || `${winner.firstName} ${winner.lastName}`,
      },
    });
  } catch (error) {
    console.error('Error confirming draw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
