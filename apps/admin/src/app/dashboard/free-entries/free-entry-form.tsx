'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { assignFreeEntry } from './actions';

interface Competition {
  id: string;
  title: string;
  totalTickets: number;
  availableTickets: number;
}

interface FreeEntryFormProps {
  competitions: Competition[];
}

export function FreeEntryForm({ competitions }: FreeEntryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ticketNumbers: number[]; title: string } | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const result = await assignFreeEntry(formData);
        setSuccess({
          ticketNumbers: result.ticketNumbers,
          title: result.competitionTitle,
        });
        // Reset form
        const form = document.getElementById('free-entry-form') as HTMLFormElement;
        form?.reset();
        setSelectedCompetition('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  }

  const selectedComp = competitions.find((c) => c.id === selectedCompetition);

  return (
    <form id="free-entry-form" action={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {success.ticketNumbers.length} free entry ticket{success.ticketNumbers.length !== 1 ? 's' : ''} (#{success.ticketNumbers.join(', #')}) assigned for {success.title}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">User Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="user@example.com"
          required
        />
        <p className="text-xs text-muted-foreground">
          User must be registered on the platform
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="competitionId">Competition *</Label>
        <Select
          name="competitionId"
          value={selectedCompetition}
          onValueChange={setSelectedCompetition}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a competition" />
          </SelectTrigger>
          <SelectContent>
            {competitions.map((comp) => (
              <SelectItem
                key={comp.id}
                value={comp.id}
                disabled={comp.availableTickets === 0}
              >
                {comp.title}
                <span className="ml-2 text-muted-foreground text-xs">
                  ({comp.availableTickets} available)
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedComp && (
          <p className="text-xs text-muted-foreground">
            {selectedComp.availableTickets} of {selectedComp.totalTickets} tickets available
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          max="10"
          defaultValue="1"
          required
        />
        <p className="text-xs text-muted-foreground">
          Number of free entry tickets to assign (max 10)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Reference number, date received, etc."
          rows={2}
        />
      </div>

      <Button type="submit" disabled={isPending || !selectedCompetition}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Assigning...
          </>
        ) : (
          'Assign Free Entry'
        )}
      </Button>
    </form>
  );
}
