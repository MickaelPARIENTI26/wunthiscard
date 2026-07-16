import { describe, it, expect } from 'vitest';
import {
  competitionFinishedAt,
  isFinished,
  isWithinFinishedWindow,
  FINISHED_VISIBLE_DAYS,
} from '@/lib/competition-visibility';

/**
 * The /competitions listing shows sold-out and finished competitions (with a red
 * "SOLD OUT" / "FINISHED" banner) but auto-hides them FINISHED_VISIBLE_DAYS after
 * they finish. These pure helpers drive that; cover the state × timing matrix.
 */
describe('competition visibility', () => {
  const now = new Date('2026-07-13T12:00:00.000Z');
  const H = 3600 * 1000;
  const D = 24 * H;
  const future = new Date(now.getTime() + 2 * D);
  const past1d = new Date(now.getTime() - 1 * D);
  const past5d = new Date(now.getTime() - 5 * D);

  describe('competitionFinishedAt', () => {
    it('open ACTIVE with a future draw is not finished', () => {
      expect(competitionFinishedAt({ status: 'ACTIVE', drawDate: future }, now)).toBeNull();
    });

    it('ACTIVE whose draw date has passed is finished at the draw date', () => {
      expect(competitionFinishedAt({ status: 'ACTIVE', drawDate: past1d }, now)?.getTime()).toBe(
        past1d.getTime()
      );
    });

    it('SOLD_OUT before its draw is not finished yet', () => {
      expect(competitionFinishedAt({ status: 'SOLD_OUT', drawDate: future }, now)).toBeNull();
    });

    it('UPCOMING is never finished, even with a (misconfigured) past draw', () => {
      expect(competitionFinishedAt({ status: 'UPCOMING', drawDate: past5d }, now)).toBeNull();
    });

    it('COMPLETED uses actualDrawDate when present', () => {
      expect(
        competitionFinishedAt(
          { status: 'COMPLETED', drawDate: past5d, actualDrawDate: past1d },
          now
        )?.getTime()
      ).toBe(past1d.getTime());
    });

    it('COMPLETED falls back to drawDate when actualDrawDate is missing', () => {
      expect(
        competitionFinishedAt({ status: 'COMPLETED', drawDate: past1d, actualDrawDate: null }, now)?.getTime()
      ).toBe(past1d.getTime());
    });
  });

  describe('isFinished', () => {
    it('true for COMPLETED, false for an open ACTIVE', () => {
      expect(isFinished({ status: 'COMPLETED', drawDate: past1d }, now)).toBe(true);
      expect(isFinished({ status: 'ACTIVE', drawDate: future }, now)).toBe(false);
    });
  });

  describe('isWithinFinishedWindow', () => {
    it('keeps a still-open competition', () => {
      expect(isWithinFinishedWindow({ status: 'ACTIVE', drawDate: future }, now)).toBe(true);
    });

    it('keeps a competition finished 1 day ago (within the 3-day window)', () => {
      expect(isWithinFinishedWindow({ status: 'COMPLETED', drawDate: past1d }, now)).toBe(true);
    });

    it('hides a competition finished 5 days ago', () => {
      expect(isWithinFinishedWindow({ status: 'COMPLETED', drawDate: past5d }, now)).toBe(false);
    });

    it('keeps a comp scheduled long ago but actually drawn 1 day ago', () => {
      expect(
        isWithinFinishedWindow({ status: 'COMPLETED', drawDate: past5d, actualDrawDate: past1d }, now)
      ).toBe(true);
    });

    it('hides right at the window edge (finished exactly N days ago)', () => {
      const exactlyNDaysAgo = new Date(now.getTime() - FINISHED_VISIBLE_DAYS * D);
      expect(
        isWithinFinishedWindow({ status: 'COMPLETED', drawDate: exactlyNDaysAgo }, now)
      ).toBe(false);
    });
  });
});
