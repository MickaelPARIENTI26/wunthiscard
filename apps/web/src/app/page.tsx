import { Suspense } from 'react';
import { prisma } from '@winucard/database';
import { ImmersiveHero } from '@/components/home/immersive-hero';
import { LiveCompetitions } from '@/components/home/live-competitions';
import { HowItWorksPreview } from '@/components/home/how-it-works-preview';
import { FAQPreview } from '@/components/home/faq-preview';
import { FinalCTA } from '@/components/home/final-cta';
import { Skeleton } from '@/components/ui/skeleton';

// Revalidate the home page every 60 seconds
export const revalidate = 60;

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

// Loading skeleton components
function CompetitionsSkeleton() {
  return (
    <div className="py-12 md:py-16" style={{ background: '#F7F7FA' }}>
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-8">
          <Skeleton className="h-10 w-64" style={{ background: '#e8e8ec' }} />
        </div>
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-xl" style={{ background: '#e8e8ec' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ background: '#ffffff', border: '1px solid #e8e8ec' }}
            >
              <Skeleton className="aspect-[9/16]" style={{ background: '#f5f5f7', maxHeight: '280px' }} />
              <div className="p-4">
                <Skeleton className="h-6 w-full mb-3" style={{ background: '#f0f0f3' }} />
                <Skeleton className="h-8 w-24 mb-3" style={{ background: '#f0f0f3' }} />
                <Skeleton className="h-2 w-full mb-3" style={{ background: '#f0f0f3' }} />
                <Skeleton className="h-10 w-full" style={{ background: '#f0f0f3' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Server Component for Live Competitions
async function LiveCompetitionsServer() {
  const competitions = await getLiveCompetitions();
  return <LiveCompetitions competitions={competitions} />;
}

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: '#FAFAFA' }}>
      {/* Immersive Hero Section */}
      <ImmersiveHero />

      {/* Live Competitions */}
      <Suspense fallback={<CompetitionsSkeleton />}>
        <LiveCompetitionsServer />
      </Suspense>

      {/* How It Works + Trust Badges */}
      <HowItWorksPreview />

      {/* Common Questions */}
      <FAQPreview />

      {/* Final CTA */}
      <FinalCTA />
    </main>
  );
}
