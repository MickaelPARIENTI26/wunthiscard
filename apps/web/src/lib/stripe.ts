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

// Generate order number: WTC-YYYYMMDD-XXXX
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WTC-${dateStr}-${random}`;
}
