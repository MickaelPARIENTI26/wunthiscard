'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Clock, CreditCard, Gift, Loader2, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice, calculateBonusTickets } from '@winthiscard/shared/utils';

interface CheckoutClientProps {
  competitionId: string;
  competitionSlug: string;
  competitionTitle: string;
  mainImageUrl: string;
  ticketPrice: number;
}

export function CheckoutClient({
  competitionId,
  competitionSlug,
  competitionTitle,
  mainImageUrl,
  ticketPrice,
}: CheckoutClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [reservation, setReservation] = useState<{ expiresAt: number } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [qcmPassed, setQcmPassed] = useState(false);

  const ticketCount = selectedTickets.length;
  const bonusTickets = calculateBonusTickets(ticketCount);
  const totalEntries = ticketCount + bonusTickets;
  const totalPrice = ticketCount * ticketPrice;

  // Format countdown timer
  const formatCountdown = useCallback((ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ':' + seconds.toString().padStart(2, '0');
  }, []);

  // Load data from sessionStorage and create reservation if needed
  useEffect(() => {
    const stored = sessionStorage.getItem('tickets_' + competitionId);
    const reservationStored = sessionStorage.getItem('reservation_' + competitionId);
    const pendingQuantityStored = sessionStorage.getItem('pending_quantity_' + competitionId);
    const qcmPassedStored = sessionStorage.getItem('qcm_passed_' + competitionId);

    // Must have QCM passed
    if (qcmPassedStored !== 'true') {
      router.push('/competitions/' + competitionSlug + '/question');
      return;
    }

    setQcmPassed(true);

    // If we have a valid (non-expired) reservation with ticket numbers, use it
    if (stored && reservationStored) {
      const res = JSON.parse(reservationStored);
      // Check if reservation has expired
      if (res.expiresAt > Date.now()) {
        setSelectedTickets(JSON.parse(stored));
        setReservation(res);
        setIsLoading(false);
        return;
      }
      // Reservation expired, clear it
      sessionStorage.removeItem('reservation_' + competitionId);
      sessionStorage.removeItem('tickets_' + competitionId);
    }

    // For anonymous users who just logged in: check for pending quantity
    if (pendingQuantityStored) {
      const pending = JSON.parse(pendingQuantityStored);
      createReservation(pending.quantity);
      return;
    }

    // For authenticated users with existing tickets but expired reservation
    if (stored) {
      const tickets = JSON.parse(stored) as number[];
      createReservation(tickets.length);
      return;
    }

    // No tickets or quantity selected, redirect back
    router.push('/competitions/' + competitionSlug + '/tickets');
  }, [competitionId, competitionSlug, router]);

  // Create reservation with quantity (server assigns random ticket numbers)
  const createReservation = async (quantity: number) => {
    try {
      const response = await fetch('/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reserve tickets. Please select tickets again.');
        setIsLoading(false);
        return;
      }

      // Store new reservation with assigned ticket numbers
      const newReservation = {
        ticketNumbers: data.ticketNumbers,
        expiresAt: data.expiresAt,
      };
      sessionStorage.setItem('reservation_' + competitionId, JSON.stringify(newReservation));
      sessionStorage.setItem('tickets_' + competitionId, JSON.stringify(data.ticketNumbers));
      sessionStorage.removeItem('pending_quantity_' + competitionId);

      setSelectedTickets(data.ticketNumbers);
      setReservation(newReservation);
      setIsLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  // Countdown timer
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

  const handleCheckout = async () => {
    if (isProcessing || !qcmPassed) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create checkout session');
        setIsProcessing(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError('Failed to get checkout URL');
        setIsProcessing(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setIsProcessing(false);
    }
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

  if (!reservation) {
    return (
      <Card className="border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Session Expired</CardTitle>
          <CardDescription>
            {error || 'Your ticket reservation has expired. Please select tickets again.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => router.push('/competitions/' + competitionSlug + '/tickets')}
          >
            Select Tickets Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href={'/competitions/' + competitionSlug + '/question'}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Question
      </Link>

      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Complete Your Purchase</h1>
        <p className="mt-2 text-muted-foreground">{competitionTitle}</p>
      </div>

      {/* Reservation Timer */}
      {countdown && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Complete checkout within <span className="font-bold text-lg">{countdown}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Competition Info */}
          <div className="flex gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={mainImageUrl}
                alt={competitionTitle}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{competitionTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Ticket Numbers */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Your ticket numbers:</p>
            <p className="text-sm font-medium">
              #{selectedTickets.sort((a, b) => a - b).join(', #')}
            </p>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>{ticketCount} ticket{ticketCount !== 1 ? 's' : ''} x {formatPrice(ticketPrice)}</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            {bonusTickets > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Gift className="h-4 w-4" />
                  Bonus tickets
                </span>
                <span>+{bonusTickets} FREE</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            {bonusTickets > 0 && (
              <p className="text-center text-sm text-green-600">
                {totalEntries} total entries!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Button
        size="lg"
        className="w-full text-lg"
        onClick={handleCheckout}
        disabled={isProcessing || !qcmPassed}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Redirecting to payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay {formatPrice(totalPrice)}
          </>
        )}
      </Button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Secure payment powered by Stripe</span>
      </div>

      {/* Terms */}
      <p className="text-center text-xs text-muted-foreground">
        By completing this purchase, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
