import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Calculate bonus tickets based on quantity
export function calculateBonusTickets(quantity: number): number {
  if (quantity >= 50) return 5;
  if (quantity >= 20) return 3;
  if (quantity >= 15) return 2;
  if (quantity >= 10) return 1;
  return 0;
}

// Generate order number: WTC-YYYYMMDD-XXXXXXXX
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
  return `WTC-${dateStr}-${random}`;
}
