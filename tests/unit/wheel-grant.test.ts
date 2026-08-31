import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ prisma: {} }));
vi.mock('@/lib/email', () => ({
  sendJackpotAlertEmail: vi.fn(),
  sendJackpotFrozenAlertEmail: vi.fn(),
  sendJackpotWinnerEmail: vi.fn(),
}));

const { grantSpinsForOrder } = await import('../../apps/web/src/lib/wheel');

/**
 * One spin per PAID ticket is the rule the whole feature rests on — it is what
 * keeps the free postal entry route free of any purchase advantage.
 */
function fakeClient(opts: {
  paymentStatus?: string;
  enabled?: boolean;
  tickets?: number;
  userId?: string | null;
}) {
  const created: { data: unknown[] } = { data: [] };
  const client = {
    order: {
      findUnique: () =>
        Promise.resolve({
          id: 'o1',
          userId: opts.userId === undefined ? 'u1' : opts.userId,
          paymentStatus: opts.paymentStatus ?? 'SUCCEEDED',
          competitionId: 'c1',
          competition: {
            drawDate: new Date('2026-12-01'),
            wheelConfig: { id: 'wc1', enabled: opts.enabled ?? true },
          },
        }),
    },
    ticket: {
      findMany: () =>
        Promise.resolve(
          Array.from({ length: opts.tickets ?? 0 }, (_, i) => ({ id: `t${i + 1}` }))
        ),
    },
    wheelSpin: {
      createMany: ({ data }: { data: unknown[] }) => {
        created.data = data;
        return Promise.resolve({ count: data.length });
      },
    },
  };
  return { client, created };
}

describe('grantSpinsForOrder — one spin per paid ticket, and not one more', () => {
  it('grants one per paid ticket', async () => {
    const { client, created } = fakeClient({ tickets: 6 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await grantSpinsForOrder('o1', client as any)).toBe(6);
    expect(created.data).toHaveLength(6);
  });

  it('does not count the referral free ticket', async () => {
    // It is a price cut, not a flagged ticket: checkout charges for 5 of 6 but
    // mints all six as ordinary paid tickets, so counting rows over-grants.
    const { client, created } = fakeClient({ tickets: 6 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await grantSpinsForOrder('o1', client as any, 1)).toBe(5);
    expect(created.data).toHaveLength(5);
  });

  it('grants nothing when the free ticket is the only ticket', async () => {
    const { client } = fakeClient({ tickets: 1 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await grantSpinsForOrder('o1', client as any, 1)).toBe(0);
  });

  it('grants nothing on an order that is not paid', async () => {
    // The reversal exists to stop rewards outliving a payment; minting them for
    // an unpaid order would walk straight past it.
    for (const status of ['PENDING', 'FAILED', 'REFUNDED', 'CANCELLED']) {
      const { client } = fakeClient({ tickets: 4, paymentStatus: status });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(await grantSpinsForOrder('o1', client as any)).toBe(0);
    }
  });

  it('grants nothing when the wheel is off, or the account is gone', async () => {
    const off = fakeClient({ tickets: 4, enabled: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await grantSpinsForOrder('o1', off.client as any)).toBe(0);

    // An anonymised order: the spins would belong to nobody and be unplayable.
    const anon = fakeClient({ tickets: 4, userId: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await grantSpinsForOrder('o1', anon.client as any)).toBe(0);
  });
});
