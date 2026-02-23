'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CardCategoriesHeroProps {
  className?: string;
}

// Category data
const categories = [
  { key: 'pokemon', label: 'Pokémon', color: '#F0B90B', emoji: '🔥', bgColor: '#FFF8E1' },
  { key: 'onePiece', label: 'One Piece', color: '#E05555', emoji: '🏴‍☠️', bgColor: '#FFEBEE' },
  { key: 'football', label: 'Football', color: '#34C772', emoji: '⚽', bgColor: '#E8F5E9' },
  { key: 'basketball', label: 'Basketball', color: '#4A90E2', emoji: '🏀', bgColor: '#E3F2FD' },
];

// Card display positions (rotation and offset)
const cardPositions = [
  { rotate: -12, x: 0, y: 0, z: 5 },
  { rotate: -4, x: 35, y: -10, z: 4 },
  { rotate: 4, x: 70, y: 5, z: 3 },
  { rotate: 12, x: 105, y: -5, z: 2 },
];

// Floating card component
function FloatingCard({
  category,
  position,
  index
}: {
  category: typeof categories[number];
  position: typeof cardPositions[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: position.rotate - 10 }}
      animate={{ opacity: 1, y: 0, rotate: position.rotate }}
      transition={{
        duration: 0.6,
        delay: 0.2 + index * 0.1,
        ease: 'easeOut'
      }}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: position.z,
        transform: `rotate(${position.rotate}deg)`,
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 3 + index * 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.3,
        }}
        className="relative"
      >
        {/* Card */}
        <div
          className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: category.bgColor,
            border: `2px solid ${category.color}`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)`,
          }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />

          {/* Card content */}
          <span className="text-4xl sm:text-5xl mb-2 relative z-10">{category.emoji}</span>
          <span
            className="text-xs sm:text-sm font-bold relative z-10"
            style={{ color: category.color }}
          >
            {category.label}
          </span>

          {/* PSA 10 badge */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              backgroundColor: category.color,
              color: category.key === 'pokemon' ? '#12151e' : '#ffffff',
            }}
          >
            PSA 10
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CardCategoriesHero({ className }: CardCategoriesHeroProps) {
  const t = useTranslations('categoriesHero');

  return (
    <section
      className={cn('py-16 md:py-20 lg:py-24 relative overflow-hidden', className)}
      style={{ backgroundColor: '#161a28' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/4 rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240, 185, 11, 0.12) 0%, transparent 70%)' }}
      />

      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                style={{
                  backgroundColor: 'rgba(240, 185, 11, 0.08)',
                  border: '1px solid rgba(240, 185, 11, 0.2)',
                  color: '#F0B90B',
                }}
              >
                <Trophy className="w-4 h-4" />
                {t('badge')}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-[family-name:var(--font-outfit)]"
              style={{ color: '#ffffff' }}
            >
              {t('titlePart1')}{' '}
              <span style={{ color: '#F0B90B' }}>{t('titleHighlight')}</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
              style={{ color: '#7a7e90', lineHeight: 1.7 }}
            >
              {t('description')}
            </motion.p>

            {/* Category badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8"
            >
              {categories.map((category) => (
                <span
                  key={category.key}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                  }}
                >
                  {category.label}
                </span>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                asChild
                size="lg"
                className="text-lg px-8 font-semibold group btn-primary-gold"
              >
                <Link href="/competitions" className="flex items-center gap-2">
                  {t('cta')}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Cards Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative h-[280px] sm:h-[320px] lg:h-[400px]"
          >
            {/* Glow behind cards */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full blur-[80px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(240, 185, 11, 0.25) 0%, transparent 70%)' }}
            />

            {/* Cards container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-[280px] sm:w-[340px] h-[200px] sm:h-[220px]">
                {categories.map((category, index) => {
                  const position = cardPositions[index];
                  if (!position) return null;
                  return (
                    <FloatingCard
                      key={category.key}
                      category={category}
                      position={position}
                      index={index}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
