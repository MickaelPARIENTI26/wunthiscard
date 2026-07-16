import { CURRENCY, LOCALE, DEFAULT_BONUS_TIERS } from '../constants/index.js';

/**
 * Format a price in GBP
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
  }).format(amount);
}

/**
 * Format a date in UK format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date and time in UK format
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Calculate bonus tickets based on tickets purchased
 */
export function calculateBonusTickets(
  ticketsBought: number,
  bonusTiers = DEFAULT_BONUS_TIERS
): number {
  let bonus = 0;
  for (const tier of bonusTiers) {
    if (ticketsBought >= tier.ticketsBought) {
      bonus = tier.bonusTickets;
    }
  }
  return bonus;
}

/**
 * Calculate total price for tickets
 */
export function calculateTotalPrice(ticketCount: number, ticketPrice: number): number {
  return ticketCount * ticketPrice;
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(prefix = 'LTC'): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Anonymize winner name with full masking: "John Doe" -> "J*** D***"
 * Handles special characters and accents properly
 */
export function anonymizeWinnerName(firstName: string, lastName: string): string {
  const anonymizeWord = (word: string): string => {
    if (word.length <= 1) return word;
    return word.charAt(0) + '*'.repeat(word.length - 1);
  };
  return `${anonymizeWord(firstName)} ${anonymizeWord(lastName)}`;
}

/**
 * Calculate ticket sale progress percentage
 */
export function calculateProgress(sold: number, total: number | null): number {
  if (total === null || total === 0) return 0;
  return Math.round((sold / total) * 100);
}

