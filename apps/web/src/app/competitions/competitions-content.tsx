'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CompetitionCard } from '@/components/competition/competition-card';

interface Competition {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  mainImageUrl: string;
  category: string;
  status: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number;
  drawDate: Date;
  soldTickets: number;
}

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  category: string;
  status: string;
  sort: string;
}

interface CompetitionsContentProps {
  competitions: Competition[];
  pagination: Pagination;
  filters: Filters;
}

// TODO: Réactiver les filtres quand on aura plus de compétitions simultanées
// Category filters with emojis
// const CATEGORY_FILTERS = [
//   { value: 'all', label: 'All', emoji: '✨' },
//   { value: 'pokemon', label: 'Pokemon', emoji: '🔥' },
//   { value: 'one-piece', label: 'One Piece', emoji: '🏴‍☠️' },
//   { value: 'sports', label: 'Sports', emoji: '⚽' },
//   { value: 'memorabilia', label: 'Memorabilia', emoji: '🏆' },
//   { value: 'other', label: 'Other', emoji: '🎴' },
// ];

// Status filters
// const STATUS_FILTERS = [
//   { value: 'all', label: 'All' },
//   { value: 'live', label: 'Live' },
//   { value: 'ending-soon', label: 'Ending Soon' },
//   { value: 'coming-soon', label: 'Coming Soon' },
// ];

export function CompetitionsContent({
  competitions,
  pagination,
  filters,
}: CompetitionsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all' && key !== 'sort') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset to page 1 when filters change
      if (key !== 'page') {
        params.delete('page');
      }
      router.push(`/competitions?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateFilters('page', String(newPage));
    },
    [updateFilters]
  );

  return (
    <div>
      {/* TODO: Réactiver les filtres quand on aura plus de compétitions simultanées */}
      {/* Category Filters - DISABLED
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = filters.category === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => updateFilters('category', filter.value)}
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
      </div>
      */}

      {/* Status Filters - DISABLED
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {STATUS_FILTERS.map((filter) => {
          const isActive = filters.status === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => updateFilters('status', filter.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              style={{
                background: isActive ? 'rgba(240, 185, 11, 0.1)' : 'transparent',
                color: isActive ? '#E8A000' : '#6b7088',
                border: `1px solid ${isActive ? 'rgba(240, 185, 11, 0.3)' : 'transparent'}`,
              }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      */}

      {/* Results count */}
      <div className="text-center mb-8" style={{ color: '#6b7088', fontSize: '14px' }}>
        Showing {competitions.length} of {pagination.totalCount} competitions
      </div>

      {/* Competitions Grid */}
      {competitions.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((competition, index) => (
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
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-6xl">🎴</div>
          <h3 className="mb-2 text-lg font-semibold" style={{ color: '#1a1a2e' }}>
            No competitions found
          </h3>
          <p className="mb-6" style={{ color: '#6b7088' }}>
            Try adjusting your filters to find more competitions
          </p>
          <button
            onClick={() => router.push('/competitions')}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
            style={{
              background: '#ffffff',
              color: '#1a1a2e',
              border: '1px solid #e8e8ec',
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => handlePageChange(pagination.page - 1)}
            aria-label="Previous page"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300"
            style={{
              background: '#ffffff',
              border: '1px solid #e8e8ec',
              color: pagination.hasPrev ? '#1a1a2e' : '#d0d0d4',
              cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {generatePageNumbers(pagination.page, pagination.totalPages).map((pageNum, index) => {
              if (pageNum === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-10 w-10 items-center justify-center"
                    style={{ color: '#6b7088' }}
                  >
                    ...
                  </span>
                );
              }
              const isCurrentPage = pageNum === pagination.page;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum as number)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                  className="flex items-center justify-center w-10 h-10 rounded-xl font-medium transition-all duration-300"
                  style={{
                    background: isCurrentPage ? '#1a1a2e' : '#ffffff',
                    color: isCurrentPage ? '#ffffff' : '#1a1a2e',
                    border: isCurrentPage ? 'none' : '1px solid #e8e8ec',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            disabled={!pagination.hasNext}
            onClick={() => handlePageChange(pagination.page + 1)}
            aria-label="Next page"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300"
            style={{
              background: '#ffffff',
              border: '1px solid #e8e8ec',
              color: pagination.hasNext ? '#1a1a2e' : '#d0d0d4',
              cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
  }

  return pages;
}
