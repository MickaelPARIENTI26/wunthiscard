import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CompetitionForm } from '@/components/competitions/competition-form';

interface EditCompetitionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCompetitionPage({ params }: EditCompetitionPageProps) {
  const { id } = await params;

  const competition = await prisma.competition.findUnique({
    where: { id },
  });

  if (!competition) {
    notFound();
  }

  // Convert Decimal fields to numbers for client component serialization
  const serializedCompetition = {
    ...competition,
    prizeValue: Number(competition.prizeValue),
    ticketPrice: Number(competition.ticketPrice),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Competition</h1>
        <p className="text-muted-foreground">
          Update competition details
        </p>
      </div>

      <CompetitionForm competition={serializedCompetition} />
    </div>
  );
}
