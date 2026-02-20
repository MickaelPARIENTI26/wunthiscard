import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CheckoutClient } from './checkout-client';
import { GuestCheckoutForm } from './guest-checkout-form';

interface PageParams {
  slug: string;
}

async function getCompetition(slug: string) {
  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      mainImageUrl: true,
      ticketPrice: true,
      status: true,
    },
  });

  if (!competition || competition.status !== 'ACTIVE') {
    return null;
  }

  return {
    ...competition,
    ticketPrice:
      typeof competition.ticketPrice === 'object' && 'toNumber' in competition.ticketPrice
        ? (competition.ticketPrice as { toNumber: () => number }).toNumber()
        : Number(competition.ticketPrice),
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
    title: 'Checkout - ' + competition.title,
    description: 'Complete your ticket purchase for ' + competition.title,
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<{ tickets?: string }>;
}) {
  const session = await auth();
  const { slug } = await params;
  const { tickets } = await searchParams;

  const competition = await getCompetition(slug);

  if (!competition) {
    notFound();
  }

  // Parse ticket count from URL or default to 1
  const ticketCount = tickets ? parseInt(tickets, 10) : 1;

  // If user is authenticated, show the normal checkout flow
  if (session?.user?.id) {
    // For authenticated users, show the existing checkout client
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-lg">
            <CheckoutClient
              competitionId={competition.id}
              competitionSlug={competition.slug}
              competitionTitle={competition.title}
              mainImageUrl={competition.mainImageUrl}
              ticketPrice={competition.ticketPrice}
            />
          </div>
        </div>
      </main>
    );
  }

  // For guest users, show the registration + checkout form
  return (
    <main className="bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <GuestCheckoutForm
            competitionId={competition.id}
            competitionSlug={competition.slug}
            competitionTitle={competition.title}
            mainImageUrl={competition.mainImageUrl}
            ticketPrice={competition.ticketPrice}
            ticketCount={ticketCount > 0 ? ticketCount : 1}
          />
        </div>
      </div>
    </main>
  );
}
