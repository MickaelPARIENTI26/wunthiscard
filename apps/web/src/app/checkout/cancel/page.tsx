import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { releaseTicketsFromRedis } from '@/lib/redis';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Checkout Cancelled - WinUCard',
  description: 'Your checkout was cancelled',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ order_id?: string }>;
}

async function getOrderAndRelease(orderId: string, userId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        competition: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    if (!order) return null;

    // Only act on an order that is still PENDING (never SUCCEEDED). Flip PENDING →
    // CANCELLED ATOMICALLY: updateMany with a paymentStatus: 'PENDING' guard returns
    // count 1 only for the request that actually performs the transition. Everything
    // that follows (releasing tickets, re-crediting the referral ticket) runs ONLY on
    // that winning transition — so a double page-load, a refresh, or a racing webhook
    // can never re-credit the free ticket twice or fight a successful payment.
    if (order.paymentStatus === 'PENDING') {
      const cancelled = await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: 'PENDING' },
        data: { paymentStatus: 'CANCELLED' },
      });

      if (cancelled.count === 1) {
        // Release Redis locks for this user/competition
        await releaseTicketsFromRedis(order.competitionId, userId);

        // Release database reservations
        await prisma.ticket.updateMany({
          where: {
            competitionId: order.competitionId,
            userId,
            status: 'RESERVED',
          },
          data: {
            status: 'AVAILABLE',
            userId: null,
            reservedUntil: null,
          },
        });

        // Re-credit the buyer's free referral ticket if one was reserved for this
        // order at checkout (the free ticket is decremented atomically in
        // create-session, NOT in the webhook). The source of truth for "this order
        // used a referral ticket" is the Stripe session metadata. Best-effort: a
        // Stripe read failure here must not break the cancel page. The atomic
        // PENDING → CANCELLED flip above guarantees this runs at most once per order,
        // so the counter can never be over-credited.
        let referralTicketUsed = false;
        if (order.stripeSessionId) {
          try {
            const stripeSession = await stripe.checkout.sessions.retrieve(
              order.stripeSessionId
            );
            referralTicketUsed = stripeSession.metadata?.referralTicketUsed === '1';
          } catch (stripeError) {
            console.error('Failed to read Stripe session on cancel:', stripeError);
          }
        }

        if (referralTicketUsed) {
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
                reason: 'checkout_cancelled',
              },
            },
          });
        }

        // Log the cancellation
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CHECKOUT_CANCELLED',
            entity: 'order',
            entityId: order.id,
            metadata: {
              orderNumber: order.orderNumber,
              reason: 'user_cancelled',
              referralTicketRestored: referralTicketUsed,
            },
          },
        });
      }
    }

    return order;
  } catch (error) {
    console.error('Error handling order cancellation:', error);
    return null;
  }
}

export default async function CheckoutCancelPage({ searchParams }: PageProps) {
  const session = await auth();
  const { order_id: orderId } = await searchParams;

  if (!session?.user) {
    redirect('/login');
  }

  let order = null;
  if (orderId) {
    order = await getOrderAndRelease(orderId, session.user.id);
  }

  return (
    <main>
      <section className="drop-section" style={{ textAlign: 'center', maxWidth: '700px', paddingTop: '80px' }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>😔</div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 700, letterSpacing: '-0.045em', margin: '20px 0' }}>
          Payment{' '}
          <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--hot)', textDecorationThickness: '6px', textUnderlineOffset: '8px' }}>
            cancelled
          </span>.
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '17px', lineHeight: 1.6, marginBottom: '32px' }}>
          Your payment was cancelled and you have not been charged. Your tickets have been released back into the pool. You can try again or browse other competitions.
        </p>

        {order && (
          <div className="drop-card-sm" style={{ textAlign: 'left', marginBottom: '24px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-faint)', marginBottom: '4px' }}>You were purchasing tickets for:</p>
            <p className="font-bold">{order.competition.title}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 justify-center">
          {order ? (
            <Button variant="primary" size="xl" asChild>
              <Link href={`/competitions/${order.competition.slug}`}>Try again →</Link>
            </Button>
          ) : (
            <Button variant="primary" size="xl" asChild>
              <Link href="/competitions">Browse competitions</Link>
            </Button>
          )}
          <Button variant="ghost" size="xl" asChild>
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
