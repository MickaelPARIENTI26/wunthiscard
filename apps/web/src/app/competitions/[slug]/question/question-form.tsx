'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle, CheckCircle, XCircle, HelpCircle, Clock, Loader2, LogIn } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface QuestionFormProps {
  competitionId: string;
  competitionSlug: string;
  competitionTitle: string;
  questionText: string;
  questionChoices: string[];
  ticketPrice: number;
}

export function QuestionForm({
  competitionId,
  competitionSlug,
  questionText,
  questionChoices,
}: QuestionFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    message: string;
    blocked?: boolean;
    attemptsRemaining?: number;
    blockUntil?: number;
  } | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [pendingQuantity, setPendingQuantity] = useState<number>(0);
  const [reservation, setReservation] = useState<{ expiresAt: number } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Format countdown timer
  const formatCountdown = useCallback((ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Load tickets and reservation from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`tickets_${competitionId}`);
    const reservationStored = sessionStorage.getItem(`reservation_${competitionId}`);
    const pendingQuantityStored = sessionStorage.getItem(`pending_quantity_${competitionId}`);

    // For authenticated users: check for reserved tickets
    if (stored) {
      setSelectedTickets(JSON.parse(stored));
    }

    // Check for authenticated user reservation (with expiresAt)
    if (reservationStored) {
      const res = JSON.parse(reservationStored);
      setReservation(res);

      // Check if reservation has expired
      if (res.expiresAt < Date.now()) {
        setError('Your ticket reservation has expired. Please select tickets again.');
        sessionStorage.removeItem(`tickets_${competitionId}`);
        sessionStorage.removeItem(`reservation_${competitionId}`);
        setIsLoading(false);
        return;
      }
    } else if (pendingQuantityStored) {
      // Anonymous user - no reservation timer, just pending quantity
      const pending = JSON.parse(pendingQuantityStored);
      setPendingQuantity(pending.quantity);

      // Check if selection is not too old (e.g., 1 hour)
      const ONE_HOUR = 60 * 60 * 1000;
      if (Date.now() - pending.timestamp > ONE_HOUR) {
        setError('Your ticket selection has expired. Please select tickets again.');
        sessionStorage.removeItem(`pending_quantity_${competitionId}`);
        setIsLoading(false);
        return;
      }
    } else if (!stored) {
      // No tickets or quantity selected, redirect back
      router.push(`/competitions/${competitionSlug}/tickets`);
      return;
    }

    // Check QCM status
    checkQcmStatus();
    setIsLoading(false);
  }, [competitionId, competitionSlug, router]);

  // Countdown timer for reservation
  useEffect(() => {
    if (!reservation) return;

    const updateCountdown = () => {
      const remaining = reservation.expiresAt - Date.now();
      if (remaining <= 0) {
        setCountdown('0:00');
        setError('Your ticket reservation has expired. Please select tickets again.');
        setReservation(null);
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [reservation, formatCountdown]);

  const checkQcmStatus = async () => {
    try {
      const response = await fetch(`/api/qcm/validate?competitionId=${competitionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.passed) {
          setResult({
            correct: true,
            message: 'You have already answered correctly.',
          });
        } else if (data.blocked) {
          setResult({
            correct: false,
            blocked: true,
            message: `Please wait ${Math.ceil(data.remainingTime / 60)} minutes before trying again.`,
            attemptsRemaining: 0,
          });
        }
      }
    } catch {
      // Ignore errors during status check
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/qcm/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          answer: selectedAnswer,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.correct && !data.blocked) {
        setError(data.error || 'An error occurred');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setIsSubmitting(false);
        return;
      }

      setResult({
        correct: data.correct,
        message: data.message,
        blocked: data.blocked,
        attemptsRemaining: data.attemptsRemaining,
        blockUntil: data.blockUntil,
      });

      if (data.correct) {
        // Store that they passed
        sessionStorage.setItem(`qcm_passed_${competitionId}`, 'true');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setResult(null);
    setError(null);
    turnstileRef.current?.reset();
    setTurnstileToken(null);
  };

  const handleProceed = () => {
    router.push(`/competitions/${competitionSlug}/checkout`);
  };

  const handleBackToTickets = () => {
    router.push(`/competitions/${competitionSlug}/tickets`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show error for expired reservation
  if (error && !reservation) {
    return (
      <Card className="border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Reservation Expired</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleBackToTickets}>
            Select Tickets Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show blocked state
  if (result?.blocked) {
    return (
      <Card className="border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Too Many Incorrect Attempts</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/competitions/${competitionSlug}`)}
          >
            Back to Competition
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show success state
  if (result?.correct) {
    return (
      <Card className="border-green-500">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Correct Answer!</CardTitle>
          <CardDescription>
            Well done! You can now proceed to checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reservation timer for authenticated users */}
          {reservation && countdown && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Complete checkout within <span className="font-bold">{countdown}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Notice for anonymous users */}
          {!isAuthenticated && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <LogIn className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                You&apos;ll need to sign in or create an account to complete your purchase.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Selected Tickets</p>
            {selectedTickets.length > 0 ? (
              <p className="font-medium">
                {selectedTickets.length} ticket{selectedTickets.length > 1 ? 's' : ''}: #
                {selectedTickets.sort((a, b) => a - b).join(', #')}
              </p>
            ) : (
              <p className="font-medium">
                {pendingQuantity} ticket{pendingQuantity > 1 ? 's' : ''} (numbers assigned at checkout)
              </p>
            )}
          </div>
          <Button size="lg" className="w-full" onClick={handleProceed}>
            Proceed to Checkout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <HelpCircle className="h-4 w-4" />
          <span className="text-sm">Skill-based entry question</span>
        </div>
        <CardTitle className="text-lg">{questionText}</CardTitle>
        {result && !result.correct && result.attemptsRemaining !== undefined && (
          <CardDescription className="text-destructive">
            Incorrect answer. {result.attemptsRemaining} attempt{result.attemptsRemaining !== 1 ? 's' : ''} remaining.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reservation timer */}
        {reservation && countdown && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Tickets reserved for <span className="font-bold">{countdown}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Answer Options */}
        <div className="space-y-2">
          {questionChoices.map((choice, index) => (
            <button
              key={index}
              onClick={() => !isSubmitting && setSelectedAnswer(index)}
              disabled={isSubmitting}
              className={cn(
                'w-full cursor-pointer rounded-lg border p-4 text-left transition-all',
                selectedAnswer === index
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent',
                isSubmitting && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    selectedAnswer === index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{choice}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Error Message for wrong answer */}
        {result && !result.correct && !result.blocked && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {result.message}
          </div>
        )}

        {/* Cloudflare Turnstile - invisible mode */}
        {TURNSTILE_SITE_KEY && (
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            options={{
              size: 'invisible',
              theme: 'auto',
            }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {result && !result.correct && !result.blocked ? (
            <Button className="flex-1" onClick={handleTryAgain}>
              Try Again
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={selectedAnswer === null || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-muted-foreground">
          UK law requires a skill-based question for prize competitions.
          You have 3 attempts to answer correctly.
        </p>
      </CardContent>
    </Card>
  );
}
