import { ImageResponse } from 'next/og';

/**
 * Dynamic Open Graph image generation for WinUCard
 * Used as fallback for pages without custom OG images
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

export const runtime = 'edge';

export const alt = 'WinUCard - Win Collectible Cards & Memorabilia';
export const size = {
  width: 1200,
  height: 630,
};
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
          backgroundColor: '#1e40af',
          backgroundImage:
            'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.1,
          }}
        >
          {/* Card pattern */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 120,
                height: 168,
                borderRadius: 8,
                backgroundColor: 'white',
                transform: `rotate(${-15 + i * 10}deg)`,
                left: `${10 + i * 14}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
            />
          ))}
        </div>

        {/* Main content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo placeholder - circle with WTC text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: 'white',
              marginBottom: 30,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: '#1e40af',
              }}
            >
              WTC
            </span>
          </div>

          {/* Main title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 16,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              lineHeight: 1.1,
            }}
          >
            WinUCard
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 30,
              maxWidth: 800,
              lineHeight: 1.3,
            }}
          >
            Win Collectible Cards & Memorabilia
          </div>

          {/* Categories */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Pokemon', 'One Piece', 'Sports', 'Trading Cards'].map(
              (category) => (
                <div
                  key={category}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 20,
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 500,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {category}
                </div>
              )
            )}
          </div>

          {/* UK badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 40,
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span style={{ fontSize: 24 }}>UK-Based</span>
            <span
              style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Prize Competitions
            </span>
          </div>
        </div>

        {/* Bottom URL bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: 1,
            }}
          >
            winucard.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
