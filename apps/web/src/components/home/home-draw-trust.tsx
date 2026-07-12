import { Eyebrow } from '@/components/ui/eyebrow';

/**
 * Trust banner near the top of the home page: makes clear that winners are picked
 * by an independent third-party draw platform (RandomDraws.com), not by us — so the
 * result is impartial and publicly verifiable. Wording is deliberately factual
 * (independent / third-party / live / verifiable) and avoids claiming any specific
 * regulatory "certification" we can't evidence.
 */
export function HomeDrawTrust() {
  return (
    <section
      className="px-5 sm:px-8"
      style={{
        background: 'var(--bg-2)',
        borderBottom: '1.5px solid var(--ink)',
        padding: '28px 0',
      }}
    >
      <div
        className="mx-auto flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7"
        style={{
          maxWidth: '1040px',
          background: 'var(--surface)',
          border: '1.5px solid var(--ink)',
          borderRadius: '16px',
          boxShadow: '4px 4px 0 var(--ink)',
          padding: 'clamp(20px, 4vw, 28px)',
        }}
      >
        {/* Icon badge */}
        <div
          className="grid place-items-center shrink-0"
          style={{
            width: 60,
            height: 60,
            border: '1.5px solid var(--ink)',
            borderRadius: '14px',
            background: 'var(--accent)',
            boxShadow: '2.5px 2.5px 0 var(--ink)',
            fontSize: '30px',
          }}
          aria-hidden
        >
          🎲
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <Eyebrow className="mb-2.5">Independent Draws</Eyebrow>
          <p
            style={{
              fontFamily: 'var(--display)',
              fontSize: 'clamp(18px, 3vw, 24px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 6px',
              color: 'var(--ink)',
            }}
          >
            Every winner is drawn by{' '}
            <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--accent)', textDecorationThickness: '3px', textUnderlineOffset: '3px' }}>
              RandomDraws.com
            </span>
          </p>
          <p style={{ color: 'var(--ink-dim)', fontSize: '14.5px', lineHeight: 1.5, margin: 0 }}>
            An independent third-party draw platform runs every draw live — so the result is
            impartial and publicly verifiable. We never pick winners ourselves.
          </p>
        </div>

        {/* External link */}
        <a
          href="https://www.randomdraws.com/"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center justify-center font-semibold transition-all duration-150 shrink-0"
          style={{
            padding: '12px 20px',
            fontSize: '13px',
            borderRadius: '10px',
            background: 'var(--ink)',
            color: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            boxShadow: '3px 3px 0 var(--accent)',
            whiteSpace: 'nowrap',
          }}
        >
          Visit RandomDraws.com →
        </a>
      </div>
    </section>
  );
}
