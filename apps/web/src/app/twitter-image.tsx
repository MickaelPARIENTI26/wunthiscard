import { ImageResponse } from 'next/og';

/**
 * Dynamic Twitter card image for WinUPrize — same "Matchday Gold" design as the
 * OG image, sized for Twitter's 2:1 summary_large_image. Self-contained (no
 * external logo or font fetch).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#twitter-image
 */

export const runtime = 'edge';

export const alt = 'WinUPrize - Win Collectible Cards & Memorabilia';
export const size = { width: 1200, height: 600 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0A',
          border: '10px solid #C9A227',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark: skewed gold wedge + WinU / Prize */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 100, fontWeight: 800, letterSpacing: 2 }}>
          <div
            style={{
              display: 'flex',
              width: 19,
              height: 92,
              backgroundColor: '#C9A227',
              transform: 'skewX(-12deg)',
              marginRight: 28,
            }}
          />
          <span style={{ display: 'flex', color: '#F4F1EA' }}>WINU</span>
          <span style={{ display: 'flex', color: '#C9A227' }}>PRIZE</span>
        </div>

        <div style={{ display: 'flex', fontSize: 36, color: 'rgba(244,241,234,0.7)', marginTop: 24, textAlign: 'center' }}>
          Win the card of your dreams
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          {['Pokémon', 'One Piece', 'Sports', 'Memorabilia'].map((c) => (
            <div
              key={c}
              style={{
                display: 'flex',
                padding: '10px 24px',
                border: '1px solid rgba(244,241,234,0.28)',
                color: 'rgba(244,241,234,0.66)',
                fontSize: 23,
                fontWeight: 600,
                letterSpacing: 2,
              }}
            >
              {c}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 66,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#C9A227',
          }}
        >
          <span style={{ display: 'flex', fontSize: 26, color: '#0A0A0A', letterSpacing: 3, fontWeight: 700 }}>
            WINUPRIZE.COM · INDEPENDENT DRAWS · 18+
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
