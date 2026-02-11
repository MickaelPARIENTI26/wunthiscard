// Ticket bonus tiers (default configuration)
export const DEFAULT_BONUS_TIERS = [
  { ticketsBought: 10, bonusTickets: 1 },
  { ticketsBought: 15, bonusTickets: 2 },
  { ticketsBought: 20, bonusTickets: 3 },
  { ticketsBought: 50, bonusTickets: 5 },
] as const;

// Bonus tiers for admin configuration
export const BONUS_TIERS = [
  { minTickets: 10, bonusPercent: 10 },
  { minTickets: 25, bonusPercent: 15 },
  { minTickets: 50, bonusPercent: 20 },
] as const;

// Limits
export const MAX_TICKETS_PER_USER_PER_COMPETITION = 50;
export const MAX_GALLERY_IMAGES = 10;
export const TICKET_RESERVATION_TTL_SECONDS = 300; // 5 minutes
export const QCM_MAX_ATTEMPTS = 3;
export const QCM_LOCKOUT_SECONDS = 900; // 15 minutes

// Auth
export const PASSWORD_MIN_LENGTH = 8;
export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_DURATION_MINUTES = 30;
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;
export const EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// Rate limiting
export const RATE_LIMITS = {
  login: { requests: 5, window: '15m' },
  signup: { requests: 3, window: '1h' },
  forgotPassword: { requests: 3, window: '1h' },
  ticketReserve: { requests: 10, window: '1m' },
  checkout: { requests: 5, window: '5m' },
  contact: { requests: 3, window: '1h' },
  globalAuth: { requests: 100, window: '1m' },
  globalUnauth: { requests: 30, window: '1m' },
} as const;

// Currency
export const CURRENCY = 'GBP';
export const CURRENCY_SYMBOL = '£';
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

// Payment statuses
export const PAYMENT_STATUSES = {
  PENDING: { label: 'Pending', color: 'yellow' },
  PROCESSING: { label: 'Processing', color: 'blue' },
  SUCCEEDED: { label: 'Succeeded', color: 'green' },
  FAILED: { label: 'Failed', color: 'red' },
  REFUNDED: { label: 'Refunded', color: 'purple' },
  CANCELLED: { label: 'Cancelled', color: 'gray' },
} as const;

// Delivery statuses
export const DELIVERY_STATUSES = {
  PENDING: 'Awaiting Claim',
  CLAIMED: 'Claimed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
} as const;

// Minimum age requirement (UK law)
export const MINIMUM_AGE = 18;

// Winner claim deadline in days
export const WINNER_CLAIM_DEADLINE_DAYS = 14;

// Order number prefix
export const ORDER_NUMBER_PREFIX = 'WTC';

// Default country
export const DEFAULT_COUNTRY = 'GB';
