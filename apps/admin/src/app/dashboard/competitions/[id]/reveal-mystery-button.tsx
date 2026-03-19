'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { revealMysteryCard } from '@/app/dashboard/competitions/actions';
import { Loader2, Eye } from 'lucide-react';

interface RevealMysteryButtonProps {
  competitionId: string;
  realTitle: string | null;
  realValue: number | null;
}

export function RevealMysteryButton({ competitionId, realTitle, realValue }: RevealMysteryButtonProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReveal() {
    setIsRevealing(true);
    setError(null);
    try {
      await revealMysteryCard(competitionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reveal mystery card');
      setIsRevealing(false);
    }
  }

  if (!showConfirm) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">Hidden Card Details (Admin Only)</p>
          {realTitle && (
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <span className="font-medium">Real Title:</span> {realTitle}
            </p>
          )}
          {realValue !== null && (
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <span className="font-medium">Real Value:</span> £{realValue.toFixed(2)}
            </p>
          )}
        </div>
        <Button
          onClick={() => setShowConfirm(true)}
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Eye className="mr-2 h-4 w-4" />
          Reveal Card to Public
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive mb-1">Are you sure?</p>
        <p className="text-sm text-muted-foreground">
          This will reveal the real card details to the public. The real value, certification, grade, and images
          will replace the mystery placeholders. This action cannot be undone.
        </p>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2">
        <Button
          onClick={handleReveal}
          disabled={isRevealing}
          variant="destructive"
        >
          {isRevealing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Revealing...
            </>
          ) : (
            'Confirm Reveal'
          )}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          variant="outline"
          disabled={isRevealing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
