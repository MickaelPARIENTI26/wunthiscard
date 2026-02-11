'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { Loader2, RefreshCw } from 'lucide-react';
import { voidWinAndAllowRedraw } from './actions';

interface ReDrawButtonProps {
  winId: string;
  competitionId: string;
  competitionTitle: string;
}

export function ReDrawButton({ winId, competitionId, competitionTitle }: ReDrawButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRedraw = async () => {
    setIsLoading(true);
    try {
      const result = await voidWinAndAllowRedraw(winId);
      if (result.success) {
        // Redirect to draw page to run a new draw
        router.push(`/dashboard/competitions/${competitionId}/draw`);
      } else {
        alert(result.error || 'Failed to void win');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Void Win & Run Re-Draw
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void Win and Run Re-Draw?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action will void the current win for &quot;{competitionTitle}&quot; and allow you
              to run a new draw to select a different winner.
            </p>
            <p className="font-medium text-destructive">
              This action cannot be undone. The original winner will be notified that their prize
              has been voided due to non-claim.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRedraw}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Void Win & Re-Draw
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
