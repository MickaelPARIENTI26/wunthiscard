import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { releaseTicketsFromRedis } from '@/lib/redis';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Checkout Cancelled - WinUCard',
  description: 'Your checkout was cancelled',
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

    // If order is still PENDING, release the reserved tickets
    if (order.paymentStatus === 'PENDING') {
      // Get ticket numbers from Stripe session metadata
      // For now, release all Redis locks for this user/competition
      await releaseTicketsFromRedis(order.competitionId, userId);

      // Update order status to CANCELLED
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'CANCELLED' },
      });

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
          },
        },
      });
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
              <Link href={`/competitions/${order.competition.slug}/tickets`}>Try again →</Link>
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
