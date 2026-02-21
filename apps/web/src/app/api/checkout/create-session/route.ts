import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, calculateBonusTickets, generateOrderNumber } from '@/lib/stripe';
import { getReservation, extendReservation, recreateReservation, releaseTicketsFromRedis, hasPassedQcm, markQcmPassed, rateLimits } from '@/lib/redis';

const createSessionSchema = z.object({
  competitionId: z.string().min(1),
  ticketNumbers: z.array(z.number().int().positive()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const { success: rateLimitSuccess } = await rateLimits.checkout.limit(
      `${userId}:${ip}`
    );
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createSessionSchema.safeParse(body);
    if (!validation.success) {
      // Log validation errors server-side only, don't expose to client
      console.error('Validation error:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { competitionId, ticketNumbers: providedTicketNumbers } = validation.data;

    // Verify user has passed QCM (check by userId first, then by IP for anonymous users who just logged in)
    let qcmPassed = await hasPassedQcm(competitionId, userId);
    if (!qcmPassed) {
      // Check if QCM was passed with IP address (anonymous user who just logged in)
      const ipIdentifier = `ip:${ip}`;
      const qcmPassedByIp = await hasPassedQcm(competitionId, ipIdentifier);
      if (qcmPassedByIp) {
        // Transfer QCM pass status from IP to userId
        await markQcmPassed(competitionId, userId);
        qcmPassed = true;
      }
    }
    if (!qcmPassed) {
      return NextResponse.json(
        { error: 'Please answer the skill question first' },
        { status: 400 }
      );
    }

    // Verify user has a valid reservation
    let reservation = await getReservation(competitionId, userId);

    if (reservation) {
      // Reservation exists - extend it for checkout
      await extendReservation(competitionId, userId);
      // Refresh reservation data after extension
      reservation = await getReservation(competitionId, userId);
    } else if (providedTicketNumbers && providedTicketNumbers.length > 0) {
      // Reservation expired but client provided ticket numbers - recreate it
      const recreateResult = await recreateReservation(competitionId, userId, providedTicketNumbers);
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
          ticketNumber: { in: providedTicketNumbers },
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
      if (updateResult.count !== providedTicketNumbers.length) {
        // Some tickets couldn't be reserved - release the Redis locks
        await releaseTicketsFromRedis(competitionId, userId);
        return NextResponse.json(
          { error: 'Some tickets are no longer available. Please select tickets again.' },
          { status: 409 }
        );
      }

      reservation = await getReservation(competitionId, userId);
    }

    if (!reservation) {
      return NextResponse.json(
        { error: 'No active ticket reservation found. Please select tickets again.' },
        { status: 400 }
      );
    }

    const ticketNumbers = reservation.ticketNumbers;
    const ticketCount = ticketNumbers.length;
    const bonusTickets = calculateBonusTickets(ticketCount);

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        ticketPrice: true,
        mainImageUrl: true,
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

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        isBanned: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Your account has been suspended' },
        { status: 403 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before purchasing tickets' },
        { status: 403 }
      );
    }

    // Calculate total
    const ticketPrice =
      typeof competition.ticketPrice === 'object' && 'toNumber' in competition.ticketPrice
        ? (competition.ticketPrice as { toNumber: () => number }).toNumber()
        : Number(competition.ticketPrice);

    const totalAmount = ticketCount * ticketPrice;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order in database (PENDING status)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        competitionId,
        ticketCount,
        bonusTicketCount: bonusTickets,
        totalAmount,
        currency: 'GBP',
        paymentStatus: 'PENDING',
        questionAnswered: true,
        questionCorrect: true,
      },
    });

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId,
        competitionId,
        ticketNumbers: JSON.stringify(ticketNumbers),
        ticketCount: ticketCount.toString(),
        bonusTickets: bonusTickets.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: Math.round(ticketPrice * 100), // Stripe uses cents/pence
            product_data: {
              name: `${ticketCount} Ticket${ticketCount > 1 ? 's' : ''} - ${competition.title}`,
              description: bonusTickets > 0
                ? `Includes ${bonusTickets} bonus ticket${bonusTickets > 1 ? 's' : ''}! Ticket numbers: #${ticketNumbers.join(', #')}`
                : `Ticket numbers: #${ticketNumbers.join(', #')}`,
              images: competition.mainImageUrl ? [competition.mainImageUrl] : [],
            },
          },
          quantity: ticketCount,
        },
      ],
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId,
          competitionId,
        },
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?order_id=${order.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: checkoutSession.id,
      },
    });

    // Log checkout initiation
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CHECKOUT_INITIATED',
        entity: 'order',
        entityId: order.id,
        metadata: {
          orderNumber,
          ticketCount,
          bonusTickets,
          totalAmount,
          stripeSessionId: checkoutSession.id,
        },
        ipAddress: ip,
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating checkout session' },
      { status: 500 }
    );
  }
}
