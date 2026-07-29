import Link from 'next/link';
import Image from 'next/image';
import { ScoreboardClock } from '@/components/common/scoreboard-clock';

interface Competition {
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number | null;
  soldTickets: number;
  drawDate: Date;
  status: string;
}

interface HomeHeroProps {
  competitions: Competition[];
}

const CATEGORY_LABELS: Record<string, string> = {
  POKEMON: 'Pokémon',
  ONE_PIECE: 'One Piece',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_OTHER: 'Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh!',
  MTG: 'MTG',
  OTHER: 'Featured',
};

function formatPrizeValue(value: number): string {
  return `£${value.toLocaleString('en-GB')}`;
}

/**
 * Matchday Gold hero (spec screen 3): three decorative layers (skewed wash,
 * orbiting rays, breathing glow), staggered entrance copy column on the left,
 * featured-competition panel with shimmer/scanline image well, scoreboard
 * countdown and progress bar on the right.
 */
export function HomeHero({ competitions }: HomeHeroProps) {
  const featured = competitions[0] ?? null;
  const liveCount = competitions.length;

  const prices = competitions.map((c) => c.ticketPrice).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;

  const soldPct = featured?.totalTickets
    ? Math.min(100, Math.round((featured.soldTickets / featured.totalTickets) * 100))
    : 0;
  const ticketsLeft = featured?.totalTickets
    ? Math.max(0, featured.totalTickets - featured.soldTickets)
    : null;

  return (
    <section className="wup-hero">
      {/* Decorative layers — all pointer-events:none */}
      <div className="wup-hero__wash" aria-hidden="true" />
      <div className="wup-hero__rays" aria-hidden="true" />
      <div className="wup-hero__glow" aria-hidden="true" />

      <div
        className="relative mx-auto flex flex-wrap items-center"
        style={{
          maxWidth: '1400px',
          gap: 'clamp(28px, 4vw, 56px)',
          padding: 'clamp(38px, 5.5vw, 84px) clamp(14px, 3vw, 34px)',
        }}
      >
        {/* Copy column */}
        <div style={{ flex: '1 1 420px', maxWidth: '660px' }}>
          {/* Live badge — gold-bright fill, blinking black dot, skew-in then gold ring pulse */}
          <span
            className="wup-in-skew wup-ring inline-flex items-center"
            style={{
              gap: '9px',
              padding: '6px 13px',
              background: 'var(--gold-bright)',
              color: '#0A0A0A',
              fontFamily: 'var(--display)',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '22px',
            }}
          >
            <span
              className="wup-dot wup-onair"
              style={{ width: '8px', height: '8px', background: '#0A0A0A' }}
              aria-hidden="true"
            />
            {liveCount > 0 ? `${liveCount} Live competition${liveCount === 1 ? '' : 's'}` : 'Live draws'}
          </span>

          {/* H1 — two lines, second in gold */}
          <h1
            className="wup-h1-hero wup-in-slam"
            style={{ animationDelay: '0.05s', margin: '0 0 18px' }}
          >
            Win the card
            <br />
            <span style={{ color: 'var(--accent)' }}>of your dreams</span>
          </h1>

          {/* Body copy */}
          <p
            className="wup-body wup-in-wipe"
            style={{ animationDelay: '0.3s', maxWidth: '540px', margin: '0 0 26px' }}
          >
            The UK&apos;s premium skill-based card competitions — Pokémon, One Piece,
            Football &amp; Basketball.{minPrice !== null ? ` Tickets from £${minPrice.toFixed(2)}.` : ''} Independent
            draws. Real graded cards delivered to your door.
          </p>

          {/* Buttons */}
          <div
            className="wup-in-slam flex flex-wrap items-center"
            style={{ animationDelay: '0.42s', gap: '12px', marginBottom: '20px' }}
          >
            <Link href="/competitions" className="wup-btn wup-btn--primary">
              Browse Competitions →
            </Link>
            <Link href="/how-it-works" className="wup-btn wup-btn--secondary">
              How It Works
            </Link>
          </div>

          {/* Draw-partner line */}
          <p className="wup-in-fade" style={{ animationDelay: '0.55s', fontSize: '14.5px', color: 'var(--ink-dim)' }}>
            🎲 Winners drawn independently by{' '}
            <b style={{ color: 'var(--accent)', fontWeight: 600 }}>RandomDraws.com</b>
          </p>
        </div>

        {/* Featured competition panel */}
        {featured && (
          <div className="wup-panel wup-in-slam" style={{ animationDelay: '0.25s', flex: '1 1 380px', maxWidth: '520px' }}>
            <Link href={`/competitions/${featured.slug}`} className="block" style={{ color: 'inherit' }}>
              {/* Image well 16/11 with shimmer sweep, scanline and diagonal-cut badge */}
              <div className="wup-well" style={{ aspectRatio: '16 / 11' }}>
                {featured.mainImageUrl && (
                  <Image
                    src={featured.mainImageUrl}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 980px) 100vw, 520px"
                    style={{ objectFit: 'contain', padding: '18px' }}
                    priority
                  />
                )}
                <span className="wup-well__shimmer" aria-hidden="true" />
                <span className="wup-well__scanline" aria-hidden="true" />
                <span className="wup-badge-cut">{CATEGORY_LABELS[featured.category] ?? featured.category}</span>
              </div>

              {/* Body */}
              <div style={{ padding: 'clamp(16px, 2.2vw, 24px)' }}>
                <h2 className="wup-title" style={{ margin: '0 0 6px' }}>{featured.title}</h2>
                <p className="wup-meta" style={{ margin: '0 0 14px' }}>
                  Prize value {formatPrizeValue(featured.prizeValue)}
                  {featured.totalTickets ? ` · odds 1 in ${featured.totalTickets.toLocaleString('en-GB')}` : ''}
                </p>

                {/* Scoreboard countdown */}
                <div style={{ marginBottom: '14px' }}>
                  <ScoreboardClock targetDate={featured.drawDate} />
                </div>

                {/* Progress bar */}
                <div className="wup-bar wup-bar--lg" style={{ marginBottom: '8px' }}>
                  <div className="wup-bar__fill" style={{ width: `${Math.max(soldPct, 2)}%` }} />
                  <span className="wup-bar__sheen" aria-hidden="true" />
                </div>
                <div className="flex items-baseline justify-between" style={{ marginBottom: '16px' }}>
                  <span className="wup-meta">
                    {featured.totalTickets
                      ? `${featured.soldTickets.toLocaleString('en-GB')} of ${featured.totalTickets.toLocaleString('en-GB')} sold`
                      : `${featured.soldTickets.toLocaleString('en-GB')} entries`}
                  </span>
                  {ticketsLeft !== null && (
                    <span className="wup-meta" style={{ color: 'var(--accent)' }}>
                      {ticketsLeft.toLocaleString('en-GB')} left
                    </span>
                  )}
                </div>

                {/* Price + CTA */}
                <div className="flex flex-wrap items-center justify-between" style={{ gap: '12px' }}>
                  <div>
                    <div className="wup-meta">Per ticket</div>
                    <div className="wup-num" style={{ fontSize: '30px', color: 'var(--accent)' }}>
                      {featured.ticketPrice > 0 ? `£${featured.ticketPrice.toFixed(2)}` : 'FREE'}
                    </div>
                  </div>
                  <span className="wup-btn wup-btn--primary" style={{ padding: '14px 24px', fontSize: '15px' }}>
                    Enter Now
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
