import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Re-exported (not re-implemented) so the money path (this file, used by
// create-session) and the UI display (simple-ticket-selector, checkout-client)
// can never drift out of sync — a prior inline duplicate here caused exactly
// that bug (see tests/unit/drop-ui.test.ts).
export { calculateBonusTickets } from '@winucard/shared/utils';

// Generate order number: LTC-YYYYMMDD-XXXXXXXX
// 8 hex chars from CSPRNG (~4.3B space/day). Uniqueness is still guaranteed by the
// DB @unique constraint + a retry at the call site; this just makes collisions
// astronomically unlikely in the first place.
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  const random = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `LTC-${dateStr}-${random}`;
}
