import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { SimpleTicketSelector } from '@/components/competition/simple-ticket-selector';
import { FreeEntryButton } from '@/components/competition/free-entry-button';
import { InlineCountdown } from '@/components/common/inline-countdown';
import { TrustStrip } from '@/components/home/trust-strip';
import type { CompetitionCategory, CompetitionPrize } from '@winucard/shared/types';
import { formatPrice } from '@winucard/shared/utils';

const CATEGORY_LABELS: Record<CompetitionCategory, string> = {
  POKEMON: 'Pokemon',
  ONE_PIECE: 'One Piece',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_OTHER: 'Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh!',
  MTG: 'MTG',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<CompetitionCategory, string> = {
  POKEMON: '#ffb80a',
  ONE_PIECE: '#ff3d57',
  SPORTS_BASKETBALL: '#0a5fff',
  SPORTS_FOOTBALL: '#00c76a',
  SPORTS_OTHER: '#0a5fff',
  MEMORABILIA: '#b37cff',
  YUGIOH: '#6366F1',
  MTG: '#0d0d0d',
  OTHER: '#8a8a8a',
};

const CATEGORY_EMOJIS: Record<CompetitionCategory, string> = {
  POKEMON: '🔥',
  ONE_PIECE: '🏴‍☠️',
  SPORTS_BASKETBALL: '🏀',
  SPORTS_FOOTBALL: '⚽',
  SPORTS_OTHER: '🏆',
  MEMORABILIA: '🏆',
  YUGIOH: '🎴',
  MTG: '🃏',
  OTHER: '🎴',
};

// Background tint colors for subtle page ambiance
const CATEGORY_BG_COLORS: Record<CompetitionCategory, string> = {
  POKEMON: '232,160,0',      // #E8A000 - golden
  ONE_PIECE: '239,68,68',    // #EF4444 - red
  SPORTS_BASKETBALL: '37,99,235',  // #2563EB - blue
  SPORTS_FOOTBALL: '22,163,74',    // #16A34A - green
  SPORTS_OTHER: '59,130,246',
  MEMORABILIA: '139,92,246',
  YUGIOH: '99,102,241',
  MTG: '26,26,46',
  OTHER: '107,112,136',
};

interface PageParams {
  slug: string;
}

async function getCompetition(slug: string) {
  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          tickets: {
            where: {
              status: { in: ['SOLD', 'FREE_ENTRY'] },
            },
          },
        },
      },
      wins: {
        select: {
          ticketNumber: true,
          prizePosition: true,
          user: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { prizePosition: 'asc' },
      },
    },
  });

  if (!competition || competition.status === 'DRAFT') return null;

  const soldTicketsCount = competition._count.tickets;
  const winner = competition.wins[0];
  const winnerDisplayName = winner?.user
    ? `${winner.user.firstName} ${winner.user.lastName?.charAt(0) ?? ''}.`
    : winner
      ? 'Lucky Winner'
      : null;

  // Parse prizes JSON for multi-draw
  const parsedPrizes: CompetitionPrize[] = Array.isArray(competition.prizes)
    ? (competition.prizes as unknown as CompetitionPrize[])
    : [];

  // SECURITY: Strip real* fields for unrevealed mystery cards — never send to client
  const safeCompetition = { ...competition };
  if (safeCompetition.isMystery && !safeCompetition.isRevealed) {
    safeCompetition.realTitle = null;
    safeCompetition.realValue = null;
    safeCompetition.realImages = [];
    safeCompetition.realCertification = null;
    safeCompetition.realGrade = null;
  }

  return {
    ...safeCompetition,
    prizes: parsedPrizes,
    prizeValue:
      typeof safeCompetition.prizeValue === 'object' && 'toNumber' in safeCompetition.prizeValue
        ? (safeCompetition.prizeValue as { toNumber: () => number }).toNumber()
        : Number(safeCompetition.prizeValue),
    ticketPrice:
      typeof safeCompetition.ticketPrice === 'object' && 'toNumber' in safeCompetition.ticketPrice
        ? (safeCompetition.ticketPrice as { toNumber: () => number }).toNumber()
        : Number(safeCompetition.ticketPrice),
    minimumValue:
      safeCompetition.minimumValue != null
        ? (typeof safeCompetition.minimumValue === 'object' && 'toNumber' in safeCompetition.minimumValue
            ? (safeCompetition.minimumValue as { toNumber: () => number }).toNumber()
            : Number(safeCompetition.minimumValue))
        : null,
    soldTickets: soldTicketsCount,
    winnerDisplayName,
  };
}

