import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatPrice, formatDate, calculateProgress } from '@winthiscard/shared';
import { ExternalLink } from 'lucide-react';
import type { CompetitionStatus } from '@winthiscard/database';

interface Competition {
  id: string;
  slug: string;
  title: string;
  status: CompetitionStatus;
  ticketPrice: { toString(): string };
  totalTickets: number;
  drawDate: Date;
  _count: {
    tickets: number;
  };
}

interface ActiveCompetitionsProps {
  competitions: Competition[];
}

const statusColors: Record<CompetitionStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  DRAFT: 'secondary',
  UPCOMING: 'default',
  ACTIVE: 'success',
  SOLD_OUT: 'warning',
  DRAWING: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
};

export function ActiveCompetitions({ competitions }: ActiveCompetitionsProps) {
  if (competitions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No active competitions
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {competitions.map((competition) => {
        const soldTickets = competition._count.tickets;
        const progress = calculateProgress(soldTickets, competition.totalTickets);

        return (
          <div
            key={competition.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{competition.title}</h4>
                <Badge variant={statusColors[competition.status]}>
                  {competition.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatPrice(Number(competition.ticketPrice))} / ticket</span>
                <span>Draw: {formatDate(competition.drawDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  {soldTickets} / {competition.totalTickets} sold
                </span>
              </div>
            </div>
            <div className="ml-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/competitions/${competition.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
