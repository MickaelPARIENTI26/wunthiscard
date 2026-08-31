import { Metadata } from 'next';
import { TrackPurchase } from '@/components/common/track-event';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { fulfillCheckoutSession } from '@/lib/fulfill-checkout';
import { Button } from '@/components/ui/button';
import { formatPrice, buildWheelSegments } from '@winucard/shared/utils';
import { PrizeWheel } from '@/components/wheel/prize-wheel';
import { ClearCheckoutStorage } from './clear-checkout-storage';

export const metadata: Metadata = {
  title: 'Purchase Successful - WinUPrize',
  description: 'Your ticket purchase was successful',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

async function getOrderDetails(sessionId: string, viewerId: string) {
  try {
    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (!session || !session.metadata?.orderId) {
      return null;
    }

    // Ownership check BEFORE any processing: the session_id is attacker-supplyable
    // (it appears in the redirect URL / browser history / Referer). Never fulfil or
    // expose an order that isn't the viewer's.
    if (session.metadata.userId && session.metadata.userId !== viewerId) {
      return null;
    }

    // Fulfil from this page if the webhook hasn't already done so — in BOTH dev and
    // prod. The webhook is normally the primary path, but in production it can be
    // unconfigured, lagging, or failing signature verification; without this fallback
    // a paid order would never fulfil (no tickets, no email, no counter drop). This
    // shares the exact same idempotent logic as the webhook: the in-transaction claim
    // (paymentStatus != 'SUCCEEDED') makes a webhook+page race safe — the loser does
    // nothing. We skip the call entirely when the order is already SUCCEEDED to avoid a
    // redundant Stripe-session round trip on the common (webhook-won) path.
    const existingStatus = await prisma.order.findUnique({
      where: { id: session.metadata.orderId },
      select: { paymentStatus: true },
    });
    if (existingStatus && existingStatus.paymentStatus !== 'SUCCEEDED') {
      await fulfillCheckoutSession(session);
    }

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: session.metadata.orderId },
      include: {
        competition: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            mainImageUrl: true,
            drawDate: true,
          },
        },
        tickets: {
          select: {
            ticketNumber: true,
            isBonus: true,
          },
          orderBy: {
            ticketNumber: 'asc',
          },
        },
      },
    });

    // Defensive second check: the loaded order must belong to the viewer.
    if (order && order.userId && order.userId !== viewerId) {
      return null;
    }

    // In production the webhook fulfils the order asynchronously, so this page can
    // load a split-second before paymentStatus flips to SUCCEEDED. Don't show the
    // (empty, ticket-less) success card or an error in that window — surface the
    // graceful "confirming your payment" state instead; the webhook will finish and
    // the tickets will appear in My Tickets / on refresh shortly. Treat any non-final
    // status that isn't a hard failure as "still confirming".
    if (
      order &&
      order.paymentStatus !== 'SUCCEEDED' &&
      order.paymentStatus !== 'REFUNDED'
    ) {
      return 'pending' as const;
    }

    return order;
  } catch (error) {
    // A backend hiccup (Stripe/DB) is NOT the same as "order doesn't exist". The
    // webhook is racing to credit the order, so signal "still confirming" rather
    // than showing the alarming "Order Not Found" for a transient failure.
    console.error('Error fetching order details:', error);
    return 'pending' as const;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const session = await auth();
  const { session_id: sessionId } = await searchParams;

  if (!session?.user) {
    redirect('/login');
  }

  if (!sessionId) {
    redirect('/');
  }

  const order = await getOrderDetails(sessionId, session.user.id);

  if (order === 'pending') {
    return (
      <main>
        <section className="drop-section" style={{ textAlign: 'center', maxWidth: '700px', paddingTop: '80px' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>Confirming your payment…</h1>
          <p style={{ color: 'var(--ink-dim)', marginBottom: '24px' }}>
            We&apos;re confirming your payment — your tickets will appear in My Tickets shortly, and we&apos;ll email your confirmation. You can safely refresh in a moment or check your account.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button variant="primary" size="lg" asChild>
              <Link href="/my-tickets">View My Tickets</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main>
        <section className="drop-section" style={{ textAlign: 'center', maxWidth: '700px', paddingTop: '80px' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>Order Not Found</h1>
          <p style={{ color: 'var(--ink-dim)', marginBottom: '24px' }}>
            We could not find your order. Please check your email for confirmation.
          </p>
          <Button variant="primary" size="lg" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </section>
      </main>
    );
  }

  // Spins this order earned and the buyer has not played yet. Fetched after
  // fulfilment above, which is what mints them.
  const spins = await prisma.wheelSpin.findMany({
    where: {
      orderId: order.id,
      userId: session.user.id,
      spunAt: null,
      reversedAt: null,
      wheelConfig: { enabled: true },
      competition: { drawDate: { gt: new Date() } },
    },
    select: {
      id: true,
      wheelConfig: {
        select: {
          jackpotEnabled: true,
          slots: {
            select: { type: true, value: true, quantityConfigured: true, quantityWon: true },
          },
        },
      },
    },
    orderBy: { grantedAt: 'asc' },
  });

  const firstSpin = spins[0];
  const wheelSlots = !firstSpin
    ? []
    : firstSpin.wheelConfig.jackpotEnabled
      ? firstSpin.wheelConfig.slots
      : firstSpin.wheelConfig.slots.filter((s) => s.type !== 'JACKPOT');
  const wheelSegments = buildWheelSegments(wheelSlots);

  const paidTickets = order.tickets.filter((t) => !t.isBonus);
  const bonusTickets = order.tickets.filter((t) => t.isBonus);
  const totalAmount =
    typeof order.totalAmount === 'object' && 'toNumber' in order.totalAmount
      ? (order.totalAmount as { toNumber: () => number }).toNumber()
      : Number(order.totalAmount);

  return (
    <main>
      {/* Reset this tab's per-competition checkout state so a repeat purchase in the
          same session starts the funnel clean (no stale qcm/reservation dead-ends). */}
      <ClearCheckoutStorage competitionId={order.competition.id} />

      {/* GA4 purchase — deduped on the order number so a refresh can't
          double-count the sale. */}
      <TrackPurchase
        orderNumber={order.orderNumber}
        value={totalAmount}
        quantity={paidTickets.length}
        competition={{
          id: order.competition.id,
          name: order.competition.title,
          category: order.competition.category,
          price: paidTickets.length > 0 ? Number((totalAmount / paidTickets.length).toFixed(2)) : 0,
        }}
      />
      <section className="drop-section" style={{ textAlign: 'center', maxWidth: '700px', paddingTop: '80px' }}>
        {/* Celebration */}
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
        <div
          className="inline-flex items-center gap-2.5 justify-center"
          style={{
            padding: '7px 14px', background: 'var(--accent)', color: '#0A0A0A',
            borderRadius: 0, fontFamily: 'var(--display)', fontSize: '12.5px',
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '20px',
          }}
        >
          <span className="live-dot" style={{ background: "#0A0A0A", boxShadow: "none" }} />
          ENTRY CONFIRMED
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 6vw, 64px)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.95, margin: '20px 0' }}>
          You&apos;re <span className="inline-block bg-[var(--accent)] text-[#0A0A0A] px-[0.18em] pb-[2px] font-bold">in</span>.
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '17px', lineHeight: 1.6, marginBottom: '32px' }}>
          We&apos;ve emailed your confirmation. When the countdown hits zero, an independent third party draws the winner and we publish the result right here.
        </p>

        {/* The wheel — one spin per paid ticket, playable right here. */}
        {spins.length > 0 && wheelSegments.length > 0 && (
          <div className="drop-card" style={{ marginBottom: '32px', borderColor: 'var(--accent)' }}>
            <div
              style={{
                fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'var(--accent-text)', fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              Buyer bonus
            </div>
            <h2
              style={{
                fontFamily: 'var(--display)', fontSize: 'clamp(24px, 6vw, 34px)', fontWeight: 700,
                letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px',
              }}
            >
              You unlocked {spins.length} spin{spins.length !== 1 ? 's' : ''}.
            </h2>
            <p style={{ color: 'var(--ink-dim)', fontSize: '14.5px', marginBottom: '22px' }}>
              One per paid ticket. Nothing to lose — your entry is already confirmed.
            </p>
            <PrizeWheel spinIds={spins.map((s) => s.id)} segments={wheelSegments} />
            <p style={{ color: 'var(--ink-faint)', fontSize: '12.5px', marginTop: '18px' }}>
              Not now? Your spins wait for you in{' '}
              <Link href="/my-rewards" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
                My Rewards
              </Link>{' '}
              until this competition closes.
            </p>
          </div>
        )}

        {/* Order summary card */}
        <div className="drop-card" style={{ textAlign: 'left', marginBottom: '32px' }}>
          {/* Competition info */}
          <div className="flex gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden" style={{ borderRadius: 0, border: '1px solid rgba(244, 241, 234, 0.18)' }}>
              <Image src={order.competition.mainImageUrl} alt={order.competition.title} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{order.competition.title}</h3>
              <p style={{ fontFamily: 'var(--display)', fontSize: '12.5px', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Draw: {formatDate(order.competition.drawDate)}
              </p>
            </div>
          </div>

          {/* Order details */}
          <div className="flex justify-between py-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <span style={{ color: 'var(--ink-dim)' }}>Order ID</span>
            <b>#{order.orderNumber}</b>
          </div>
          <div className="flex justify-between py-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <span style={{ color: 'var(--ink-dim)' }}>Tickets</span>
            <b>{paidTickets.length}{bonusTickets.length > 0 ? ` + ${bonusTickets.length} bonus` : ''}</b>
          </div>
          <div className="flex justify-between py-3">
            <span style={{ color: 'var(--ink-dim)' }}>Total paid</span>
            <b>{formatPrice(totalAmount)}</b>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5 justify-center">
          <Button variant="hot" size="xl" asChild>
            <Link href="/my-tickets">View my tickets →</Link>
          </Button>
          <Button variant="ghost" size="xl" asChild>
            <Link href="/competitions">Browse more</Link>
          </Button>
        </div>

        {/* Email note */}
        <p style={{ fontFamily: 'var(--display)', fontSize: '12.5px', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '24px' }}>
          Confirmation sent to {session.user.email}
        </p>
      </section>
    </main>
  );
}
