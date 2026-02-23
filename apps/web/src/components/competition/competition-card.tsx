'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CountdownTimer } from '@/components/common/countdown-timer';
import { ProgressBar } from '@/components/common/progress-bar';
import { cn } from '@/lib/utils';
import {
  Flame,
  Sparkles,
  Zap,
  CircleDot,
  Anchor,
  Trophy,
  Shirt,
  Swords,
  Layers,
  HelpCircle,
} from 'lucide-react';

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
}

const categoryLabels: Record<string, string> = {
  POKEMON: 'Pokemon',
  ONE_PIECE: 'One Piece',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_OTHER: 'Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh!',
  MTG: 'MTG',
  OTHER: 'Other',
};

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  POKEMON: <CircleDot className="w-3 h-3" />,
  ONE_PIECE: <Anchor className="w-3 h-3" />,
  SPORTS_BASKETBALL: <Trophy className="w-3 h-3" />,
  SPORTS_FOOTBALL: <Trophy className="w-3 h-3" />,
  SPORTS_OTHER: <Trophy className="w-3 h-3" />,
  MEMORABILIA: <Shirt className="w-3 h-3" />,
  YUGIOH: <Swords className="w-3 h-3" />,
  MTG: <Layers className="w-3 h-3" />,
  OTHER: <HelpCircle className="w-3 h-3" />,
};

// Deep Navy category colors
const categoryColors: Record<string, string> = {
  POKEMON: 'text-[#12151e] border-[#F0B90B]/50',
  ONE_PIECE: 'text-white border-[#E05555]/50',
  SPORTS_BASKETBALL: 'text-white border-[#4A90E2]/50',
  SPORTS_FOOTBALL: 'text-white border-[#34C772]/50',
  SPORTS_OTHER: 'text-white border-[#4A90E2]/50',
  MEMORABILIA: 'text-white border-[#9B59B6]/50',
  YUGIOH: 'text-white border-[#8B5CF6]/50',
  MTG: 'text-white border-[#64748B]/50',
  OTHER: 'text-white border-[#5a5e70]/50',
};

const categoryBgColors: Record<string, string> = {
  POKEMON: '#F0B90B',
  ONE_PIECE: '#E05555',
  SPORTS_BASKETBALL: '#4A90E2',
  SPORTS_FOOTBALL: '#34C772',
  SPORTS_OTHER: '#4A90E2',
  MEMORABILIA: '#9B59B6',
  YUGIOH: '#8B5CF6',
  MTG: '#64748B',
  OTHER: '#5a5e70',
};

const categoryHoverClasses: Record<string, string> = {
  POKEMON: 'card-hover-category-pokemon',
  ONE_PIECE: 'card-hover-category-one-piece',
  SPORTS_BASKETBALL: 'card-hover-category-basketball',
  SPORTS_FOOTBALL: 'card-hover-category-football',
  SPORTS_OTHER: 'card-hover-category-basketball',
  MEMORABILIA: 'card-hover-gold',
  YUGIOH: 'card-hover-gold',
  MTG: 'card-hover-gold',
  OTHER: 'card-hover-gold',
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
  drawDate,
  status,
  createdAt,
  className,
}: CompetitionCardProps) {
  const t = useTranslations('competitions');
  const isActive = status === 'ACTIVE';
  const isUpcoming = status === 'UPCOMING';
  const isSoldOut = status === 'SOLD_OUT';

  const soldPercentage = (soldTickets / totalTickets) * 100;
  const isHot = soldPercentage >= 80 && soldPercentage < 90;
  const isAlmostGone = soldPercentage >= 90;

  // Check if new (created within last 24 hours)
  const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8 }}
      className={cn('group', className)}
    >
      <Link href={`/competitions/${slug}`} className="block h-full">
        <Card
          className={cn(
            'overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300',
            'border hover:shadow-xl',
            categoryHoverClasses[category] || 'card-hover-gold',
            isActive && !isSoldOut && 'holo-shimmer'
          )}
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={mainImageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={cn(
                'object-cover transition-transform duration-500 group-hover:scale-110',
                isSoldOut && 'grayscale opacity-70'
              )}
              loading="lazy"
            />

            {/* Category Badge */}
            <Badge
              className={cn(
                'absolute top-3 left-3 border gap-1',
                categoryColors[category]
              )}
              style={{
                backgroundColor: categoryBgColors[category] || '#5a5e70',
              }}
            >
              {categoryIcons[category]}
              {categoryLabels[category]}
            </Badge>

            {/* Status Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {isSoldOut && (
                <Badge variant="destructive" className="bg-red-600 border-red-500">
                  {t('soldOut')}
                </Badge>
              )}
              {isUpcoming && (
                <Badge variant="secondary" className="bg-secondary border-border">
                  {t('comingSoon')}
                </Badge>
              )}
              {isNew && !isSoldOut && (
                <Badge className="bg-accent text-accent-foreground border-accent/50">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t('new')}
                </Badge>
              )}
              {isHot && !isSoldOut && (
                <Badge className="bg-orange-500 text-white border-orange-400 urgency-pulse">
                  <Flame className="w-3 h-3 mr-1" />
                  {t('hot')}
                </Badge>
              )}
              {isAlmostGone && !isSoldOut && (
                <Badge className="bg-red-500 text-white border-red-400 urgency-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  {t('almostGone')}
                </Badge>
              )}
            </div>

            {/* Sold Out Overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="bg-red-600 text-white px-6 py-2 text-xl font-bold -rotate-12 shadow-lg">
                  {t('soldOut')}
                </div>
              </div>
            )}

            {/* Prize Value Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70 mb-1">{t('prizeValue')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gradient-gold tabular-nums font-[family-name:var(--font-outfit)]">
                  {new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(prizeValue)}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="flex-1 p-4 flex flex-col" style={{ color: '#ffffff' }}>
            {/* Title */}
            <h3
              className="font-semibold text-lg line-clamp-2 mb-3 min-h-[3.5rem] group-hover:text-primary transition-colors font-[family-name:var(--font-outfit)]"
              style={{ color: '#ffffff' }}
            >
              {title}
            </h3>

            {/* Ticket Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold tabular-nums" style={{ color: '#F0B90B' }}>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  minimumFractionDigits: 2,
                }).format(ticketPrice)}
              </span>
              <span className="text-sm" style={{ color: '#7a7e90' }}>{t('perTicket')}</span>
            </div>

            {/* Progress Bar */}
            <ProgressBar
              sold={soldTickets}
              total={totalTickets}
              size="sm"
              className="mb-4"
            />

            {/* Countdown */}
            {(isActive || isUpcoming) && (
              <div className="mt-auto">
                <p className="text-xs mb-2" style={{ color: '#7a7e90' }}>
                  {isActive ? t('drawEndsIn') : t('saleStartsIn')}
                </p>
                <CountdownTimer
                  targetDate={drawDate}
                  size="sm"
                  showLabels={false}
                />
              </div>
            )}

            {/* CTA Button */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <span
                className={cn(
                  'block w-full text-center py-2.5 rounded-lg font-semibold transition-all duration-300'
                )}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)' : '#1a1e2e',
                  color: isActive ? '#12151e' : '#7a7e90',
                }}
              >
                {isActive ? t('enterNow') : isUpcoming ? t('viewDetails') : isSoldOut ? t('soldOut') : t('viewDetails')}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
