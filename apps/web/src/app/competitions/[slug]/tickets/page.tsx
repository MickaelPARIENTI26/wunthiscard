import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TicketSelector } from './ticket-selector';

interface PageParams {
  slug: string;
}

async function getCompetition(slug: string) {
  const now = new Date();

  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      mainImageUrl: true,
      ticketPrice: true,
      totalTickets: true,
      maxTicketsPerUser: true,
      status: true,
      questionText: true,
      questionChoices: true,
      _count: {
        select: {
          tickets: {
            where: {
              OR: [
                // Sold or free entry tickets
                { status: { in: ['SOLD', 'FREE_ENTRY'] } },
                // Reserved tickets that haven't expired yet
                {
                  status: 'RESERVED',
                  reservedUntil: { gt: now },
                },
              ],
            },
          },
        },
      },
    },
  });

  if (!competition) return null;

  // Only allow ticket selection for ACTIVE competitions
  if (competition.status !== 'ACTIVE') {
    return null;
  }

  const unavailableCount = competition._count.tickets;
  const availableTicketCount = (competition.totalTickets ?? 0) - unavailableCount;

  return {
    id: competition.id,
    slug: competition.slug,
    title: competition.title,
    mainImageUrl: competition.mainImageUrl,
    ticketPrice:
      typeof competition.ticketPrice === 'object' && 'toNumber' in competition.ticketPrice
        ? (competition.ticketPrice as { toNumber: () => number }).toNumber()
        : Number(competition.ticketPrice),
    totalTickets: competition.totalTickets,
    maxTicketsPerUser: competition.maxTicketsPerUser,
    availableTicketCount,
    questionText: competition.questionText,
    questionChoices: competition.questionChoices as string[],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);

  if (!competition) {
    return {
      title: 'Competition Not Found',
    };
  }

  return {
    title: `Select Tickets - ${competition.title}`,
    description: `Select your tickets for ${competition.title}`,
  };
}

export default async function TicketSelectionPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const session = await auth();
  const { slug } = await params;

  const competition = await getCompetition(slug);

  if (!competition) {
    notFound();
  }

  // Get user's existing ticket count for this competition (only if logged in)
  let userTicketCount = 0;
  if (session?.user) {
    userTicketCount = await prisma.ticket.count({
      where: {
        competitionId: competition.id,
        userId: session.user.id,
        status: {
          in: ['SOLD', 'FREE_ENTRY'],
        },
      },
    });
  }

  return (
    <main className="min-h-screen pb-36 lg:pb-8">
      {/* Back link */}
      <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: '1440px', padding: '12px 32px' }}>
        <Link href={`/competitions/${slug}`} className="drop-back-link">
          <ChevronLeft className="h-4 w-4" />
          Back to Competition
        </Link>
      </div>

      <div className="drop-section" style={{ paddingTop: '16px' }}>
        <div className="text-center mb-12">
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-0.04em', margin: '0 0 12px' }}>
            Select Your Tickets
          </h1>
          <p style={{ color: 'var(--ink-dim)', fontSize: '16px' }}>
            How many tickets do you want for <b>{competition.title}</b>?
          </p>
        </div>

        <Suspense fallback={<TicketSelectorSkeleton />}>
          <TicketSelector
            competitionId={competition.id}
            competitionSlug={competition.slug}
            competitionTitle={competition.title}
            competitionImageUrl={competition.mainImageUrl}
            ticketPrice={competition.ticketPrice}
            totalTickets={competition.totalTickets ?? 0}
            maxTicketsPerUser={competition.maxTicketsPerUser}
            availableTicketCount={competition.availableTicketCount}
            userTicketCount={userTicketCount}
          />
        </Suspense>
      </div>
    </main>
  );
}

function TicketSelectorSkeleton() {
  return (
    <>
      {/* Desktop skeleton */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-8 animate-pulse">
        <div className="lg:col-span-3 space-y-6">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
      {/* Mobile skeleton */}
      <div className="lg:hidden space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-14 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
      </div>
    </>
  );
}
