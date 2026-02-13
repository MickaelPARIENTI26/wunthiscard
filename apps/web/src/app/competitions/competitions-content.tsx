'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CompetitionCard } from '@/components/competition/competition-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

const CATEGORY_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pokemon', label: 'Pokemon' },
  { value: 'one-piece', label: 'One Piece' },
  { value: 'sports', label: 'Sports' },
  { value: 'memorabilia', label: 'Memorabilia' },
  { value: 'other', label: 'Other' },
];

// No "Completed" option - users can see completed competitions on /winners page
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Coming Soon' },
];

const SORT_OPTIONS = [
  { value: 'end-date', label: 'End Date' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
];

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
      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        {/* Category Tabs - Scrollable on mobile */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs
            value={filters.category}
            onValueChange={(value) => updateFilters('category', value)}
          >
            <TabsList className="inline-flex h-auto gap-1 bg-transparent p-0">
              {CATEGORY_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                    'data-[state=inactive]:bg-muted data-[state=inactive]:hover:bg-muted/80'
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Status and Sort Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Select value={filters.status} onValueChange={(value) => updateFilters('status', value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={filters.sort} onValueChange={(value) => updateFilters('sort', value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {competitions.length} of {pagination.totalCount} competitions
        </div>
      </div>

      {/* Competitions Grid */}
      {competitions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {competitions.map((competition) => (
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
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-6xl">🎴</div>
          <h3 className="mb-2 text-lg font-semibold">No competitions found</h3>
          <p className="mb-6 text-muted-foreground">
            Try adjusting your filters to find more competitions
          </p>
          <Button
            variant="outline"
            onClick={() => {
              router.push('/competitions');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
          <Button
            variant="outline"
            size="icon"
            disabled={!pagination.hasPrev}
            onClick={() => handlePageChange(pagination.page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {/* Generate page numbers */}
            {generatePageNumbers(pagination.page, pagination.totalPages).map((pageNum, index) => {
              if (pageNum === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handlePageChange(pageNum as number)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={pageNum === pagination.page ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={!pagination.hasNext}
            onClick={() => handlePageChange(pagination.page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}
