'use client';

import { useEffect, useRef } from 'react';
import {
  trackViewItem,
  trackPurchase,
  type CompetitionItem,
} from '@/lib/analytics-events';

/**
 * Fire-and-forget trackers for server-rendered pages, which cannot call gtag
 * themselves. Each renders nothing.
 */

export function TrackViewItem({ competition }: { competition: CompetitionItem }) {
  const fired = useRef(false);
  useEffect(() => {
    // Strict Mode runs effects twice in dev; a ref keeps the event single.
    if (fired.current) return;
    fired.current = true;
    trackViewItem(competition);
  }, [competition]);
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
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPurchase(orderNumber, value, competition, quantity);
  }, [orderNumber, value, competition, quantity]);
  return null;
}
