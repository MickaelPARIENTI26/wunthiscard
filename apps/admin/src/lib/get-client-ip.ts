/**
 * Resolve the requester's client IP consistently (rate-limit keys, audit logs).
 * Prefers x-real-ip (Vercel's edge-set client IP), then the first x-forwarded-for
 * hop, then 'unknown'. Accepts a Web Headers or next/headers ReadonlyHeaders.
 */
export function getClientIp(headers: { get(name: string): string | null }): string {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}
