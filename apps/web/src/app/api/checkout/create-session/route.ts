import type { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, calculateBonusTickets, generateOrderNumber } from '@/lib/stripe';
import { getReservation, extendReservation, recreateReservation, releaseTicketsFromRedis, hasPassedQcm, markQcmPassed, rateLimits, CHECKOUT_RESERVATION_TTL } from '@/lib/redis';
import { getClientIp } from '@/lib/get-client-ip';

const createSessionSchema = z.object({
  competitionId: z.string().min(1),
  ticketNumbers: z.array(z.number().int().positive()).max(100).optional(),
  useReferralTicket: z.boolean().optional(),
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
    const ip = getClientIp(request.headers);
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

    const { competitionId, ticketNumbers: providedTicketNumbers, useReferralTicket: requestedReferralTicket } = validation.data;

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
      // Reservation expired but client provided ticket numbers - recreate it.
      // This path trusts client-supplied numbers, so it must re-enforce the
      // per-user cap that /api/tickets/reserve normally applies — otherwise a
      // user could check out more tickets than the competition allows.
      const capComp = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: { maxTicketsPerUser: true },
      });
      const existingOwned = await prisma.ticket.count({
        where: { competitionId, userId, status: 'SOLD' },
      });
      const perUserCap = capComp?.maxTicketsPerUser ?? 100;
      // perUserCap <= 0 means "no per-user limit".
      if (perUserCap > 0 && providedTicketNumbers.length > perUserCap - existingOwned) {
        return NextResponse.json(
          { error: `You can hold at most ${perUserCap} tickets for this competition.` },
          { status: 400 }
        );
      }

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
        // Some tickets couldn't be reserved - release the Redis locks. Don't let a
        // cleanup failure mask the real 409 with a 500 (locks self-heal on TTL).
        try {
          await releaseTicketsFromRedis(competitionId, userId);
        } catch (releaseError) {
          console.error('Redis release failed during reservation rollback:', releaseError);
        }
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
        drawDate: true,
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

    // No checkout past the advertised draw time (defence even if a status-flip
    // cron hasn't run yet).
    if (competition.drawDate && new Date(competition.drawDate) <= new Date()) {
      return NextResponse.json(
        { error: 'This competition has closed and is no longer accepting entries.' },
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
        isBanned: true,
        referralFreeTicketsAvailable: true,
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

    // Paid purchases intentionally do NOT require a verified email — the Stripe
    // payment is the legitimacy signal. (Free entries DO; see free-entry route.)

    // Age (18+) is confirmed by the arrival AgeGate prompt + the 18+ acceptance at
    // signup/checkout (product decision) — no server-side date-of-birth gate here.

    // Calculate total
    const ticketPrice =
      typeof competition.ticketPrice === 'object' && 'toNumber' in competition.ticketPrice
        ? (competition.ticketPrice as { toNumber: () => number }).toNumber()
        : Number(competition.ticketPrice);

    // Referral free ticket: apply ONLY if the user genuinely has one available
    // AND is buying ≥ 2 tickets (so at least 1 ticket is still paid → valid charge).
    // Never trust the client — re-checked here against the DB.
    //
    // Reserve the free ticket ATOMICALLY here (decrement before creating the Stripe
    // session) rather than at webhook time. A plain read would let a user with 1 free
    // ticket open several concurrent Checkout sessions, each showing the discount and
    // each redeeming it at webhook time — a double-spend. The conditional updateMany
    // (gt: 0) lets exactly one session win; the rest charge full price.
    const wantsReferralTicket =
      requestedReferralTicket === true &&
      user.referralFreeTicketsAvailable >= 1 &&
      ticketCount >= 2;

    let applyReferralTicket = false;
    if (wantsReferralTicket) {
      const dec = await prisma.user.updateMany({
        where: { id: userId, referralFreeTicketsAvailable: { gt: 0 } },
        data: { referralFreeTicketsAvailable: { decrement: 1 } },
      });
      applyReferralTicket = dec.count === 1;
    }

    const paidTicketCount = applyReferralTicket ? ticketCount - 1 : ticketCount;

    const totalAmount = paidTicketCount * ticketPrice;

    // Create order in database (PENDING status). ticketCount = total tickets the
    // user receives; totalAmount reflects what they actually pay. Regenerate the
    // order number on the (astronomically rare) unique-constraint collision rather
    // than 500ing the user's checkout.
    let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        order = await prisma.order.create({
          data: {
            orderNumber: generateOrderNumber(),
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
        break;
      } catch (e) {
        const code =
          e && typeof e === 'object' && 'code' in e
            ? (e as { code?: string }).code
            : undefined;
        if (code === 'P2002' && attempt < 4) continue; // orderNumber collision — retry
        throw e;
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Could not create your order. Please try again.' },
        { status: 500 }
      );
    }
    const orderNumber = order.orderNumber;

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Create Stripe Checkout Session. The referral free ticket was decremented
    // atomically BEFORE this call (to stop two concurrent sessions redeeming the same
    // ticket). If session creation throws, no expiry/cancel path will ever fire to
    // re-credit it (the order has no stripeSessionId), so it would be lost forever —
    // restore it here before surfacing the error.
    let checkoutSession: Stripe.Checkout.Session;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
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
        referralTicketUsed: applyReferralTicket ? '1' : '0',
      },
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: Math.round(ticketPrice * 100), // Stripe uses cents/pence
            product_data: {
              name: `${paidTicketCount} Ticket${paidTicketCount > 1 ? 's' : ''} - ${competition.title}`,
              description: [
                applyReferralTicket
                  ? `1 free referral ticket applied (you get ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} total).`
                  : null,
                bonusTickets > 0
                  ? `Includes ${bonusTickets} bonus ticket${bonusTickets > 1 ? 's' : ''}!`
                  : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined,
              images: competition.mainImageUrl ? [competition.mainImageUrl] : [],
            },
          },
          quantity: paidTicketCount,
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
    } catch (stripeError) {
      console.error('Stripe checkout session creation failed:', stripeError);
      // Re-credit the referral free ticket decremented above so it isn't silently lost.
      if (applyReferralTicket) {
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { referralFreeTicketsAvailable: { increment: 1 } },
          });
          await prisma.auditLog.create({
            data: {
              userId,
              action: 'REFERRAL_FREE_TICKET_RESTORED',
              entity: 'order',
              entityId: order.id,
              metadata: {
                orderNumber: order.orderNumber,
                reason: 'stripe_session_create_failed',
              },
            },
          });
        } catch (restoreError) {
          console.error('Failed to restore referral free ticket after Stripe failure:', restoreError);
        }
      }
      return NextResponse.json(
        { error: 'An error occurred while creating checkout session' },
        { status: 500 }
      );
    }

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: checkoutSession.id,
      },
    });

    // Hold the reserved tickets for the FULL Stripe Checkout window (~31 min, just
    // beyond the 30-min session expiry) so they can't be resold while the buyer is
    // on the payment page. Extend BOTH the Redis lock and the DB reservedUntil — the
    // 5-minute selection hold would otherwise expire mid-payment and let another
    // buyer grab the same numbers (causing a paid-but-under-delivered order).
    // Best-effort: a Redis/DB hiccup here must not block checkout — the webhook
    // reassigns any lost numbers from available stock as a backstop.
    try {
      await extendReservation(competitionId, userId, CHECKOUT_RESERVATION_TTL);
      await prisma.ticket.updateMany({
        where: { competitionId, userId, status: 'RESERVED' },
        data: { reservedUntil: new Date(Date.now() + CHECKOUT_RESERVATION_TTL * 1000) },
      });
    } catch (extendError) {
      console.error('Failed to extend reservation to the checkout window:', extendError);
    }

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
          paidTicketCount,
          referralTicketUsed: applyReferralTicket,
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
