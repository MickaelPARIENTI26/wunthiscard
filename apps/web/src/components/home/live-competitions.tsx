'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
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
  totalTickets: number | null;
  soldTickets: number;
  drawDate: Date;
  status: CompetitionStatus;
  isFree: boolean;
  isMystery?: boolean;
  isRevealed?: boolean;
  drawType?: string;
  prizeCount?: number;
}

interface LiveCompetitionsProps {
  competitions: Competition[];
  className?: string;
}

// TODO: Réactiver les filtres quand on aura plus de compétitions simultanées
// Category filter options
// const categoryFilters = [
//   { key: 'ALL', label: 'All', emoji: '✨' },
//   { key: 'POKEMON', label: 'Pokemon', emoji: '🔥', color: '#F0B90B' },
//   { key: 'ONE_PIECE', label: 'One Piece', emoji: '🏴‍☠️', color: '#EF4444' },
//   { key: 'SPORTS_FOOTBALL', label: 'Football', emoji: '⚽', color: '#22C55E' },
//   { key: 'SPORTS_BASKETBALL', label: 'Basketball', emoji: '🏀', color: '#3B82F6' },
//   { key: 'MEMORABILIA', label: 'Memorabilia', emoji: '🏆', color: '#A855F7' },
// ];

// Sort by urgency: Last Hours first, then Ending Soon, then by draw date
function sortByUrgency(comps: Competition[]): Competition[] {
  const now = Date.now();
  return [...comps].sort((a, b) => {
    const diffA = new Date(a.drawDate).getTime() - now;
    const diffB = new Date(b.drawDate).getTime() - now;
    const urgencyA = diffA > 0 && diffA < 3 * 3600000 ? 0 : diffA > 0 && diffA < 24 * 3600000 ? 1 : 2;
    const urgencyB = diffB > 0 && diffB < 3 * 3600000 ? 0 : diffB > 0 && diffB < 24 * 3600000 ? 1 : 2;
    if (urgencyA !== urgencyB) return urgencyA - urgencyB;
    return diffA - diffB; // Closest draw date first
  });
}

export function LiveCompetitions({ competitions, className }: LiveCompetitionsProps) {
  const t = useTranslations();

  // Sort by urgency (Last Hours → Ending Soon → rest)
  const displayedCompetitions = sortByUrgency(competitions);

  if (competitions.length === 0) {
    return (
      <section
        className={cn('py-16 md:py-20 lg:py-24', className)}
        style={{ background: '#F7F7FA' }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 font-[family-name:var(--font-outfit)]">
              <span style={{ color: '#1a1a2e' }}>{t('competitions.liveCompetitions')}</span>
            </h2>
            <p className="mb-8" style={{ color: '#6b7088', fontSize: '16px' }}>
              {t('competitions.noLiveCompetitions')}
            </p>
            <Link
              href="/competitions"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              style={{
                background: '#1a1a2e',
                color: '#ffffff',
              }}
            >
              {t('common.viewCompetitions')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn('py-16 md:py-20 lg:py-24 relative', className)}
      style={{ background: '#F7F7FA' }}
    >
      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-[family-name:var(--font-outfit)]"
            style={{ color: '#1a1a2e', letterSpacing: '-1px' }}
          >
            {t('competitions.liveCompetitions')}
          </h2>
          <p style={{ color: '#6b7088', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            {t('competitions.liveCompetitionsSubtitle')}
          </p>
        </motion.div>

        {/* TODO: Réactiver les filtres quand on aura plus de compétitions simultanées */}
        {/* Category Filters - DISABLED
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-10 md:mb-12"
        >
          {categoryFilters.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
                style={{
                  background: isActive ? '#1a1a2e' : '#ffffff',
                  color: isActive ? '#ffffff' : '#6b7088',
                  border: isActive ? 'none' : '1px solid #e8e8ec',
                  boxShadow: isActive ? '0 4px 12px rgba(26, 26, 46, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <span>{filter.emoji}</span>
                <span>{filter.label}</span>
              </button>
            );
          })}
        </motion.div>
        */}

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCompetitions.map((competition, index) => (
            <CompetitionCard
              key={competition.id}
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
              isFree={competition.isFree}
              isMystery={competition.isMystery}
              isRevealed={competition.isRevealed}
              drawType={competition.drawType}
              prizeCount={competition.prizeCount}
              index={index}
            />
          ))}
        </div>

        {/* TODO: Réactiver les filtres quand on aura plus de compétitions simultanées */}
        {/* Empty State for filtered results - DISABLED
        {filteredCompetitions.length === 0 && activeFilter !== 'ALL' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p style={{ color: '#6b7088', fontSize: '16px', marginBottom: '16px' }}>
              No competitions available right now.
            </p>
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300"
              style={{
                background: '#ffffff',
                color: '#1a1a2e',
                border: '1px solid #e8e8ec',
              }}
            >
              View All Competitions
            </button>
          </motion.div>
        )}
        */}

        {/* View All Link */}
        {displayedCompetitions.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 md:mt-12 text-center"
          >
            <style>{`
              .view-all-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 14px 28px;
                font-weight: 600;
                font-size: 15px;
                background: #1a1a2e;
                color: #ffffff;
                border-radius: 14px;
                transition: all 0.3s ease;
              }
              .view-all-btn:hover {
                background: #2a2a3e;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(26, 26, 46, 0.3);
              }
            `}</style>
            <Link
              href="/competitions"
              className="view-all-btn group"
            >
              <Sparkles className="h-4 w-4" />
              {t('common.viewCompetitions')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
