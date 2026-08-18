import { describe, it, expect, vi } from 'vitest';

// The module pulls in the Prisma client at import time; the selection function
// under test is pure and never touches it.
vi.mock('@/lib/db', () => ({ prisma: {} }));

const { pickFromPool } = await import('../../apps/web/src/lib/wheel');

/** The 700-token default: 420 / 210 / 69 / 1. */
const POOL = [
  { name: 'NO_WIN', remaining: 420 },
  { name: 'OFF5', remaining: 210 },
  { name: 'OFF10', remaining: 69 },
  { name: 'JACKPOT', remaining: 1 },
];

describe('pickFromPool — one token, one reward', () => {
  it('maps each boundary to the right slot', () => {
    // Ranges: NO_WIN 0-419, OFF5 420-629, OFF10 630-698, JACKPOT 699.
    expect(pickFromPool(POOL, 0)!.name).toBe('NO_WIN');
    expect(pickFromPool(POOL, 419)!.name).toBe('NO_WIN');
    expect(pickFromPool(POOL, 420)!.name).toBe('OFF5');
    expect(pickFromPool(POOL, 629)!.name).toBe('OFF5');
    expect(pickFromPool(POOL, 630)!.name).toBe('OFF10');
    expect(pickFromPool(POOL, 698)!.name).toBe('OFF10');
    expect(pickFromPool(POOL, 699)!.name).toBe('JACKPOT');
  });

  it('gives the single jackpot exactly one token out of 700', () => {
    let jackpot = 0;
    for (let t = 0; t < 700; t++) if (pickFromPool(POOL, t)!.name === 'JACKPOT') jackpot++;
    expect(jackpot).toBe(1);
  });

  it('covers the whole pool with no gap and no overlap', () => {
    const counts: Record<string, number> = {};
    for (let t = 0; t < 700; t++) {
      const hit = pickFromPool(POOL, t)!;
      counts[hit.name] = (counts[hit.name] ?? 0) + 1;
    }
    expect(counts).toEqual({ NO_WIN: 420, OFF5: 210, OFF10: 69, JACKPOT: 1 });
  });

  it('returns null past the end rather than silently handing out the last slot', () => {
    expect(pickFromPool(POOL, 700)).toBeNull();
    expect(pickFromPool([], 0)).toBeNull();
  });

  it('skips exhausted slots — they carry no tokens', () => {
    const drained = [
      { name: 'NO_WIN', remaining: 0 },
      { name: 'JACKPOT', remaining: 1 },
    ];
    expect(pickFromPool(drained, 0)!.name).toBe('JACKPOT');
  });
});
