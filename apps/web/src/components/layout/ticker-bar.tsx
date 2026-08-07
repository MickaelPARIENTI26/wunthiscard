/**
 * Full-bleed gold ticker band above the header (all pages).
 * Two identical copies of the message row inside a width:max-content
 * flex track animated with the marquee keyframe (22s linear infinite).
 * The second copy is aria-hidden so screen readers hear it once.
 */
const MESSAGES = [
  'Winners drawn independently by RandomDraws.com',
  'Free postal entry route available',
  'Free insured UK delivery',
  'Graded & authenticated prizes',
  '18+ only',
];

function MessageSet({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="wup-marquee__set" aria-hidden={ariaHidden || undefined}>
      {MESSAGES.map((msg) => (
        <span key={msg} className="flex items-center" style={{ gap: '26px' }}>
          <span>{msg}</span>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
        </span>
      ))}
    </div>
  );
}

export function TickerBar() {
  return (
    <div className="wup-marquee wup-marquee--gold" role="marquee" aria-label="Site highlights">
      <div className="wup-marquee__track">
        <MessageSet />
        <MessageSet ariaHidden />
      </div>
    </div>
  );
}
