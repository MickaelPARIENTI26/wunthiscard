'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Dices, CheckCircle2, AlertTriangle, PartyPopper, Mail, User } from 'lucide-react';
import { executeDraw } from './actions';

interface DrawClientProps {
  competitionId: string;
  competitionTitle: string;
  soldTickets: number[];
  adminId: string;
}

type DrawState = 'idle' | 'animating' | 'result' | 'confirming' | 'saving' | 'complete' | 'error';

export function DrawClient({
  competitionId,
  competitionTitle,
  soldTickets,
  adminId,
}: DrawClientProps) {
  const router = useRouter();
  const [state, setState] = useState<DrawState>('idle');
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [winner, setWinner] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Cryptographically secure random number selection
  const selectRandomTicket = useCallback((): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const randomValue = array[0] ?? 0;
    const index = randomValue % soldTickets.length;
    return soldTickets[index] ?? soldTickets[0] ?? 1;
  }, [soldTickets]);

  // Animation effect
  useEffect(() => {
    if (state !== 'animating') return;

    let animationCount = 0;
    const totalAnimations = 30; // Number of "spins"
    const baseInterval = 50; // Starting speed (ms)

    const animate = () => {
      if (animationCount >= totalAnimations) {
        // Animation complete, show final number
        const finalNumber = selectRandomTicket();
        setWinningNumber(finalNumber);
        setDisplayNumber(finalNumber);
        setState('result');
        return;
      }

      // Show random number during animation
      const randomIndex = Math.floor(Math.random() * soldTickets.length);
      setDisplayNumber(soldTickets[randomIndex] ?? null);
      animationCount++;

      // Slow down as we approach the end
      const slowdownFactor = 1 + (animationCount / totalAnimations) * 3;
      const interval = baseInterval * slowdownFactor;

      setTimeout(animate, interval);
    };

    animate();
  }, [state, soldTickets, selectRandomTicket]);

  const handleStartDraw = () => {
    setError(null);
    setWinningNumber(null);
    setWinner(null);
    setState('animating');
  };

  const handleConfirm = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDraw = async () => {
    if (!winningNumber) return;

    setShowConfirmDialog(false);
    setState('saving');

    try {
      const result = await executeDraw({
        competitionId,
        winningTicketNumber: winningNumber,
        adminId,
      });

      if (result.success) {
        setWinner(result.winner ?? null);
        setState('complete');
      } else {
        setError(result.error ?? 'Failed to save draw result');
        setState('error');
      }
    } catch {
      setError('An unexpected error occurred');
      setState('error');
    }
  };

  const handleRedraw = () => {
    setState('idle');
    setDisplayNumber(null);
    setWinningNumber(null);
    setWinner(null);
    setError(null);
  };

  return (
    <>
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Draw Execution</CardTitle>
          <CardDescription>
            {state === 'idle' && 'Click the button below to randomly select a winning ticket'}
            {state === 'animating' && 'Selecting a winner...'}
            {state === 'result' && 'Winning ticket selected! Please confirm to save the result.'}
            {state === 'saving' && 'Saving draw result...'}
            {state === 'complete' && 'Draw completed successfully!'}
            {state === 'error' && 'An error occurred during the draw'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Number Display */}
          <div className="flex justify-center">
            <div
              className={`
                flex h-32 w-32 items-center justify-center rounded-2xl border-4 text-5xl font-bold transition-all
                ${state === 'animating' ? 'animate-pulse border-primary bg-primary/10' : ''}
                ${state === 'result' || state === 'complete' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950' : ''}
                ${state === 'idle' ? 'border-muted bg-muted/50 text-muted-foreground' : ''}
                ${state === 'error' ? 'border-destructive bg-destructive/10 text-destructive' : ''}
              `}
            >
              {displayNumber !== null ? `#${displayNumber}` : '?'}
            </div>
          </div>

          {/* Winner Info (after confirmation) */}
          {state === 'complete' && winner && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <PartyPopper className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Winner Found!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{winner.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{winner.email}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {state === 'error' && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {state === 'idle' && (
              <Button size="lg" onClick={handleStartDraw} className="gap-2 text-lg">
                <Dices className="h-5 w-5" />
                Execute Draw
              </Button>
            )}

            {state === 'animating' && (
              <Button size="lg" disabled className="gap-2 text-lg">
                <Loader2 className="h-5 w-5 animate-spin" />
                Drawing...
              </Button>
            )}

            {state === 'result' && (
              <>
                <Button size="lg" variant="outline" onClick={handleRedraw}>
                  Re-draw
                </Button>
                <Button size="lg" onClick={handleConfirm} className="gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Confirm Winner
                </Button>
              </>
            )}

            {state === 'saving' && (
              <Button size="lg" disabled className="gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </Button>
            )}

            {state === 'complete' && (
              <Button size="lg" onClick={() => router.push('/dashboard/competitions/' + competitionId)}>
                View Competition
              </Button>
            )}

            {state === 'error' && (
              <Button size="lg" variant="outline" onClick={handleRedraw}>
                Try Again
              </Button>
            )}
          </div>

          {/* Security Notice */}
          {state === 'idle' && (
            <p className="text-center text-xs text-muted-foreground">
              This draw uses cryptographically secure random number generation (crypto.getRandomValues).
              <br />
              The result will be immutably recorded in the audit log.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Draw Result</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to confirm <strong>Ticket #{winningNumber}</strong> as the winner for:
              </p>
              <p className="font-medium">{competitionTitle}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                This action is irreversible. The result will be recorded in the audit log and the winner will be notified.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDraw}>
              Confirm Winner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
