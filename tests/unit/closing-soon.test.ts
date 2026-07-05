import { describe, it, expect } from 'vitest';
import { isClosingSoon, closingSoonWindow, CLOSING_SOON_WINDOW_HOURS } from '@/lib/closing-soon';

/**
 * The "closing soon" reminder cron (apps/web/src/app/api/cron/closing-soon) uses
 * these pure helpers to decide which competitions to remind. The window must be
 * future-only (never remind a past draw) and bounded to CLOSING_SOON_WINDOW_HOURS.
 */
describe('closing-soon window', () => {
  const now = new Date('2026-07-05T09:00:00.000Z');
  const H = 3600 * 1000;

  it('includes a draw a few hours out', () => {
    expect(isClosingSoon(new Date(now.getTime() + 5 * H), now)).toBe(true);
  });

  it('includes a draw right at the window edge', () => {
    const edge = new Date(now.getTime() + CLOSING_SOON_WINDOW_HOURS * H);
    expect(isClosingSoon(edge, now)).toBe(true);
  });

  it('excludes a draw beyond the window', () => {
    const beyond = new Date(now.getTime() + (CLOSING_SOON_WINDOW_HOURS + 1) * H);
    expect(isClosingSoon(beyond, now)).toBe(false);
  });

  it('excludes a draw in the past (already closed)', () => {
    expect(isClosingSoon(new Date(now.getTime() - H), now)).toBe(false);
  });

  it('excludes a draw exactly now (not in the future)', () => {
    expect(isClosingSoon(now, now)).toBe(false);
  });

  it('closingSoonWindow spans now → now + window hours', () => {
    const { from, to } = closingSoonWindow(now);
    expect(from.getTime()).toBe(now.getTime());
    expect(to.getTime()).toBe(now.getTime() + CLOSING_SOON_WINDOW_HOURS * H);
  });
});
