'use client';

import { useEffect, useRef } from 'react';
import { CONSENT_EVENT, GA_READY_EVENT } from '@/components/common/analytics';
import {
  trackViewItem,
  trackPurchase,
  type CompetitionItem,
} from '@/lib/analytics-events';

/**
 * Fires an event once, as soon as GA is actually available.
 *
 * On a first visit the cookie banner is still up when the page mounts, so
 * gtag does not exist yet and a plain effect would drop the event — losing
 * precisely the visitors who matter most, the new ones arriving from a shared
 * link. So: fire now if GA is ready, otherwise wait until it is.
 *
 * Both events are watched. Consent alone does not mean gtag exists — the tag
 * still has to load — so ga-ready is the one that usually lands; the consent
 * event just covers the case where GA was already loaded. Declining means it
 * never fires, which is the point.
 */
function useTrackOnce(fire: () => void) {
  const done = useRef(false);
  // Kept in a ref so the effect never re-runs just because the caller passed a
  // fresh closure — this must happen exactly once per page view.
  const fireRef = useRef(fire);
  fireRef.current = fire;

  useEffect(() => {
    const attempt = () => {
      if (done.current) return;
      if (typeof window.gtag !== 'function') return;
      done.current = true;
      fireRef.current();
    };

    attempt();
    if (done.current) return;

    window.addEventListener(CONSENT_EVENT, attempt);
    window.addEventListener(GA_READY_EVENT, attempt);
    return () => {
      window.removeEventListener(CONSENT_EVENT, attempt);
      window.removeEventListener(GA_READY_EVENT, attempt);
    };
  }, []);
}

export function TrackViewItem({ competition }: { competition: CompetitionItem }) {
  useTrackOnce(() => trackViewItem(competition));
  return null;
}

export function TrackPurchase({
  orderNumber,
  value,
  competition,
  quantity,
}: {
  orderNumber: string;
  value: number;
  competition: CompetitionItem;
  quantity: number;
}) {
  useTrackOnce(() => trackPurchase(orderNumber, value, competition, quantity));
  return null;
}
