import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';

/**
 * Coverage for the Stripe fulfilment path — the single most money-critical function
 * in the app (apps/web/src/lib/fulfill-checkout.ts), shared by the webhook AND the
 * checkout success page. Until now it had ZERO automated coverage (audit #13).
 *
 * Two layers:
 *  1. The pure payment guards (isSessionPaid / isChargedAmountValid) — these are the
 *     fail-closed checks behind the P0 "free tickets without paying" fix and the
 *     amount-tampering guard. Tested directly, no mocking.
 *  2. fulfillCheckoutSession's refusal + idempotency behaviour — driven through the
 *     REAL function with its DB/Redis/email deps mocked, asserting it never assigns
 *     tickets or emails a buyer when payment isn't proven, and never double-processes.
 */

// Mock fulfil-checkout's side-effecting deps. vi.mock is hoisted above the import below.
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    order: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
    user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    competition: { update: vi.fn() },
  },
}));

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/redis', () => ({
  releaseTicketsFromRedis: vi.fn(),
  clearQcmPassed: vi.fn(),
}));
vi.mock('@/lib/email', () => ({
  sendPurchaseConfirmationEmail: vi.fn(),
  sendReferralRewardEmail: vi.fn(),
}));

import {
  fulfillCheckoutSession,
  isSessionPaid,
  isChargedAmountValid,
} from '@/lib/fulfill-checkout';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

// A PENDING order that should cost £29.80 (2980 pence).
const fakeOrder = {
  id: 'order_1',
  userId: 'user_1',
  orderNumber: 'WUC-0001',
  competitionId: 'comp_1',
  totalAmount: 29.8,
  paymentStatus: 'PENDING',
  competition: { id: 'comp_1', slug: 'card', title: 'Card', mainImageUrl: 'x', drawDate: new Date() },
  user: { email: 'buyer@example.com', firstName: 'Buyer' },
};

function makeSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    payment_status: 'paid',
    status: 'complete',
    amount_total: 2980,
    currency: 'gbp',
    metadata: { orderId: 'order_1', ticketNumbers: '[1,2]', bonusTickets: '0' },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function auditActions(): string[] {
  const calls = mockPrisma.auditLog.create.mock.calls as Array<[{ data: { action: string } }]>;
  return calls.map((c) => c[0].data.action);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.order.findUnique.mockResolvedValue(fakeOrder);
  mockPrisma.auditLog.create.mockResolvedValue({});
});

describe('isSessionPaid', () => {
  it('accepts a paid session', () => {
    expect(isSessionPaid({ payment_status: 'paid' })).toBe(true);
  });
  it('accepts no_payment_required (genuine zero-cost)', () => {
    expect(isSessionPaid({ payment_status: 'no_payment_required' })).toBe(true);
  });
  it('rejects an unpaid/open session (the P0 free-tickets hole)', () => {
    expect(isSessionPaid({ payment_status: 'unpaid' })).toBe(false);
  });
  it('rejects a session with no payment_status', () => {
    expect(isSessionPaid({ payment_status: null })).toBe(false);
  });
});

describe('isChargedAmountValid', () => {
  it('accepts an exact GBP match', () => {
    expect(isChargedAmountValid({ amount_total: 2980, currency: 'gbp' }, 2980)).toBe(true);
  });
  it('rejects underpayment (amount tampering)', () => {
    expect(isChargedAmountValid({ amount_total: 100, currency: 'gbp' }, 2980)).toBe(false);
  });
  it('rejects overpayment / any mismatch', () => {
    expect(isChargedAmountValid({ amount_total: 5000, currency: 'gbp' }, 2980)).toBe(false);
  });
  it('rejects a non-GBP currency', () => {
    expect(isChargedAmountValid({ amount_total: 2980, currency: 'usd' }, 2980)).toBe(false);
  });
  it('treats a null amount_total as unknown (other guards still apply)', () => {
    expect(isChargedAmountValid({ amount_total: null, currency: 'gbp' }, 2980)).toBe(true);
  });
});

describe('fulfillCheckoutSession — refusal & idempotency', () => {
  it('refuses an unpaid session: no transaction, no email, audit-logged', async () => {
    await fulfillCheckoutSession(makeSession({ payment_status: 'unpaid' }));
    expect(auditActions()).toContain('FULFILMENT_BLOCKED_UNPAID');
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(sendPurchaseConfirmationEmail).not.toHaveBeenCalled();
  });

  it('refuses an underpaid session: audit PAYMENT_AMOUNT_MISMATCH, no fulfilment', async () => {
    await fulfillCheckoutSession(makeSession({ amount_total: 100 }));
    expect(auditActions()).toContain('PAYMENT_AMOUNT_MISMATCH');
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(sendPurchaseConfirmationEmail).not.toHaveBeenCalled();
  });

  it('refuses a non-GBP session', async () => {
    await fulfillCheckoutSession(makeSession({ currency: 'usd' }));
    expect(auditActions()).toContain('PAYMENT_AMOUNT_MISMATCH');
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('does nothing when the session has no orderId', async () => {
    await fulfillCheckoutSession(makeSession({ metadata: {} }));
    expect(mockPrisma.order.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('is idempotent: an already-processed order (claim count 0) re-sends nothing', async () => {
    mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) =>
      cb({ order: { updateMany: () => Promise.resolve({ count: 0 }) } })
    );
    await fulfillCheckoutSession(makeSession());
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(sendPurchaseConfirmationEmail).not.toHaveBeenCalled();
  });
});

/**
 * The claim is an ALLOWLIST of statuses, not "anything but SUCCEEDED".
 *
 * REFUNDED is the one that costs money: re-fulfilling there would re-assign
 * tickets and mint fresh wheel spins for an order whose money has gone back.
 * CANCELLED is claimed separately because a cancelled order is still payable —
 * nothing expires the Stripe session — and paying it must take back the rewards
 * the cancellation handed out.
 */
describe('fulfillCheckoutSession — which statuses may still be fulfilled', () => {
  function captureClaims() {
    const claims: Record<string, unknown>[] = [];
    mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        order: {
          updateMany: (args: { where: Record<string, unknown> }) => {
            claims.push(args.where);
            return Promise.resolve({ count: 0 });
          },
        },
      })
    );
    return claims;
  }

  it('claims CANCELLED on its own, before the ordinary states', async () => {
    const claims = captureClaims();
    await fulfillCheckoutSession(makeSession());

    expect(claims[0]?.paymentStatus).toBe('CANCELLED');
    expect(claims[1]?.paymentStatus).toEqual({ in: ['PENDING', 'PROCESSING', 'FAILED'] });
  });

  it('never offers to fulfil a REFUNDED or SUCCEEDED order', async () => {
    const claims = captureClaims();
    await fulfillCheckoutSession(makeSession());

    const allowed = claims.flatMap((w) => {
      const status = w.paymentStatus as string | { in: string[] };
      return typeof status === 'string' ? [status] : status.in;
    });
    expect(allowed).not.toContain('REFUNDED');
    expect(allowed).not.toContain('SUCCEEDED');
  });

  it('keeps FAILED fulfillable, so a retried card still delivers', async () => {
    // Stripe fires payment_failed for the declined attempt before the retry
    // succeeds, so the order can legitimately be FAILED when payment lands.
    const claims = captureClaims();
    await fulfillCheckoutSession(makeSession());

    const second = claims[1]?.paymentStatus as { in: string[] };
    expect(second.in).toContain('FAILED');
  });
});
