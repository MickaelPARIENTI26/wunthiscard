'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { anonymizeWinnerName } from '@winthiscard/shared/utils';

interface Winner {
  id: string;
  competitionTitle: string;
  competitionSlug: string;
  prizeImageUrl: string;
  prizeValue: number;
  winnerFirstName: string;
  winnerLastName: string;
  wonAt: Date;
}

interface RecentWinnersProps {
  winners: Winner[];
  className?: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

function WinnerCard({ winner }: { winner: Winner }) {
  return (
    <motion.div variants={itemVariants} className="flex-shrink-0 w-72 sm:w-80 group">
      <div
        className="overflow-hidden h-full rounded-2xl transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, oklch(0.14 0.02 270) 0%, oklch(0.10 0.02 270) 100%)',
          border: '1px solid oklch(0.25 0.02 270)',
        }}
      >
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={winner.prizeImageUrl}
            alt={winner.competitionTitle}
            fill
            sizes="(max-width: 640px) 288px, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 50%, oklch(0.10 0.02 270) 100%)',
            }}
          />

          {/* Winner Badge Overlay */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
              color: 'black',
            }}
          >
            <Trophy className="h-3.5 w-3.5" />
            WINNER
          </div>

          {/* Confetti/stars effect */}
          <div className="absolute top-3 right-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>

        <div className="p-4">
          {/* Competition Title */}
          <h3 className="font-semibold text-base line-clamp-2 mb-2 font-[family-name:var(--font-display)]" style={{ color: '#f5f5f5' }}>
            {winner.competitionTitle}
          </h3>

          {/* Prize Value */}
          <p
            className="text-xl font-bold mb-3 text-gradient-gold"
          >
            {new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(winner.prizeValue)}
          </p>

          {/* Winner Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-primary/70" />
              {anonymizeWinnerName(winner.winnerFirstName, winner.winnerLastName)}
            </span>
            <span>{formatDate(winner.wonAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function RecentWinners({ winners, className }: RecentWinnersProps) {
  if (winners.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-16 md:py-20 lg:py-24 relative', className)}>
      {/* Decorative background elements */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'oklch(0.82 0.165 85 / 0.05)' }}
      />

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
                  background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                }}
              >
                <Trophy className="h-5 w-5 text-black" />
              </div>
              <span className="text-gradient-gold">Recent Winners</span>
            </h2>
            <p className="text-muted-foreground mt-2" style={{ color: '#a0a0a0' }}>
              Check out our latest lucky winners
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
            <Link href="/winners" className="flex items-center gap-2">
              View All Winners
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        {/* Winners Horizontal Scroll (Mobile) / Grid (Desktop) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Mobile: Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:hidden -mx-4 px-4">
            {winners.map((winner) => (
              <div key={winner.id} className="snap-start">
                <WinnerCard winner={winner} />
              </div>
            ))}
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {winners.slice(0, 4).map((winner) => (
              <WinnerCard key={winner.id} winner={winner} />
            ))}
          </div>
        </motion.div>

        {/* View All Link (Mobile) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 text-center md:hidden"
        >
          <Button
            asChild
            variant="outline"
            style={{
              background: 'transparent',
              borderColor: 'oklch(0.3 0.02 270)',
            }}
          >
            <Link href="/winners" className="flex items-center gap-2">
              View All Winners
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
