import { Suspense } from 'react';
import { prisma } from '@winucard/database';
import { HeroSection } from '@/components/home/hero-section';
import { LiveCompetitions } from '@/components/home/live-competitions';
import { ComingSoon as _ComingSoon } from '@/components/home/coming-soon';
import { RecentWinners as _RecentWinners } from '@/components/home/recent-winners';
import { HowItWorksPreview } from '@/components/home/how-it-works-preview';
import { FinalCTA } from '@/components/home/final-cta';
import { Skeleton } from '@/components/ui/skeleton';

// Revalidate the home page every 60 seconds
export const revalidate = 60;

// Fetch featured competition
// Priority: 1. Explicitly featured competition (isFeatured = true)
//           2. Fallback: active competition with highest prize value
async function getFeaturedCompetition() {
  // First, try to find an explicitly featured competition
  let competition = await prisma.competition.findFirst({
    where: {
      status: 'ACTIVE',
      isFeatured: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      mainImageUrl: true,
      prizeValue: true,
      drawDate: true,
      category: true,
    },
  });

  // Fallback: get the active competition with highest prize value
  if (!competition) {
    competition = await prisma.competition.findFirst({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [
        { prizeValue: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        mainImageUrl: true,
        prizeValue: true,
        drawDate: true,
        category: true,
      },
    });
  }

  if (!competition) return null;

  return {
    ...competition,
    prizeValue: Number(competition.prizeValue),
  };
}

// Fetch live competitions (ACTIVE status)
async function getLiveCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: {
      status: 'ACTIVE',
    },
    orderBy: {
      drawDate: 'asc',
    },
    take: 6,
    select: {
      id: true,
      slug: true,
      title: true,
      mainImageUrl: true,
      category: true,
      prizeValue: true,
      ticketPrice: true,
      totalTickets: true,
      drawDate: true,
      status: true,
      _count: {
        select: {
          tickets: {
            where: {
              status: 'SOLD',
            },
          },
        },
      },
    },
  });

  return competitions.map((comp) => ({
    id: comp.id,
    slug: comp.slug,
    title: comp.title,
    mainImageUrl: comp.mainImageUrl,
    category: comp.category,
    prizeValue: Number(comp.prizeValue),
    ticketPrice: Number(comp.ticketPrice),
    totalTickets: comp.totalTickets,
    soldTickets: comp._count.tickets,
    drawDate: comp.drawDate,
    status: comp.status,
  }));
}

// Fetch upcoming competitions (UPCOMING status)
async function getUpcomingCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: {
      status: 'UPCOMING',
    },
    orderBy: {
      saleStartDate: 'asc',
    },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      mainImageUrl: true,
      category: true,
      prizeValue: true,
      ticketPrice: true,
      saleStartDate: true,
    },
  });

  return competitions
    .filter((comp) => comp.saleStartDate !== null)
    .map((comp) => ({
      id: comp.id,
      slug: comp.slug,
      title: comp.title,
      mainImageUrl: comp.mainImageUrl,
      category: comp.category,
      prizeValue: Number(comp.prizeValue),
      ticketPrice: Number(comp.ticketPrice),
      saleStartDate: comp.saleStartDate as Date,
    }));
}

// Fetch recent winners
async function getRecentWinners() {
  const wins = await prisma.win.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
    include: {
      competition: {
        select: {
          title: true,
          slug: true,
          mainImageUrl: true,
          prizeValue: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return wins.map((win) => ({
    id: win.id,
    competitionTitle: win.competition.title,
    competitionSlug: win.competition.slug,
    prizeImageUrl: win.competition.mainImageUrl,
    prizeValue: Number(win.competition.prizeValue),
    winnerFirstName: win.user?.firstName ?? 'Lucky',
    winnerLastName: win.user?.lastName ?? 'Winner',
    wonAt: win.createdAt,
  }));
}

// Loading skeleton components
function HeroSkeleton() {
  return (
    <div className="min-h-[70vh] flex items-center bg-muted/30">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-16 w-3/4 mb-6" />
          <Skeleton className="h-24 w-48 mb-8" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitionsSkeleton() {
  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4">
                <Skeleton className="h-6 w-full mb-3" />
                <Skeleton className="h-8 w-24 mb-3" />
                <Skeleton className="h-2 w-full mb-3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Server Component for Hero
async function HeroSectionServer() {
  const featuredCompetition = await getFeaturedCompetition();
  return <HeroSection featuredCompetition={featuredCompetition} />;
}

// Server Component for Live Competitions
async function LiveCompetitionsServer() {
  const competitions = await getLiveCompetitions();
  return <LiveCompetitions competitions={competitions} />;
}

// Server Component for Coming Soon (hidden, kept for future use)
async function _ComingSoonServer() {
  const competitions = await getUpcomingCompetitions();
  return <_ComingSoon competitions={competitions} />;
}

// Server Component for Recent Winners (hidden, kept for future use)
async function _RecentWinnersServer() {
  const winners = await getRecentWinners();
  return <_RecentWinners winners={winners} />;
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSectionServer />
      </Suspense>

      {/* Live Competitions */}
      <Suspense fallback={<CompetitionsSkeleton />}>
        <LiveCompetitionsServer />
      </Suspense>

      {/* How It Works */}
      <HowItWorksPreview />

      {/* Final CTA */}
      <FinalCTA />
    </main>
  );
}
