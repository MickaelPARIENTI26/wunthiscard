import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/db';

/**
 * Per-competition share card.
 *
 * The prize photo alone made a poor preview: the cards are 5:7 portrait and
 * every network crops to its own ratio, so a raw image gets sliced through the
 * middle with nothing to say what it is or what it costs. This lays the photo
 * out on the left at its own aspect ratio and puts the sell — prize value and
 * ticket price — on the right, inside a fixed 1200x630 frame that no crop can
 * ruin.
 *
 * Node runtime, not edge: it reads the competition from Postgres via Prisma.
 * Social crawlers fetch this once and cache it, so the query cost is trivial.
 */
export const alt = 'WinUPrize competition';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GOLD = '#C9A227';
const INK = '#F4F1EA';
const BG = '#0A0A0A';

const gbp0 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});
const gbp2 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

const CATEGORY_LABELS: Record<string, string> = {
  POKEMON: 'Pokémon',
  ONE_PIECE: 'One Piece',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_OTHER: 'Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh!',
  MTG: 'MTG',
  OTHER: 'Collectibles',
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: {
      title: true,
      category: true,
      prizeValue: true,
      ticketPrice: true,
      isFree: true,
      mainImageUrl: true,
      totalTickets: true,
      isMystery: true,
      isRevealed: true,
    },
  });

  // A missing slug still has to return an image — the crawler asked for one.
  if (!competition) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: BG,
            border: `10px solid ${GOLD}`,
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800 }}>
            <span style={{ display: 'flex', color: INK }}>WINU</span>
            <span style={{ display: 'flex', color: GOLD }}>PRIZE</span>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // Prisma returns Decimal for money columns; Intl only takes numbers.
  const prizeValue = Number(competition.prizeValue);
  const ticketPrice = Number(competition.ticketPrice);

  const hidden = competition.isMystery && !competition.isRevealed;
  const label = CATEGORY_LABELS[competition.category] ?? 'Collectibles';
  const title = hidden ? `Mystery ${label} Card` : competition.title;
  const priceLine = competition.isFree ? 'FREE ENTRY' : `TICKETS ${gbp2.format(ticketPrice)}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: BG,
          border: `10px solid ${GOLD}`,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Prize photo — contained, never cropped */}
        <div
          style={{
            display: 'flex',
            width: 430,
            alignItems: 'center',
            justifyContent: 'center',
            // Clears the bottom band, which otherwise clipped the card's edge.
            paddingBottom: 64,
            backgroundColor: '#050505',
            borderRight: `1px solid rgba(244,241,234,0.14)`,
          }}
        >
          {!hidden && competition.mainImageUrl ? (
            /* next/og rasterises this to PNG; next/image does not apply. */
            <img
              src={competition.mainImageUrl}
              alt=""
              width={344}
              height={482}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div style={{ display: 'flex', fontSize: 150, color: GOLD, fontWeight: 800 }}>?</div>
          )}
        </div>

        {/* The sell */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '48px 52px 88px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '7px 16px',
              backgroundColor: GOLD,
              color: BG,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              marginBottom: 26,
            }}
          >
            {label.toUpperCase()}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: title.length > 42 ? 46 : 58,
              lineHeight: 1.1,
              fontWeight: 800,
              color: INK,
              marginBottom: 30,
            }}
          >
            {title}
          </div>

          <div style={{ display: 'flex', fontSize: 26, color: 'rgba(244,241,234,0.6)', letterSpacing: 2 }}>
            PRIZE VALUE
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, color: GOLD, marginBottom: 24 }}>
            {gbp0.format(prizeValue)}
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                padding: '10px 20px',
                border: `1px solid ${GOLD}`,
                color: GOLD,
                fontSize: 25,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {priceLine}
            </div>
            {competition.totalTickets ? (
              <div
                style={{
                  display: 'flex',
                  padding: '10px 20px',
                  border: '1px solid rgba(244,241,234,0.28)',
                  color: 'rgba(244,241,234,0.66)',
                  fontSize: 25,
                  fontWeight: 600,
                  letterSpacing: 2,
                }}
              >
                ODDS 1 IN {competition.totalTickets.toLocaleString('en-GB')}
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom band */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: GOLD,
          }}
        >
          <span style={{ display: 'flex', fontSize: 24, color: BG, letterSpacing: 3, fontWeight: 700 }}>
            WINUPRIZE.COM · FREE POSTAL ENTRY · INDEPENDENT DRAWS · 18+
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
