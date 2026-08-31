import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { buildWheelSegments, wheelSlotLabel } from '@winucard/shared/utils';
import { PrizeWheel } from '@/components/wheel/prize-wheel';
import { CopyCode } from './copy-code';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'My Rewards',
  description: 'Spin your wheel, and find the promo codes you have won',
};

// Spins and codes change the moment one is used, so this page must never be
// served from a cached render.
export const dynamic = 'force-dynamic';

/** What each fulfilment stage means to the person waiting for the card. */
const JACKPOT_STATUS_COPY: Record<string, string> = {
  PENDING: 'We have been alerted and will email you to confirm your delivery address.',
  CONTACTED: 'We have emailed you — reply with your delivery address and we will ship it.',
  ADDRESS_CONFIRMED: 'Address confirmed. Your card is being packed for tracked, insured delivery.',
  SHIPPED: 'On its way, tracked and insured.',
  DELIVERED: 'Delivered. Enjoy it.',
};

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default async function MyRewardsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-rewards');
  }

  const userId = session.user.id;
  const now = new Date();

  const [pendingSpins, codes, history, expiredCount, jackpotWins] = await Promise.all([
    prisma.wheelSpin.findMany({
      // A spin dies with its competition, so the live draw date is the filter —
      // never the copy stored on the spin, which an admin can move.
      where: {
        userId,
        spunAt: null,
        reversedAt: null,
        // NOT filtered on wheelConfig.enabled. A spin on a switched-off wheel
        // matched none of the three queries on this page and simply vanished,
        // while the hero still promised spins last until the competition closes.
        // They are shown paused instead.
        competition: { drawDate: { gt: now }, status: { in: ['ACTIVE', 'SOLD_OUT'] } },
      },
      select: {
        id: true,
        competitionId: true,
        competition: {
          select: { slug: true, title: true, mainImageUrl: true, drawDate: true },
        },
        wheelConfig: {
          select: {
            enabled: true,
            jackpotEnabled: true,
            slots: {
              select: { type: true, value: true, quantityConfigured: true, quantityWon: true },
            },
          },
        },
      },
      orderBy: { grantedAt: 'asc' },
    }),
    prisma.promoCode.findMany({
      where: { userId },
      select: {
        id: true,
        code: true,
        percentOff: true,
        expiresAt: true,
        redeemedAt: true,
        voidedAt: true,
      },
      orderBy: { issuedAt: 'desc' },
    }),
    prisma.wheelSpin.findMany({
      where: { userId, spunAt: { not: null } },
      select: {
        id: true,
        spunAt: true,
        resultType: true,
        resultValue: true,
        reversedAt: true,
        reversalReason: true,
        competition: { select: { title: true } },
      },
      orderBy: { spunAt: 'desc' },
      take: 30,
    }),
    prisma.wheelSpin.count({
      where: { userId, spunAt: null, reversedAt: null, competition: { drawDate: { lte: now } } },
    }),
    // A graded card is the one prize that must survive a page refresh. The
    // reveal on the wheel is a single div in the browser; this is the record.
    prisma.jackpotWin.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        prizeDescription: true,
        prizeValue: true,
        trackingNumber: true,
        createdAt: true,
        competition: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // One wheel per competition: each has its own pool, and its own segments once
  // some of that pool has been won.
  type PendingSpin = (typeof pendingSpins)[number];
  const wheels: { first: PendingSpin; spins: PendingSpin[] }[] = [];
  const wheelIndex = new Map<string, number>();
  for (const spin of pendingSpins) {
    const at = wheelIndex.get(spin.competitionId);
    if (at === undefined) {
      wheelIndex.set(spin.competitionId, wheels.length);
      wheels.push({ first: spin, spins: [spin] });
    } else {
      wheels[at]?.spins.push(spin);
    }
  }

  // A cancelled code is neither usable nor silently hidden: it moves to the spent
  // list labelled "Cancelled", because a reward that vanishes without a word
  // reads as a bug.
  const activeCodes = codes.filter((c) => !c.voidedAt && !c.redeemedAt && c.expiresAt > now);
  const spentCodes = codes.filter(
    (c) => c.voidedAt !== null || c.redeemedAt !== null || c.expiresAt <= now
  );
  const spinsAvailable = pendingSpins.filter((s) => s.wheelConfig.enabled).length;
  const pausedSpins = pendingSpins.length - spinsAvailable;

  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: '32px', paddingBottom: '22px', borderBottom: '1px solid var(--line)' }}>
        <div
          style={{
            fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 700, marginBottom: '10px',
          }}
        >
          Your account · Rewards · {spinsAvailable} spin{spinsAvailable !== 1 ? 's' : ''} ready
          {pausedSpins > 0 ? ` · ${pausedSpins} on hold` : ''}
        </div>
        <h1
          style={{
            fontFamily: 'var(--display)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700,
            letterSpacing: '-0.035em', lineHeight: 0.95, marginBottom: '10px',
          }}
        >
          My <span className="chip">rewards</span>.
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px' }}>
          Every paid ticket earns one spin. Spins last until that competition closes.
        </p>
      </div>

      {/* A won graded card — shown first and permanently. */}
      {jackpotWins.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {jackpotWins.map((win) => (
            <div key={win.id} className="drop-card" style={{ borderColor: 'var(--accent)' }}>
              <div
                style={{
                  fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'var(--accent-text)', fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                🏆 Graded card won
              </div>
              <p style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>
                {win.prizeDescription}
              </p>
              <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginBottom: '12px' }}>
                Won on {win.competition.title} · {DATE.format(win.createdAt)}
                {win.prizeValue ? ` · approx. £${Number(win.prizeValue).toLocaleString('en-GB')}` : ''}
              </p>
              <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
                {JACKPOT_STATUS_COPY[win.status] ?? 'We are arranging delivery.'}
              </p>
              {win.trackingNumber && (
                <p style={{ color: 'var(--ink-faint)', fontSize: '13px', marginTop: '6px' }}>
                  Tracking: <span style={{ fontFamily: 'var(--mono)' }}>{win.trackingNumber}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Wheels */}
      {wheels.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {wheels.map(({ first, spins }) => {
            const config = first.wheelConfig;
            const paused = !config.enabled;
            const slots = config.jackpotEnabled
              ? config.slots
              : config.slots.filter((s) => s.type !== 'JACKPOT');

            return (
              <div key={first.competitionId} className="drop-card">
                <div className="flex gap-3 items-center" style={{ marginBottom: '18px' }}>
                  <div
                    className="relative flex-shrink-0 overflow-hidden"
                    style={{ height: '56px', width: '56px', border: '1px solid var(--line)' }}
                  >
                    <Image
                      src={first.competition.mainImageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/competitions/${first.competition.slug}`}
                      style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', textDecoration: 'none' }}
                    >
                      {first.competition.title}
                    </Link>
                    <p
                      style={{
                        fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: '2px',
                      }}
                    >
                      Spins expire {DATE.format(first.competition.drawDate)}
                    </p>
                  </div>
                </div>

                {paused ? (
                  <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
                    This wheel is paused right now, so your {spins.length} spin
                    {spins.length !== 1 ? 's are' : ' is'} on hold. They are not lost — we
                    will email you when it reopens, and they still last until this
                    competition closes.
                  </p>
                ) : (
                  <PrizeWheel
                    spinIds={spins.map((s) => s.id)}
                    segments={buildWheelSegments(slots)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="drop-card" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎡</div>
          <h3
            style={{
              fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700,
              letterSpacing: '-0.02em', marginBottom: '8px',
            }}
          >
            No spins waiting
          </h3>
          <p style={{ color: 'var(--ink-dim)', fontSize: '14px', maxWidth: '380px', margin: '0 auto 22px' }}>
            You get one spin for every paid ticket. Free entries and bonus tickets don&apos;t
            earn spins.
          </p>
          <Link href="/competitions" className="btn btn-hot btn-xl">
            Enter a competition →
          </Link>
        </div>
      )}

      {expiredCount > 0 && (
        <p style={{ color: 'var(--ink-faint)', fontSize: '13px', marginTop: '-24px', marginBottom: '40px' }}>
          {expiredCount} spin{expiredCount !== 1 ? 's' : ''} expired when their competition closed.
        </p>
      )}

      {/* Promo codes */}
      <SectionTitle>My promo codes</SectionTitle>
      {activeCodes.length === 0 && spentCodes.length === 0 ? (
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginBottom: '40px' }}>
          No codes yet — win one on the wheel.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {activeCodes.map((code) => (
            <div
              key={code.id}
              className="drop-card flex flex-wrap items-center gap-3"
              style={{ justifyContent: 'space-between', padding: '14px 16px' }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <code
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '17px', fontWeight: 700,
                    letterSpacing: '0.09em', padding: '6px 12px', background: 'var(--bg-input)',
                    border: '1px solid var(--accent)', color: 'var(--accent-text)',
                  }}
                >
                  {code.code}
                </code>
                <span
                  style={{
                    fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.12em',
                    textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-dim)',
                  }}
                >
                  {code.percentOff}% off · expires {DATE.format(code.expiresAt)}
                </span>
              </div>
              <CopyCode code={code.code} />
            </div>
          ))}

          {spentCodes.map((code) => (
            <div
              key={code.id}
              className="drop-card flex flex-wrap items-center gap-3"
              style={{ justifyContent: 'space-between', padding: '14px 16px', opacity: 0.5 }}
            >
              <code
                style={{
                  fontFamily: 'var(--mono)', fontSize: '17px', fontWeight: 700,
                  letterSpacing: '0.09em', padding: '6px 12px', background: 'var(--bg-input)',
                  border: '1px solid var(--line)', color: 'var(--ink-faint)',
                  textDecoration: 'line-through',
                }}
              >
                {code.code}
              </code>
              <span
                style={{
                  fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-faint)',
                }}
              >
                {code.voidedAt ? 'Cancelled' : code.redeemedAt ? 'Used' : 'Expired'}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeCodes.length > 0 && (
        <p style={{ color: 'var(--ink-faint)', fontSize: '13px', marginBottom: '40px' }}>
          One code per order — codes can&apos;t be combined. Enter it at checkout.
        </p>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <SectionTitle>Spin history</SectionTitle>
          <div className="drop-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Competition</Th>
                  <Th>Result</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((spin) => (
                  <tr key={spin.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <Td>{spin.spunAt ? DATE.format(spin.spunAt) : '—'}</Td>
                    <Td>{spin.competition.title}</Td>
                    <Td>
                      {spin.resultType ? (
                        <span
                          style={{
                            fontWeight: 700,
                            textDecoration: spin.reversedAt ? 'line-through' : 'none',
                            color: spin.reversedAt
                              ? 'var(--ink-faint)'
                              : spin.resultType === 'NO_WIN'
                                ? 'var(--ink-faint)'
                                : 'var(--accent-text)',
                          }}
                        >
                          {wheelSlotLabel(spin.resultType, spin.resultValue ?? 0)}
                        </span>
                      ) : (
                        '—'
                      )}
                      {spin.reversedAt && (
                        <span
                          style={{ display: 'block', fontSize: '11px', color: 'var(--ink-faint)' }}
                        >
                          {spin.reversalReason === 'COMPETITION_CANCELLED'
                            ? 'Competition cancelled — any code you won still works'
                            : spin.reversalReason === 'DISPUTE_LOST'
                              ? 'Cancelled — payment charged back'
                              : 'Cancelled — order refunded'}
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--display)', fontSize: '13px', letterSpacing: '0.18em',
        textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-dim)',
        marginBottom: '14px',
      }}
    >
      {children}
    </h2>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left', padding: '12px 16px', fontFamily: 'var(--display)', fontSize: '12px',
        letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '12px 16px', fontSize: '14px' }}>{children}</td>;
}
