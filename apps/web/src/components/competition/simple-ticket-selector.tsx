'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, Loader2, Clock, X } from 'lucide-react';
import { formatPrice } from '@winucard/shared/utils';

// TODO: Rendre les paliers de bonus configurables depuis l'admin
const BONUS_TIERS = [
  { minTickets: 10, bonusTickets: 1 },
  { minTickets: 15, bonusTickets: 2 },
  { minTickets: 20, bonusTickets: 3 },
  { minTickets: 25, bonusTickets: 4 },
  { minTickets: 50, bonusTickets: 5 },
];

// Preset buttons for row 2
const PRESET_BUTTONS = [15, 20, 25, 50];

function getBonusTickets(quantity: number): number {
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
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const [isProceeding, setIsProceeding] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<{
    ticketNumbers: number[];
    expiresAt: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Effective max considers user's existing tickets
  const remainingAllowance = maxTicketsPerUser - userTicketCount;
  const maxQuantity = Math.min(remainingAllowance, availableTicketCount, 100);

  const bonusTickets = getBonusTickets(quantity);
  const totalTickets = quantity + bonusTickets;
  const totalPrice = quantity * ticketPrice;

  // Quick select buttons (1-10)
  const quickButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Determine which row/button is selected
  const isRow1Selected = quantity >= 1 && quantity <= 10 && !showOtherInput;
  const isPresetSelected = PRESET_BUTTONS.includes(quantity) && !showOtherInput;
  const isOtherSelected = showOtherInput && otherValue !== '';

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

  // Auto-focus other input when opened
  useEffect(() => {
    if (showOtherInput && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [showOtherInput]);

  const handleRow1Select = (num: number) => {
    if (num <= maxQuantity) {
      setQuantity(num);
      setShowOtherInput(false);
      setOtherValue('');
      setReservationError(null);
    }
  };

  const handlePresetSelect = (num: number) => {
    if (num <= maxQuantity) {
      setQuantity(num);
      setShowOtherInput(false);
      setOtherValue('');
      setReservationError(null);
    }
  };

  const handleOtherClick = () => {
    setShowOtherInput(true);
  };

  const handleOtherClose = () => {
    setShowOtherInput(false);
    setOtherValue('');
    // Reset to last valid selection if needed
    if (!PRESET_BUTTONS.includes(quantity) && (quantity < 1 || quantity > 10)) {
      setQuantity(1);
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherValue(value);

    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= maxQuantity) {
      setQuantity(num);
      setReservationError(null);
    }
  };

  const proceedToCheckout = async () => {
    if (quantity === 0) return;
    setIsProceeding(true);
    setReservationError(null);

    if (!isAuthenticated) {
      sessionStorage.setItem(
        `pending_quantity_${competitionId}`,
        JSON.stringify({ quantity, timestamp: Date.now() })
      );
      router.push(`/competitions/${competitionSlug}/question`);
      return;
    }

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

  return (
    <div className="space-y-5">
      {/* CSS for styling */}
      <style>{`
        .ticket-other-input::-webkit-inner-spin-button,
        .ticket-other-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .ticket-other-input {
          -moz-appearance: textfield;
        }
        .ticket-btn {
          transition: all 0.2s ease-out !important;
        }
        .ticket-btn:hover:not(:disabled):not(.selected) {
          background: #F7F7FA !important;
          border-color: ${categoryColor}4D !important;
        }
        .ticket-btn.selected {
          background: linear-gradient(135deg, #1a1a2e, #2a2e4e) !important;
          transform: scale(1.05);
          box-shadow: 0 4px 14px rgba(26, 26, 46, 0.2) !important;
        }
        .ticket-btn:active:not(:disabled) {
          transform: scale(0.92);
        }
        .preset-btn {
          transition: all 0.2s ease-out !important;
        }
        .preset-btn:hover:not(:disabled):not(.selected) {
          background: #F7F7FA !important;
          border-color: ${categoryColor}4D !important;
        }
        .preset-btn.selected {
          background: linear-gradient(135deg, #1a1a2e, #2a2e4e) !important;
          transform: scale(1.05);
          box-shadow: 0 4px 14px rgba(26, 26, 46, 0.2) !important;
        }
        .preset-btn:active:not(:disabled) {
          transform: scale(0.92);
        }
        .other-btn:hover {
          background: #F7F7FA !important;
          border-style: solid !important;
        }
        .checkout-btn {
          background: linear-gradient(135deg, #1a1a2e, #2a2e4e) !important;
          position: relative;
          overflow: hidden;
        }
        .checkout-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
        }
        .checkout-btn:hover:not(:disabled)::after {
          left: 100%;
        }
        .checkout-btn:hover:not(:disabled) {
          box-shadow: 0 12px 36px rgba(26, 26, 46, 0.3) !important;
        }
        .checkout-btn:hover:not(:disabled) .checkout-arrow {
          transform: translateX(4px);
        }
        @keyframes bonusFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; text-shadow: 0 0 8px rgba(240, 185, 11, 0.5); }
        }
        .bonus-flash {
          animation: bonusFlash 0.4s ease;
        }
      `}</style>

      {/* Select Tickets Label */}
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
        Select tickets
      </p>

      {/* Row 1: Buttons 1-10 */}
      <div className="flex flex-wrap gap-2">
        {quickButtons.map((num) => {
          const isSelected = quantity === num && isRow1Selected;
          const isDisabled = num > maxQuantity;

          return (
            <button
              key={num}
              onClick={() => handleRow1Select(num)}
              disabled={isDisabled}
              className={`ticket-btn ${isSelected ? 'selected' : ''}`}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                border: isSelected ? 'none' : '1.5px solid rgba(0, 0, 0, 0.08)',
                background: isSelected ? 'linear-gradient(135deg, #1a1a2e, #2a2e4e)' : '#ffffff',
                color: isSelected ? '#ffffff' : isDisabled ? '#9a9eb0' : '#1a1a2e',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Row 2: Presets + Other */}
      <div className="flex flex-wrap gap-2 items-end">
        {PRESET_BUTTONS.map((num) => {
          const isSelected = quantity === num && isPresetSelected;
          const isDisabled = num > maxQuantity;
          const bonusForPreset = getBonusTickets(num);

          return (
            <div key={num} className="flex flex-col items-center">
              <button
                onClick={() => handlePresetSelect(num)}
                disabled={isDisabled}
                className={`preset-btn ${isSelected ? 'selected' : ''}`}
                style={{
                  height: '44px',
                  padding: '0 20px',
                  borderRadius: '12px',
                  border: isSelected ? 'none' : '1.5px solid rgba(0, 0, 0, 0.08)',
                  background: isSelected ? 'linear-gradient(135deg, #1a1a2e, #2a2e4e)' : '#ffffff',
                  color: isSelected ? '#ffffff' : isDisabled ? '#9a9eb0' : '#1a1a2e',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                {num}
              </button>
              {bonusForPreset > 0 && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#F0B90B',
                    marginTop: '3px',
                  }}
                >
                  +{bonusForPreset} free
                </span>
              )}
            </div>
          );
        })}

        {/* Other button / Input */}
        {showOtherInput ? (
          <div className="flex items-center gap-1">
            <input
              ref={otherInputRef}
              type="number"
              min={1}
              max={maxQuantity}
              value={otherValue}
              onChange={handleOtherChange}
              placeholder="Qty"
              className="ticket-other-input"
              style={{
                width: '80px',
                height: '44px',
                borderRadius: '10px',
                border: '1.5px solid rgba(240, 185, 11, 0.3)',
                background: isOtherSelected ? '#1a1a2e' : '#F7F7FA',
                color: isOtherSelected ? '#ffffff' : 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
                textAlign: 'center',
                outline: 'none',
                boxShadow: isOtherSelected ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            />
            <button
              onClick={handleOtherClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.06)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleOtherClick}
            className="other-btn"
            style={{
              height: '44px',
              padding: '0 20px',
              borderRadius: '10px',
              border: '1px dashed rgba(0, 0, 0, 0.15)',
              background: '#F7F7FA',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Other
          </button>
        )}
      </div>

      {/* Bonus Offers - Compact Chips */}
      <div>
        <p style={{ fontSize: '10px', color: '#9a9eb0', marginBottom: '6px' }}>
          Buy more, get free tickets:
        </p>
        <div className="flex items-center" style={{ gap: '6px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {BONUS_TIERS.map((tier) => {
            const isActive = bonusTickets === tier.bonusTickets && quantity >= tier.minTickets;
            const isAbove = quantity < tier.minTickets;

            return (
              <div
                key={tier.minTickets}
                className="bonus-chip"
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(240, 185, 11, 0.1)' : '#ffffff',
                  border: isActive
                    ? '1.5px solid #F0B90B'
                    : '1px solid rgba(240, 185, 11, 0.15)',
                  boxShadow: isActive ? '0 2px 8px rgba(240, 185, 11, 0.12)' : 'none',
                  opacity: isAbove ? 0.5 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'default',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 400,
                    color: isActive ? '#1a1a2e' : '#6b7088',
                  }}
                >
                  {tier.minTickets}→
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#E8A000',
                  }}
                >
                  +{tier.bonusTickets}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total Price with Bonus Info - Highlighted container */}
      <div
        style={{
          padding: '12px 20px',
          borderRadius: '12px',
          background: 'rgba(240, 185, 11, 0.04)',
          border: '1px solid rgba(240, 185, 11, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '14px', color: '#6b7088' }}>Total:</span>
        <span style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e' }}>
          {formatPrice(totalPrice)}
        </span>
        <span style={{ fontSize: '14px', color: '#6b7088' }}>
          — {totalTickets} ticket{totalTickets > 1 ? 's' : ''}
        </span>
        {bonusTickets > 0 && (
          <span
            className="bonus-flash"
            style={{
              color: '#F0B90B',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            (+{bonusTickets} free!)
          </span>
        )}
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

      {/* Checkout Button - Premium */}
      <button
        onClick={proceedToCheckout}
        disabled={quantity === 0 || isProceeding || maxQuantity === 0 || sessionStatus === 'loading'}
        className="w-full flex items-center justify-center gap-2 checkout-btn"
        style={{
          padding: '18px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1a1a2e, #2a2e4e)',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 600,
          cursor: quantity === 0 || isProceeding || maxQuantity === 0 ? 'not-allowed' : 'pointer',
          opacity: quantity === 0 || isProceeding || maxQuantity === 0 ? 0.6 : 1,
          transition: 'all 0.3s',
          boxShadow: '0 8px 28px rgba(26, 26, 46, 0.2)',
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
            <ArrowRight className="h-5 w-5 checkout-arrow" style={{ transition: 'transform 0.2s' }} />
          </>
        )}
      </button>

      {/* Availability Info */}
      <p style={{ fontSize: '12px', color: '#9a9eb0', textAlign: 'center' }}>
        {availableTicketCount.toLocaleString('en-GB')} tickets available · Max {maxTicketsPerUser} per person
      </p>
    </div>
  );
}
