'use client';

import { useEffect } from 'react';

interface ClearCheckoutStorageProps {
  competitionId: string;
}

/**
 * After a successful purchase the server clears the skill-question pass, but the
 * browser still holds the per-competition checkout state in sessionStorage. Left
 * behind, a SECOND purchase in the same tab would route straight to checkout with a
 * stale qcm_passed flag and 400 with "Please answer the skill question first" — a
 * dead end. Clearing it here resets the funnel cleanly for a repeat buyer.
 *
 * Renders nothing; runs once on mount on the success page.
 */
export function ClearCheckoutStorage({ competitionId }: ClearCheckoutStorageProps) {
  useEffect(() => {
    if (!competitionId) return;
    try {
      sessionStorage.removeItem(`tickets_${competitionId}`);
      sessionStorage.removeItem(`reservation_${competitionId}`);
      sessionStorage.removeItem(`pending_quantity_${competitionId}`);
      sessionStorage.removeItem(`qcm_passed_${competitionId}`);
      sessionStorage.removeItem(`useReferralTicket_${competitionId}`);
    } catch {
      // sessionStorage can be unavailable (private mode / blocked); the stale-state
      // recovery in checkout-client handles the fallback, so this is best-effort.
    }
  }, [competitionId]);

  return null;
}
