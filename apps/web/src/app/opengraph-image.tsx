import { ImageResponse } from 'next/og';

/**
 * Dynamic Open Graph image for WinUPrize — fallback for pages without a custom OG image.
 * Rendered in the "Matchday Gold" identity: near-black field, antique-gold accent,
 * squared geometry, skewed wedge + WinU/Prize wordmark. Self-contained (no external
 * logo or font fetch), so it renders on the edge runtime.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

export const runtime = 'edge';

export const alt = 'WinUPrize - Win Collectible Cards & Memorabilia';
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
          backgroundColor: '#0A0A0A',
          border: '10px solid #C9A227',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark: skewed gold wedge + WinU / Prize */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 104, fontWeight: 800, letterSpacing: 2 }}>
          <div
            style={{
              display: 'flex',
              width: 20,
              height: 96,
              backgroundColor: '#C9A227',
              transform: 'skewX(-12deg)',
              marginRight: 30,
            }}
          />
          <span style={{ display: 'flex', color: '#F4F1EA' }}>WINU</span>
          <span style={{ display: 'flex', color: '#C9A227' }}>PRIZE</span>
        </div>

        {/* Tagline */}
        <div style={{ display: 'flex', fontSize: 38, color: 'rgba(244,241,234,0.7)', marginTop: 26, textAlign: 'center' }}>
          Win the card of your dreams
        </div>

        {/* Category pills — squared, outlined */}
        <div style={{ display: 'flex', gap: 16, marginTop: 44 }}>
          {['Pokémon', 'One Piece', 'Sports', 'Memorabilia'].map((c) => (
            <div
              key={c}
              style={{
                display: 'flex',
                padding: '10px 24px',
                border: '1px solid rgba(244,241,234,0.28)',
                color: 'rgba(244,241,234,0.66)',
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 2,
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* Bottom gold band */}
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
