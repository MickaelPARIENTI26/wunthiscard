const items = [
  { icon: '🔒', label: 'Secure Payments' },
  { icon: '🎲', label: 'Independent Draws' },
  { icon: '🚚', label: 'Free UK Delivery' },
  { icon: '✉️', label: 'Free Postal Entry' },
  { icon: '✓', label: 'Graded & Authenticated' },
];

function TrustSet({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="wup-marquee__set" aria-hidden={ariaHidden || undefined}>
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center"
          style={{
            gap: '9px',
            fontFamily: 'var(--display)',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-dim)',
            whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Trust marquee — panel band scrolling at 30s (spec screen 3). */
export function TrustStrip() {
  return (
    <div
      className="wup-marquee"
      style={{
        background: 'var(--surface)',
        padding: '13px 0',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="wup-marquee__track wup-marquee__track--slow">
        <TrustSet />
        <TrustSet ariaHidden />
      </div>
    </div>
  );
}
