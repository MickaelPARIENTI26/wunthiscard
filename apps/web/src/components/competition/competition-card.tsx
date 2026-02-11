'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CountdownTimer } from '@/components/common/countdown-timer';
import { ProgressBar } from '@/components/common/progress-bar';
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
  className?: string;
}

const categoryLabels: Record<string, string> = {
  POKEMON: 'Pokemon',
  ONE_PIECE: 'One Piece',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_OTHER: 'Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh',
  MTG: 'MTG',
  OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  POKEMON: 'bg-yellow-500 hover:bg-yellow-500/80',
  ONE_PIECE: 'bg-red-500 hover:bg-red-500/80',
  SPORTS_BASKETBALL: 'bg-orange-500 hover:bg-orange-500/80',
  SPORTS_FOOTBALL: 'bg-green-500 hover:bg-green-500/80',
  SPORTS_OTHER: 'bg-blue-500 hover:bg-blue-500/80',
  MEMORABILIA: 'bg-purple-500 hover:bg-purple-500/80',
  YUGIOH: 'bg-indigo-500 hover:bg-indigo-500/80',
  MTG: 'bg-slate-500 hover:bg-slate-500/80',
  OTHER: 'bg-gray-500 hover:bg-gray-500/80',
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
  className,
}: CompetitionCardProps) {
  const isActive = status === 'ACTIVE';
  const isUpcoming = status === 'UPCOMING';
  const isSoldOut = status === 'SOLD_OUT';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className={cn('group', className)}
    >
      <Link href={`/competitions/${slug}`} className="block h-full">
        <Card className="overflow-hidden h-full flex flex-col cursor-pointer transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={mainImageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Category Badge */}
            <Badge
              className={cn(
                'absolute top-3 left-3 text-white border-0',
                categoryColors[category]
              )}
            >
              {categoryLabels[category]}
            </Badge>

            {/* Status Badge */}
            {isSoldOut && (
              <Badge
                variant="destructive"
                className="absolute top-3 right-3"
              >
                Sold Out
              </Badge>
            )}
            {isUpcoming && (
              <Badge
                variant="secondary"
                className="absolute top-3 right-3"
              >
                Coming Soon
              </Badge>
            )}

            {/* Prize Value Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="text-white">
                <p className="text-xs uppercase tracking-wider opacity-80">Prize Value</p>
                <p className="text-2xl font-bold">
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

          <CardContent className="flex-1 p-4">
            {/* Title */}
            <h3 className="font-semibold text-lg line-clamp-2 mb-3 min-h-[3.5rem] group-hover:text-primary transition-colors">
              {title}
            </h3>

            {/* Ticket Price */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  minimumFractionDigits: 2,
                }).format(ticketPrice)}
              </span>
              <span className="text-sm text-muted-foreground">per ticket</span>
            </div>

            {/* Progress Bar */}
            <ProgressBar
              sold={soldTickets}
              total={totalTickets}
              size="sm"
              className="mb-3"
            />

            {/* Countdown */}
            {(isActive || isUpcoming) && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1.5">
                  {isActive ? 'Draw ends in:' : 'Sale starts in:'}
                </p>
                <CountdownTimer
                  targetDate={drawDate}
                  size="sm"
                  showLabels={false}
                />
              </div>
            )}

            {/* CTA Text */}
            <div className="mt-4 pt-3 border-t">
              <span
                className={cn(
                  'block w-full text-center py-2 rounded-md font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground group-hover:bg-primary/90'
                    : isSoldOut
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-secondary text-secondary-foreground group-hover:bg-secondary/80'
                )}
              >
                {isActive ? 'Enter Now' : isUpcoming ? 'View Details' : isSoldOut ? 'Sold Out' : 'View Details'}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
