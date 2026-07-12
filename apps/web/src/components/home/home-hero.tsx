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
    <section className="mx-auto px-5 sm:px-8 pt-6 pb-10 sm:pt-12 sm:pb-16" style={{ maxWidth: '1440px' }}>
      <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '48px', alignItems: 'center', minHeight: '620px' }}>
        {/* Copy column */}
        <div className="hero-copy">
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
              marginBottom: '20px',
              fontWeight: 600,
            }}
          >
            <span className="live-dot" style={{ boxShadow: '0 0 10px var(--accent)' }} />
            {competitions.length} LIVE COMPETITION{competitions.length === 1 ? '' : 'S'}
          </div>

          {/* Title */}
          <h1
            className="hero-title"
            style={{
              fontFamily: 'var(--display)',
              fontSize: 'clamp(38px, 8vw, 124px)',
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              fontWeight: 700,
              margin: '0 0 16px',
            }}
          >
            Win The Card<br />
            <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--hot)', textDecorationThickness: '5px', textUnderlineOffset: '6px' }}>
              Of Your
            </span>{' '}
            <Chip color="accent">Dreams</Chip>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle" style={{ fontSize: '17px', lineHeight: 1.5, color: 'var(--ink-dim)', maxWidth: '460px', margin: '0 0 22px' }}>
            UK&apos;s biggest card comps — <b style={{ color: 'var(--ink)', fontWeight: 700, background: 'var(--accent)', padding: '1px 6px', borderRadius: '5px' }}>Pokémon, One Piece, Football &amp; Basketball</b>. Tickets from <b style={{ color: 'var(--ink)', fontWeight: 700, background: 'var(--accent)', padding: '1px 6px', borderRadius: '5px' }}>£14.90</b>. Independent draws. Real cards delivered to your door.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2.5" style={{ marginBottom: '12px' }}>
            <Link
              href="/competitions"
              className="hero-cta-primary inline-flex items-center justify-center font-semibold transition-all duration-150"
              style={{
                padding: '15px 26px', fontSize: '15px', borderRadius: '12px',
                background: 'var(--hot)', color: '#fff',
                border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow)',
              }}
            >
              Browse Competitions →
            </Link>
            <Link
              href="/how-it-works"
              className="hero-cta-secondary inline-flex items-center justify-center font-semibold transition-all duration-150"
              style={{
                padding: '15px 26px', fontSize: '15px', borderRadius: '12px',
                background: 'var(--surface)', color: 'var(--ink)',
                border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow)',
              }}
            >
              How it works
            </Link>
          </div>

          {/* Draw-provider trust note — name only, no link */}
          <p style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--ink-dim)', margin: 0 }}>
            <span aria-hidden style={{ fontSize: '15px' }}>🎲</span>
            <span>
              Winners drawn independently by{' '}
              <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>RandomDraws.com</strong>
            </span>
          </p>
        </div>

        {/* Visual column — the card carousel, now shown at every width */}
        <div className="hero-visual">
          <HeroCarousel cards={heroImages} />
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            gap: 8px !important;
          }
          /* Visual first, copy below — the card is the hook, the words follow.
             Extra margin clears the carousel's own overlapping info pill (top)
             and prev/next arrows (bottom), which sit outside its box via
             position:absolute and would otherwise collide with the copy below. */
          .hero-visual { order: 1; margin-top: 28px; margin-bottom: 56px; }
          .hero-copy { order: 2; text-align: center; }
          .hero-copy > * { margin-left: auto !important; margin-right: auto !important; }

          /* Flatten the 3D coverflow on mobile: perspective + preserve-3d + the
             clipped rounded-corner slides can paint solid black on some mobile
             GPU compositors. A flat stack (no rotateY, no perspective) keeps the
             same peeking-cards look with none of the render risk. */
          .carousel { perspective: none; }
          .carousel-track { transform-style: flat; }
          .carousel-slide.prev-1 { transform: translateX(-70%) scale(0.8); }
          .carousel-slide.next-1 { transform: translateX(70%) scale(0.8); }
          .carousel-slide.prev-2 { transform: translateX(-125%) scale(0.62); }
          .carousel-slide.next-2 { transform: translateX(125%) scale(0.62); }
        }
        @media (max-width: 640px) {
          .carousel { height: 320px; }
          .carousel-track { width: 230px; height: 320px; }
          .hero-title { font-size: 42px !important; }
          .hero-subtitle { font-size: 15px !important; }
        }
        @media (max-width: 380px) {
          .carousel { height: 280px; }
          .carousel-track { width: 200px; height: 280px; }
        }
        @media (hover: hover) {
          .hero-cta-primary:hover, .hero-cta-secondary:hover {
            box-shadow: var(--shadow-lg);
            transform: translate(-2px, -2px);
          }
        }
      `}</style>
    </section>
  );
}
