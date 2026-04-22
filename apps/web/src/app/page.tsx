import { Suspense } from 'react';
import { prisma } from '@winucard/database';
import { HomeHero } from '@/components/home/home-hero';
import { TrustStrip } from '@/components/home/trust-strip';
import { HomeLiveComps } from '@/components/home/home-live-comps';
import { HomeHowItWorks } from '@/components/home/home-how-it-works';
import { HomeFAQPreview } from '@/components/home/home-faq-preview';
import { HomeCTABand } from '@/components/home/home-cta-band';

export const revalidate = 60;

async function getLiveCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: { status: 'ACTIVE', drawDate: { gt: new Date() } },
    orderBy: { drawDate: 'asc' },
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
          tickets: { where: { status: 'SOLD' } },
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

async function HomeContent() {
  const competitions = await getLiveCompetitions();
  return (
    <>
      <HomeHero competitions={competitions} />
      <TrustStrip />
      <HomeLiveComps competitions={competitions} />
    </>
  );
}

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <HomeContent />
      </Suspense>
      <HomeHowItWorks />
      <HomeFAQPreview />
      <HomeCTABand />
    </main>
  );
}
