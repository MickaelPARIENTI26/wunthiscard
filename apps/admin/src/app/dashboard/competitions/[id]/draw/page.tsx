import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatPrice, formatDate } from '@winthiscard/shared';
import { COMPETITION_CATEGORIES, COMPETITION_STATUSES } from '@winthiscard/shared';
import { ArrowLeft, AlertTriangle, Trophy, Users, Ticket, PoundSterling } from 'lucide-react';
import type { CompetitionStatus } from '@winthiscard/database';
import { DrawClient } from './draw-client';

interface DrawPageProps {
  params: Promise<{ id: string }>;
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

export default async function DrawPage({ params }: DrawPageProps) {
  const session = await auth();
  const { id } = await params;

  // Only SUPER_ADMIN can access this page
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard/competitions/' + id);
  }

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      wins: true,
    },
  });

  if (!competition) {
    notFound();
  }

  // Check if draw already happened
  if (competition.wins.length > 0 || competition.status === 'COMPLETED') {
    redirect('/dashboard/competitions/' + id);
  }

  // Get sold tickets count
  const soldTicketsCount = await prisma.ticket.count({
    where: { competitionId: id, status: 'SOLD' },
  });

  // Get unique participants count
  const uniqueParticipants = await prisma.ticket.groupBy({
    by: ['userId'],
    where: { competitionId: id, status: 'SOLD', userId: { not: null } },
    _count: true,
  });

  // Get total revenue
  const totalRevenue = await prisma.order.aggregate({
    where: { competitionId: id, paymentStatus: 'SUCCEEDED' },
    _sum: { totalAmount: true },
  });

  // Get all sold ticket numbers for the draw
  const soldTickets = await prisma.ticket.findMany({
    where: { competitionId: id, status: 'SOLD' },
    select: { ticketNumber: true, userId: true },
  });

  // Check if competition is eligible for draw
  // Note: COMPLETED status is already handled by redirect above
  const drawDatePassed = new Date(competition.drawDate) <= new Date();
  const isEligible =
    competition.status !== 'CANCELLED' &&
    competition.status !== 'DRAFT' &&
    competition.status !== 'UPCOMING' &&
    (competition.status === 'SOLD_OUT' || competition.status === 'ACTIVE' || competition.status === 'DRAWING') &&
    (competition.status === 'SOLD_OUT' || drawDatePassed);

  if (!isEligible) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/competitions/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Execute Draw</h1>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Eligible for Draw</AlertTitle>
          <AlertDescription>
            This competition is not eligible for a draw. It must be SOLD_OUT or past the draw date.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (soldTicketsCount === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/competitions/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Execute Draw</h1>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Tickets Sold</AlertTitle>
          <AlertDescription>
            This competition has no sold tickets. A draw cannot be executed without participants.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/competitions/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Execute Draw</h1>
          <p className="text-muted-foreground">{competition.title}</p>
        </div>
      </div>

      {/* Competition Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={competition.mainImageUrl}
                alt={competition.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle>{competition.title}</CardTitle>
                <Badge variant={statusColors[competition.status]}>
                  {COMPETITION_STATUSES[competition.status].label}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {COMPETITION_CATEGORIES[competition.category]}
                {competition.subcategory && ` • ${competition.subcategory}`}
              </CardDescription>
              <p className="mt-2 text-2xl font-bold text-primary">
                {formatPrice(Number(competition.prizeValue))}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldTicketsCount}</div>
            <p className="text-xs text-muted-foreground">
              of {competition.totalTickets} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueParticipants.length}</div>
            <p className="text-xs text-muted-foreground">unique users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(Number(totalRevenue._sum.totalAmount ?? 0))}
            </div>
            <p className="text-xs text-muted-foreground">from this competition</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draw Date</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(competition.drawDate)}</div>
            <p className="text-xs text-muted-foreground">
              {drawDatePassed ? 'Date has passed' : 'Scheduled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Draw Execution */}
      <DrawClient
        competitionId={competition.id}
        competitionTitle={competition.title}
        soldTickets={soldTickets.map((t) => t.ticketNumber)}
        adminId={session.user.id}
      />
    </div>
  );
}
