'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, ChevronDown, Users, Ticket, Loader2 } from 'lucide-react';
import { formatPrice } from '@winucard/shared';

interface ParticipantsExportProps {
  competitionId: string;
  stats: {
    uniqueParticipants: number;
    totalTickets: number;
    paidTickets: number;
    freeTickets: number;
    bonusTickets: number;
    totalRevenue: number;
    ticketMin: number | null;
    ticketMax: number | null;
  };
}

export function ParticipantsExport({ competitionId, stats }: ParticipantsExportProps) {
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);

  async function handleExport(type: 'detailed' | 'summary', format: 'csv' | 'xlsx') {
    const setter = type === 'detailed' ? setLoadingDetail : setLoadingSummary;
    setter(format);

    try {
      const params = new URLSearchParams({
        competitionId,
        format,
        type,
      });

      const response = await fetch(`/api/export/participants?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `export.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setter(null);
    }
  }

  const isDetailLoading = loadingDetail !== null;
  const isSummaryLoading = loadingSummary !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDetailLoading || stats.totalTickets === 0}>
                  {isDetailLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export Participants
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('detailed', 'csv')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('detailed', 'xlsx')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download Excel (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isSummaryLoading || stats.totalTickets === 0}>
                  {isSummaryLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export Summary
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('summary', 'csv')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('summary', 'xlsx')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download Excel (.xlsx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats.totalTickets === 0 ? (
          <p className="text-sm text-muted-foreground">No participants yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Unique Participants</p>
              <p className="text-xl font-bold">{stats.uniqueParticipants}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-xl font-bold">{stats.totalTickets}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid Tickets</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <Ticket className="h-4 w-4 text-primary" />
                {stats.paidTickets}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Free Tickets</p>
              <p className="text-xl font-bold">{stats.freeTickets}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bonus Tickets</p>
              <p className="text-xl font-bold">{stats.bonusTickets}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">{formatPrice(stats.totalRevenue)}</p>
            </div>
            {stats.ticketMin !== null && stats.ticketMax !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Ticket Range</p>
                <p className="text-xl font-bold">#{stats.ticketMin} — #{stats.ticketMax}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
