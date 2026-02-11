'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/common/countdown-timer';
import { cn } from '@/lib/utils';
import type { CompetitionCategory } from '@winthiscard/shared/types';

interface UpcomingCompetition {
  id: string;
  slug: string;
  title: string;
  mainImageUrl: string;
  category: CompetitionCategory;
  prizeValue: number;
  ticketPrice: number;
  saleStartDate: Date;
}

interface ComingSoonProps {
  competitions: UpcomingCompetition[];
  className?: string;
}

const categoryLabels: Record<CompetitionCategory, string> = {
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

function UpcomingCard({ competition }: { competition: UpcomingCompetition }) {
  return (
    <motion.div variants={itemVariants}>
      <div
        className="overflow-hidden group h-full rounded-2xl transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, oklch(0.14 0.02 270) 0%, oklch(0.10 0.02 270) 100%)',
          border: '1px solid oklch(0.25 0.02 270)',
        }}
      >
        <div className="relative">
          {/* Image with greyscale effect */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={competition.mainImageUrl}
              alt={competition.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Overlay */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(180deg, oklch(0 0 0 / 0.3) 0%, oklch(0 0 0 / 0.6) 100%)',
              }}
            />
          </div>

          {/* Coming Soon Badge */}
          <Badge
            className="absolute top-3 left-3 backdrop-blur-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, oklch(0.55 0.2 255) 0%, oklch(0.45 0.18 270) 100%)',
              color: 'white',
              border: 'none',
            }}
          >
            Coming Soon
          </Badge>

          {/* Category Badge */}
          <Badge
            className="absolute top-3 right-3 backdrop-blur-sm"
            style={{
              background: 'oklch(0.15 0.02 270 / 0.9)',
              border: '1px solid oklch(0.3 0.02 270)',
            }}
          >
            {categoryLabels[competition.category]}
          </Badge>
        </div>

        <div className="p-5">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mb-4 font-[family-name:var(--font-display)]">
            {competition.title}
          </h3>

          {/* Prize Value & Ticket Price */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-muted-foreground">Prize Value</p>
              <p className="text-xl font-bold text-gradient-gold">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(competition.prizeValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Ticket Price</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  minimumFractionDigits: 2,
                }).format(competition.ticketPrice)}
              </p>
            </div>
          </div>

          {/* Countdown to Sale Start */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Sale starts in:
            </p>
            <CountdownTimer
              targetDate={new Date(competition.saleStartDate)}
              size="sm"
              showLabels={false}
            />
          </div>

          {/* Notify Button */}
          <Button
            asChild
            variant="outline"
            className="w-full group/btn transition-all hover:border-primary/50"
            style={{
              background: 'transparent',
              borderColor: 'oklch(0.3 0.02 270)',
            }}
          >
            <Link href={`/competitions/${competition.slug}`} className="flex items-center gap-2">
              <Bell className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
              Get Notified
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function ComingSoon({ competitions, className }: ComingSoonProps) {
  if (competitions.length === 0) {
    return null;
  }

  return (
    <section
      className={cn('py-16 md:py-20 lg:py-24 relative', className)}
      style={{
        background: 'linear-gradient(180deg, oklch(0.06 0.02 270) 0%, oklch(0.08 0.02 270) 100%)',
      }}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 md:mb-14"
        >
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-3 font-[family-name:var(--font-display)]">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.55 0.2 255) 0%, oklch(0.45 0.18 270) 100%)',
                }}
              >
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-gradient-gold">Coming Soon</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              Get notified when these competitions go live
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="self-start sm:self-auto group transition-all hover:border-primary/50"
            style={{
              background: 'transparent',
              borderColor: 'oklch(0.3 0.02 270)',
            }}
          >
            <Link href="/competitions?status=upcoming" className="flex items-center gap-2">
              View All Upcoming
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        {/* Competitions Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {competitions.map((competition) => (
            <UpcomingCard key={competition.id} competition={competition} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
