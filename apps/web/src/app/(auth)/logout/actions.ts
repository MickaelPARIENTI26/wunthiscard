'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redis, getTicketReservationKey, getQcmPassedKey, getQcmAttemptKey, getQcmBlockKey, getTicketLockKey } from '@/lib/redis';

interface ReservationData {
  userId: string;
  competitionId: string;
  ticketNumbers: number[];
  reservedAt: number;
  expiresAt: number;
}

/**
 * Server-side cleanup on logout:
 * - Release all reserved tickets for this user
 * - Clear QCM passed state for this user
 * - Clear QCM attempts for this user
 */
export async function cleanupOnLogout(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true }; // No user to cleanup
    }

    const userId = session.user.id;

    // Get all competitions to check for reservations
    const competitions = await prisma.competition.findMany({
      where: { status: { in: ['ACTIVE', 'UPCOMING'] } },
      select: { id: true },
    });

    const pipeline = redis.pipeline();

    for (const competition of competitions) {
      const competitionId = competition.id;

      // Release reservation and ticket locks
      const reservationKey = getTicketReservationKey(competitionId, userId);
      const reservationDataStr = await redis.get<string>(reservationKey);

      if (reservationDataStr) {
        const reservationData: ReservationData = typeof reservationDataStr === 'string'
          ? JSON.parse(reservationDataStr)
          : reservationDataStr;

        // Delete ticket locks
        for (const ticketNumber of reservationData.ticketNumbers) {
          const lockKey = getTicketLockKey(competitionId, ticketNumber);
          pipeline.del(lockKey);
        }

        // Delete reservation
        pipeline.del(reservationKey);
      }

      // Clear QCM state
      const qcmPassedKey = getQcmPassedKey(competitionId, userId);
      const qcmAttemptKey = getQcmAttemptKey(competitionId, userId);
      const qcmBlockKey = getQcmBlockKey(competitionId, userId);

      pipeline.del(qcmPassedKey);
      pipeline.del(qcmAttemptKey);
      pipeline.del(qcmBlockKey);
    }

    await pipeline.exec();

    // Log the logout
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_LOGOUT',
        entity: 'user',
        entityId: userId,
        metadata: { cleanedUp: true },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error during logout cleanup:', error);
    return { success: false, error: 'Failed to cleanup session data' };
  }
}