async function getUserTicketCount(competitionId: string, userId: string | undefined) {
  if (!userId) return 0;
  return prisma.ticket.count({
    where: { competitionId, userId, status: { in: ['SOLD', 'FREE_ENTRY'] } },
  });
}

async function getAvailableTicketCount(competitionId: string) {
  const now = new Date();
  return prisma.ticket.count({
    where: {
      competitionId,
      OR: [
        { status: 'AVAILABLE' },
        { status: 'RESERVED', reservedUntil: { lte: now } },
      ],
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);

  if (!competition) return notFound();

  const isMysteryUnrevealed = competition.isMystery && !competition.isRevealed;
  const title = isMysteryUnrevealed
    ? `Mystery ${CATEGORY_LABELS[competition.category as CompetitionCategory] ?? ''} Card`
    : (competition.metaTitle || competition.title);
  const description = isMysteryUnrevealed
    ? `Win a Mystery ${CATEGORY_LABELS[competition.category as CompetitionCategory] ?? ''} Card guaranteed worth at least ${formatPrice(competition.minimumValue ?? competition.prizeValue)}. UK prize competition with free entry route.`
    : (competition.metaDescription ||
      `Win ${competition.title} worth ${formatPrice(competition.prizeValue)}. Tickets from ${formatPrice(competition.ticketPrice)}. UK prize competition with free entry route.`);

  return {
    title,
    description,
    openGraph: {
      title: `${title} | WinUCard`,
      description,
      ...(isMysteryUnrevealed ? {} : { images: [{ url: competition.mainImageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | WinUCard`,
      description,
      ...(isMysteryUnrevealed ? {} : { images: [competition.mainImageUrl] }),
    },
  };
}


export default async function CompetitionDetailPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const [competition, session] = await Promise.all([getCompetition(slug), auth()]);

  if (!competition) notFound();

  const isActive = competition.status === 'ACTIVE';
  const isCompleted = competition.status === 'COMPLETED';
  const isUpcoming = competition.status === 'UPCOMING';
  const isSoldOut = competition.status === 'SOLD_OUT';
  const isCancelled = competition.status === 'CANCELLED';

  const [userTicketCount, availableTicketCount, referralFreeTickets] = isActive
    ? await Promise.all([
        getUserTicketCount(competition.id, session?.user?.id),
        getAvailableTicketCount(competition.id),
        (async () => {
          if (!session?.user?.id) return 0;
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referralFreeTicketsAvailable: true },
          });
          return user?.referralFreeTicketsAvailable ?? 0;
        })(),
      ])
    : [0, 0, 0];

  const category = competition.category as CompetitionCategory;
  const categoryColor = CATEGORY_COLORS[category];
  const _categoryBgColor = CATEGORY_BG_COLORS[category];
  const isFree = competition.isFree;
  const hasTotalTickets = competition.totalTickets !== null;
  const soldPercentage = hasTotalTickets
    ? Math.round((competition.soldTickets / competition.totalTickets!) * 100)
    : 0;
  const ticketsRemaining = hasTotalTickets
    ? competition.totalTickets! - competition.soldTickets
    : 0;

  const isMystery = competition.isMystery;
  const isMysteryUnrevealed = isMystery && !competition.isRevealed;
  const isMysteryRevealed = isMystery && competition.isRevealed;

  const isMultiDraw = competition.drawType === 'multi' && competition.prizes.length > 1;
  const totalPrizesValue = isMultiDraw
    ? competition.prizes.reduce((sum: number, p: CompetitionPrize) => sum + p.value, 0)
    : 0;

  // Format prize value without decimals
  const formattedPrizeValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(competition.prizeValue);


  const gameClass = category.toLowerCase().replace(/_/g, '-').replace('sports-', '');
  const psa = competition.grade ?? 'PSA 10';

  return (
    <main>
      {/* Back */}
      <div className="comp-back">
        <Link href="/competitions" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-dim)', padding: '12px 0' }}>
          ← Back to Competitions
        </Link>
      </div>

      {/* HERO */}
      <section className="comp-hero">
        <div className="comp-hero-grid">
          {/* LEFT: Card visual */}
          <div className="comp-hero-visual">
            <div className={`comp-hero-frame game-${gameClass}`}>
              <div className="comp-hero-marquee">
                ★ LIVE DRAW · {CATEGORY_LABELS[category].toUpperCase()} · LIVE DRAW · {CATEGORY_LABELS[category].toUpperCase()} · LIVE DRAW ★
              </div>
              <div className="comp-hero-imgwrap">
                {competition.mainImageUrl && (
                  <img src={competition.mainImageUrl} alt={competition.title} className="comp-hero-img" />
                )}
              </div>
              <div className="comp-hero-badges">
                <span className={`comp-game ${gameClass}`} style={{ position: 'static' }}>{CATEGORY_LABELS[category]}</span>
                <span className="comp-hero-psa">{psa}</span>
              </div>
            </div>

            {/* Meta card below image */}
            <div className="comp-hero-meta-card">
              <p className="comp-desc">{competition.descriptionShort}</p>
              <div className="comp-stats-mini">
                <div>
                  <div className="comp-value-label">Card value</div>
                  <div className="comp-stats-mini-v">{formattedPrizeValue}</div>
                </div>
                <div>
                  <div className="comp-value-label">Participants</div>
                  <div className="comp-stats-mini-v">{competition.soldTickets.toLocaleString('en-GB')}</div>
                </div>
                <div>
                  <div className="comp-value-label">Per ticket</div>
                  <div className="comp-stats-mini-v">{isFree ? 'FREE' : formatPrice(competition.ticketPrice)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Title + progress + inline ticket picker */}
          <div className="comp-hero-info">
            <div
              className="inline-flex items-center gap-2.5"
              style={{ padding: '7px 14px', background: 'var(--ink)', color: 'var(--accent)', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '14px' }}
            >
              <span className="live-dot" style={{ boxShadow: '0 0 10px var(--accent)' }} />
              {isActive ? 'LIVE NOW' : isUpcoming ? 'COMING SOON' : isSoldOut ? 'SOLD OUT' : isCompleted ? 'COMPLETED' : 'CANCELLED'} · #WUC-{String(competition.soldTickets).padStart(5, '0')}
            </div>

            <h1 className="comp-detail-title">
              {isMysteryUnrevealed ? `Mystery ${CATEGORY_LABELS[category]} Card` : competition.title}
            </h1>

            {/* Progress + countdown */}
            {hasTotalTickets && (
              <div className="comp-progress-combo">
                <div className="comp-progress-head">
                  <span>
                    <b style={{ fontFamily: 'var(--display)', fontSize: '22px', letterSpacing: '-0.02em' }}>{ticketsRemaining.toLocaleString('en-GB')}</b>
                    <span style={{ color: 'var(--ink-dim)', fontSize: '13px', marginLeft: '6px' }}>/ {competition.totalTickets!.toLocaleString('en-GB')} tickets left</span>
                  </span>
                  <span className="comp-progress-pct">{soldPercentage}% sold</span>
                </div>
                <div className="comp-hero-bar">
                  <div className="comp-hero-bar-fill" style={{ width: `${Math.max(soldPercentage, 3)}%` }} />
                </div>
                <div className="comp-progress-end">
                  <span className="comp-progress-end-l">Draw ends in</span>
                  <span className="comp-progress-end-v">
                    <InlineCountdown targetDate={competition.drawDate} />
                  </span>
                </div>
              </div>
            )}

            {/* Inline Step 01: ticket picker (active comps only) */}
            {isActive && !isFree && (
              <SimpleTicketSelector
                competitionId={competition.id}
                competitionSlug={competition.slug}
                ticketPrice={competition.ticketPrice}
                maxTicketsPerUser={competition.maxTicketsPerUser}
                availableTicketCount={availableTicketCount}
                userTicketCount={userTicketCount}
                categoryColor={categoryColor}
                referralFreeTickets={referralFreeTickets}
              />
            )}

            {/* Free entry button */}
            {isActive && isFree && (
              <FreeEntryButton
                competitionId={competition.id}
                competitionSlug={competition.slug}
                userTicketCount={userTicketCount}
                maxTicketsPerUser={competition.maxTicketsPerUser}
              />
            )}

            {/* Non-active states */}
            {isUpcoming && (
              <button disabled className="w-full" style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-2)', color: 'var(--ink-dim)', fontSize: '16px', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid var(--ink)', marginTop: '18px' }}>
                Coming Soon
              </button>
            )}
            {isSoldOut && (
              <button disabled className="w-full" style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-2)', color: 'var(--ink-dim)', fontSize: '16px', fontWeight: 600, cursor: 'not-allowed', border: '1.5px solid var(--ink)', marginTop: '18px' }}>
                Sold Out — Draw Pending
              </button>
            )}
            {isCompleted && competition.winningTicketNumber && (
              <div style={{ background: 'var(--accent)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center', marginTop: '18px', boxShadow: 'var(--shadow)' }}>
                <Trophy style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '18px', fontWeight: 700 }}>Competition Completed</p>
                <p style={{ fontSize: '14px', color: 'var(--ink-dim)', marginTop: '4px' }}>
                  Winning ticket: <b style={{ fontWeight: 700, color: 'var(--ink)' }}>#{competition.winningTicketNumber}</b>
                  {competition.winnerDisplayName && <> — {competition.winnerDisplayName}</>}
                </p>
              </div>
            )}
            {isCancelled && (
              <div style={{ background: 'var(--hot)', color: '#fff', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center', marginTop: '18px', boxShadow: 'var(--shadow)' }}>
                <p style={{ fontSize: '18px', fontWeight: 700 }}>Competition Cancelled</p>
                <p style={{ fontSize: '14px', marginTop: '4px', opacity: 0.8 }}>All participants have been fully refunded.</p>
              </div>
            )}

            {/* Trust row */}
            <div className="comp-meta-row">
              <span>🔒 Secure checkout</span>
              <span>✉ Free postal entry</span>
              <span>📺 Live TikTok draw</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT THIS CARD — full-bleed gray background */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 32px' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700, marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '20px', height: '2px', background: 'var(--ink)', display: 'block' }} />
                About the Card
              </div>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5.5vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.96, maxWidth: '720px' }}>
                What you&apos;ll be <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--accent)', textDecorationThickness: '5px', textUnderlineOffset: '6px' }}>winning</span>.
              </h2>
            </div>
            <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '360px', lineHeight: 1.5 }}>
              Everything graded, authenticated, and ready to ship to your door.
            </p>
          </div>

          {/* Card container — white card with border + shadow holding both columns */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: '14px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div className="comp-about-grid" style={{ padding: '28px' }}>
              {/* Left: Card details list */}
              <div>
                <ul className="about-card-details">
                  {competition.certificationNumber && (
                    <li><span className="about-card-k">Cert</span><span className="about-card-v">{competition.certificationNumber}</span></li>
                  )}
                  {competition.grade && (
                    <li><span className="about-card-k">Grade</span><span className="about-card-v">{competition.grade}</span></li>
                  )}
                  {competition.condition && (
                    <li><span className="about-card-k">Condition</span><span className="about-card-v">{competition.condition}</span></li>
                  )}
                  <li><span className="about-card-k">Category</span><span className="about-card-v">{CATEGORY_LABELS[category]}</span></li>
                  <li><span className="about-card-k">Draw Date</span><span className="about-card-v">{new Date(competition.drawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></li>
                  <li><span className="about-card-k">Draw Type</span><span className="about-card-v">Certified RNG · Live on TikTok</span></li>
                </ul>
              </div>

              {/* Right: Free postal entry card (green) */}
              <div className="postal-card">
                <div className="postal-kicker">Free postal entry</div>
                <p>Send a handwritten postcard with your name, email, and answer to the skill question:</p>
                <div className="postal-addr">
                  WinUCard Ltd — Free Entry<br/>
                  Unit 14 Skyline House<br/>
                  200 Union St<br/>
                  London SE1 0LX
                </div>
                <span className="postal-note">One entry per person per comp · Full <Link href="/competition-rules">rules</Link></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />
    </main>
  );
}
