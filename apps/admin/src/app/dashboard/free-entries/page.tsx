import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FreeEntryForm } from './free-entry-form';
import { RecentFreeEntries } from './recent-entries';

async function getActiveCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: {
      status: { in: ['ACTIVE', 'SOLD_OUT'] },
    },
    select: {
      id: true,
      title: true,
      totalTickets: true,
      _count: {
        select: {
          tickets: {
            where: { status: { in: ['SOLD', 'FREE_ENTRY', 'RESERVED'] } },
          },
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  return competitions.map((c) => ({
    ...c,
    availableTickets: c.totalTickets - c._count.tickets,
  }));
}

async function getRecentFreeEntries() {
  const entries = await prisma.ticket.findMany({
    where: { isFreeEntry: true },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
      user: { select: { email: true, firstName: true, lastName: true } },
      competition: { select: { title: true } },
    },
    orderBy: { id: 'desc' },
    take: 20,
  });

  return entries;
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export default async function FreeEntriesPage() {
  const [competitions, recentEntries] = await Promise.all([
    getActiveCompetitions(),
    getRecentFreeEntries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Free Entries (Postal)</h1>
        <p className="text-muted-foreground">
          Manually assign free entry tickets for postal requests (UK compliance)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Free Entry</CardTitle>
            <CardDescription>
              Assign a free ticket for a valid postal entry request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormSkeleton />}>
              <FreeEntryForm competitions={competitions} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Free Entries</CardTitle>
            <CardDescription>
              Last 20 postal entry tickets assigned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<FormSkeleton />}>
              <RecentFreeEntries entries={recentEntries} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
