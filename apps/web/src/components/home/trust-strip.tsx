const items = [
  { icon: '🔒', label: 'Secure Payments' },
  { icon: '📺', label: 'Live Draws' },
  { icon: '🚚', label: 'Free Delivery' },
  { icon: '✉️', label: 'Free Postal Entry' },
  { icon: '✓', label: 'PSA 10 Authenticated' },
];

export function TrustStrip() {
  return (
    <div
      className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 px-5 sm:px-8"
      style={{
        padding: '20px 0',
        background: 'var(--bg-2)',
        borderTop: '1.5px solid var(--ink)',
        borderBottom: '1.5px solid var(--ink)',
      }}
    >
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-2.5"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '12px',
            letterSpacing: '0.1em',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--ink-dim)',
          }}
        >
          <span
            className="grid place-items-center"
            style={{
              width: 26, height: 26,
              border: '1.5px solid var(--ink)',
              borderRadius: '6px',
              background: 'var(--surface)',
              fontSize: '13px',
              boxShadow: '1.5px 1.5px 0 var(--ink)',
            }}
          >
            {item.icon}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}
