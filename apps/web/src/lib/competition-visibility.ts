// How long a finished competition keeps showing in listings (with its red
// "FINISHED"/"SOLD OUT" marker) before it auto-hides.
export const FINISHED_VISIBLE_DAYS = 3;

export interface CompetitionTimes {
  status: string;
  drawDate: Date | string;
  actualDrawDate?: Date | string | null;
}

/**
 * When a competition became (or is scheduled to become) closed to new entries:
 * - COMPLETED / CANCELLED are terminal — use the real draw time (actualDrawDate)
 *   if we have it, otherwise the scheduled drawDate.
 * - ACTIVE / SOLD_OUT / DRAWING become "finished" the moment their draw date passes.
 * - UPCOMING / DRAFT are never finished.
 * Returns null while the competition is still upcoming or genuinely open.
 */
export function competitionFinishedAt(c: CompetitionTimes, now: Date = new Date()): Date | null {
  const draw = new Date(c.drawDate);
  if (c.status === 'COMPLETED' || c.status === 'CANCELLED') {
    return c.actualDrawDate ? new Date(c.actualDrawDate) : draw;
  }
  if (c.status === 'ACTIVE' || c.status === 'SOLD_OUT' || c.status === 'DRAWING') {
    return draw.getTime() <= now.getTime() ? draw : null;
  }
  return null; // UPCOMING / DRAFT
}

export function isFinished(c: CompetitionTimes, now: Date = new Date()): boolean {
  return competitionFinishedAt(c, now) !== null;
}

/**
 * True if the competition should still appear in listings under the auto-hide
 * rule: everything that isn't finished stays; a finished competition stays only
 * until it has been finished for `days` days, then hides.
 */
export function isWithinFinishedWindow(
  c: CompetitionTimes,
  now: Date = new Date(),
  days: number = FINISHED_VISIBLE_DAYS
): boolean {
  const finishedAt = competitionFinishedAt(c, now);
  if (!finishedAt) return true;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return finishedAt.getTime() > cutoff;
}
