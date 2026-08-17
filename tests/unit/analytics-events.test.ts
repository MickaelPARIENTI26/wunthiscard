import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The purchase event is the one that must never be wrong: the success page is a
 * normal URL, so a refresh or back-then-forward would re-report the same sale
 * and inflate revenue. These cover that, plus the rule that nothing is sent
 * when analytics isn't configured or consented to.
 */

const store = new Map<string, string>();

function installBrowser(withGtag: boolean) {
  const calls: { event: string; params: Record<string, unknown> }[] = [];
  const win = {
    gtag: withGtag
      ? (_cmd: string, event: string, params: Record<string, unknown>) => {
          calls.push({ event, params });
        }
      : undefined,
  };
  vi.stubGlobal('window', win);
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  return calls;
}

const COMP = { id: 'comp_1', name: 'Charizard PSA 10', category: 'POKEMON', price: 9.99 };

describe('analytics events', () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('sends nothing when gtag is absent (no consent, or no measurement id)', async () => {
    const calls = installBrowser(false);
    const m = await import('../../apps/web/src/lib/analytics-events');
    m.trackViewItem(COMP);
    m.trackBeginCheckout(COMP, 5);
    m.trackPurchase('WUP-1', 49.95, COMP, 5);
    m.trackSignUp('credentials');
    expect(calls).toHaveLength(0);
  });

  it('reports a purchase once, then ignores repeats of the same order', async () => {
    const calls = installBrowser(true);
    const m = await import('../../apps/web/src/lib/analytics-events');

    m.trackPurchase('WUP-2026-0000481', 99.9, COMP, 10);
    m.trackPurchase('WUP-2026-0000481', 99.9, COMP, 10); // refresh
    m.trackPurchase('WUP-2026-0000481', 99.9, COMP, 10); // back / forward

    const purchases = calls.filter((c) => c.event === 'purchase');
    expect(purchases).toHaveLength(1);
    expect(purchases[0]!.params).toMatchObject({
      transaction_id: 'WUP-2026-0000481',
      currency: 'GBP',
      value: 99.9,
    });
  });

  it('still reports a genuinely different order', async () => {
    const calls = installBrowser(true);
    const m = await import('../../apps/web/src/lib/analytics-events');
    m.trackPurchase('WUP-A', 10, COMP, 1);
    m.trackPurchase('WUP-B', 20, COMP, 2);
    expect(calls.filter((c) => c.event === 'purchase')).toHaveLength(2);
  });

  it('prices begin_checkout at quantity x ticket price', async () => {
    const calls = installBrowser(true);
    const m = await import('../../apps/web/src/lib/analytics-events');
    m.trackBeginCheckout(COMP, 7);
    const e = calls.find((c) => c.event === 'begin_checkout');
    expect(e?.params.value).toBe(69.93);
    expect((e?.params.items as { quantity: number }[])[0]!.quantity).toBe(7);
  });

  it('avoids float drift on the order total', async () => {
    const calls = installBrowser(true);
    const m = await import('../../apps/web/src/lib/analytics-events');
    // 2.99 * 3 is 8.969999999999999 in binary floating point.
    m.trackBeginCheckout({ ...COMP, price: 2.99 }, 3);
    expect(calls.find((c) => c.event === 'begin_checkout')?.params.value).toBe(8.97);
  });
});
