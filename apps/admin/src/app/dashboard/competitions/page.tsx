import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { CompetitionsTable } from '@/components/competitions/competitions-table';

async function getCompetitions() {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          tickets: { where: { status: 'SOLD' } },
          orders: { where: { paymentStatus: 'SUCCEEDED' } },
        },
      },
    },
  });
  return competitions;
}

async function CompetitionsList() {
  const competitions = await getCompetitions();

  // Serialize Decimal fields for client component
  const serializedCompetitions = competitions.map((comp) => ({
    ...comp,
    prizeValue: Number(comp.prizeValue),
    ticketPrice: Number(comp.ticketPrice),
  }));

  return <CompetitionsTable data={serializedCompetitions} />;
}

export default function CompetitionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitions</h1>
          <p className="text-muted-foreground">
            Manage your prize competitions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/competitions/new">
            <Plus className="mr-2 h-4 w-4" />
            New Competition
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <CompetitionsList />
      </Suspense>
    </div>
  );
}
