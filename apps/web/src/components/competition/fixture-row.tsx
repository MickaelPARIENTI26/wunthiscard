import Link from 'next/link';
import Image from 'next/image';
import { InlineCountdown } from '@/components/common/inline-countdown';

export interface FixtureCompetition {
  id: string;
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number | null;
  soldTickets: number;
  drawDate: Date | string;
  status: string;
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
  OTHER: 'Other',
};

/** Column-header row that sits above a fixture list. */
export function FixtureHeader() {
  return (
    <div
      className="flex items-center"
      style={{ gap: '10px', padding: '0 0 10px', borderBottom: '2px solid var(--accent)' }}
    >
      <span className="wup-thead" style={{ flex: 'none', width: '34px' }}>#</span>
      <span className="wup-thead" style={{ flex: 'none', width: 'clamp(44px, 5vw, 58px)' }} aria-hidden="true" />
      <span className="wup-thead" style={{ flex: '1 1 160px', minWidth: '120px', paddingLeft: '4px' }}>Prize</span>
      <span className="wup-thead" style={{ flex: 'none', width: 'clamp(80px, 10vw, 120px)', textAlign: 'right' }}>Ticket</span>
      <span className="wup-thead fixture-col-sold" style={{ flex: 'none', width: 'clamp(90px, 12vw, 150px)' }}>Sold</span>
      <span className="wup-thead fixture-col-closes" style={{ flex: 'none', width: 'clamp(74px, 9vw, 110px)', textAlign: 'right' }}>Closes</span>
    </div>
  );
}

interface FixtureRowProps {
  competition: FixtureCompetition;
  /** 1-based position shown in the leading number column. */
  index: number;
}

/**
 * The core list primitive (spec "Fixture row") — replaces the grid card on
 * Home, Competitions and "Other live comps". A flex row whose signature
 * interaction is the gold wash + 7px slide on hover.
 */
export function FixtureRow({ competition: c, index }: FixtureRowProps) {
  const sold = c.soldTickets;
  const total = c.totalTickets;
  const pct = total ? Math.min(100, Math.round((sold / total) * 100)) : 0;
  const isFree = c.ticketPrice <= 0;
  const finished = c.status === 'COMPLETED' || c.status === 'CANCELLED' || c.status === 'DRAWING';
  const soldOut = c.status === 'SOLD_OUT';

  return (
    <Link href={`/competitions/${c.slug}`} className="wup-row" style={{ color: 'inherit', textDecoration: 'none' }}>
      <span className="wup-row__no wup-num">{String(index).padStart(2, '0')}</span>

      <span className="wup-row__thumb">
        {c.mainImageUrl && (
          <Image
            src={c.mainImageUrl}
            alt=""
            fill
            sizes="58px"
            style={{ objectFit: 'cover', opacity: finished || soldOut ? 0.4 : 1 }}
          />
        )}
      </span>

      <span className="wup-row__main">
        <span className="wup-title" style={{ display: 'block' }}>{c.title}</span>
        <span className="wup-meta" style={{ display: 'block', marginTop: '4px' }}>
          {CATEGORY_LABELS[c.category] ?? c.category}
          {' · '}£{c.prizeValue.toLocaleString('en-GB')}
          {total ? ` · odds 1 in ${total.toLocaleString('en-GB')}` : ''}
          {soldOut ? ' · Sold out' : finished ? ' · Finished' : ''}
        </span>
      </span>

      <span className="wup-row__price wup-num">{isFree ? 'FREE' : `£${c.ticketPrice.toFixed(2)}`}</span>

      <span className="wup-row__sold fixture-col-sold">
        <span
          className="wup-num"
          style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink-dim)', marginBottom: '5px' }}
        >
          {total ? `${sold.toLocaleString('en-GB')}/${total.toLocaleString('en-GB')}` : `${sold.toLocaleString('en-GB')} in`}
        </span>
        <span className="wup-bar" style={{ display: 'block' }}>
          <span className="wup-bar__fill" style={{ display: 'block', width: `${Math.max(pct, 2)}%` }} />
          <span className="wup-bar__sheen" aria-hidden="true" />
        </span>
      </span>

      <span className="wup-row__closes fixture-col-closes">
        {finished ? 'Drawn' : <InlineCountdown targetDate={c.drawDate} compact />}
      </span>
    </Link>
  );
}
