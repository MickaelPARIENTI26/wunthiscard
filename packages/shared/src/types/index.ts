// User types
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type TokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'ACCOUNT_UNLOCK';

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

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Audit log types
export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOCKED'
  | 'USER_UNLOCKED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'TICKET_RESERVED'
  | 'TICKET_RELEASED'
  | 'TICKET_PURCHASED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'DRAW_EXECUTED'
  | 'COMPETITION_CREATED'
  | 'COMPETITION_UPDATED'
  | 'COMPETITION_STATUS_CHANGED'
  | 'COMPETITION_DELETED'
  | 'REFUND_ISSUED'
  | 'SETTINGS_CHANGED'
  | 'FREE_ENTRY_ADDED';
