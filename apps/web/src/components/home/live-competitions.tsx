'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompetitionCard } from '@/components/competition/competition-card';
import { cn } from '@/lib/utils';
import type { CompetitionCategory, CompetitionStatus } from '@winthiscard/shared/types';

interface Competition {
  id: string;
  slug: string;
  title: string;
  mainImageUrl: string;
  category: CompetitionCategory;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  drawDate: Date;
  status: CompetitionStatus;
}

interface LiveCompetitionsProps {
  competitions: Competition[];
  className?: string;
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export function LiveCompetitions({ competitions, className }: LiveCompetitionsProps) {
  if (competitions.length === 0) {
    return (
      <section className={cn('py-12 md:py-16 lg:py-20', className)}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              Live Competitions
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              No live competitions at the moment. Check back soon!
            </p>
            <Button asChild variant="outline">
              <Link href="/competitions">View All Competitions</Link>
            </Button>
          </div>
        </div>
      </section>
    );
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
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Live Competitions
            </h2>
            <p className="text-muted-foreground mt-2">
              Enter now for your chance to win amazing prizes
            </p>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href="/competitions" className="flex items-center gap-2">
              View All
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
            <motion.div key={competition.id} variants={itemVariants}>
              <CompetitionCard
                id={competition.id}
                slug={competition.slug}
                title={competition.title}
                mainImageUrl={competition.mainImageUrl}
                category={competition.category}
                prizeValue={competition.prizeValue}
                ticketPrice={competition.ticketPrice}
                totalTickets={competition.totalTickets}
                soldTickets={competition.soldTickets}
                drawDate={competition.drawDate}
                status={competition.status}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* View All Link (Mobile) */}
        {competitions.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center sm:hidden"
          >
            <Button asChild>
              <Link href="/competitions" className="flex items-center gap-2">
                View All Competitions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
