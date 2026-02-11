import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { QuestionForm } from './question-form';

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
      questionText: true,
      questionChoices: true,
      // Note: questionAnswer is NOT selected - validation is server-side only
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
    title: `Skill Question - ${competition.title}`,
    description: `Answer the skill question to proceed with your ticket purchase for ${competition.title}`,
  };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;

  const competition = await getCompetition(slug);

  if (!competition) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Back Navigation */}
        <Link
          href={`/competitions/${slug}/tickets`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Ticket Selection
        </Link>

        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">Skill Question</h1>
            <p className="mt-2 text-muted-foreground">
              As required by UK law, please answer the following skill-based question to proceed.
            </p>
          </div>

          <QuestionForm
            competitionId={competition.id}
            competitionSlug={competition.slug}
            competitionTitle={competition.title}
            questionText={competition.questionText}
            questionChoices={competition.questionChoices}
            ticketPrice={competition.ticketPrice}
          />
        </div>
      </div>
    </main>
  );
}
