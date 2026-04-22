'use client';

import Link from 'next/link';
import { HeroCarousel } from './hero-carousel';
import { Chip } from '@/components/ui/chip';

interface Competition {
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  status: string;
}

interface HomeHeroProps {
  competitions: Competition[];
}

const heroImages = [
  { slug: 'charizard', title: 'Charizard PSA 10', mainImageUrl: '/images/hero/charizard.webp', category: 'POKEMON', prizeValue: 150000, status: 'ACTIVE' },
  { slug: 'luffy', title: 'Luffy Gear 5 Alt Art', mainImageUrl: '/images/hero/luffy.webp', category: 'ONE_PIECE', prizeValue: 25000, status: 'ACTIVE' },
  { slug: 'messi', title: 'Messi Signed Jersey', mainImageUrl: '/images/hero/messi.webp', category: 'SPORTS_FOOTBALL', prizeValue: 35000, status: 'ACTIVE' },
  { slug: 'jordan', title: 'Jordan Rookie PSA 10', mainImageUrl: '/images/hero/michael-jordan.webp', category: 'SPORTS_BASKETBALL', prizeValue: 80000, status: 'ACTIVE' },
];

export function HomeHero({ competitions }: HomeHeroProps) {
  return (
    <section className="mx-auto px-5 sm:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16" style={{ maxWidth: '1440px' }}>
      <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '48px', alignItems: 'center', minHeight: '620px' }}>
        {/* Left col */}
        <div>
          {/* Eyebrow pill */}
          <div
            className="inline-flex items-center gap-2.5"
            style={{
              padding: '7px 14px',
              background: 'var(--ink)',
              color: 'var(--accent)',
              borderRadius: '999px',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '28px',
              fontWeight: 600,
            }}
          >
            <span className="live-dot" style={{ boxShadow: '0 0 10px var(--accent)' }} />
            {competitions.length} LIVE COMPETITIONS
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--display)',
              fontSize: 'clamp(36px, 8vw, 124px)',
              lineHeight: 0.88,
              letterSpacing: '-0.05em',
              fontWeight: 700,
              margin: '0 0 22px',
            }}
          >
            Win The Card<br />
            <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--hot)', textDecorationThickness: '6px', textUnderlineOffset: '8px' }}>
              Of Your
            </span>{' '}
            <Chip color="accent">Dreams</Chip>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: '18px', lineHeight: 1.5, color: 'var(--ink-dim)', maxWidth: '460px', margin: '0 0 30px' }}>
            UK&apos;s biggest card comps — <b style={{ color: 'var(--ink)', fontWeight: 700, background: 'var(--accent)', padding: '1px 6px', borderRadius: '5px' }}>Pokémon, One Piece, Football &amp; Basketball</b>. Tickets from <b style={{ color: 'var(--ink)', fontWeight: 700, background: 'var(--accent)', padding: '1px 6px', borderRadius: '5px' }}>£2.99</b>. Live draws. Real cards delivered to your door.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2.5" style={{ marginBottom: '32px' }}>
            <Link
              href="/competitions"
              className="inline-flex items-center justify-center font-semibold transition-all duration-150"
              style={{
                padding: '16px 28px', fontSize: '15px', borderRadius: '12px',
                background: 'var(--hot)', color: '#fff',
                border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translate(-2px,-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'none'; }}
            >
              Browse Competitions →
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center font-semibold transition-all duration-150"
              style={{
                padding: '16px 28px', fontSize: '15px', borderRadius: '12px',
                background: 'var(--surface)', color: 'var(--ink)',
                border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translate(-2px,-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'none'; }}
            >
              How it works
            </Link>
          </div>

          {/* Strip chips */}
          <div className="flex flex-wrap items-center gap-2.5" style={{ paddingTop: '24px', borderTop: '1.5px dashed var(--ink)' }}>
            <span style={{ padding: '7px 14px', border: '1.5px solid var(--ink)', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: 'var(--accent)' }}>£500K + won</span>
            <span style={{ padding: '7px 14px', border: '1.5px solid var(--ink)', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: 'var(--surface)' }}>2,500+ entries</span>
            <span style={{ padding: '7px 14px', border: '1.5px solid var(--ink)', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: 'var(--hot)', color: '#fff' }}>100% live draws</span>
          </div>
        </div>

        {/* Right col: carousel — hidden on mobile */}
        <div className="hidden md:block">
          <HeroCarousel cards={heroImages} />
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }
          .carousel { height: 480px; }
        }
        @media (max-width: 640px) {
          .carousel { height: 380px; }
          .carousel-track { width: 240px; height: 380px; }
        }
      `}</style>
    </section>
  );
}
