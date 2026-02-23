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

const categoryColors: Record<string, string> = {
  POKEMON: 'bg-yellow-500/90 text-black border-yellow-400/50',
  ONE_PIECE: 'bg-red-500/90 text-white border-red-400/50',
  SPORTS_BASKETBALL: 'bg-orange-500/90 text-white border-orange-400/50',
  SPORTS_FOOTBALL: 'bg-green-500/90 text-white border-green-400/50',
  SPORTS_OTHER: 'bg-blue-500/90 text-white border-blue-400/50',
  MEMORABILIA: 'bg-purple-500/90 text-white border-purple-400/50',
  YUGIOH: 'bg-indigo-500/90 text-white border-indigo-400/50',
  MTG: 'bg-slate-500/90 text-white border-slate-400/50',
  OTHER: 'bg-gray-500/90 text-white border-gray-400/50',
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
        <Card className={cn(
          'overflow-hidden h-full flex flex-col cursor-pointer transition-all duration-300',
          'bg-card border-border/50 hover:border-primary/50',
          'hover:shadow-xl hover:shadow-primary/10',
          isActive && !isSoldOut && 'holo-shimmer'
        )}>
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
                <p className="text-2xl md:text-3xl font-bold text-gradient-gold tabular-nums font-[family-name:var(--font-display)]">
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

          <CardContent className="flex-1 p-4 flex flex-col" style={{ color: '#f5f5f5' }}>
            {/* Title */}
            <h3
              className="font-semibold text-lg line-clamp-2 mb-3 min-h-[3.5rem] group-hover:text-primary transition-colors font-[family-name:var(--font-display)]"
              style={{ color: '#f5f5f5' }}
            >
              {title}
            </h3>

            {/* Ticket Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold tabular-nums" style={{ color: '#FFD700' }}>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  minimumFractionDigits: 2,
                }).format(ticketPrice)}
              </span>
              <span className="text-sm" style={{ color: '#a0a0a0' }}>{t('perTicket')}</span>
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
                <p className="text-xs mb-2" style={{ color: '#a0a0a0' }}>
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
            <div className="mt-4 pt-3 border-t" style={{ borderColor: '#2a2a4a' }}>
              <span
                className={cn(
                  'block w-full text-center py-2.5 rounded-lg font-semibold transition-all duration-300'
                )}
                style={{
                  backgroundColor: isActive ? '#FFD700' : isSoldOut ? '#1f1f35' : '#1f1f35',
                  color: isActive ? '#0f0f1a' : '#a0a0a0',
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
