/**
 * Resolve the requester's client IP from a headers object, consistently across the
 * whole app (rate-limit keys, audit logs).
 *
 * Why centralise: routes previously did this ad-hoc — some took
 * `x-forwarded-for.split(',')[0]`, others used the WHOLE `x-forwarded-for` string as
 * the key (so appending junk to the header minted a fresh rate-limit bucket). We now:
 *   1. prefer `x-real-ip` — on Vercel this is the single, edge-set client IP and is
 *      not a client-appendable list; then
 *   2. fall back to the FIRST hop of `x-forwarded-for` (the original client on a
 *      trusted-proxy chain), trimmed; then
 *   3. 'unknown'.
 *
 * Accepts anything with a `.get()` — a Web `Headers` (route handlers) or the
 * `ReadonlyHeaders` returned by `next/headers` (server actions).
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
