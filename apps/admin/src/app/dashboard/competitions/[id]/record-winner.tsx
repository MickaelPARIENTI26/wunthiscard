'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trophy, CheckCircle2 } from 'lucide-react';
import { recordWinner } from '../actions';

interface RecordWinnerProps {
  competitionId: string;
}

export function RecordWinner({ competitionId }: RecordWinnerProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const ticketNumber = Number(value);
  const isValid = value.trim() !== '' && Number.isInteger(ticketNumber) && ticketNumber >= 1;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        await recordWinner(competitionId, ticketNumber);
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record winner.');
      }
    });
  };

  return (
    <Card className="border-amber-500 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" />
          Record winner (external draw)
        </CardTitle>
        <CardDescription>
          Enter the winning ticket number produced by the external draw company. This records the
          winner and notifies them by email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Winner recorded ✓</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="winning-ticket" className="text-sm font-medium">
                Winning ticket number
              </label>
              <Input
                id="winning-ticket"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                placeholder="e.g. 1234"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                disabled={isPending}
                className="max-w-xs"
              />
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!isValid || isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trophy className="mr-2 h-4 w-4" />
                  )}
                  Record winner
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Record ticket #{ticketNumber} as the winner?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This marks the competition as completed, records the winner for ticket #
                    {ticketNumber}, and sends the winner a notification email. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Record winner
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
