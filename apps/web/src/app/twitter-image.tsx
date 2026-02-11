import { ImageResponse } from 'next/og';

/**
 * Dynamic Twitter card image generation for WinThisCard
 * Uses the same design as OG image but optimized for Twitter
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#twitter-image
 */

export const runtime = 'edge';

export const alt = 'WinThisCard - Win Collectible Cards & Memorabilia';
export const size = {
  width: 1200,
  height: 600, // Twitter uses 2:1 ratio for summary_large_image
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
        {/* Background pattern - slightly smaller for Twitter */}
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
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 100,
                height: 140,
                borderRadius: 6,
                backgroundColor: 'white',
                transform: `rotate(${-10 + i * 8}deg)`,
                left: `${12 + i * 15}%`,
                top: `${25 + (i % 2) * 20}%`,
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
            padding: 40,
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
              width: 100,
              height: 100,
              borderRadius: '50%',
              backgroundColor: 'white',
              marginBottom: 24,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: 40,
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
              fontSize: 56,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 12,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              lineHeight: 1.1,
            }}
          >
            WinThisCard
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 24,
              maxWidth: 700,
              lineHeight: 1.3,
            }}
          >
            Win Collectible Cards & Memorabilia
          </div>

          {/* Categories */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Pokemon', 'One Piece', 'Sports', 'Trading Cards'].map(
              (category) => (
                <div
                  key={category}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 16,
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 500,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {category}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom URL bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 30,
            paddingRight: 30,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: 1,
            }}
          >
            winthiscard.com
          </span>
          <span
            style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            UK Prize Competitions
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
