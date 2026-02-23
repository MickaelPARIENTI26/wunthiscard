'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompetitionCard } from '@/components/competition/competition-card';
import { cn } from '@/lib/utils';
import type { CompetitionCategory, CompetitionStatus } from '@winucard/shared/types';

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
  const t = useTranslations();

  if (competitions.length === 0) {
    return (
      <section className={cn('py-16 md:py-20 lg:py-24', className)}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]">
              <span className="text-gradient-gold">{t('competitions.liveCompetitions')}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8" style={{ color: '#a0a0a0' }}>
              {t('competitions.noLiveCompetitions')}
            </p>
            <Button
              asChild
              variant="outline"
              style={{
                background: 'transparent',
                borderColor: 'oklch(0.3 0.02 270)',
              }}
            >
              <Link href="/competitions">{t('common.viewCompetitions')}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('py-16 md:py-20 lg:py-24 relative', className)}>
      {/* Decorative background glow */}
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'oklch(0.82 0.165 85 / 0.04)' }}
      />

      <div className="container mx-auto px-4 relative">
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
                className="flex h-10 w-10 items-center justify-center rounded-xl animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.6 0.2 25) 0%, oklch(0.45 0.18 25) 100%)',
                }}
              >
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-gradient-gold">{t('competitions.liveCompetitions')}</span>
            </h2>
            <p className="text-muted-foreground mt-2" style={{ color: '#a0a0a0' }}>
              {t('competitions.liveCompetitionsSubtitle')}
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
            <Link href="/competitions" className="flex items-center gap-2">
              {t('common.viewAll')}
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
            <Button
              asChild
              className="font-semibold"
              style={{
                background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                color: 'black',
              }}
            >
              <Link href="/competitions" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('common.viewCompetitions')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
