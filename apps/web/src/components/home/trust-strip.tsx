const items = [
  { icon: '🔒', label: 'Secure Payments' },
  { icon: '🎲', label: 'Independent Draws' },
  { icon: '🚚', label: 'Free Delivery' },
  { icon: '✉️', label: 'Free Postal Entry' },
  { icon: '✓', label: 'Graded & Authenticated' },
];

export function TrustStrip() {
  return (
    <div
      className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2.5 sm:gap-8 px-5 sm:px-8"
      style={{
        padding: '16px 0',
        background: 'var(--bg-2)',
        borderTop: '1.5px solid var(--ink)',
        borderBottom: '1.5px solid var(--ink)',
      }}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className="trust-item inline-flex items-center gap-2"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--ink-dim)',
          }}
        >
          <span
            className="grid place-items-center shrink-0"
            style={{
              width: 22, height: 22,
              border: '1.5px solid var(--ink)',
              borderRadius: '6px',
              background: 'var(--surface)',
              fontSize: '11px',
              boxShadow: '1.5px 1.5px 0 var(--ink)',
            }}
          >
            {item.icon}
          </span>
          {item.label}
        </span>
      ))}

      <style>{`
        @media (min-width: 640px) {
          .trust-item { font-size: 12px !important; letter-spacing: 0.1em !important; gap: 10px !important; }
          .trust-item > span:first-child { width: 26px !important; height: 26px !important; font-size: 13px !important; }
        }
      `}</style>
    </div>
  );
}
