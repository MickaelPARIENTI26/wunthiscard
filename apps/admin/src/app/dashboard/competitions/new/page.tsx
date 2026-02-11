import { CompetitionForm } from '@/components/competitions/competition-form';

export default function NewCompetitionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Competition</h1>
        <p className="text-muted-foreground">
          Create a new prize competition
        </p>
      </div>

      <CompetitionForm />
    </div>
  );
}
