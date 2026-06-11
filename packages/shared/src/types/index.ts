// User types
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

// Competition types
export type CompetitionCategory =
  | 'POKEMON'
  | 'ONE_PIECE'
  | 'SPORTS_BASKETBALL'
  | 'SPORTS_FOOTBALL'
  | 'SPORTS_OTHER'
  | 'MEMORABILIA'
  | 'YUGIOH'
  | 'MTG'
  | 'OTHER';

export type CompetitionStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'ACTIVE'
  | 'SOLD_OUT'
  | 'DRAWING'
  | 'COMPLETED'
  | 'CANCELLED';

// Ticket types
export type TicketStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'FREE_ENTRY';

// Payment types
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

// Multi-draw prize type
export interface CompetitionPrize {
  position: number;
  title: string;
  value: number;
  imageUrl?: string;
  certification?: string;
  grade?: string;
  description?: string;
}
