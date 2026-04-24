'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Gift, Loader2 } from 'lucide-react';
import { formatPrice, calculateBonusTickets } from '@winucard/shared/utils';

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
  const totalPriceLabel = (totalPrice / 100).toFixed(2);

  const formatCountdown = useCallback((ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ':' + seconds.toString().padStart(2, '0');
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('tickets_' + competitionId);
    const reservationStored = sessionStorage.getItem('reservation_' + competitionId);
    const pendingQuantityStored = sessionStorage.getItem('pending_quantity_' + competitionId);
    const qcmPassedStored = sessionStorage.getItem('qcm_passed_' + competitionId);

    if (qcmPassedStored !== 'true') {
      router.push('/competitions/' + competitionSlug + '/question');
      return;
    }

    setQcmPassed(true);

    if (stored && reservationStored) {
      const res = JSON.parse(reservationStored);
      setSelectedTickets(JSON.parse(stored));
      setReservation(res);
      setIsLoading(false);
      return;
    }

    if (pendingQuantityStored) {
      const pending = JSON.parse(pendingQuantityStored);
      createReservation(pending.quantity);
      return;
    }

    if (stored) {
      const tickets = JSON.parse(stored) as number[];
      createReservation(tickets.length);
      return;
    }

    router.push('/competitions/' + competitionSlug + '/tickets');
  }, [competitionId, competitionSlug, router]);

  const createReservation = async (quantity: number) => {
    try {
      const response = await fetch('/api/tickets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Failed to reserve tickets. Please select tickets again.');
        setIsLoading(false);
        return;
      }

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

  useEffect(() => {
    if (!reservation) return;

    const updateCountdown = () => {
      const remaining = reservation.expiresAt - Date.now();
      if (remaining <= 0) {
        setCountdown('expired');
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
        body: JSON.stringify({
          competitionId,
          ticketNumbers: selectedTickets.length > 0 ? selectedTickets : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Failed to create checkout session');
        setIsProcessing(false);
        return;
      }

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '32px',
          background: 'var(--surface)',
          border: '1.5px solid var(--ink)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏱</div>
        <h3
          style={{
            fontFamily: 'var(--display)',
            fontSize: '22px',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          Session expired
        </h3>
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginBottom: '20px' }}>
          {error ?? 'Your ticket reservation has expired. Please select tickets again.'}
        </p>
        <button
          onClick={() => router.push('/competitions/' + competitionSlug + '/tickets')}
          className="btn btn-primary btn-xl"
        >
          Select tickets again →
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Timer + error row */}
      {countdown === 'expired' ? (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'var(--hot)',
            color: '#fff',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          ⏱ Timer expired — complete checkout now to try to keep your tickets
        </div>
      ) : countdown ? (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'var(--warn)',
            color: 'var(--ink)',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span>⏱ Tickets reserved</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700 }}>
            {countdown}
          </span>
        </div>
      ) : null}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'var(--hot)',
            color: '#fff',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {error}
        </div>
      )}

      {/* Order summary card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--ink)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          padding: '22px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '14px',
            paddingBottom: '16px',
            marginBottom: '16px',
            borderBottom: '1.5px dashed var(--line-2)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '72px',
              height: '92px',
              flexShrink: 0,
              overflow: 'hidden',
              border: '1.5px solid var(--ink)',
              borderRadius: '8px',
              boxShadow: '2px 2px 0 var(--ink)',
            }}
          >
            <Image src={mainImageUrl} alt={competitionTitle} fill className="object-cover" sizes="72px" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                fontWeight: 700,
                marginBottom: '4px',
              }}
            >
              Your order
            </div>
            <h3
              style={{
                fontFamily: 'var(--display)',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                marginBottom: '6px',
              }}
            >
              {competitionTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>
              {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
              {bonusTickets > 0 ? ` + ${bonusTickets} bonus` : ''}
            </p>
          </div>
        </div>

        {/* Ticket numbers */}
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--bg-2)',
            border: '1px dashed var(--line-2)',
            borderRadius: '8px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            Ticket numbers
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--mono)' }}>
            #{selectedTickets.sort((a, b) => a - b).join(', #')}
          </p>
        </div>

        {/* Price breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
            <span style={{ color: 'var(--ink-dim)' }}>
              {ticketCount} × {formatPrice(ticketPrice)}
            </span>
            <span style={{ fontWeight: 600 }}>{formatPrice(totalPrice)}</span>
          </div>
          {bonusTickets > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--accent-2)',
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Gift className="h-4 w-4" />
                Bonus tickets
              </span>
              <span>+{bonusTickets} FREE</span>
            </div>
          )}
        </div>
      </div>

      {/* Bonus banner */}
      {bonusTickets > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            marginBottom: '10px',
            background: 'var(--accent)',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-sm)',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            fontWeight: 700,
          }}
        >
          🎁 +{bonusTickets} bonus tickets · {totalEntries} total entries
        </div>
      )}

      {/* Pay panel */}
      <div className="enter-pay-panel">
        <div className="enter-pay-total">
          <span>Total</span>
          <b>£{totalPriceLabel}</b>
        </div>
        <div className="enter-pay-chips">
          <span>🔒 Pay with</span>
          <span className="pay-chip">Card</span>
        </div>
      </div>

      {/* Foot */}
      <div className="enter-step-foot">
        <span className="skill-hint">Secure payment powered by Stripe · SSL encrypted</span>
        <button
          onClick={handleCheckout}
          disabled={isProcessing || !qcmPassed}
          className={`btn ${isProcessing ? 'btn-mute' : 'btn-hot'} btn-xl`}
        >
          {isProcessing ? (
            <>
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }}
              />
              Redirecting...
            </>
          ) : (
            <>Pay £{totalPriceLabel} →</>
          )}
        </button>
      </div>

      {/* Terms note */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--ink-faint)',
          marginTop: '18px',
        }}
      >
        By completing this purchase, you agree to our{' '}
        <Link
          href="/terms"
          style={{ color: 'var(--ink)', textDecoration: 'underline', fontWeight: 700 }}
        >
          Terms
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          style={{ color: 'var(--ink)', textDecoration: 'underline', fontWeight: 700 }}
        >
          Privacy
        </Link>
        .
      </p>
    </div>
  );
}
