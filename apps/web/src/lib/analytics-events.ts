/**
 * GA4 ecommerce events.
 *
 * Every call is a no-op unless the visitor accepted cookies AND
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is set — <Analytics> only defines window.gtag
 * once both hold, so the guard here is simply "does gtag exist". Nothing needs
 * to know whether analytics is configured; callers just fire away.
 */

export interface CompetitionItem {
  id: string;
  name: string;
  category: string;
  /** Per-ticket price in GBP. */
  price: number;
}

function send(event: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}

function toItem(c: CompetitionItem, quantity = 1) {
  return {
    item_id: c.id,
    item_name: c.name,
    item_category: c.category,
    price: c.price,
    quantity,
  };
}

/** Competition detail page opened. */
export function trackViewItem(c: CompetitionItem): void {
  send('view_item', { currency: 'GBP', value: c.price, items: [toItem(c)] });
}

/** Quantity chosen and the funnel entered. */
export function trackBeginCheckout(c: CompetitionItem, quantity: number): void {
  send('begin_checkout', {
    currency: 'GBP',
    value: Number((c.price * quantity).toFixed(2)),
    items: [toItem(c, quantity)],
  });
}

/**
 * Order paid.
 *
 * Deduplicated on the order number: the success page is a normal URL, so a
 * refresh or a back-then-forward would otherwise report the same sale twice
 * and inflate revenue. sessionStorage is enough — GA also dedupes on
 * transaction_id, but only within a window, and being wrong about revenue is
 * the one thing analytics must not do.
 */
export function trackPurchase(
  orderNumber: string,
  value: number,
  c: CompetitionItem,
  quantity: number
): void {
  if (typeof window === 'undefined') return;
  const key = `ga_purchase_${orderNumber}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Private mode with storage blocked: still report rather than lose the sale.
  }
  send('purchase', {
    transaction_id: orderNumber,
    currency: 'GBP',
    value,
    items: [toItem(c, quantity)],
  });
}

/** Free entry submitted — no revenue, but it is the other conversion. */
export function trackFreeEntry(c: CompetitionItem): void {
  send('free_entry', { currency: 'GBP', value: 0, items: [toItem(c)] });
}

/** Account created. */
export function trackSignUp(method: 'credentials' | 'google'): void {
  send('sign_up', { method });
}

/** Waiting-list email captured on the coming-soon gate. */
export function trackWaitlistSignup(): void {
  send('generate_lead', { currency: 'GBP', value: 0 });
}
