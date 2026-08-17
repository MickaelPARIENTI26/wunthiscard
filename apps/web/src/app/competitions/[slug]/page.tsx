import { cache } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { SimpleTicketSelector } from '@/components/competition/simple-ticket-selector';
import { FreeEntryButton } from '@/components/competition/free-entry-button';
import { ScoreboardClock } from '@/components/common/scoreboard-clock';
import { TrustStrip } from '@/components/home/trust-strip';
import { StructuredData } from '@/components/common/structured-data';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { TrackViewItem } from '@/components/common/track-event';
import { ShareCompetition } from '@/components/competition/share-competition';
import { generateCompetitionSchema } from '@/lib/structured-data';
import { siteConfig } from '@/lib/seo';
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

function anonymizeName(firstName: string, lastName: string): string {
  const f = firstName?.trim()?.[0] ?? '';
  const l = lastName?.trim()?.[0] ?? '';
  return [f && `${f}.`, l && `${l}.`].filter(Boolean).join(' ') || 'Winner';
}

async function getRecentWinners() {
  const wins = await prisma.win.findMany({
    where: { competition: { status: 'COMPLETED' } },
    select: {
      competition: { select: { title: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });
  return wins.map((w) => ({
    name: w.user ? anonymizeName(w.user.firstName, w.user.lastName) : 'Lucky winner',
    competitionTitle: w.competition.title,
  }));
}

// Wrapped in React cache() so generateMetadata() and the page component share a
// single DB query per request instead of running the full lookup twice.
const getCompetition = cache(async (slug: string) => {
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
});

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
      title: `${title} | WinUPrize`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | WinUPrize`,
      description,
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

  // The draw has closed (date passed) but a winner hasn't been recorded yet, and the
  // competition isn't in a terminal/upcoming state — show "Drawing soon", not a buy box.
  const drawPending =
    !isCompleted &&
    !isCancelled &&
    !isUpcoming &&
    new Date(competition.drawDate) <= new Date();
  // Entry is only possible on an ACTIVE competition whose draw date is still in the future.
  const isOpenForEntry = isActive && !drawPending;

  // State label shared by the status chip and the hero marquee, so a finished /
  // sold-out / upcoming competition never falsely reads "LIVE NOW".
  const stateLabel = drawPending
    ? 'DRAWING SOON'
    : isOpenForEntry
      ? 'LIVE NOW'
      : isUpcoming
        ? 'COMING SOON'
        : isSoldOut
          ? 'SOLD OUT'
          : isCompleted
            ? 'FINISHED'
            : isCancelled
              ? 'CANCELLED'
              : 'CLOSED';

  const [userTicketCount, availableTicketCount, referralFreeTickets] = isOpenForEntry
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

  // Recent winners site-wide — social proof (empty until a competition is drawn).
  const recentWinners = isActive ? await getRecentWinners() : [];

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

  // Format prize value without decimals
  const formattedPrizeValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(competition.prizeValue);


  const gameClass = category.toLowerCase().replace(/_/g, '-').replace('sports-', '');
  // Never fabricate a grade — show the real one, or a neutral "Authenticated".
  const gradeBadge = competition.grade?.trim() || 'Authenticated';

  return (
    <main className="comp-detail-main">
      <StructuredData
        data={generateCompetitionSchema({
          slug: competition.slug,
          title: isMysteryUnrevealed ? `Mystery ${CATEGORY_LABELS[category]} Card` : competition.title,
          descriptionShort: competition.descriptionShort,
          mainImageUrl: competition.mainImageUrl,
          ticketPrice: competition.ticketPrice,
          drawDate: competition.drawDate,
          status: competition.status,
        })}
      />
      <TrackViewItem
        competition={{
          id: competition.id,
          name: competition.title,
          category: competition.category,
          price: Number(competition.ticketPrice),
        }}
      />

      {/* Breadcrumbs (also emits BreadcrumbList JSON-LD) */}
      <div className="comp-back">
        <Breadcrumbs
          baseUrl={siteConfig.url}
          items={[
            { label: 'Home', href: '/' },
            { label: 'Competitions', href: '/competitions' },
            { label: isMysteryUnrevealed ? `Mystery ${CATEGORY_LABELS[category]} Card` : competition.title },
          ]}
        />
      </div>

      {/* HERO */}
      <section className="comp-hero">
        <div className="comp-hero-grid">
          {/* LEFT: Card visual */}
          <div className="comp-hero-visual">
            <div className={`comp-hero-frame game-${gameClass}`}>
              <div className="comp-hero-marquee">{CATEGORY_LABELS[category]}</div>
              <div className="comp-hero-imgwrap">
                {competition.mainImageUrl && (
                  <div className="comp-hero-img" style={{ width: '100%', maxWidth: '380px', aspectRatio: '5 / 7' }}>
                    <Image
                      src={competition.mainImageUrl}
                      alt={competition.title}
                      fill
                      priority
                      sizes="(max-width: 980px) 90vw, 45vw"
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="comp-hero-badges">
                <span className={`comp-game ${gameClass}`} style={{ position: 'static' }}>{CATEGORY_LABELS[category]}</span>
                <span className="comp-hero-psa">{gradeBadge}</span>
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
                {hasTotalTickets && (
                  <div className="comp-stat-mobile-hide">
                    <div className="comp-value-label">Participants</div>
                    <div className="comp-stats-mini-v">{competition.soldTickets.toLocaleString('en-GB')}</div>
                  </div>
                )}
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
              className="inline-flex items-center"
              style={{ gap: '9px', padding: '6px 13px', background: 'var(--gold-bright)', color: '#0A0A0A', borderRadius: 0, fontFamily: 'var(--display)', fontSize: '14px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '16px' }}
            >
              {isActive && !drawPending && (
                <span className="wup-dot wup-onair" style={{ width: '8px', height: '8px', background: '#0A0A0A' }} aria-hidden="true" />
              )}
              {stateLabel}
              {hasTotalTickets && competition.soldTickets > 0
                ? ` · ${competition.soldTickets.toLocaleString('en-GB')} entered`
                : ''}
            </div>

            <h1 className="comp-detail-title">
              {isMysteryUnrevealed ? `Mystery ${CATEGORY_LABELS[category]} Card` : competition.title}
            </h1>

            {/* Prize value — the core motivator, right under the title */}
            <div className="comp-prize-line">
              Win this — worth <b>{formattedPrizeValue}</b>
            </div>

            <ShareCompetition
              url={`${siteConfig.url}/competitions/${competition.slug}`}
              title={isMysteryUnrevealed ? `Mystery ${CATEGORY_LABELS[category]} Card` : competition.title}
              prizeValue={competition.prizeValue}
            />

            {/* Progress + countdown */}
            {hasTotalTickets && (
              <div className="comp-progress-combo">
                <div className="comp-progress-head">
                  <span>
                    <b style={{ fontFamily: 'var(--display)', fontSize: '22px', letterSpacing: '-0.02em' }}>{ticketsRemaining.toLocaleString('en-GB')}</b>
                    <span style={{ color: 'var(--ink-dim)', fontSize: '13px', marginLeft: '6px' }}>/ {competition.totalTickets!.toLocaleString('en-GB')} tickets left</span>
                  </span>
                  <span className="comp-progress-pct">{soldPercentage === 0 ? 'Just launched' : `${soldPercentage}% sold`}</span>
                </div>
                <div className="comp-hero-bar">
                  <div
                    className="comp-hero-bar-fill"
                    style={{ width: `${Math.max(soldPercentage, 3)}%` }}
                  />
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.04em', color: 'var(--ink-dim)', marginTop: '8px' }}>
                  Max odds 1 in {competition.totalTickets!.toLocaleString('en-GB')}
                </div>
                {/* Scoreboard countdown — blinking gold-bright dot + DAYS/HRS/MIN/SEC */}
                <div style={{ marginTop: '14px' }}>
                  <div className="comp-progress-end" style={{ marginBottom: '9px' }}>
                    <span
                      className="wup-dot wup-onair"
                      style={{ width: '8px', height: '8px', background: 'var(--gold-bright)' }}
                      aria-hidden="true"
                    />
                    <span className="comp-progress-end-l">Draw closes in</span>
                  </div>
                  <ScoreboardClock targetDate={competition.drawDate} />
                </div>
              </div>
            )}

            {/* Verify strip — fairness/authenticity proofs right by the buy widget */}
            {isOpenForEntry && (
              <p className="comp-verify-line">
                {competition.certificationNumber ? `Cert #${competition.certificationNumber} · ` : ''}
                {competition.grade ? `${competition.grade} · ` : ''}
                Draws {new Date(competition.drawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Independent draw · Full refund if cancelled
              </p>
            )}

            {/* Inline Step 01: ticket picker (active comps only) */}
            {isOpenForEntry && !isFree && (
              <SimpleTicketSelector
                competitionId={competition.id}
                competitionSlug={competition.slug}
                competitionTitle={competition.title}
                competitionCategory={competition.category}
                ticketPrice={competition.ticketPrice}
                maxTicketsPerUser={competition.maxTicketsPerUser}
                availableTicketCount={availableTicketCount}
                userTicketCount={userTicketCount}
                categoryColor={categoryColor}
                referralFreeTickets={referralFreeTickets}
              />
            )}

            {/* Free entry button */}
            {isOpenForEntry && isFree && (
              <FreeEntryButton
                competitionId={competition.id}
                competitionSlug={competition.slug}
                competitionTitle={competition.title}
                competitionCategory={competition.category}
                userTicketCount={userTicketCount}
                maxTicketsPerUser={competition.maxTicketsPerUser}
              />
            )}

            {/* Draw pending — closed, awaiting the winner */}
            {drawPending && (
              <div style={{ marginTop: '18px' }}>
                <button disabled className="w-full" style={{ padding: '16px', borderRadius: 0, background: 'var(--bg-2)', color: 'var(--ink-dim)', fontSize: '16px', fontWeight: 600, cursor: 'not-allowed', border: '1px solid rgba(244, 241, 234, 0.18)' }}>
                  Entries closed — drawing soon
                </button>
                <p style={{ fontFamily: 'var(--display)', fontSize: '12.5px', color: 'var(--ink-faint)', letterSpacing: '0.04em', marginTop: '10px', textAlign: 'center' }}>
                  This competition has closed. The winner is drawn by an independent third party and the result is published shortly.
                </p>
              </div>
            )}

            {/* Non-active states */}
            {isUpcoming && (
              <button disabled className="w-full" style={{ padding: '16px', borderRadius: 0, background: 'var(--bg-2)', color: 'var(--ink-dim)', fontSize: '16px', fontWeight: 600, cursor: 'not-allowed', border: '1px solid rgba(244, 241, 234, 0.18)', marginTop: '18px' }}>
                Coming Soon
              </button>
            )}
            {isSoldOut && !drawPending && (
              <button disabled className="w-full" style={{ padding: '16px', borderRadius: 0, background: 'var(--bg-2)', color: 'var(--ink-dim)', fontSize: '16px', fontWeight: 600, cursor: 'not-allowed', border: '1px solid rgba(244, 241, 234, 0.18)', marginTop: '18px' }}>
                Sold Out — Draw Pending
              </button>
            )}
            {isCompleted && competition.winningTicketNumber && (
              <div style={{ background: 'var(--accent)', color: '#0A0A0A', border: 'none', borderRadius: 0, padding: '24px', textAlign: 'center', marginTop: '18px' }}>
                <Trophy style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '18px', fontWeight: 700 }}>Competition Completed</p>
                <p style={{ fontSize: '14px', color: 'rgba(10, 10, 10, 0.75)', marginTop: '4px' }}>
                  Winning ticket: <b style={{ fontWeight: 700, color: '#0A0A0A' }}>#{competition.winningTicketNumber}</b>
                  {competition.winnerDisplayName && <> — {competition.winnerDisplayName}</>}
                </p>
              </div>
            )}
            {isCancelled && (
              <div style={{ background: 'var(--hot)', color: '#0A0A0A', border: '1px solid rgba(244, 241, 234, 0.18)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center', marginTop: '18px', boxShadow: 'var(--shadow)' }}>
                <p style={{ fontSize: '18px', fontWeight: 700 }}>Competition Cancelled</p>
                <p style={{ fontSize: '14px', marginTop: '4px', opacity: 0.8 }}>All participants have been fully refunded.</p>
              </div>
            )}

            {/* Trust row */}
            <div className="comp-meta-row">
              <span>🔒 Secure checkout</span>
              <span>✉ Free postal entry</span>
              <span>🎲 Independent draw</span>
            </div>

            {/* Recent winners — social proof */}
            {recentWinners.length > 0 && (
              <div className="comp-winners-strip">
                🏆 Recent winners:{' '}
                {recentWinners.map((w, i) => (
                  <span key={i}>
                    {i > 0 ? ' · ' : ''}
                    <b>{w.name}</b>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT THIS CARD — full-bleed gray background */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 5vw, 32px)' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700, marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
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
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(244, 241, 234, 0.18)', borderRadius: 0, overflow: 'hidden' }}>
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
                  <li><span className="about-card-k">Draw Type</span><span className="about-card-v">Independent third party</span></li>
                </ul>
              </div>

              {/* Right: Free postal entry card (green) */}
              <div className="postal-card">
                <div className="postal-kicker">Free postal entry</div>
                <p>Post your full name, email, date of birth, this competition&apos;s name and your answer to the skill question, in an envelope to:</p>
                <div className="postal-addr">
                  WinUPrize — Free Entry<br/>
                  71-75 Shelton Street, Covent Garden<br/>
                  London WC2H 9JQ
                </div>
                <span className="postal-note">One entry per envelope (multiple permitted) · Full <Link href="/competition-rules">rules</Link></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />
    </main>
  );
}
