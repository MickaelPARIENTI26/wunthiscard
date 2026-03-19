'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, Loader2, Clock, Minus, Plus, Gift } from 'lucide-react';
import { formatPrice } from '@winucard/shared/utils';

// Default ticket packs
const DEFAULT_PACKS = [
  { name: 'Starter', tickets: 5, bonus: 0, badge: null },
  { name: 'Popular', tickets: 10, bonus: 1, badge: 'Most Popular' as const },
  { name: 'Best Value', tickets: 20, bonus: 3, badge: 'Best Value' as const },
  { name: 'Ultimate', tickets: 50, bonus: 5, badge: null },
];

type PackBadge = 'Most Popular' | 'Best Value' | null;

interface TicketPack {
  name: string;
  tickets: number;
  bonus: number;
  badge: PackBadge;
}

function getBonusForQuantity(quantity: number, packs: TicketPack[]): number {
  // Find the best matching pack for the exact quantity
  const exactPack = packs.find(p => p.tickets === quantity);
  if (exactPack) return exactPack.bonus;
  // For custom quantities, find the highest applicable bonus
  let bonus = 0;
  for (const pack of packs) {
    if (quantity >= pack.tickets) {
      bonus = pack.bonus;
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
  referralFreeTickets?: number;
}

export function SimpleTicketSelector({
  competitionId,
  competitionSlug,
  ticketPrice,
  maxTicketsPerUser,
  availableTicketCount,
  userTicketCount = 0,
  categoryColor,
  referralFreeTickets = 0,
}: SimpleTicketSelectorProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session?.user;

  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [useReferralTicket, setUseReferralTicket] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<{
    ticketNumbers: number[];
    expiresAt: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const packs = DEFAULT_PACKS;

  // Effective max considers user's existing tickets
  const remainingAllowance = maxTicketsPerUser - userTicketCount;
  const maxQuantity = Math.min(remainingAllowance, availableTicketCount, 100);

  const bonusTickets = getBonusForQuantity(quantity, packs);
  const totalTickets = quantity + bonusTickets;
  const paidTickets = useReferralTicket ? Math.max(quantity - 1, 0) : quantity;
  const totalPrice = paidTickets * ticketPrice;

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

  const handleQuantityChange = (newQty: number) => {
    const clamped = Math.max(1, Math.min(newQty, maxQuantity));
    setQuantity(clamped);
    setSelectedPack(null); // Deselect pack when manually changing
    setReservationError(null);
  };

  const handlePackSelect = (pack: TicketPack) => {
    if (pack.tickets > maxQuantity) return;
    setQuantity(pack.tickets);
    setSelectedPack(pack.name);
    setReservationError(null);
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
      if (useReferralTicket) {
        sessionStorage.setItem(`useReferralTicket_${competitionId}`, 'true');
      } else {
        sessionStorage.removeItem(`useReferralTicket_${competitionId}`);
      }
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
        setReservationError(data.error ?? 'Failed to reserve tickets');
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
      if (useReferralTicket) {
        sessionStorage.setItem(`useReferralTicket_${competitionId}`, 'true');
      } else {
        sessionStorage.removeItem(`useReferralTicket_${competitionId}`);
      }

      router.push(`/competitions/${competitionSlug}/question`);
    } catch {
      setReservationError('Network error. Please try again.');
      setIsProceeding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* CSS */}
      <style>{`
        .pack-card { transition: all 0.2s ease-out; }
        .pack-card:hover:not(.pack-disabled) { background: #F7F7FA !important; border-color: rgba(0,0,0,0.15) !important; }
        .pack-card.pack-selected { border: 2px solid #1A1A2E !important; box-shadow: 0 4px 14px rgba(0,0,0,0.1); transform: scale(1.02); }
        .pack-card:active:not(.pack-disabled) { transform: scale(0.98); }
        .pack-card:focus-visible, .checkout-btn:focus-visible, .qty-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .qty-input::-webkit-inner-spin-button,
        .qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .qty-input { -moz-appearance: textfield; }
        .checkout-btn {
          background: linear-gradient(135deg, #1a1a2e, #2a2e4e) !important;
          position: relative; overflow: hidden;
        }
        .checkout-btn::after {
          content: ''; position: absolute; top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.6s ease;
        }
        .checkout-btn:hover:not(:disabled)::after { left: 100%; }
        .checkout-btn:hover:not(:disabled) { box-shadow: 0 12px 36px rgba(26, 26, 46, 0.3) !important; }
      `}</style>

      {/* Referral Free Ticket Banner */}
      {referralFreeTickets > 0 && (
        <div>
          <div
            style={{
              background: 'rgba(240,185,11,0.08)',
              border: '1px solid rgba(240,185,11,0.2)',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1a1a2e',
            }}
          >
            <Gift style={{ width: '16px', height: '16px', color: '#F0B90B', flexShrink: 0 }} />
            <span>
              You have <strong>{referralFreeTickets}</strong> free ticket{referralFreeTickets > 1 ? 's' : ''} available from referrals
            </span>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
              fontSize: '13px',
              color: '#1a1a2e',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={useReferralTicket}
              onChange={(e) => setUseReferralTicket(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#F0B90B', cursor: 'pointer' }}
            />
            Use 1 free ticket
          </label>
        </div>
      )}

      {/* Title */}
      <p id="ticket-selector-label" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
        Choose your tickets
      </p>

      {/* Custom Quantity Selector */}
      <div
        className="flex items-center gap-3"
        role="group"
        aria-labelledby="ticket-selector-label"
      >
        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            border: '1.5px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
            opacity: quantity <= 1 ? 0.4 : 1,
            transition: 'all 0.15s',
          }}
        >
          <Minus style={{ width: '16px', height: '16px' }} />
        </button>

        <input
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) handleQuantityChange(v);
          }}
          className="qty-input"
          aria-label="Ticket quantity"
          style={{
            width: '64px',
            height: '44px',
            borderRadius: '10px',
            border: '1.5px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />

        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={quantity >= maxQuantity}
          aria-label="Increase quantity"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            border: '1.5px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: quantity >= maxQuantity ? 'not-allowed' : 'pointer',
            opacity: quantity >= maxQuantity ? 0.4 : 1,
            transition: 'all 0.15s',
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
        </button>

        <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '4px' }}>
          {formatPrice(quantity * ticketPrice)} total
        </span>
      </div>

      {/* Recommended Packs */}
      <div>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Recommended packs
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {packs.map((pack) => {
            const isSelected = selectedPack === pack.name;
            const isDisabled = pack.tickets > maxQuantity;
            const totalPackTickets = pack.tickets + pack.bonus;
            const fullPrice = totalPackTickets * ticketPrice;
            const actualPrice = pack.tickets * ticketPrice;
            const savings = fullPrice - actualPrice;

            return (
              <button
                key={pack.name}
                onClick={() => handlePackSelect(pack)}
                disabled={isDisabled}
                className={`pack-card relative flex flex-col items-center text-center ${isSelected ? 'pack-selected' : ''} ${isDisabled ? 'pack-disabled' : ''}`}
                style={{
                  padding: '16px 12px',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid #1A1A2E' : '1.5px solid rgba(0,0,0,0.08)',
                  background: '#ffffff',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  minHeight: '160px',
                }}
              >
                {/* Badge */}
                {pack.badge && (
                  <span
                    className="absolute"
                    style={{
                      top: '-10px',
                      right: '-10px',
                      background: pack.badge === 'Most Popular' ? '#F0B90B' : '#16A34A',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pack.badge}
                  </span>
                )}

                {/* Pack name */}
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {pack.name}
                </span>

                {/* Ticket count */}
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {totalPackTickets}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-faded)', marginBottom: '2px' }}>
                  tickets
                </span>

                {/* Bonus info */}
                {pack.bonus > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#16A34A', marginBottom: '6px' }}>
                    ({pack.bonus} free)
                  </span>
                )}
                {pack.bonus === 0 && <div style={{ height: '17px' }} />}

                {/* Strikethrough price */}
                {pack.bonus > 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--text-faded)', textDecoration: 'line-through' }}>
                    {formatPrice(fullPrice)}
                  </span>
                )}

                {/* Actual price */}
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatPrice(actualPrice)}
                </span>

                {/* Savings */}
                {savings > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#16A34A', marginTop: '2px' }}>
                    Save {formatPrice(savings)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Total Price */}
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
          <span style={{ color: 'var(--accent-text)', fontWeight: 700, fontSize: '14px' }}>
            ({bonusTickets} free!)
          </span>
        )}
        {useReferralTicket && (
          <span style={{ color: '#16A34A', fontWeight: 600, fontSize: '13px' }}>
            (1 referral ticket applied)
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
          role="alert"
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
            <ArrowRight className="h-5 w-5" style={{ transition: 'transform 0.2s' }} />
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
