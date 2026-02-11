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

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function calculateBonusTickets(quantity: number): number {
  if (quantity >= 50) return 5;
  if (quantity >= 20) return 3;
  if (quantity >= 15) return 2;
  if (quantity >= 10) return 1;
  return 0;
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
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-900 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-400">
                <Gift className="h-5 w-5" />
                Buy more, get free tickets!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {BONUS_TIERS.map((tier) => {
                  const isAchieved = quantity >= tier.min;
                  const isNext = nextTier?.min === tier.min;

                  return (
                    <div
                      key={tier.min}
                      className={cn(
                        'flex items-center justify-between rounded-lg px-4 py-3 transition-all',
                        isAchieved
                          ? 'bg-green-200 dark:bg-green-800/50 ring-2 ring-green-500'
                          : isNext
                            ? 'bg-white dark:bg-green-900/30 ring-2 ring-green-400 ring-dashed'
                            : 'bg-white/60 dark:bg-green-900/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                            isAchieved
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          )}
                        >
                          {isAchieved ? <Check className="h-4 w-4" /> : tier.min}
                        </div>
                        <span
                          className={cn(
                            'font-medium',
                            isAchieved && 'text-green-800 dark:text-green-300'
                          )}
                        >
                          {tier.min} tickets
                        </span>
                      </div>
                      <Badge
                        className={cn(
                          isAchieved
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        )}
                      >
                        +{tier.bonus} FREE
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {nextTier && ticketsToNextTier > 0 && (
                <p className="mt-4 text-center text-sm font-medium text-green-700 dark:text-green-400">
                  <Sparkles className="inline h-4 w-4 mr-1" />
                  Buy {ticketsToNextTier} more to unlock {nextTier.bonus} free
                  ticket{nextTier.bonus > 1 ? 's' : ''}!
                </p>
              )}
            </CardContent>
          </Card>
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
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
              <Gift className="h-4 w-4" />
              Free ticket bonuses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {BONUS_TIERS.map((tier) => {
                const isAchieved = quantity >= tier.min;
                const isNext = nextTier?.min === tier.min;

                return (
                  <div
                    key={tier.min}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all',
                      isAchieved
                        ? 'bg-green-200 dark:bg-green-800/50 ring-1 ring-green-500'
                        : isNext
                          ? 'bg-white dark:bg-green-900/30 ring-1 ring-green-400 ring-dashed'
                          : 'bg-white/60 dark:bg-green-900/20'
                    )}
                  >
                    {isAchieved && <Check className="h-3 w-3 text-green-600" />}
                    <span className={isAchieved ? 'font-medium' : ''}>
                      {tier.min}
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +{tier.bonus}
                    </span>
                  </div>
                );
              })}
            </div>
            {nextTier && ticketsToNextTier > 0 && ticketsToNextTier <= 10 && (
              <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
                {ticketsToNextTier} more for +{nextTier.bonus} free!
              </p>
            )}
          </CardContent>
        </Card>

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
