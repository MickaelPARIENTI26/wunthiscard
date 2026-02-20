'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Gift,
  Clock,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { formatPrice, calculateBonusTickets } from '@winucard/shared/utils';

interface InlineTicketSelectorProps {
  competitionId: string;
  competitionSlug: string;
  ticketPrice: number;
  maxTicketsPerUser: number;
  availableTicketCount: number;
  userTicketCount?: number;
}

const BONUS_TIERS = [
  { min: 10, bonus: 1 },
  { min: 15, bonus: 2 },
  { min: 20, bonus: 3 },
  { min: 50, bonus: 5 },
];

export function InlineTicketSelector({
  competitionId,
  competitionSlug,
  ticketPrice,
  maxTicketsPerUser,
  availableTicketCount,
  userTicketCount = 0,
}: InlineTicketSelectorProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session?.user;
  const [quantity, setQuantity] = useState(1);
  const [isProceeding, setIsProceeding] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

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
  const bonusTickets = quantity > 0 ? calculateBonusTickets(quantity) : 0;
  const totalEntries = quantity + bonusTickets;
  const totalPrice = quantity * ticketPrice;

  // Find current and next tier
  const currentTier = BONUS_TIERS.filter((t) => quantity >= t.min).pop() || null;
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
    setReservationError(null);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantitySafe(parseInt(e.target.value, 10));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity(1);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setQuantitySafe(num);
    }
  };

  const proceedToQuestion = async () => {
    if (quantity === 0) return;
    setIsProceeding(true);
    setReservationError(null);

    // For anonymous users, just store quantity in sessionStorage and proceed
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
    setQuantity(1);
    sessionStorage.removeItem(`tickets_${competitionId}`);
    sessionStorage.removeItem(`reservation_${competitionId}`);
  };

  // Calculate slider progress percentage
  const sliderProgress = ((quantity - 1) / (maxQuantity - 1)) * 100;

  return (
    <div className="space-y-4">
      {/* Main Selector Card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, oklch(0.14 0.02 270) 0%, oklch(0.10 0.02 270) 100%)',
          border: '1px solid oklch(0.25 0.02 270)',
        }}
      >
        {/* Quantity Display */}
        <div className="flex items-baseline justify-center gap-1 mb-6">
          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={handleInputChange}
            className="w-20 text-center text-5xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-lg text-muted-foreground">
            ticket{quantity !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Slider */}
        <div className="relative mb-4 py-3" ref={sliderRef}>
          {/* Slider Track Background */}
          <div
            className="relative h-3 rounded-full"
            style={{ background: 'oklch(0.25 0.02 270)' }}
          >
            {/* Progress Fill */}
            <div
              className="absolute h-full rounded-full transition-all duration-150"
              style={{
                width: `${sliderProgress}%`,
                background: currentTier
                  ? 'linear-gradient(90deg, oklch(0.55 0.18 145), oklch(0.65 0.2 145))'
                  : 'linear-gradient(90deg, oklch(0.45 0.12 270), oklch(0.55 0.15 270))',
              }}
            />

            {/* Slider Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full shadow-lg transition-all duration-150 pointer-events-none"
              style={{
                left: `${sliderProgress}%`,
                background: currentTier
                  ? 'linear-gradient(135deg, oklch(0.7 0.2 145), oklch(0.55 0.18 145))'
                  : 'linear-gradient(135deg, oklch(0.85 0.02 270), oklch(0.7 0.02 270))',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            />

            {/* Bonus Tier Markers */}
            {BONUS_TIERS.map((tier) => {
              const position = ((tier.min - 1) / (maxQuantity - 1)) * 100;
              if (tier.min > maxQuantity) return null;
              const isActive = quantity >= tier.min;

              return (
                <div
                  key={tier.min}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all pointer-events-none"
                  style={{ left: `${position}%` }}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full border-2 transition-all',
                      isActive
                        ? 'bg-green-500 border-green-400 scale-110'
                        : 'bg-muted border-muted-foreground/50'
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* Actual Range Input (invisible but functional) */}
          <input
            type="range"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ margin: 0 }}
          />
        </div>

        {/* Bonus Tier Quick Select */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {BONUS_TIERS.map((tier) => {
            if (tier.min > maxQuantity) return null;
            const isSelected = quantity === tier.min;
            const isActive = quantity >= tier.min;

            return (
              <button
                key={tier.min}
                onClick={() => setQuantitySafe(tier.min)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : isActive
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground'
                )}
              >
                <span>{tier.min}</span>
                <span className={cn(
                  'text-xs',
                  isSelected ? 'text-white/90' : isActive ? 'text-green-400' : 'text-green-500'
                )}>
                  +{tier.bonus} FREE
                </span>
              </button>
            );
          })}
        </div>

        {/* Incentive Message */}
        {nextTier && ticketsToNextTier > 0 && ticketsToNextTier <= 15 && (
          <div
            className="rounded-lg px-3 py-2 text-center mb-4"
            style={{
              background: 'linear-gradient(135deg, oklch(0.18 0.06 85) 0%, oklch(0.14 0.04 85) 100%)',
              border: '1px solid oklch(0.3 0.08 85)',
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'oklch(0.82 0.165 85)' }}>
              <Sparkles className="inline h-3.5 w-3.5 mr-1" />
              {ticketsToNextTier === 1 ? '1 more' : `${ticketsToNextTier} more`} to unlock +{nextTier.bonus} FREE!
            </p>
          </div>
        )}

        {/* Price Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold">{formatPrice(totalPrice)}</span>
            {bonusTickets > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                <Gift className="h-3.5 w-3.5" />
                +{bonusTickets} FREE
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {totalEntries} total entr{totalEntries === 1 ? 'y' : 'ies'} &bull; {formatPrice(ticketPrice)}/ticket
          </p>
        </div>
      </div>

      {/* Reservation Timer */}
      {reservation && countdown && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="font-medium text-amber-800 dark:text-amber-200">
              Reserved for <span className="font-bold text-lg">{countdown}</span>
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

      {/* Error Alert */}
      {reservationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{reservationError}</AlertDescription>
        </Alert>
      )}

      {/* Checkout Button */}
      <Button
        size="lg"
        className="w-full text-lg h-14 font-semibold"
        disabled={
          quantity === 0 ||
          isProceeding ||
          maxQuantity === 0 ||
          sessionStatus === 'loading'
        }
        onClick={proceedToQuestion}
        style={{
          background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
          color: 'black',
        }}
      >
        {isProceeding ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isAuthenticated ? 'Reserving...' : 'Processing...'}
          </>
        ) : (
          <>
            Proceed to Checkout
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      {/* Availability Info */}
      <p className="text-center text-xs text-muted-foreground">
        {availableTicketCount.toLocaleString('en-GB')} tickets available
        {userTicketCount > 0 && <> &bull; You own {userTicketCount}</>}
        &bull; Max {maxTicketsPerUser} per person
      </p>
    </div>
  );
}
