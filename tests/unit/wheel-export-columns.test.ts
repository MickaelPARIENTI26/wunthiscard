import { describe, it, expect, vi } from 'vitest';

// The module reaches for the Prisma client at import time; the columns under
// test are pure and never touch it.
vi.mock('@/lib/db', () => ({ prisma: {} }));

const { WHEEL_EXPORT_COLUMNS } = await import('../../apps/admin/src/lib/wheel-results');

type Row = Parameters<(typeof WHEEL_EXPORT_COLUMNS)[number]['accessor']>[0];

function render(row: Row): Record<string, string | number> {
  return Object.fromEntries(WHEEL_EXPORT_COLUMNS.map((c) => [c.header, c.accessor(row)]));
}

const FULL = {
  id: 'spin_1',
  spunAt: new Date('2026-08-31T09:23:00Z'),
  resultType: 'PERCENT_OFF',
  resultValue: 10,
  userId: 'usr_1',
  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  order: { orderNumber: 'WUP-1234', ticketCount: 6 },
  promoCode: { code: 'W10-ABCDEFGHJK', redeemedAt: new Date('2026-09-01T00:00:00Z') },
  jackpotWin: null,
} as unknown as Row;

describe('wheel export columns', () => {
  it('renders a complete row', () => {
    const r = render(FULL);
    expect(r.email).toBe('john@example.com');
    expect(r.order_number).toBe('WUP-1234');
    expect(r.tickets_in_order).toBe(6);
    expect(r.result).toBe('10% OFF');
    expect(r.promo_code).toBe('W10-ABCDEFGHJK');
    expect(r.promo_status).toBe('used');
    expect(r.jackpot_status).toBe('');
  });

  it('marks an unredeemed code unused, not blank', () => {
    // Blank would be indistinguishable from "no code was won at all".
    const r = render({ ...FULL, promoCode: { code: 'W5-XYZ', redeemedAt: null } } as Row);
    expect(r.promo_status).toBe('unused');
  });

  it('survives a deleted account without dropping the row', () => {
    // GDPR erasure nulls the user but the spin stays: the operator still needs
    // to see that the reward was drawn.
    const r = render({ ...FULL, userId: null, user: null, order: null } as unknown as Row);
    expect(r.user_id).toBe('');
    expect(r.email).toBe('');
    expect(r.order_number).toBe('');
    expect(r.tickets_in_order).toBe(0);
    expect(r.result).toBe('10% OFF');
  });

  it('carries the jackpot status through', () => {
    const r = render({
      ...FULL,
      resultType: 'JACKPOT',
      resultValue: 0,
      promoCode: null,
      jackpotWin: { status: 'SHIPPED' },
    } as unknown as Row);
    expect(r.result).toBe('Graded Card');
    expect(r.jackpot_status).toBe('SHIPPED');
    expect(r.promo_code).toBe('');
    expect(r.promo_status).toBe('');
  });
});
