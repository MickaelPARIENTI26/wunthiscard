'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WinnersPaginationProps {
  currentPage: number;
  totalPages: number;
  category?: string;
}

export function WinnersPagination({
  currentPage,
  totalPages,
  category,
}: WinnersPaginationProps) {
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (page > 1) params.set('page', page.toString());
    const queryString = params.toString();
    return `/winners${queryString ? `?${queryString}` : ''}`;
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
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
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <Link
        href={getPageUrl(currentPage - 1)}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm transition-colors',
          currentPage === 1
            ? 'pointer-events-none border-muted text-muted-foreground opacity-50'
            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
        )}
        aria-label="Go to previous page"
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-10 w-10 items-center justify-center text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              )}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Next Button */}
      <Link
        href={getPageUrl(currentPage + 1)}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm transition-colors',
          currentPage === totalPages
            ? 'pointer-events-none border-muted text-muted-foreground opacity-50'
            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
        )}
        aria-label="Go to next page"
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
