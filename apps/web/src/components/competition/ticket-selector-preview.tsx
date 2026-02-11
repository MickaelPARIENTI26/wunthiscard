'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TicketSelectorPreviewProps {
  totalTickets: number;
  soldTicketNumbers: number[];
  isActive: boolean;
  className?: string;
}

export function TicketSelectorPreview({
  totalTickets,
  soldTicketNumbers,
  isActive,
  className,
}: TicketSelectorPreviewProps) {
  const [searchNumber, setSearchNumber] = useState('');
  const [visibleRows, setVisibleRows] = useState(3);

  const soldSet = useMemo(() => new Set(soldTicketNumbers), [soldTicketNumbers]);

  const TICKETS_PER_ROW = 10;
  const totalRows = Math.ceil(totalTickets / TICKETS_PER_ROW);
  const rowsToShow = Math.min(visibleRows, totalRows);

  const handleSearch = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    setSearchNumber(numericValue);

    if (numericValue) {
      const ticketNum = parseInt(numericValue, 10);
      if (ticketNum > 0 && ticketNum <= totalTickets) {
        // Calculate which row this ticket is in and show that row
        const targetRow = Math.ceil(ticketNum / TICKETS_PER_ROW);
        if (targetRow > visibleRows) {
          setVisibleRows(targetRow);
        }
      }
    }
  };

  const searchedTicket = searchNumber ? parseInt(searchNumber, 10) : null;
  const isSearchedTicketValid =
    searchedTicket !== null && searchedTicket > 0 && searchedTicket <= totalTickets;
  const isSearchedTicketSold = isSearchedTicketValid && soldSet.has(searchedTicket);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Your Tickets</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-gray-300" />
            <span className="text-muted-foreground">Sold</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Search for a lucky number..."
          value={searchNumber}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
          disabled={!isActive}
        />
        {searchNumber && isSearchedTicketValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isSearchedTicketSold ? (
              <span className="text-sm text-destructive">Sold</span>
            ) : (
              <span className="text-sm text-green-600">Available</span>
            )}
          </div>
        )}
        {searchNumber && !isSearchedTicketValid && searchNumber !== '' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-sm text-destructive">Invalid number</span>
          </div>
        )}
      </div>

      {/* Ticket Grid */}
      <div className="rounded-lg border bg-muted/30 p-2 sm:p-3 overflow-hidden">
        <div className="grid grid-cols-5 xs:grid-cols-8 sm:grid-cols-10 gap-1">
          {Array.from({ length: rowsToShow * TICKETS_PER_ROW }, (_, i) => {
            const ticketNumber = i + 1;
            if (ticketNumber > totalTickets) return null;

            const isSold = soldSet.has(ticketNumber);
            const isHighlighted = searchedTicket === ticketNumber;

            return (
              <button
                key={ticketNumber}
                disabled={!isActive || isSold}
                className={cn(
                  'aspect-square rounded text-xs font-medium transition-all',
                  'flex items-center justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  isSold
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    : isActive
                      ? 'cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                      : 'cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
                  isHighlighted && 'ring-2 ring-primary ring-offset-1'
                )}
                title={`Ticket #${ticketNumber}${isSold ? ' (Sold)' : ''}`}
                aria-label={`Ticket number ${ticketNumber}${isSold ? ', sold' : ', available'}`}
              >
                {ticketNumber}
              </button>
            );
          })}
        </div>

        {/* Show More Button */}
        {rowsToShow < totalRows && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleRows((prev) => Math.min(prev + 5, totalRows))}
            >
              Show More Tickets
            </Button>
          </div>
        )}
      </div>

      {/* Functional Notice */}
      {isActive && (
        <p className="text-center text-sm text-muted-foreground">
          Full ticket selection available in checkout
        </p>
      )}

      {!isActive && (
        <p className="text-center text-sm text-muted-foreground">
          Ticket selection is not available for this competition
        </p>
      )}
    </div>
  );
}
