'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImmersiveHeroProps {
  className?: string;
}

// Les images du carrousel sont statiques — les remplacer dans /public/images/hero/
// TEST: Utilise la même image Charizard PSA 10 pour toutes les cartes
const heroCards = [
  { src: '/images/hero/charizard.webp', alt: 'PSA 10 Charizard 1st Edition', emoji: '🔥', color: '#E8A000', bg: 'linear-gradient(160deg, #FFF3D6, #FFEAA0, #FFD54F)' },
  { src: '/images/hero/charizard.webp', alt: 'PSA 10 Charizard 1st Edition', emoji: '🔥', color: '#E8A000', bg: 'linear-gradient(160deg, #FFF3D6, #FFEAA0, #FFD54F)' },
  { src: '/images/hero/charizard.webp', alt: 'PSA 10 Charizard 1st Edition', emoji: '🔥', color: '#E8A000', bg: 'linear-gradient(160deg, #FFF3D6, #FFEAA0, #FFD54F)' },
  { src: '/images/hero/charizard.webp', alt: 'PSA 10 Charizard 1st Edition', emoji: '🔥', color: '#E8A000', bg: 'linear-gradient(160deg, #FFF3D6, #FFEAA0, #FFD54F)' },
];

// Stat chips data
const statChips = [
  { value: '£0.99', label: 'From', color: '#F0B90B' },
  { value: '£15K', label: 'Top Prize', color: '#A855F7' },
  { value: '100%', label: 'Live Draws', color: '#22C55E' },
  { value: '24/7', label: 'Open', color: '#3B82F6' },
];

// 3D Carousel Card Component
function CarouselCard({
  card,
  angle,
  index,
}: {
  card: typeof heroCards[0];
  angle: number;
  index: number;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="carousel-card"
      style={{
        position: 'absolute',
        width: '155px',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        backfaceVisibility: 'visible',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s',
        transform: `rotateY(${angle}deg) translateZ(230px)`,
        aspectRatio: '2/3',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 16px 48px ${card.color}4D`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
      }}
    >
      {!imageError ? (
        <Image
          src={card.src}
          alt={card.alt}
          fill
          sizes="155px"
          style={{ objectFit: 'cover' }}
          onError={() => setImageError(true)}
          priority={index < 2}
        />
      ) : (
        // Fallback: gradient + emoji
        <div
          style={{
            width: '100%',
            height: '100%',
            background: card.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Decorative blurred circles */}
          <div
            style={{
              position: 'absolute',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              filter: 'blur(12px)',
              top: '20%',
              left: '15%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              filter: 'blur(12px)',
              bottom: '25%',
              right: '20%',
            }}
          />
          <span style={{ fontSize: '48px', position: 'relative', zIndex: 1 }}>{card.emoji}</span>
        </div>
      )}
    </div>
  );
}

export function ImmersiveHero({ className }: ImmersiveHeroProps) {
  const t = useTranslations('immersiveHero');

  return (
    <section
      className={cn('relative min-h-screen flex items-center overflow-hidden', className)}
      style={{
        background: '#FAFAFA',
      }}
    >
      {/* CSS for carousel and responsive */}
      <style>{`
        @keyframes rotateCarousel {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }

        .carousel-track {
          animation: rotateCarousel 25s linear infinite;
        }

        .hero-carousel:hover .carousel-track {
          animation-duration: 80s;
        }

        .shimmer-text {
          background: linear-gradient(
            90deg,
            #F0B90B 0%,
            #FFD700 25%,
            #F0B90B 50%,
            #FFD700 75%,
            #F0B90B 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .hero-primary-btn:hover {
          background: #2a2a3e !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(26, 26, 46, 0.3);
        }

        .hero-secondary-btn:hover {
          background: #f5f5f7 !important;
          border-color: #d0d0d4 !important;
        }

        @media (max-width: 1024px) {
          .hero-carousel {
            display: none !important;
          }
          .hero-content {
            text-align: center;
            width: 100% !important;
          }
          .hero-buttons {
            justify-content: center;
          }
          .hero-chips {
            justify-content: center;
          }
          .hero-badge {
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>

      {/* Subtle blob - left side only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full"
          style={{
            background: 'rgba(240, 185, 11, 0.10)',
            filter: 'blur(80px)',
            top: '10%',
            left: '5%',
          }}
          animate={{
            y: [0, 40, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main content - 2 column layout */}
      <div className="container mx-auto px-4 relative z-10 py-20 lg:py-0" style={{ maxWidth: '1100px' }}>
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left Column - 55% */}
          <div className="hero-content w-full lg:w-[55%] text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <span
                className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#22C55E',
                }}
              >
                {/* Pulsing green dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {t('badge')}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight mb-5 font-[family-name:var(--font-outfit)]"
              style={{ letterSpacing: '-2px', lineHeight: 1.05 }}
            >
              <span style={{ color: '#1a1a2e' }}>{t('titlePart1')}</span>
              <br />
              <span className="shimmer-text">{t('titlePart2')}</span>
            </motion.h1>

            {/* Subtitle with colored category names */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              style={{ color: '#6b7088' }}
            >
              PSA 10 graded cards from{' '}
              <span style={{ color: '#F0B90B', fontWeight: 600 }}>Pokemon</span>,{' '}
              <span style={{ color: '#EF4444', fontWeight: 600 }}>One Piece</span>,{' '}
              <span style={{ color: '#22C55E', fontWeight: 600 }}>Football</span> &{' '}
              <span style={{ color: '#3B82F6', fontWeight: 600 }}>Basketball</span>.
              <br className="hidden sm:block" />
              Every draw streamed live.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="hero-buttons flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10"
            >
              {/* Primary Button - Dark */}
              <Link
                href="/competitions"
                className="hero-primary-btn group inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold transition-all duration-300"
                style={{
                  background: '#1a1a2e',
                  color: '#ffffff',
                  borderRadius: '14px',
                  fontSize: '15px',
                }}
              >
                {t('cta')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Secondary Button - White */}
              <Link
                href="/how-it-works"
                className="hero-secondary-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold transition-all duration-300"
                style={{
                  background: '#ffffff',
                  color: '#1a1a2e',
                  borderRadius: '14px',
                  fontSize: '15px',
                  border: '1.5px solid #e0e0e4',
                }}
              >
                {t('secondaryCta')}
              </Link>
            </motion.div>

            {/* Stat Chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="hero-chips flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              {statChips.map((chip, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e8e8ec',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: chip.color }}
                  >
                    {chip.value}
                  </span>
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: '#9a9eb0' }}
                  >
                    {chip.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - 42% - 3D Carousel */}
          <div
            className="hero-carousel"
            style={{
              flex: '0 0 42%',
              height: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '900px',
              overflow: 'visible',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="carousel-track"
              style={{
                position: 'relative',
                width: '160px',
                height: '240px',
                transformStyle: 'preserve-3d',
              }}
            >
              {heroCards.map((card, index) => {
                const angle = (360 / heroCards.length) * index;
                return (
                  <CarouselCard
                    key={index}
                    card={card}
                    angle={angle}
                    index={index}
                  />
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #FAFAFA 0%, transparent 100%)',
        }}
      />
    </section>
  );
}
