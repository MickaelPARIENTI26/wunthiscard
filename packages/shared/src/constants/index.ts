export * from './countries.js';

// Ticket bonus tiers (default configuration). Chosen so the effective discount
// (bonusTickets / (ticketsBought + bonusTickets)) strictly increases at each of
// the six bundle sizes offered in the UI (1, 5, 10, 25, 50, 100) — 0%, 0%, 9.1%,
// 13.8%, 15.3%, 16.7% — so buying a bigger bundle is never a worse deal than a
// smaller one. 15/20 stay as intermediate steps for custom (non-bundle) quantities.
export const DEFAULT_BONUS_TIERS = [
  { ticketsBought: 10, bonusTickets: 1 },
  { ticketsBought: 15, bonusTickets: 2 },
  { ticketsBought: 20, bonusTickets: 3 },
  { ticketsBought: 25, bonusTickets: 4 },
  { ticketsBought: 50, bonusTickets: 9 },
  { ticketsBought: 100, bonusTickets: 20 },
] as const;

// Bonus tiers for admin configuration
export const BONUS_TIERS = [
  { minTickets: 10, bonusPercent: 10 },
  { minTickets: 25, bonusPercent: 15 },
  { minTickets: 50, bonusPercent: 20 },
] as const;

// Limits
export const DEFAULT_MAX_TICKETS_PER_USER_FREE = 1;

// Referral system
// A referrer earns exactly 1 free ticket per referee, the first time that
// referee makes a successful purchase (handled in the Stripe webhook). There is
// no per-ticket threshold anymore.
export const REFERRAL_CODE_LENGTH = 8;
export const MAX_REFERRALS_PER_USER = 100;

// Auth
export const MAX_LOGIN_ATTEMPTS = 5;

// Currency
export const CURRENCY = 'GBP';
export const LOCALE = 'en-GB';

// Competition categories with display names
export const COMPETITION_CATEGORIES = {
  POKEMON: 'Pokémon',
  ONE_PIECE: 'One Piece',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_OTHER: 'Other Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh!',
  MTG: 'Magic: The Gathering',
  OTHER: 'Other',
} as const;

// Competition status with display names
export const COMPETITION_STATUSES = {
  DRAFT: { label: 'Draft', color: 'gray' },
  UPCOMING: { label: 'Coming Soon', color: 'blue' },
  ACTIVE: { label: 'Live', color: 'green' },
  SOLD_OUT: { label: 'Sold Out', color: 'orange' },
  DRAWING: { label: 'Drawing', color: 'purple' },
  COMPLETED: { label: 'Completed', color: 'slate' },
  CANCELLED: { label: 'Cancelled', color: 'red' },
} as const;

// Minimum age requirement (UK law)
export const MINIMUM_AGE = 18;

// Winner claim deadline in days
export const WINNER_CLAIM_DEADLINE_DAYS = 14;
