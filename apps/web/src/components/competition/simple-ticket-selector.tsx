'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { calculateBonusTickets } from '@winucard/shared/utils';

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
  categoryColor: _categoryColor,
  referralFreeTickets: _referralFreeTickets = 0,
}: SimpleTicketSelectorProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session?.user;

  const [quantity, setQuantity] = useState(1);
  const [isProceeding, setIsProceeding] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<{
    ticketNumbers: number[];
    expiresAt: number;
  } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effective max considers user's existing tickets
  const remainingAllowance = maxTicketsPerUser - userTicketCount;
  const maxQuantity = Math.min(remainingAllowance, availableTicketCount, 100);

  const bonusTickets = calculateBonusTickets(quantity);
  const useReferralTicket = false;
  const paidTickets = useReferralTicket ? Math.max(quantity - 1, 0) : quantity;

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

  const price = ticketPrice / 100; // pence to pounds
  const bundles = [1, 5, 10, 25, 50, 100];
  const bonus = bonusTickets;
  const displayTotal = (paidTickets * ticketPrice / 100).toFixed(2);

  return (
    <div className="inline-step">
      <div className="inline-step-head">
        <span className="inline-step-num">01</span>
        <div>
          <div className="step-kicker">Pick your tickets</div>
          <h3 className="inline-step-title">How many do you want?</h3>
        </div>
      </div>

      {/* Qty tiles */}
      <div className="qty-grid qty-grid-6">
        {bundles.map(b => {
          const bb = calculateBonusTickets(b);
          const active = quantity === b;
          const disabled = b > maxQuantity;
          return (
            <button
              key={b}
              onClick={() => !disabled && handleQuantityChange(b)}
              className={`qty-tile ${active ? 'active' : ''}`}
              style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
              disabled={disabled}
            >
              <div className="qty-tile-num">{b}</div>
              <div className="qty-tile-label">ticket{b > 1 ? 's' : ''}</div>
              {bb > 0 && <div className="qty-tile-bonus">+{bb}</div>}
              <div className="qty-tile-price">£{(b * price).toFixed(2)}</div>
            </button>
          );
        })}
      </div>

      {/* Custom stepper */}
      <div className="qty-custom">
        <span className="qty-custom-label">Custom</span>
        <div className="qty-stepper">
          <button type="button" onClick={() => handleQuantityChange(quantity - 1)}>−</button>
          <input
            type="number"
            value={quantity}
            onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)}
            min={1}
            max={maxQuantity}
          />
          <button type="button" onClick={() => handleQuantityChange(quantity + 1)}>+</button>
        </div>
        <span className="qty-custom-max">Max {maxQuantity}{bonus > 0 ? ` · +${bonus} bonus` : ''}</span>
      </div>

      {/* Error */}
      {reservationError && (
        <div style={{ padding: '10px 14px', background: 'var(--hot)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid var(--ink)' }}>
          {reservationError}
        </div>
      )}

      {/* Summary + CTA */}
      <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1.5px dashed var(--line-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px', fontSize: '14px' }}>
          <span>{quantity} ticket{quantity > 1 ? 's' : ''}{bonus > 0 ? <span style={{ color: 'var(--accent-2)', fontWeight: 700 }}> + {bonus} bonus</span> : ''}</span>
          <span style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em' }}>£{displayTotal}</span>
        </div>
        <button
          onClick={proceedToCheckout}
          disabled={isProceeding || quantity === 0 || sessionStatus === 'loading'}
          className="btn btn-hot btn-xl btn-block"
          style={{ opacity: isProceeding ? 0.6 : 1 }}
        >
          {isProceeding ? 'Reserving...' : `Enter now · £${displayTotal} →`}
        </button>
      </div>

      {/* Reservation countdown */}
      {reservation && countdown && (
        <div style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: countdown === '0:00' ? 'var(--hot)' : 'var(--ink-dim)', marginTop: '8px' }}>
          {countdown === '0:00' ? 'Reservation expired' : `Tickets reserved for ${countdown}`}
        </div>
      )}

    </div>
  );
}
