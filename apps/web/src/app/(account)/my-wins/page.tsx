import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Trophy, Package, Truck, CheckCircle, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'My Wins | WinUCard',
  description: 'View all your competition wins and delivery status',
};

type DeliveryStatus = 'claimed' | 'shipped' | 'delivered' | 'pending';

function getDeliveryStatus(win: {
  claimedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}): DeliveryStatus {
  if (win.deliveredAt) return 'delivered';
  if (win.shippedAt) return 'shipped';
  if (win.claimedAt) return 'claimed';
  return 'pending';
}

const DELIVERY_CONFIG: Record<
  DeliveryStatus,
  { label: string; bg: string; color: string; icon: typeof Package }
> = {
  pending: { label: 'Pending claim', bg: 'var(--warn)', color: 'var(--ink)', icon: Trophy },
  claimed: { label: 'Claimed', bg: 'var(--pop)', color: '#fff', icon: Package },
  shipped: { label: 'Shipped', bg: 'var(--pop)', color: '#fff', icon: Truck },
  delivered: { label: 'Delivered', bg: 'var(--accent)', color: 'var(--ink)', icon: CheckCircle },
};

function DeliveryPill({ status }: { status: DeliveryStatus }) {
  const config = DELIVERY_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        background: config.bg,
        color: config.color,
        border: '1.5px solid var(--ink)',
        borderRadius: '6px',
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default async function MyWinsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-wins');
  }

  const wins = await prisma.win.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      competition: {
        select: {
          id: true,
          slug: true,
          title: true,
          mainImageUrl: true,
          prizeValue: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          marginBottom: '32px',
          paddingBottom: '22px',
          borderBottom: '1.5px solid var(--ink)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          Your account · Wins · {wins.length} card{wins.length !== 1 ? 's' : ''}
        </div>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 0.95,
            marginBottom: '10px',
          }}
        >
          My <span className="chip">wins</span>.
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px' }}>
          All cards shipped with tracked insurance.
        </p>
      </div>

      {wins.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏆</div>
          <h3
            style={{
              fontFamily: 'var(--display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            No wins yet
          </h3>
          <p
            style={{
              color: 'var(--ink-dim)',
              fontSize: '14px',
              maxWidth: '360px',
              margin: '0 auto 24px',
            }}
          >
            Keep entering — every ticket is a shot at a grail card.
          </p>
          <Link href="/competitions" className="btn btn-hot btn-xl">
            Enter a competition →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {wins.map((win) => {
            const deliveryStatus = getDeliveryStatus(win);

            return (
              <div
                key={win.id}
                style={{
                  overflow: 'hidden',
                  background: 'var(--surface)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: 'var(--radius)',
                  boxShadow: '4px 4px 0 var(--accent)',
                  display: 'flex',
                }}
                className="flex-col sm:flex-row"
              >
                {/* Image */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 10',
                    flexShrink: 0,
                  }}
                  className="sm:w-40 sm:aspect-square"
                >
                  <Image
                    src={win.competition.mainImageUrl}
                    alt={win.competition.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 160px"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(13, 13, 13, 0.6)',
                    }}
                  >
                    <Trophy className="h-10 w-10" style={{ color: 'var(--accent)' }} />
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: '18px 20px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <DeliveryPill status={deliveryStatus} />
                  </div>

                  <Link
                    href={`/competitions/${win.competition.slug}`}
                    style={{
                      fontFamily: 'var(--display)',
                      fontSize: '18px',
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.2,
                      display: 'block',
                      marginBottom: '12px',
                    }}
                    className="hover:underline"
                  >
                    {win.competition.title}
                  </Link>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ink-dim)' }}>Prize value</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-2)' }}>
                        {Number(win.competition.prizeValue).toLocaleString('en-GB', {
                          style: 'currency',
                          currency: 'GBP',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ink-dim)' }}>Winning ticket</span>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: 'var(--accent)',
                          border: '1.5px solid var(--ink)',
                          borderRadius: '6px',
                          fontFamily: 'var(--mono)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                        }}
                      >
                        #{win.ticketNumber}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--ink-dim)' }}>Won on</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '12.5px' }}>
                        {formatDate(win.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Tracking */}
                  {win.shippedAt && win.trackingNumber && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px 14px',
                        background: 'var(--bg-2)',
                        border: '1px dashed var(--line-2)',
                        borderRadius: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '10px',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-faint)',
                          fontWeight: 700,
                          marginBottom: '8px',
                        }}
                      >
                        Tracking
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink-dim)' }}>Carrier</span>
                          <span>{win.shippingCarrier ?? 'Royal Mail'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink-dim)' }}>Tracking</span>
                          {win.trackingUrl ? (
                            <a
                              href={win.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontFamily: 'var(--mono)',
                                color: 'var(--ink)',
                                fontWeight: 700,
                                textDecoration: 'underline',
                              }}
                            >
                              {win.trackingNumber}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span style={{ fontFamily: 'var(--mono)' }}>{win.trackingNumber}</span>
                          )}
                        </div>
                        {win.shippedAt && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--ink-dim)' }}>Shipped</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '12.5px' }}>
                              {formatDate(win.shippedAt)}
                            </span>
                          </div>
                        )}
                        {win.deliveredAt && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--ink-dim)' }}>Delivered</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '12.5px' }}>
                              {formatDate(win.deliveredAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
