'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetitionCardProps {
  id: string;
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  drawDate: Date;
  status: string;
  createdAt?: Date;
  className?: string;
  index?: number;
}

// Category configuration
const categoryConfig: Record<string, { label: string; emoji: string; color: string }> = {
  POKEMON: { label: 'Pokemon', emoji: '🔥', color: '#F0B90B' },
  ONE_PIECE: { label: 'One Piece', emoji: '🏴‍☠️', color: '#EF4444' },
  SPORTS_BASKETBALL: { label: 'Basketball', emoji: '🏀', color: '#3B82F6' },
  SPORTS_FOOTBALL: { label: 'Football', emoji: '⚽', color: '#22C55E' },
  SPORTS_OTHER: { label: 'Sports', emoji: '🏆', color: '#3B82F6' },
  MEMORABILIA: { label: 'Memorabilia', emoji: '✨', color: '#A855F7' },
  YUGIOH: { label: 'Yu-Gi-Oh!', emoji: '🃏', color: '#8B5CF6' },
  MTG: { label: 'MTG', emoji: '🧙', color: '#64748B' },
  OTHER: { label: 'Other', emoji: '🎴', color: '#6B7280' },
};

export function CompetitionCard({
  slug,
  title,
  mainImageUrl,
  category,
  prizeValue,
  ticketPrice,
  totalTickets,
  soldTickets,
  status,
  className,
  index = 0,
}: CompetitionCardProps) {
  const t = useTranslations('competitions');
  const isActive = status === 'ACTIVE';
  const isSoldOut = status === 'SOLD_OUT';

  const soldPercentage = Math.round((soldTickets / totalTickets) * 100);
  const isHotSelling = soldPercentage >= 75;

  const defaultConfig = { label: 'Other', emoji: '🎴', color: '#6B7280' };
  const config = categoryConfig[category] ?? defaultConfig;
  const categoryColor = config.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn('group', className)}
    >
      <Link href={`/competitions/${slug}`} className="block h-full">
        <div
          className="h-full flex flex-col overflow-hidden competition-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e8e8ec',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = `${categoryColor}40`;
            el.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.08), 0 0 30px ${categoryColor}12`;
            el.style.transform = 'translateY(-8px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = '#e8e8ec';
            el.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
            el.style.transform = 'translateY(0)';
          }}
        >
          {/* Image Zone - 9:16 Aspect Ratio */}
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              aspectRatio: '9/16',
              maxHeight: '280px',
              background: mainImageUrl ? '#f5f5f7' : `linear-gradient(135deg, ${categoryColor}12 0%, ${categoryColor}05 50%, #f5f5f7 100%)`,
              borderRadius: '20px 20px 0 0',
            }}
          >
            {/* Real Image or Emoji Fallback */}
            {mainImageUrl ? (
              <Image
                src={mainImageUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ borderRadius: '20px 20px 0 0' }}
              />
            ) : (
              <span
                className="text-7xl md:text-8xl transition-all duration-500 ease-out group-hover:scale-[1.15] group-hover:rotate-[-3deg]"
                style={{
                  filter: `drop-shadow(0 12px 32px ${categoryColor}30)`,
                }}
              >
                {config.emoji}
              </span>
            )}

            {/* Category Badge - Top Left */}
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider z-10"
              style={{
                background: '#ffffff',
                border: `1px solid ${categoryColor}30`,
                color: categoryColor,
              }}
            >
              {config.label}
            </div>

            {/* Status Badge - Top Right */}
            <div
              className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 z-10"
              style={{
                background: '#ffffff',
                border: `1px solid ${isHotSelling ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                color: isHotSelling ? '#EF4444' : '#22C55E',
              }}
            >
              {isHotSelling ? (
                <>🔥 {soldPercentage}% sold</>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Open
                </>
              )}
            </div>
          </div>

          {/* Info Zone */}
          <div className="flex-1 flex flex-col" style={{ padding: '18px 22px 24px' }}>
            {/* Title */}
            <h3
              className="font-semibold line-clamp-2 mb-3 min-h-[2.5rem] font-[family-name:var(--font-outfit)]"
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#1a1a2e',
              }}
            >
              {title}
            </h3>

            {/* Prize Value */}
            <p
              className="font-[family-name:var(--font-outfit)] mb-4"
              style={{
                fontSize: '30px',
                fontWeight: 800,
                color: '#1a1a2e',
              }}
            >
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(prizeValue)}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div
                className="w-full rounded-full overflow-hidden"
                style={{
                  height: '6px',
                  background: '#f0f0f3',
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${soldPercentage}%`,
                    background: `linear-gradient(90deg, ${categoryColor} 0%, ${categoryColor}CC 100%)`,
                    boxShadow: `0 0 12px ${categoryColor}40`,
                  }}
                />
              </div>
              {/* Stats */}
              <div className="flex justify-between mt-2">
                <span style={{ fontSize: '11px', color: '#6b7088' }}>
                  {soldTickets} / {totalTickets} {t('sold')}
                </span>
                <span style={{ fontSize: '11px', color: '#9a9eb0' }}>
                  {totalTickets - soldTickets} {t('ticketsLeft')}
                </span>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Separator + Price + CTA */}
            <div
              style={{
                borderTop: '1px solid #f0f0f3',
                marginTop: '18px',
                paddingTop: '14px',
              }}
            >
              {/* Price */}
              <div className="flex items-baseline justify-between mb-3">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                  {new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                    minimumFractionDigits: 2,
                  }).format(ticketPrice)}
                </span>
                <span style={{ fontSize: '11px', color: '#9a9eb0' }}>
                  {t('perTicket')}
                </span>
              </div>

              {/* CTA Button */}
              <button
                className="w-full flex items-center justify-center gap-2 py-3 font-semibold transition-all duration-300"
                style={{
                  background: isActive && !isSoldOut
                    ? '#1a1a2e'
                    : '#f5f5f7',
                  color: isActive && !isSoldOut
                    ? '#ffffff'
                    : '#6b7088',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxShadow: isActive && !isSoldOut ? '0 4px 16px rgba(26, 26, 46, 0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (isActive && !isSoldOut) {
                    e.currentTarget.style.background = '#2a2a3e';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(26, 26, 46, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isActive && !isSoldOut) {
                    e.currentTarget.style.background = '#1a1a2e';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(26, 26, 46, 0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isActive && !isSoldOut ? (
                  <>
                    {t('enterNow')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : isSoldOut ? (
                  t('soldOut')
                ) : (
                  t('viewDetails')
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
