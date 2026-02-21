import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyTurnstileToken } from '@/lib/turnstile';
import {
  recordQcmAttempt,
  isQcmBlocked,
  markQcmPassed,
  hasPassedQcm,
  getReservation,
  extendReservation,
  recreateReservation,
  releaseTicketsFromRedis,
  MAX_QCM_ATTEMPTS,
} from '@/lib/redis';

const validateSchema = z.object({
  competitionId: z.string().min(1),
  answer: z.number().int().min(0).max(3),
  turnstileToken: z.string().optional(),
  ticketNumbers: z.array(z.number().int().positive()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID (from session) or IP address (for anonymous users)
    const session = await auth();
    const userId = session?.user?.id;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Use userId if authenticated, otherwise use IP address
    const identifier = userId || `ip:${ip}`;

    // Parse and validate request body
    const body = await request.json();
    const validation = validateSchema.safeParse(body);
    if (!validation.success) {
      // Log validation errors server-side only, don't expose to client
      console.error('Validation error:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { competitionId, answer, turnstileToken, ticketNumbers } = validation.data;

    // Verify Turnstile captcha if token provided
    if (turnstileToken) {
      const captchaResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!captchaResult.success) {
        return NextResponse.json(
          { error: captchaResult.error || 'Captcha verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Check if user/IP is blocked due to too many attempts
    const { blocked, remainingTime } = await isQcmBlocked(competitionId, identifier);
    if (blocked) {
      return NextResponse.json(
        {
          error: 'Too many incorrect attempts',
          blocked: true,
          remainingTime,
          message: `Please wait ${Math.ceil(remainingTime / 60)} minutes before trying again.`,
        },
        { status: 429 }
      );
    }

    // Check if user/IP already passed
    const alreadyPassed = await hasPassedQcm(competitionId, identifier);
    if (alreadyPassed) {
      return NextResponse.json({
        correct: true,
        alreadyPassed: true,
        message: 'You have already answered correctly.',
      });
    }

    // For authenticated users, verify/manage their reservation
    // Anonymous users will create reservation at checkout
    let newExpiresAt: number | null = null;
    if (userId) {
      let reservation = await getReservation(competitionId, userId);

      if (reservation) {
        // Reservation exists - extend it to prevent expiration during checkout
        const extendResult = await extendReservation(competitionId, userId);
        if (extendResult.success) {
          newExpiresAt = extendResult.expiresAt;
        }
      } else if (ticketNumbers && ticketNumbers.length > 0) {
        // Reservation expired but we have ticket numbers from sessionStorage - recreate it
        const recreateResult = await recreateReservation(competitionId, userId, ticketNumbers);
        if (!recreateResult.success) {
          return NextResponse.json(
            { error: recreateResult.error || 'Failed to reserve tickets. Please select tickets again.' },
            { status: 400 }
          );
        }

        // Also update database tickets to RESERVED (Redis-only recreation doesn't update DB)
        const now = new Date();
        const updateResult = await prisma.ticket.updateMany({
          where: {
            competitionId,
            ticketNumber: { in: ticketNumbers },
            OR: [
              { status: 'AVAILABLE' },
              {
                status: 'RESERVED',
                reservedUntil: { lte: now }, // Expired reservation
              },
              {
                status: 'RESERVED',
                userId, // User's own existing reservation
              },
            ],
          },
          data: {
            status: 'RESERVED',
            userId,
            reservedUntil: new Date(recreateResult.expiresAt),
          },
        });

        // Verify all tickets were successfully reserved in the database
        if (updateResult.count !== ticketNumbers.length) {
          // Some tickets couldn't be reserved - release the Redis locks
          await releaseTicketsFromRedis(competitionId, userId);
          return NextResponse.json(
            { error: 'Some tickets are no longer available. Please select tickets again.' },
            { status: 409 }
          );
        }

        newExpiresAt = recreateResult.expiresAt;
        reservation = await getReservation(competitionId, userId);
      }

      if (!reservation) {
        return NextResponse.json(
          { error: 'No active ticket reservation found. Please select tickets again.' },
          { status: 400 }
        );
      }
    }

    // Get competition and verify status
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        status: true,
        questionAnswer: true,
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    if (competition.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This competition is not currently accepting entries' },
        { status: 400 }
      );
    }

    // Check the answer
    const isCorrect = answer === competition.questionAnswer;

    if (isCorrect) {
      // Mark as passed in Redis
      await markQcmPassed(competitionId, identifier);

      // Log success (only if authenticated)
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'QCM_PASSED',
            entity: 'competition',
            entityId: competitionId,
            metadata: { answer },
            ipAddress: ip,
          },
        });
      }

      return NextResponse.json({
        correct: true,
        message: 'Correct! You can now proceed to checkout.',
        // Return new expiry time so client can update the timer
        ...(newExpiresAt && { expiresAt: newExpiresAt }),
      });
    }

    // Record failed attempt
    const { attempts, maxAttempts, blocked: nowBlocked, blockUntil } = await recordQcmAttempt(
      competitionId,
      identifier
    );

    // Log failed attempt (only if authenticated)
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'QCM_FAILED',
          entity: 'competition',
          entityId: competitionId,
          metadata: { answer, attempts, blocked: nowBlocked },
          ipAddress: ip,
        },
      });
    }

    if (nowBlocked) {
      return NextResponse.json({
        correct: false,
        blocked: true,
        blockUntil,
        message: 'Too many incorrect attempts. Please wait 15 minutes before trying again.',
        attemptsRemaining: 0,
      });
    }

    return NextResponse.json({
      correct: false,
      blocked: false,
      attemptsRemaining: maxAttempts - attempts,
      message: `Incorrect answer. ${maxAttempts - attempts} attempt${maxAttempts - attempts !== 1 ? 's' : ''} remaining.`,
    });
  } catch (error) {
    console.error('Error validating QCM:', error);
    return NextResponse.json(
      { error: 'An error occurred while validating your answer' },
      { status: 500 }
    );
  }
}

// GET endpoint to check QCM status
export async function GET(request: NextRequest) {
  try {
    // Get user ID (from session) or IP address (for anonymous users)
    const session = await auth();
    const userId = session?.user?.id;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Use userId if authenticated, otherwise use IP address
    const identifier = userId || `ip:${ip}`;

    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    // Check if already passed
    const passed = await hasPassedQcm(competitionId, identifier);
    if (passed) {
      return NextResponse.json({
        passed: true,
        blocked: false,
        attemptsRemaining: MAX_QCM_ATTEMPTS,
      });
    }

    // Check if blocked
    const { blocked, remainingTime, attempts } = await isQcmBlocked(competitionId, identifier);

    return NextResponse.json({
      passed: false,
      blocked,
      remainingTime: blocked ? remainingTime : 0,
      attemptsRemaining: Math.max(0, MAX_QCM_ATTEMPTS - attempts),
    });
  } catch (error) {
    console.error('Error checking QCM status:', error);
    return NextResponse.json(
      { error: 'An error occurred while checking status' },
      { status: 500 }
    );
  }
}
