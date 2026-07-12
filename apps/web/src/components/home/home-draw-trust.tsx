/**
 * Compact trust note: winners are drawn by an independent third-party platform
 * (RandomDraws.com). Placed lower on the home page (after competitions + how-it-works).
 * Deliberately a plain one-line strip — the site NAME is shown as text only, no link,
 * and the wording stays factual (independent / live / verifiable) with no unverifiable
 * "certification" claim.
 */
export function HomeDrawTrust() {
  return (
    <section
      className="px-5 sm:px-8"
      style={{
        background: 'var(--bg-2)',
        borderTop: '1.5px solid var(--ink)',
        borderBottom: '1.5px solid var(--ink)',
        padding: '16px 0',
      }}
    >
      <p
        className="mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center"
        style={{ maxWidth: '820px', margin: 0, fontSize: '13.5px', lineHeight: 1.5, color: 'var(--ink-dim)' }}
      >
        <span aria-hidden style={{ fontSize: '16px' }}>🎲</span>
        <span>
          Every winner is drawn independently by{' '}
          <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>RandomDraws.com</strong> — live,
          impartial and publicly verifiable.
        </span>
      </p>
    </section>
  );
}
