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
export function generateOrderNumber(prefix = 'WTC'): string {
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
 * Anonymize a name for public display (e.g., "John D.")
 */
export function anonymizeName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName.charAt(0)}.`;
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
 * Check if a user is at least 18 years old
 */
export function isAdult(dateOfBirth: Date | string): boolean {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
}

/**
 * Calculate time remaining until a date
 */
export function getTimeRemaining(endDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const total = end.getTime() - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

/**
 * Calculate ticket sale progress percentage
 */
export function calculateProgress(sold: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((sold / total) * 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
