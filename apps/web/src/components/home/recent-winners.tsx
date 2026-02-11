'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

function anonymizeName(firstName: string, lastName: string): string {
  const anonymizeWord = (word: string): string => {
    if (word.length <= 1) return word;
    return word[0] + '***';
  };

  return `${anonymizeWord(firstName)} ${anonymizeWord(lastName)}`;
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
    <motion.div variants={itemVariants} className="flex-shrink-0 w-72 sm:w-80">
      <Card className="overflow-hidden h-full">
        <div className="relative aspect-square">
          <Image
            src={winner.prizeImageUrl}
            alt={winner.competitionTitle}
            fill
            sizes="(max-width: 640px) 288px, 320px"
            className="object-cover"
            loading="lazy"
          />
          {/* Winner Badge Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-yellow-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
            <Trophy className="h-3.5 w-3.5" />
            Winner
          </div>
        </div>

        <CardContent className="p-4">
          {/* Competition Title */}
          <h3 className="font-semibold text-base line-clamp-2 mb-2">
            {winner.competitionTitle}
          </h3>

          {/* Prize Value */}
          <p className="text-xl font-bold text-primary mb-3">
            {new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(winner.prizeValue)}
          </p>

          {/* Winner Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{anonymizeName(winner.winnerFirstName, winner.winnerLastName)}</span>
            <span>{formatDate(winner.wonAt)}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RecentWinners({ winners, className }: RecentWinnersProps) {
  if (winners.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-12 md:py-16 lg:py-20', className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-12"
        >
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Recent Winners
            </h2>
            <p className="text-muted-foreground mt-2">
              Check out our latest lucky winners
            </p>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href="/winners" className="flex items-center gap-2">
              View All Winners
              <ArrowRight className="h-4 w-4" />
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
          <Button asChild variant="outline">
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
