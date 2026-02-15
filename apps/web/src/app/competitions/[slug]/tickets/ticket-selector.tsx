'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Minus,
  Plus,
  Gift,
  ShoppingCart,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { formatPrice, calculateBonusTickets } from '@winucard/shared/utils';

interface TicketSelectorProps {
  competitionId: string;
  competitionSlug: string;
  competitionTitle: string;
  competitionImageUrl: string;
  ticketPrice: number;
  totalTickets: number;
  maxTicketsPerUser: number;
  availableTicketCount: number;
  userTicketCount?: number;
}

const BONUS_TIERS = [
  { min: 10, bonus: 1, total: 11 },
  { min: 15, bonus: 2, total: 17 },
  { min: 20, bonus: 3, total: 23 },
  { min: 50, bonus: 5, total: 55 },
];

const QUICK_SELECT_OPTIONS = [10, 15, 20, 50];

export function TicketSelector({
  competitionId,
  competitionSlug,
  competitionTitle,
  competitionImageUrl,
  ticketPrice,
  totalTickets: _totalTickets,
  maxTicketsPerUser,
  availableTicketCount,
  userTicketCount = 0,
}: TicketSelectorProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session?.user;
  const [quantity, setQuantity] = useState(1);
  const [isProceeding, setIsProceeding] = useState(false);

  // Reservation state
  const [reservation, setReservation] = useState<{
    ticketNumbers: number[];
    expiresAt: number;
  } | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effective max considers user's existing tickets
  const remainingAllowance = maxTicketsPerUser - userTicketCount;
  const maxQuantity = Math.min(remainingAllowance, availableTicketCount, 50);

  // Calculate totals
  const bonusTickets = calculateBonusTickets(quantity);
  const totalEntries = quantity + bonusTickets;
  const totalPrice = quantity * ticketPrice;

  // Find current tier and next tier
  const _currentTier = BONUS_TIERS.filter((t) => quantity >= t.min).pop() || null;
  const nextTier = BONUS_TIERS.find((t) => quantity < t.min) || null;
  const ticketsToNextTier = nextTier ? nextTier.min - quantity : 0;

  // Format countdown timer
  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update countdown timer
  useEffect(() => {
    if (!reservation) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const remaining = reservation.expiresAt - Date.now();
      if (remaining <= 0) {
        setCountdown('0:00');
        setReservation(null);
        setReservationError(
          'Your reservation has expired. Please select tickets again.'
        );
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [reservation]);

  // Release reservation on unmount (only for authenticated users)
  useEffect(() => {
    if (!isAuthenticated) return;

    return () => {
      if (reservation) {
        fetch('/api/tickets/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitionId }),
        }).catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, [reservation, competitionId, isAuthenticated]);

  const setQuantitySafe = (newQty: number) => {
    const clamped = Math.max(1, Math.min(newQty, maxQuantity));
    setQuantity(clamped);
  };

  const incrementQuantity = () => setQuantitySafe(quantity + 1);
  const decrementQuantity = () => setQuantitySafe(quantity - 1);

  const proceedToQuestion = async () => {
    if (quantity === 0) return;
    setIsProceeding(true);
    setReservationError(null);

    // For anonymous users, just store quantity in sessionStorage and proceed
    // Reservation will be created at checkout after login
    if (!isAuthenticated) {
      sessionStorage.setItem(
        `pending_quantity_${competitionId}`,
        JSON.stringify({
          quantity,
          timestamp: Date.now(),
        })
      );
      router.push(`/competitions/${competitionSlug}/question`);
      return;
    }

    // For authenticated users, reserve tickets via API
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
        setReservationError(data.error || 'Failed to reserve tickets');
        setIsProceeding(false);
        return;
      }

      // Store reservation data
      setReservation({
        ticketNumbers: data.ticketNumbers,
        expiresAt: data.expiresAt,
      });

      // Store in sessionStorage for the question page
      sessionStorage.setItem(
        `tickets_${competitionId}`,
        JSON.stringify(data.ticketNumbers)
      );
      sessionStorage.setItem(
        `reservation_${competitionId}`,
        JSON.stringify({
          ticketNumbers: data.ticketNumbers,
          expiresAt: data.expiresAt,
        })
      );

      router.push(`/competitions/${competitionSlug}/question`);
    } catch {
      setReservationError('Network error. Please try again.');
      setIsProceeding(false);
    }
  };

  const cancelReservation = async () => {
    if (!reservation) return;

    try {
      await fetch('/api/tickets/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId }),
      });
    } catch {
      // Ignore errors
    }

    setReservation(null);
    setReservationError(null);
    sessionStorage.removeItem(`tickets_${competitionId}`);
    sessionStorage.removeItem(`reservation_${competitionId}`);
  };

  return (
    <>
      {/* Desktop Layout: Two columns */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Left Column - 60% (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quantity Selector */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">How many tickets?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quantity Stepper */}
              <div className="flex items-center justify-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full text-lg"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-6 w-6" />
                </Button>
                <div className="flex min-w-[140px] flex-col items-center">
                  <span className="text-6xl font-bold">{quantity}</span>
                  <span className="text-sm text-muted-foreground">
                    ticket{quantity !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full text-lg"
                  onClick={incrementQuantity}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                {QUICK_SELECT_OPTIONS.map((num) => {
                  const tier = BONUS_TIERS.find((t) => t.min === num);
                  const isSelected = quantity === num;
                  return (
                    <Button
                      key={num}
                      variant={isSelected ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setQuantitySafe(num)}
                      disabled={num > maxQuantity}
                      className={cn(
                        'min-w-[100px]',
                        isSelected && 'ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      {num}
                      {tier && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          +{tier.bonus}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Info text */}
              <p className="text-center text-sm text-muted-foreground">
                Your ticket numbers will be randomly assigned at checkout
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
          {reservation && countdown && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  Tickets reserved for{' '}
                  <span className="font-bold text-lg">{countdown}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelReservation}
                  className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                >
                  Cancel
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {reservationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{reservationError}</AlertDescription>
            </Alert>
          )}

          {/* Bonus Tiers Section */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, oklch(0.14 0.02 270) 0%, oklch(0.10 0.02 270) 100%)',
              border: '1px solid oklch(0.25 0.02 270)',
            }}
          >
            <h3
              className="flex items-center gap-2 text-lg font-semibold mb-4"
              style={{ color: 'oklch(0.82 0.165 85)' }}
            >
              <Gift className="h-5 w-5" />
              Buy more, get free tickets!
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {BONUS_TIERS.map((tier) => {
                const isAchieved = quantity >= tier.min;
                const isNext = nextTier?.min === tier.min;

                return (
                  <div
                    key={tier.min}
                    className="flex items-center justify-between rounded-xl px-4 py-3 transition-all"
                    style={{
                      background: isAchieved
                        ? 'linear-gradient(135deg, oklch(0.35 0.12 145) 0%, oklch(0.25 0.1 145) 100%)'
                        : 'oklch(0.18 0.02 270)',
                      border: isAchieved
                        ? '2px solid oklch(0.55 0.18 145)'
                        : isNext
                          ? '2px dashed oklch(0.45 0.12 145)'
                          : '1px solid oklch(0.25 0.02 270)',
                      boxShadow: isAchieved
                        ? '0 0 12px oklch(0.5 0.15 145 / 0.3)'
                        : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          background: isAchieved
                            ? 'oklch(0.55 0.18 145)'
                            : 'oklch(0.25 0.02 270)',
                          color: isAchieved ? 'white' : 'oklch(0.6 0.02 270)',
                        }}
                      >
                        {isAchieved ? <Check className="h-4 w-4" /> : tier.min}
                      </div>
                      <span
                        className="font-medium"
                        style={{
                          color: isAchieved
                            ? 'white'
                            : isNext
                              ? 'oklch(0.75 0.02 270)'
                              : 'oklch(0.55 0.02 270)',
                        }}
                      >
                        {tier.min} tickets
                      </span>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{
                        background: isAchieved
                          ? 'oklch(0.45 0.15 145)'
                          : 'oklch(0.25 0.08 145)',
                        color: isAchieved
                          ? 'white'
                          : 'oklch(0.65 0.12 145)',
                      }}
                    >
                      +{tier.bonus} FREE
                    </span>
                  </div>
                );
              })}
            </div>

            {nextTier && ticketsToNextTier > 0 && (
              <p
                className="mt-4 text-center text-sm font-medium"
                style={{ color: 'oklch(0.82 0.165 85)' }}
              >
                <Sparkles className="inline h-4 w-4 mr-1" />
                Buy {ticketsToNextTier} more to unlock {nextTier.bonus} free
                ticket{nextTier.bonus > 1 ? 's' : ''}!
              </p>
            )}
          </div>
        </div>

        {/* Right Column - 40% (2/5) - Sticky Order Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Competition Preview */}
                <div className="flex gap-3 rounded-lg bg-background p-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={competitionImageUrl}
                      alt={competitionTitle}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {competitionTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPrice(ticketPrice)} per ticket
                    </p>
                  </div>
                </div>

                {/* Ticket Breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid tickets</span>
                    <span className="font-semibold">{quantity}</span>
                  </div>
                  {bonusTickets > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1.5">
                        <Gift className="h-4 w-4" />
                        Bonus tickets
                      </span>
                      <span className="font-semibold">+{bonusTickets} FREE</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-base font-bold">
                    <span>Total entries</span>
                    <span className="text-primary">{totalEntries}</span>
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-3xl font-bold">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {/* Continue Button */}
                <Button
                  size="lg"
                  className="w-full text-lg h-14"
                  disabled={
                    quantity === 0 ||
                    isProceeding ||
                    maxQuantity === 0 ||
                    sessionStatus === 'loading'
                  }
                  onClick={proceedToQuestion}
                >
                  {isProceeding ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isAuthenticated ? 'Reserving...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Continue
                    </>
                  )}
                </Button>

                {/* Notice for anonymous users */}
                {!isAuthenticated && sessionStatus !== 'loading' && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300">
                    <LogIn className="h-4 w-4 flex-shrink-0" />
                    <span>You&apos;ll sign in before checkout</span>
                  </div>
                )}

                {/* Availability info */}
                <p className="text-center text-xs text-muted-foreground">
                  {availableTicketCount.toLocaleString('en-GB')} available
                  {userTicketCount > 0 && (
                    <> &bull; You own {userTicketCount}</>
                  )}
                  <br />
                  Max {maxTicketsPerUser} per person
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Layout: Single column with fixed bottom bar */}
      <div className="lg:hidden space-y-4">
        {/* Quantity Selector - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">How many tickets?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quantity Stepper */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <div className="flex min-w-[100px] flex-col items-center">
                <span className="text-5xl font-bold">{quantity}</span>
                <span className="text-xs text-muted-foreground">
                  ticket{quantity !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={incrementQuantity}
                disabled={quantity >= maxQuantity}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick Select Buttons - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {QUICK_SELECT_OPTIONS.map((num) => {
                const tier = BONUS_TIERS.find((t) => t.min === num);
                const isSelected = quantity === num;
                return (
                  <Button
                    key={num}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuantitySafe(num)}
                    disabled={num > maxQuantity}
                    className={cn(
                      'flex-shrink-0',
                      isSelected && 'ring-2 ring-primary ring-offset-1'
                    )}
                  >
                    {num}
                    {tier && (
                      <span className="ml-1 text-green-600 dark:text-green-400">
                        +{tier.bonus}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Info text */}
            <p className="text-center text-xs text-muted-foreground">
              Numbers assigned randomly at checkout
            </p>
          </CardContent>
        </Card>

        {/* Bonus Tiers - Compact for mobile */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, oklch(0.14 0.02 270) 0%, oklch(0.10 0.02 270) 100%)',
            border: '1px solid oklch(0.25 0.02 270)',
          }}
        >
          <h3
            className="flex items-center gap-2 text-base font-semibold mb-3"
            style={{ color: 'oklch(0.82 0.165 85)' }}
          >
            <Gift className="h-4 w-4" />
            Free ticket bonuses
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {BONUS_TIERS.map((tier) => {
              const isAchieved = quantity >= tier.min;
              const isNext = nextTier?.min === tier.min;

              return (
                <div
                  key={tier.min}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all"
                  style={{
                    background: isAchieved
                      ? 'linear-gradient(135deg, oklch(0.35 0.12 145) 0%, oklch(0.25 0.1 145) 100%)'
                      : 'oklch(0.18 0.02 270)',
                    border: isAchieved
                      ? '2px solid oklch(0.55 0.18 145)'
                      : isNext
                        ? '2px dashed oklch(0.45 0.12 145)'
                        : '1px solid oklch(0.25 0.02 270)',
                    boxShadow: isAchieved
                      ? '0 0 8px oklch(0.5 0.15 145 / 0.3)'
                      : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isAchieved && (
                      <Check
                        className="h-3.5 w-3.5 flex-shrink-0"
                        style={{ color: 'oklch(0.75 0.18 145)' }}
                      />
                    )}
                    <span
                      className="font-medium"
                      style={{
                        color: isAchieved
                          ? 'white'
                          : isNext
                            ? 'oklch(0.75 0.02 270)'
                            : 'oklch(0.55 0.02 270)',
                      }}
                    >
                      {tier.min} tickets
                    </span>
                  </div>
                  <span
                    className="font-bold text-xs"
                    style={{
                      color: isAchieved
                        ? 'oklch(0.85 0.18 145)'
                        : 'oklch(0.55 0.12 145)',
                    }}
                  >
                    +{tier.bonus} FREE
                  </span>
                </div>
              );
            })}
          </div>
          {nextTier && ticketsToNextTier > 0 && ticketsToNextTier <= 10 && (
            <p
              className="mt-3 text-xs font-medium text-center"
              style={{ color: 'oklch(0.82 0.165 85)' }}
            >
              <Sparkles className="inline h-3 w-3 mr-1" />
              {ticketsToNextTier} more for +{nextTier.bonus} free!
            </p>
          )}
        </div>

        {/* Alerts */}
        {reservation && countdown && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between text-sm">
              <span className="text-amber-800 dark:text-amber-200">
                Reserved for <span className="font-bold">{countdown}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelReservation}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 h-7 text-xs"
              >
                Cancel
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {reservationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {reservationError}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Mobile Fixed Bottom Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-background border-t shadow-lg">
          {/* Bonus indicator bar */}
          {bonusTickets > 0 && (
            <div className="bg-green-100 dark:bg-green-900/50 px-4 py-1.5 text-center text-xs font-medium text-green-700 dark:text-green-300">
              <Gift className="inline h-3 w-3 mr-1" />
              +{bonusTickets} FREE bonus ticket{bonusTickets > 1 ? 's' : ''}{' '}
              included!
            </div>
          )}

          {/* Main cart bar */}
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            {/* Left: Price summary */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {quantity} ticket{quantity !== 1 ? 's' : ''}
                {bonusTickets > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    {' '}
                    + {bonusTickets} free
                  </span>
                )}{' '}
                = {totalEntries} entries
              </p>
            </div>

            {/* Right: Continue Button */}
            <Button
              size="lg"
              className="h-12 px-6"
              disabled={
                quantity === 0 ||
                isProceeding ||
                maxQuantity === 0 ||
                sessionStatus === 'loading'
              }
              onClick={proceedToQuestion}
            >
              {isProceeding ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ShoppingCart className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Login notice for anonymous users */}
          {!isAuthenticated && sessionStatus !== 'loading' && (
            <div className="bg-blue-50 dark:bg-blue-950/50 px-4 py-2 text-center text-xs text-blue-700 dark:text-blue-300">
              <LogIn className="inline h-3 w-3 mr-1" />
              You&apos;ll sign in before checkout
            </div>
          )}
        </div>
      </div>
    </>
  );
}
