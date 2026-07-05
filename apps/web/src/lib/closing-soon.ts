// How far ahead of the draw a "closing soon" reminder fires. Kept >= 24h because
// on the Vercel Hobby plan the cron runs at most once per day — a narrower window
// could skip a competition whose draw falls between two daily runs.
export const CLOSING_SOON_WINDOW_HOURS = 48;

export function closingSoonWindow(now: Date, hours: number = CLOSING_SOON_WINDOW_HOURS): { from: Date; to: Date } {
  return { from: now, to: new Date(now.getTime() + hours * 3600 * 1000) };
}

// A competition is "closing soon" when its draw is still in the future but within
// the reminder window. (Past-draw competitions are never reminded.)
export function isClosingSoon(drawDate: Date, now: Date, hours: number = CLOSING_SOON_WINDOW_HOURS): boolean {
  const t = drawDate.getTime();
  return t > now.getTime() && t <= now.getTime() + hours * 3600 * 1000;
}
