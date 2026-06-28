import Link from 'next/link';
import Image from 'next/image';

interface CompCardProps {
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number | null;
  soldTickets: number;
  status: string;
  // True when the competition has closed (draw date passed) and is awaiting its draw —
  // shown as "Drawing soon" with entry disabled.
  pendingDraw?: boolean;
}

const gameColorMap: Record<string, { bg: string; color: string }> = {
  POKEMON: { bg: 'var(--warn)', color: 'var(--ink)' },
  ONE_PIECE: { bg: 'var(--hot)', color: '#fff' },
  SPORTS_FOOTBALL: { bg: 'var(--accent)', color: 'var(--ink)' },
  SPORTS_BASKETBALL: { bg: 'var(--pop)', color: '#fff' },
  MEMORABILIA: { bg: 'var(--mauve)', color: '#fff' },
};

function formatCategory(cat: string) {
  return cat.replace(/_/g, ' ').replace(/^SPORTS /i, '');
}

export function CompCard({ slug, title, mainImageUrl, category, prizeValue, ticketPrice, totalTickets, soldTickets, status, pendingDraw = false }: CompCardProps) {
  const isUnlimited = totalTickets === null;
  const isFree = ticketPrice <= 0;
  const total = totalTickets ?? 1; // only used when !isUnlimited
  const left = total - soldTickets;
  const pct = Math.max(Math.round((soldTickets / total) * 100), 3);
  const isOpen = status === 'ACTIVE' && !pendingDraw;
  const gamePill = gameColorMap[category] ?? { bg: 'var(--warn)', color: 'var(--ink)' };

  // Status pill: correctly distinguish Open / Sold Out / Drawing soon / Coming Soon
  // (previously everything non-ACTIVE was mislabelled "Coming Soon").
  const statusPill = pendingDraw
    ? { label: 'Drawing soon', bg: 'var(--warn)', color: 'var(--ink)' }
    : isOpen
      ? { label: 'Open', bg: 'var(--accent)', color: 'var(--ink)' }
      : status === 'SOLD_OUT'
        ? { label: 'Sold Out', bg: 'var(--pop)', color: '#fff' }
        : { label: 'Coming Soon', bg: 'var(--pop)', color: '#fff' };

  return (
    <Link
      href={`/competitions/${slug}`}
      className="comp-card group flex flex-col transition-all duration-200 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-lg)]"
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--ink)',
        borderRadius: '14px',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
      }}
    >
      {/* Visual */}
      <div
        className="relative grid place-items-center"
        style={{ aspectRatio: '5/4', background: 'var(--bg-2)', borderBottom: '1.5px solid var(--ink)', overflow: 'hidden' }}
      >
        {/* Game pill */}
        <span
          className="absolute top-3.5 left-3.5 z-[2]"
          style={{
            padding: '5px 10px', border: '1.5px solid var(--ink)', borderRadius: '6px',
            fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.12em', fontWeight: 700,
            background: gamePill.bg, color: gamePill.color,
          }}
        >
          {formatCategory(category)}
        </span>

        {/* Status pill */}
        <span
          className="absolute top-3.5 right-3.5 z-[2]"
          style={{
            padding: '5px 10px', border: '1.5px solid var(--ink)', borderRadius: '6px',
            fontSize: '11px', fontWeight: 700,
            background: statusPill.bg,
            color: statusPill.color,
          }}
        >
          ● {statusPill.label}
        </span>

        {/* Card image */}
        <div className="relative transition-transform duration-400 group-hover:-translate-y-1.5 group-hover:rotate-[-2deg] group-hover:scale-[1.02]" style={{ maxHeight: '88%', maxWidth: '62%', width: '100%', height: '100%' }}>
          <Image
            src={mainImageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3.5 flex-1" style={{ padding: '20px 22px 22px' }}>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {title}
        </h3>

        <div style={{ fontFamily: 'var(--display)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1 }}>
          £{prizeValue.toLocaleString('en-GB')}
        </div>

        {/* Progress / entries */}
        <div>
          {isUnlimited ? (
            <div className="flex justify-between" style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>
              <span>{soldTickets.toLocaleString('en-GB')} entries</span>
              <span>Unlimited tickets</span>
            </div>
          ) : (
            <>
              <div style={{ height: '4px', background: 'var(--bg-3)', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--ink)' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: '2px' }} />
              </div>
              <div className="flex justify-between" style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>
                <span>{soldTickets.toLocaleString('en-GB')} / {total.toLocaleString('en-GB')} sold</span>
                <span>{left.toLocaleString('en-GB')} tickets left</span>
              </div>
            </>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mt-auto" style={{ paddingTop: '12px', borderTop: '1.5px dashed var(--line-2)' }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {isFree ? 'FREE' : `£${ticketPrice.toFixed(2)}`}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {isFree ? 'free entry' : 'per ticket'}
            </div>
          </div>
          <span
            className="transition-all duration-150 group-hover:bg-[var(--accent)] group-hover:text-[var(--ink)]"
            style={{
              padding: '10px 16px', background: 'var(--ink)', color: 'var(--accent)',
              borderRadius: '8px', fontSize: '13px', fontWeight: 700,
              border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--ink)',
            }}
          >
            {isOpen ? 'Enter Now →' : 'View Details'}
          </span>
        </div>
      </div>
    </Link>
  );
}
