'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendWinnerNotificationEmail, sendDrawCompleteNotificationEmail, anonymizeWinnerName } from '@/lib/email';
import { revalidatePath } from 'next/cache';

interface ExecuteDrawParams {
  competitionId: string;
  winningTicketNumber: number;
  adminId: string;
}

interface ExecuteDrawResult {
  success: boolean;
  error?: string;
  winner?: {
    name: string;
    email: string;
  };
}

export async function executeDraw({
  competitionId,
  winningTicketNumber,
  adminId,
}: ExecuteDrawParams): Promise<ExecuteDrawResult> {
  try {
    // Verify the current user is SUPER_ADMIN
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only SUPER_ADMIN can execute draws' };
    }

    // Verify admin ID matches session
    if (session.user.id !== adminId) {
      return { success: false, error: 'Admin ID mismatch' };
    }

    // Get the competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        wins: true,
      },
    });

    if (!competition) {
      return { success: false, error: 'Competition not found' };
    }

    // Check if draw already happened
    if (competition.wins.length > 0 || competition.status === 'COMPLETED') {
      return { success: false, error: 'Draw has already been executed for this competition' };
    }

    // Verify the ticket is a valid sold ticket
    const winningTicket = await prisma.ticket.findFirst({
      where: {
        competitionId,
        ticketNumber: winningTicketNumber,
        status: 'SOLD',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!winningTicket) {
      return { success: false, error: 'Invalid winning ticket number' };
    }

    if (!winningTicket.user) {
      return { success: false, error: 'Winning ticket has no associated user' };
    }

    // Get sold tickets count for audit log
    const soldTicketsCount = await prisma.ticket.count({
      where: { competitionId, status: 'SOLD' },
    });

    // Execute all updates in a transaction
    await prisma.$transaction(async (tx) => {
      // Update competition with winning ticket number and set to COMPLETED
      await tx.competition.update({
        where: { id: competitionId },
        data: {
          winningTicketNumber,
          actualDrawDate: new Date(),
          status: 'COMPLETED',
        },
      });

      // Create Win record
      await tx.win.create({
        data: {
          competitionId,
          userId: winningTicket.user!.id,
          ticketNumber: winningTicketNumber,
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          action: 'DRAW_EXECUTED',
          entity: 'competition',
          entityId: competitionId,
          userId: adminId,
          metadata: {
            competitionTitle: competition.title,
            winningTicketNumber,
            totalTicketsSold: soldTicketsCount,
            winnerId: winningTicket.user!.id,
            winnerEmail: winningTicket.user!.email,
            rngMethod: 'crypto.getRandomValues',
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    // Revalidate related paths
    revalidatePath('/dashboard/competitions');
    revalidatePath('/dashboard/competitions/' + competitionId);
    revalidatePath('/dashboard');

    // Send winner notification email (async, don't block)
    sendWinnerNotificationEmail(
      winningTicket.user.email,
      winningTicket.user.firstName,
      {
        competitionTitle: competition.title,
        ticketNumber: winningTicketNumber,
        prizeValue: Number(competition.prizeValue),
      }
    ).catch((err) => console.error('Failed to send winner email:', err));

    // Send notifications to other participants (async, don't block)
    notifyParticipants(
      competitionId,
      winningTicket.user.id,
      competition.title,
      winningTicketNumber,
      winningTicket.user.firstName,
      winningTicket.user.lastName
    ).catch((err) => console.error('Failed to notify participants:', err));

    return {
      success: true,
      winner: {
        name: `${winningTicket.user.firstName} ${winningTicket.user.lastName}`,
        email: winningTicket.user.email,
      },
    };
  } catch (error) {
    console.error('Draw execution error:', error);
    return { success: false, error: 'Failed to execute draw' };
  }
}

// Notify all participants except the winner
async function notifyParticipants(
  competitionId: string,
  winnerId: string,
  competitionTitle: string,
  winningTicketNumber: number,
  winnerFirstName: string,
  winnerLastName: string
) {
  // Get unique participants (excluding winner)
  const participants = await prisma.ticket.findMany({
    where: {
      competitionId,
      status: 'SOLD',
      userId: { not: winnerId },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      },
    },
    distinct: ['userId'],
  });

  const anonymizedWinnerName = anonymizeWinnerName(winnerFirstName, winnerLastName);

  // Send emails to all participants (in batches to avoid overwhelming)
  const batchSize = 10;
  for (let i = 0; i < participants.length; i += batchSize) {
    const batch = participants.slice(i, i + batchSize);
    await Promise.all(
      batch.map((p) =>
        p.user
          ? sendDrawCompleteNotificationEmail(p.user.email, p.user.firstName, {
              competitionTitle,
              winnerName: anonymizedWinnerName,
              winningTicketNumber,
            })
          : Promise.resolve()
      )
    );
  }
}
