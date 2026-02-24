'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, Loader2, Mail, Clock, Gift } from 'lucide-react';
import { formatPrice } from '@winucard/shared/utils';

// TODO: Rendre les paliers de bonus configurables depuis l'admin
const BONUS_TIERS = [
  { minTickets: 10, bonusTickets: 1 },
  { minTickets: 15, bonusTickets: 2 },
  { minTickets: 20, bonusTickets: 3 },
  { minTickets: 25, bonusTickets: 4 },
  { minTickets: 50, bonusTickets: 5 },
];

function getBonusTickets(quantity: number): number {
  // Find the highest tier the user qualifies for
  let bonus = 0;
  for (const tier of BONUS_TIERS) {
    if (quantity >= tier.minTickets) {
      bonus = tier.bonusTickets;
    }
  }
  return bonus;
}

interface SimpleTicketSelectorProps {
  competitionId: string;
  competitionSlug: string;
  ticketPrice: number;
  maxTicketsPerUser: number;
  availableTicketCount: number;
  userTicketCount?: number;
  categoryColor: string;
}

export function SimpleTicketSelector({
  competitionId,
  competitionSlug,
  ticketPrice,
  maxTicketsPerUser,
  availableTicketCount,
  userTicketCount = 0,
  categoryColor,
}: SimpleTicketSelectorProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session?.user;

  const [quantity, setQuantity] = useState(1);
  const [customValue, setCustomValue] = useState('');
  const [isCustomActive, setIsCustomActive] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<{
    ticketNumbers: number[];
    expiresAt: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Effective max considers user's existing tickets
  const remainingAllowance = maxTicketsPerUser - userTicketCount;
  const maxQuantity = Math.min(remainingAllowance, availableTicketCount, 100);

  const bonusTickets = getBonusTickets(quantity);
  const totalTickets = quantity + bonusTickets;
  const totalPrice = quantity * ticketPrice;

  // Quick select buttons (1-10)
  const quickButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
        setReservationError('Your reservation has expired. Please select tickets again.');
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

  // Release reservation on unmount
  useEffect(() => {
    if (!isAuthenticated) return;

    return () => {
      if (reservation) {
        fetch('/api/tickets/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitionId }),
        }).catch(() => {});
      }
    };
  }, [reservation, competitionId, isAuthenticated]);

  const handleQuickSelect = (num: number) => {
    if (num <= maxQuantity) {
      setQuantity(num);
      setCustomValue('');
      setIsCustomActive(false);
      setReservationError(null);
    }
  };

  const handleCustomFocus = () => {
    setIsCustomActive(true);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomValue(value);

    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 11 && num <= maxQuantity) {
      setQuantity(num);
      setReservationError(null);
    }
  };

  const handleCustomBlur = () => {
    const num = parseInt(customValue, 10);
    // If the value is less than 11 or invalid, clear the input
    if (isNaN(num) || num < 11) {
      setCustomValue('');
      setIsCustomActive(false);
    }
  };

  const proceedToCheckout = async () => {
    if (quantity === 0) return;
    setIsProceeding(true);
    setReservationError(null);

    // For anonymous users, store quantity and proceed
    if (!isAuthenticated) {
      sessionStorage.setItem(
        `pending_quantity_${competitionId}`,
        JSON.stringify({ quantity, timestamp: Date.now() })
      );
      router.push(`/competitions/${competitionSlug}/question`);
      return;
    }

    // For authenticated users, reserve tickets via API
    try {
      const response = await fetch('/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        setReservationError(data.error || 'Failed to reserve tickets');
        setIsProceeding(false);
        return;
      }

      setReservation({
        ticketNumbers: data.ticketNumbers,
        expiresAt: data.expiresAt,
      });

      sessionStorage.setItem(`tickets_${competitionId}`, JSON.stringify(data.ticketNumbers));
      sessionStorage.setItem(
        `reservation_${competitionId}`,
        JSON.stringify({ ticketNumbers: data.ticketNumbers, expiresAt: data.expiresAt })
      );

      router.push(`/competitions/${competitionSlug}/question`);
    } catch {
      setReservationError('Network error. Please try again.');
      setIsProceeding(false);
    }
  };

  // Determine if custom input has a valid value (for styling)
  const hasCustomValue = customValue !== '' && parseInt(customValue, 10) >= 11;

  return (
    <div className="space-y-5">
      {/* CSS for hiding number input spinners */}
      <style>{`
        .ticket-custom-input::-webkit-inner-spin-button,
        .ticket-custom-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .ticket-custom-input {
          -moz-appearance: textfield;
        }
        .ticket-btn:hover:not(:disabled):not(.selected) {
          background: #EDEDF0 !important;
        }
      `}</style>

      {/* Select Tickets Label */}
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
        Select tickets
      </p>

      {/* Ticket Buttons Row */}
      <div className="flex flex-wrap gap-2">
        {quickButtons.map((num) => {
          const isSelected = quantity === num && !hasCustomValue;
          const isDisabled = num > maxQuantity;

          return (
            <button
              key={num}
              onClick={() => handleQuickSelect(num)}
              disabled={isDisabled}
              className={`ticket-btn ${isSelected ? 'selected' : ''}`}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                border: isSelected ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                background: isSelected ? '#1a1a2e' : '#F7F7FA',
                color: isSelected ? '#ffffff' : isDisabled ? '#9a9eb0' : '#1a1a2e',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              {num}
            </button>
          );
        })}

        {/* Custom Input (always visible) */}
        <input
          ref={customInputRef}
          type="number"
          min={11}
          max={maxQuantity}
          value={customValue}
          onChange={handleCustomChange}
          onFocus={handleCustomFocus}
          onBlur={handleCustomBlur}
          placeholder="25"
          className="ticket-custom-input"
          style={{
            width: '80px',
            height: '44px',
            borderRadius: '10px',
            border: hasCustomValue
              ? 'none'
              : isCustomActive
                ? '1px solid rgba(240, 185, 11, 0.3)'
                : '1px solid rgba(0, 0, 0, 0.1)',
            background: hasCustomValue ? '#1a1a2e' : '#F7F7FA',
            color: hasCustomValue ? '#ffffff' : 'var(--text-primary)',
            fontSize: '16px',
            fontWeight: 600,
            textAlign: 'center',
            outline: 'none',
            boxShadow: hasCustomValue
              ? '0 4px 12px rgba(0, 0, 0, 0.1)'
              : isCustomActive
                ? '0 0 0 3px rgba(240, 185, 11, 0.08)'
                : 'none',
            transition: 'all 0.2s',
          }}
        />
      </div>

      {/* Bonus Offers Section */}
      <div
        style={{
          background: '#F7F7FA',
          borderRadius: '14px',
          padding: '14px 18px',
        }}
      >
        <div
          className="flex items-center gap-2 mb-2"
          style={{ marginBottom: '8px' }}
        >
          <Gift style={{ width: '14px', height: '14px', color: '#F0B90B' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a2e' }}>
            Bonus Offers
          </span>
        </div>
        <div className="space-y-1">
          {BONUS_TIERS.map((tier) => {
            const isActive = quantity >= tier.minTickets &&
              (BONUS_TIERS.find(t => t.minTickets > tier.minTickets && quantity >= t.minTickets) === undefined ||
               tier.bonusTickets === bonusTickets);
            const isAbove = quantity < tier.minTickets;
            const isExactMatch = bonusTickets === tier.bonusTickets && quantity >= tier.minTickets;

            return (
              <div
                key={tier.minTickets}
                className="flex items-center gap-2"
                style={{
                  padding: '4px 8px',
                  marginLeft: '-8px',
                  borderRadius: '6px',
                  background: isExactMatch ? 'rgba(240, 185, 11, 0.06)' : 'transparent',
                  borderLeft: isExactMatch ? '3px solid #F0B90B' : '3px solid transparent',
                  opacity: isAbove ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: isExactMatch ? 600 : 400,
                    color: 'var(--text-muted)',
                  }}
                >
                  Buy {tier.minTickets}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-faded)' }}>→</span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#F0B90B',
                  }}
                >
                  Get {tier.bonusTickets} FREE
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total Price with Bonus Info */}
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
        Total: {formatPrice(totalPrice)}
        <span style={{ fontWeight: 500, marginLeft: '8px' }}>
          — {totalTickets} ticket{totalTickets > 1 ? 's' : ''}
          {bonusTickets > 0 && (
            <span style={{ color: '#F0B90B', fontWeight: 700 }}>
              {' '}({bonusTickets} free!)
            </span>
          )}
        </span>
      </div>

      {/* Reservation Timer */}
      {reservation && countdown && (
        <div
          className="flex items-center gap-2"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <Clock style={{ width: '16px', height: '16px', color: '#D97706' }} />
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#92400E' }}>
            Reserved for <strong>{countdown}</strong>
          </span>
        </div>
      )}

      {/* Error */}
      {reservationError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            color: '#DC2626',
            fontSize: '14px',
          }}
        >
          {reservationError}
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={proceedToCheckout}
        disabled={quantity === 0 || isProceeding || maxQuantity === 0 || sessionStatus === 'loading'}
        className="w-full flex items-center justify-center gap-2 checkout-btn"
        style={{
          padding: '16px',
          borderRadius: '14px',
          background: '#1a1a2e',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 600,
          cursor: quantity === 0 || isProceeding || maxQuantity === 0 ? 'not-allowed' : 'pointer',
          opacity: quantity === 0 || isProceeding || maxQuantity === 0 ? 0.6 : 1,
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          if (quantity > 0 && !isProceeding && maxQuantity > 0) {
            e.currentTarget.style.background = categoryColor;
            e.currentTarget.style.boxShadow = `0 8px 24px ${categoryColor}40`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1a1a2e';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {isProceeding ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isAuthenticated ? 'Reserving...' : 'Processing...'}
          </>
        ) : (
          <>
            Proceed to Checkout
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      {/* Availability Info */}
      <p style={{ fontSize: '12px', color: '#9a9eb0', textAlign: 'center' }}>
        {availableTicketCount.toLocaleString('en-GB')} tickets available · Max {maxTicketsPerUser} per person
      </p>

      {/* Free Entry Route Link */}
      <button
        onClick={() => {
          // Open modal or scroll to free entry section
          const freeEntrySection = document.getElementById('free-entry-section');
          if (freeEntrySection) {
            freeEntrySection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="w-full flex items-center justify-center gap-2"
        style={{
          padding: '10px',
          background: 'transparent',
          color: '#F0B90B',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Mail className="h-4 w-4" />
        Free Entry Route
      </button>
    </div>
  );
}
