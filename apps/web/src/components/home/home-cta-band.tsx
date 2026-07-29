import Link from 'next/link';

/** Closing CTA — full gold band with animated diagonal stripes (spec screen 3). */
export function HomeCTABand() {
  return (
    <section className="wup-band" style={{ textAlign: 'center' }}>
      <div className="wup-band__stripes" aria-hidden="true" />
      <div
        className="wup-band__inner mx-auto"
        style={{ maxWidth: '820px', padding: 'clamp(44px, 7vw, 78px) clamp(14px, 3vw, 34px)' }}
      >
        <h2 className="wup-h2" style={{ color: '#0A0A0A', margin: '0 0 16px' }}>
          Ready to Enter?
        </h2>

        <p
          style={{
            color: 'rgba(10, 10, 10, 0.78)',
            fontSize: '17px',
            lineHeight: 1.55,
            margin: '0 0 28px',
          }}
        >
          Create your free account and enter our live competitions.
        </p>

        <div className="flex flex-wrap justify-center" style={{ gap: '12px', marginBottom: '20px' }}>
          <Link href="/register" className="wup-btn wup-btn--on-gold">
            Sign Up Free →
          </Link>
          <Link
            href="/competitions"
            className="wup-btn"
            style={{
              background: 'none',
              border: '1px solid rgba(10, 10, 10, 0.5)',
              color: '#0A0A0A',
              fontWeight: 600,
            }}
          >
            View Competitions
          </Link>
        </div>

        <p
          style={{
            fontFamily: 'var(--display)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(10, 10, 10, 0.7)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          18+ only · Free postal entry available · T&amp;Cs apply
        </p>
      </div>
    </section>
  );
}
