import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Calendar, ArrowRight, Trophy } from 'lucide-react';

export const metadata = {
  title: 'My Tickets | WinThisCard',
  description: 'View all your competition entries and ticket numbers',
};

type CompetitionStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'ACTIVE'
  | 'SOLD_OUT'
  | 'DRAWING'
  | 'COMPLETED'
  | 'CANCELLED';

function getStatusBadge(status: CompetitionStatus) {
  const statusConfig: Record<
    CompetitionStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }
  > = {
    DRAFT: { label: 'Draft', variant: 'secondary' },
    UPCOMING: { label: 'Upcoming', variant: 'outline' },
    ACTIVE: { label: 'Active', variant: 'success' },
    SOLD_OUT: { label: 'Sold Out', variant: 'warning' },
    DRAWING: { label: 'Drawing', variant: 'default' },
    COMPLETED: { label: 'Completed', variant: 'secondary' },
    CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function MyTicketsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-tickets');
  }

  // Get all tickets for the user, grouped by competition
  const tickets = await prisma.ticket.findMany({
    where: {
      userId: session.user.id,
      status: 'SOLD',
    },
    include: {
      competition: {
        select: {
          id: true,
          slug: true,
          title: true,
          mainImageUrl: true,
          status: true,
          drawDate: true,
          prizeValue: true,
          winningTicketNumber: true,
        },
      },
    },
    orderBy: {
      competition: {
        drawDate: 'desc',
      },
    },
  });

  // Get user's wins to mark winning tickets
  const userWins = await prisma.win.findMany({
    where: { userId: session.user.id },
    select: { competitionId: true, ticketNumber: true },
  });
  const winsMap = new Map(userWins.map((w) => [w.competitionId, w.ticketNumber]));

  // Group tickets by competition
  const competitionTickets = tickets.reduce<
    Record<
      string,
      {
        competition: (typeof tickets)[0]['competition'];
        ticketNumbers: number[];
      }
    >
  >((acc, ticket) => {
    const compId = ticket.competitionId;
    if (!acc[compId]) {
      acc[compId] = {
        competition: ticket.competition,
        ticketNumbers: [],
      };
    }
    acc[compId].ticketNumbers.push(ticket.ticketNumber);
    return acc;
  }, {});

  const entries = Object.values(competitionTickets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">My Tickets</h1>
        <p className="mt-1 text-muted-foreground">
          View all your competition entries
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No tickets yet</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">
              You have not entered any competitions yet. Browse our live competitions and get your tickets!
            </p>
            <Button asChild>
              <Link href="/competitions">
                Browse Competitions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map(({ competition, ticketNumbers }) => {
            const winningTicket = winsMap.get(competition.id);
            const isWinner = winningTicket !== undefined;

            return (
              <Card key={competition.id} className={`overflow-hidden ${isWinner ? 'border-2 border-yellow-400' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Competition image */}
                    <div className="relative aspect-video w-full sm:aspect-square sm:w-40">
                      <Image
                        src={competition.mainImageUrl}
                        alt={competition.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 160px"
                      />
                      {isWinner && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Trophy className="h-10 w-10 text-yellow-400" />
                        </div>
                      )}
                    </div>

                    {/* Competition details */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {isWinner && (
                            <Badge variant="success" className="gap-1 bg-yellow-400 text-yellow-900">
                              <Trophy className="h-3 w-3" />
                              Winner!
                            </Badge>
                          )}
                          {getStatusBadge(competition.status as CompetitionStatus)}
                          <span className="text-sm font-medium text-primary">
                            {Number(competition.prizeValue).toLocaleString('en-GB', {
                              style: 'currency',
                              currency: 'GBP',
                            })}
                          </span>
                        </div>
                        <Link
                          href={`/competitions/${competition.slug}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {competition.title}
                        </Link>
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Draw: {formatDate(competition.drawDate)}</span>
                        </div>
                        {competition.status === 'COMPLETED' && competition.winningTicketNumber && !isWinner && (
                          <div className="mt-2 rounded-md bg-muted px-3 py-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Better luck next time!
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Winning ticket: #{competition.winningTicketNumber}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Ticket numbers */}
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium">
                          Your Tickets ({ticketNumbers.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {ticketNumbers.sort((a, b) => a - b).map((num) => (
                            <span
                              key={num}
                              className={`inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-sm font-medium ${
                                num === winningTicket
                                  ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-500'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              #{num}
                              {num === winningTicket && <Trophy className="ml-1 h-3 w-3" />}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
