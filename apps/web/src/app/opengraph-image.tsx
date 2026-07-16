import { ImageResponse } from 'next/og';

/**
 * Dynamic Open Graph image for Lucky TCG — fallback for pages without a custom OG image.
 * Rendered in the real brand ("DROP" aesthetic): cream background, thick black border,
 * neon-green highlight, black wordmark. No external logo/font fetch (self-contained).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

export const runtime = 'edge';

export const alt = 'Lucky TCG - Win Collectible Cards & Memorabilia';
export const size = { width: 1200, height: 630 };
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
          backgroundColor: '#f2f0ec',
          border: '18px solid #0d0d0d',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark: WinU + green "Card" chip */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 104, fontWeight: 800, color: '#0d0d0d', letterSpacing: -4 }}>
          <span style={{ display: 'flex' }}>WinU</span>
          <span
            style={{
              display: 'flex',
              backgroundColor: '#00c76a',
              color: '#0d0d0d',
              padding: '4px 22px',
              borderRadius: 18,
              marginLeft: 8,
            }}
          >
            Card
          </span>
        </div>

        {/* Tagline */}
        <div style={{ display: 'flex', fontSize: 38, color: '#333333', marginTop: 26, textAlign: 'center' }}>
          Win the card of your dreams
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          {['Pokemon', 'One Piece', 'Sports', 'Memorabilia'].map((c) => (
            <div
              key={c}
              style={{
                display: 'flex',
                padding: '10px 24px',
                border: '2px solid #0d0d0d',
                borderRadius: 999,
                backgroundColor: '#ffffff',
                color: '#0d0d0d',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d0d0d',
          }}
        >
          <span style={{ display: 'flex', fontSize: 26, color: '#00c76a', letterSpacing: 2, fontWeight: 700 }}>
            lucky-tcg.com · 18+
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
