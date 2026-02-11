import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CheckoutClient } from './checkout-client';

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
}: {
  params: Promise<PageParams>;
}) {
  const session = await auth();
  const { slug } = await params;

  // Redirect to login if not authenticated
  if (!session?.user) {
    const callbackUrl = '/competitions/' + slug + '/checkout';
    redirect('/login?callbackUrl=' + encodeURIComponent(callbackUrl));
  }

  // Check if email is verified (required for payment)
  if (!session.user.emailVerified) {
    redirect('/email-not-verified?callbackUrl=' + encodeURIComponent('/competitions/' + slug + '/checkout'));
  }

  const competition = await getCompetition(slug);

  if (!competition) {
    notFound();
  }

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
