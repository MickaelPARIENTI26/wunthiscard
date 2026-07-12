'use client';

import { useState, useEffect } from 'react';
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
  referralFreeTickets = 0,
}: SimpleTicketSelectorProps) {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Effective max considers the user's existing tickets. maxTicketsPerUser <= 0 means
  // "no per-user limit" — then only the stock and the 100-per-request cap apply.
  const remainingAllowance =
    maxTicketsPerUser > 0 ? maxTicketsPerUser - userTicketCount : availableTicketCount;
  const maxQuantity = Math.min(remainingAllowance, availableTicketCount, 100);

  // Default to a popular bonus-bearing bundle (10 → +1 bonus), clamped to what's allowed.
  const [quantity, setQuantity] = useState(() => Math.max(1, Math.min(10, maxQuantity)));
  const [customValue, setCustomValue] = useState(String(quantity));
  const [maxNote, setMaxNote] = useState(false);
  const [useReferralTicket, setUseReferralTicket] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  const bonusTickets = calculateBonusTickets(quantity);
  // A free referral ticket can only be applied when the user has one AND is buying
  // at least 2 tickets (so there's still a paid amount for Stripe).
  const canUseReferralTicket = referralFreeTickets > 0 && quantity >= 2;
  const referralApplied = useReferralTicket && canUseReferralTicket;
  const paidTickets = referralApplied ? quantity - 1 : quantity;

  // Restore a previously-chosen quantity when returning to this step (e.g. via
  // "Change tickets" on checkout) instead of resetting to the default. In an effect
  // (not initial state) to avoid a server/client hydration mismatch.
  useEffect(() => {
    let restored: number | null = null;
    try {
      const tickets = sessionStorage.getItem(`tickets_${competitionId}`);
      const pending = sessionStorage.getItem(`pending_quantity_${competitionId}`);
      if (tickets) restored = (JSON.parse(tickets) as number[]).length;
      else if (pending) restored = (JSON.parse(pending) as { quantity: number }).quantity;
    } catch {
      restored = null;
    }
    if (restored && restored >= 1) {
      setQuantity(Math.max(1, Math.min(restored, maxQuantity)));
    }
  }, [competitionId, maxQuantity]);

  // Keep the custom input in sync when quantity changes from the tiles/stepper.
  useEffect(() => {
    setCustomValue(String(quantity));
  }, [quantity]);

  const handleQuantityChange = (newQty: number) => {
    const clamped = Math.max(1, Math.min(newQty, maxQuantity));
    setMaxNote(newQty > maxQuantity);
    setQuantity(clamped);
  };

  const proceedToCheckout = () => {
    if (quantity === 0) return;
    setIsProceeding(true);

    // Skip the skill question if it was already answered for this competition.
    const nextStep =
      sessionStorage.getItem(`qcm_passed_${competitionId}`) === 'true' ? 'checkout' : 'question';

    // Stash the chosen quantity and reserve later (at checkout) — keeps "Enter now"
    // instant (no pre-navigation reserve, spinner or timer at the top of the funnel)
    // and removes the reservation-expiry dead-ends. Clear any stale reservation.
    sessionStorage.setItem(
      `pending_quantity_${competitionId}`,
      JSON.stringify({ quantity, timestamp: Date.now() })
    );
    sessionStorage.removeItem(`tickets_${competitionId}`);
    sessionStorage.removeItem(`reservation_${competitionId}`);
    if (referralApplied) {
      sessionStorage.setItem(`useReferralTicket_${competitionId}`, 'true');
    } else {
      sessionStorage.removeItem(`useReferralTicket_${competitionId}`);
    }

    router.push(`/competitions/${competitionSlug}/${nextStep}`);
  };

  const price = ticketPrice; // ticketPrice is stored in pounds
  const bundles = [1, 5, 10, 25, 50, 100];
  const bonus = bonusTickets;
  const displayTotal = (paidTickets * ticketPrice).toFixed(2);
  const ctaDisabled = isProceeding || quantity === 0 || sessionStatus === 'loading';

  return (
    <div className="inline-step">
      <div className="inline-step-head">
        <div>
          <div className="step-kicker">Step 1 of 3 · Pick your tickets</div>
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
              {b === 10 && !disabled && <div className="qty-tile-ribbon">BEST VALUE</div>}
              <div className="qty-tile-num">{b}</div>
              <div className="qty-tile-label">ticket{b > 1 ? 's' : ''}</div>
              {bb > 0 && <div className="qty-tile-bonus">+{bb}</div>}
              <div className="qty-tile-price">£{(b * price).toFixed(2)}</div>
              {bb > 0 && <div className="qty-tile-save">−{Math.round((bb / (b + bb)) * 100)}% off</div>}
            </button>
          );
        })}
      </div>

      {/* Custom stepper */}
      <div className="qty-custom">
        <span className="qty-custom-label">Custom</span>
        <div className="qty-stepper">
          <button type="button" aria-label="Decrease quantity" onClick={() => handleQuantityChange(quantity - 1)}>−</button>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Ticket quantity"
            value={customValue}
            onChange={e => {
              const v = e.target.value;
              setCustomValue(v);
              if (v === '') return; // allow an empty field while editing
              const n = parseInt(v, 10);
              if (!Number.isNaN(n)) handleQuantityChange(n);
            }}
            onBlur={() => setCustomValue(String(quantity))}
            min={1}
            max={maxQuantity}
          />
          <button type="button" aria-label="Increase quantity" onClick={() => handleQuantityChange(quantity + 1)}>+</button>
        </div>
        <span className="qty-custom-max">
          {maxNote ? `Max ${maxQuantity} per person` : `Max ${maxQuantity}${bonus > 0 ? ` · +${bonus} bonus` : ''}`}
        </span>
      </div>

      {/* Free referral ticket toggle (only for users who have earned one) */}
      {referralFreeTickets > 0 && (
        <label
          className="check-row"
          style={{
            marginTop: '14px',
            padding: '12px 14px',
            border: '1.5px solid var(--ink)',
            borderRadius: '10px',
            background: referralApplied ? 'rgba(0, 199, 106, 0.08)' : 'var(--surface)',
            cursor: canUseReferralTicket ? 'pointer' : 'not-allowed',
            opacity: canUseReferralTicket ? 1 : 0.6,
            alignItems: 'center',
          }}
        >
          <input
            type="checkbox"
            className="checkbox"
            checked={referralApplied}
            disabled={!canUseReferralTicket}
            onChange={(e) => setUseReferralTicket(e.target.checked)}
          />
          <span>
            🎁 Use 1 free referral ticket{' '}
            <b>(you have {referralFreeTickets})</b>
            {!canUseReferralTicket && quantity < 2 && (
              <span style={{ color: 'var(--ink-faint)' }}> — buy 2+ tickets to apply</span>
            )}
          </span>
        </label>
      )}

      {/* Summary + CTA */}
      <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1.5px dashed var(--line-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px', fontSize: '14px' }}>
          <span>
            {quantity} ticket{quantity > 1 ? 's' : ''}
            {bonus > 0 ? <span style={{ color: 'var(--accent-2)', fontWeight: 700 }}> + {bonus} bonus (−{Math.round((bonus / (quantity + bonus)) * 100)}%)</span> : ''}
            {referralApplied ? <span style={{ color: 'var(--accent-2)', fontWeight: 700 }}> · 1 free referral</span> : ''}
          </span>
          <span style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em' }}>£{displayTotal}</span>
        </div>
        <button
          onClick={proceedToCheckout}
          disabled={ctaDisabled}
          className="btn btn-hot btn-xl btn-block"
          style={{ opacity: isProceeding ? 0.6 : 1 }}
        >
          {isProceeding ? 'Loading…' : `Enter now · £${displayTotal} →`}
        </button>
      </div>

      {/* Trust / reassurance — right where the user commits */}
      <div className="buy-trust">
        <div className="buy-trust-chips">
          <span>🔒 Secure payment</span>
          <span>✓ Graded &amp; authenticated</span>
          <span>🎲 Independent draw</span>
        </div>
        <p className="buy-trust-note">
          Skill-based prize competition — not a lottery. Free postal entry available ·{' '}
          <a href="/competition-rules" target="_blank" rel="noopener noreferrer">See rules</a>
        </p>
      </div>

      {/* Mobile sticky buy bar — keeps price + action in the thumb zone */}
      <div className="buy-sticky">
        <div className="buy-sticky-info">
          <span className="buy-sticky-qty">
            {quantity} ticket{quantity > 1 ? 's' : ''}{bonus > 0 ? ` +${bonus}` : ''}
          </span>
          <span className="buy-sticky-total">£{displayTotal}</span>
        </div>
        <button onClick={proceedToCheckout} disabled={ctaDisabled} className="btn btn-hot">
          {isProceeding ? 'Loading…' : 'Enter now →'}
        </button>
      </div>

    </div>
  );
}
