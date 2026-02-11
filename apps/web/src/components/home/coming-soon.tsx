'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="overflow-hidden group h-full">
        <div className="relative">
          {/* Image with greyscale effect */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={competition.mainImageUrl}
              alt={competition.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              loading="lazy"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
          </div>

          {/* Coming Soon Badge */}
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
          >
            Coming Soon
          </Badge>

          {/* Category Badge */}
          <Badge
            className="absolute top-3 right-3 bg-muted/90 backdrop-blur-sm text-muted-foreground"
          >
            {categoryLabels[competition.category]}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mb-3">
            {competition.title}
          </h3>

          {/* Prize Value & Ticket Price */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Prize Value</p>
              <p className="text-lg font-bold text-primary">
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
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">
              Sale starts in:
            </p>
            <CountdownTimer
              targetDate={new Date(competition.saleStartDate)}
              size="sm"
              showLabels={false}
            />
          </div>

          {/* Notify Button */}
          <Button asChild variant="outline" className="w-full">
            <Link href={`/competitions/${competition.slug}`} className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Get Notified
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ComingSoon({ competitions, className }: ComingSoonProps) {
  if (competitions.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-12 md:py-16 lg:py-20 bg-muted/30', className)}>
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
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Coming Soon
            </h2>
            <p className="text-muted-foreground mt-2">
              Get notified when these competitions go live
            </p>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href="/competitions?status=upcoming" className="flex items-center gap-2">
              View All Upcoming
              <ArrowRight className="h-4 w-4" />
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
