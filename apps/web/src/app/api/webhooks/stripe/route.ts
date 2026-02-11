import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { releaseTicketsFromRedis } from '@/lib/redis';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No orderId in session metadata');
    return;
  }

  // Get order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      competition: true,
    },
  });

  if (!order) {
    console.error('Order not found:', orderId);
    return;
  }

  const ticketNumbers = JSON.parse(session.metadata?.ticketNumbers || '[]') as number[];
  const bonusTickets = parseInt(session.metadata?.bonusTickets || '0', 10);

  // Start a transaction to update order and assign tickets
  // Using a transaction with the idempotency check INSIDE to prevent race conditions
  const transactionResult = await prisma.$transaction(async (tx) => {
    // Check again inside transaction to prevent duplicate processing
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true },
    });

    if (currentOrder?.paymentStatus === 'SUCCEEDED') {
      console.log('Order already processed (inside transaction):', orderId);
      return { alreadyProcessed: true };
    }

    // Update order status atomically
    const updatedOrder = await tx.order.update({
      where: {
        id: orderId,
        paymentStatus: { not: 'SUCCEEDED' }, // Extra safety
      },
      data: {
        paymentStatus: 'SUCCEEDED',
        stripePaymentIntentId: session.payment_intent as string,
      },
    });

    if (!updatedOrder) {
      console.log('Order status conflict:', orderId);
      return { alreadyProcessed: true };
    }

    // Assign paid tickets to user - only update RESERVED tickets belonging to this user
    const ticketUpdateResult = await tx.ticket.updateMany({
      where: {
        competitionId: order.competitionId,
        ticketNumber: { in: ticketNumbers },
        status: 'RESERVED',
        userId: order.userId, // Only update tickets reserved by this user
      },
      data: {
        orderId: order.id,
        status: 'SOLD',
        reservedUntil: null,
      },
    });

    // Verify all expected tickets were updated
    if (ticketUpdateResult.count !== ticketNumbers.length) {
      console.error(
        `Ticket count mismatch: expected ${ticketNumbers.length}, updated ${ticketUpdateResult.count}`
      );
      // Don't throw - payment succeeded so we should continue
      // The user will get the tickets that were successfully updated
    }

    // Assign bonus tickets if any
    if (bonusTickets > 0) {
      // Find available tickets for bonus
      const availableTickets = await tx.ticket.findMany({
        where: {
          competitionId: order.competitionId,
          status: 'AVAILABLE',
          ticketNumber: { notIn: ticketNumbers },
        },
        take: bonusTickets,
        orderBy: {
          ticketNumber: 'asc', // Give lowest available numbers as bonus
        },
      });

      if (availableTickets.length > 0) {
        const bonusTicketNumbers = availableTickets.map((t) => t.ticketNumber);

        // Use status check to prevent race conditions with concurrent bonus assignments
        await tx.ticket.updateMany({
          where: {
            competitionId: order.competitionId,
            ticketNumber: { in: bonusTicketNumbers },
            status: 'AVAILABLE', // Only update if still available
          },
          data: {
            userId: order.userId,
            orderId: order.id,
            status: 'SOLD',
            isBonus: true,
          },
        });
      }
    }

    // Check if competition is now sold out
    const remainingTickets = await tx.ticket.count({
      where: {
        competitionId: order.competitionId,
        status: 'AVAILABLE',
      },
    });

    if (remainingTickets === 0 && order.competition.status === 'ACTIVE') {
      await tx.competition.update({
        where: { id: order.competitionId },
        data: { status: 'SOLD_OUT' },
      });
    }

    return { alreadyProcessed: false };
  });

  // Check if order was already processed
  if (transactionResult.alreadyProcessed) {
    return;
  }

  // Release Redis reservation (cleanup)
  // Only release if userId exists (should always exist for active orders)
  if (order.userId) {
    await releaseTicketsFromRedis(order.competitionId, order.userId);
  }

  // Log success
  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'PAYMENT_SUCCEEDED',
      entity: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        ticketNumbers,
        bonusTickets,
        stripeSessionId: session.id,
        amount: session.amount_total,
      },
    },
  });

  console.log('Payment processed successfully:', order.orderNumber);

  // Get the final ticket numbers including bonuses
  const finalTickets = await prisma.ticket.findMany({
    where: {
      orderId: order.id,
    },
    select: {
      ticketNumber: true,
      isBonus: true,
    },
    orderBy: {
      ticketNumber: 'asc',
    },
  });

  const paidTicketNumbers = finalTickets
    .filter((t) => !t.isBonus)
    .map((t) => t.ticketNumber);
  const bonusTicketNumbers = finalTickets
    .filter((t) => t.isBonus)
    .map((t) => t.ticketNumber);

  const totalAmount =
    typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount
      ? (order.totalAmount as { toNumber: () => number }).toNumber()
      : Number(order.totalAmount);

  // Send confirmation email (only if user exists)
  if (order.user) {
    await sendPurchaseConfirmationEmail(order.user.email, order.user.firstName, {
      orderNumber: order.orderNumber,
      competitionTitle: order.competition.title,
      ticketNumbers: paidTicketNumbers,
      bonusTicketNumbers,
      totalAmount,
      drawDate: order.competition.drawDate,
    });
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return;

  // Update order status to cancelled
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'CANCELLED' },
  });

  // Release reserved tickets back to available
  const ticketNumbers = JSON.parse(session.metadata?.ticketNumbers || '[]') as number[];

  if (ticketNumbers.length > 0) {
    await prisma.ticket.updateMany({
      where: {
        competitionId: order.competitionId,
        ticketNumber: { in: ticketNumbers },
        status: 'RESERVED',
      },
      data: {
        status: 'AVAILABLE',
        userId: null,
        reservedUntil: null,
      },
    });
  }

  // Release Redis reservation
  if (order.userId) {
    await releaseTicketsFromRedis(order.competitionId, order.userId);
  }

  // Log expiration
  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'CHECKOUT_EXPIRED',
      entity: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        stripeSessionId: session.id,
      },
    },
  });

  console.log('Checkout session expired:', order.orderNumber);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    console.log('No orderId in payment intent metadata');
    return;
  }

  // Update order with payment intent ID if not already set
  await prisma.order.updateMany({
    where: {
      id: orderId,
      stripePaymentIntentId: null,
    },
    data: {
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  console.log('Payment intent succeeded:', paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return;

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'FAILED' },
  });

  // Log failure
  await prisma.auditLog.create({
    data: {
      userId: order.userId,
      action: 'PAYMENT_FAILED',
      entity: 'order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        stripePaymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      },
    },
  });

  console.log('Payment failed:', order.orderNumber);
}
