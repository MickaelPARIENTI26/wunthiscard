/**
 * Loading skeleton for the competitions list. Mirrors the real layout:
 * a chip filter row, a results count, then fixture rows (not grid cards).
 */
function FixtureRowSkeleton() {
  return (
    <div
      className="flex items-center animate-pulse"
      style={{ gap: '10px', padding: 'clamp(11px, 1.4vw, 15px) 0', borderBottom: '1px solid var(--line)' }}
    >
      <span style={{ flex: 'none', width: '34px', height: '18px', background: 'var(--line)' }} />
      <span style={{ flex: 'none', width: 'clamp(44px, 5vw, 58px)', aspectRatio: '1 / 1', background: 'var(--bg-3)', border: '1px solid var(--line)' }} />
      <span style={{ flex: '1 1 160px', minWidth: '120px', paddingLeft: '4px' }}>
        <span style={{ display: 'block', height: '19px', width: '62%', background: 'var(--line)', marginBottom: '7px' }} />
        <span style={{ display: 'block', height: '12px', width: '40%', background: 'var(--line)' }} />
      </span>
      <span style={{ flex: 'none', width: 'clamp(80px, 10vw, 120px)', height: '22px', background: 'var(--line)' }} />
      <span className="fixture-col-sold" style={{ flex: 'none', width: 'clamp(90px, 12vw, 150px)' }}>
        <span style={{ display: 'block', height: '13px', width: '70%', background: 'var(--line)', marginBottom: '5px' }} />
        <span style={{ display: 'block', height: '5px', background: 'var(--line)' }} />
      </span>
      <span className="fixture-col-closes" style={{ flex: 'none', width: 'clamp(74px, 9vw, 110px)', height: '14px', background: 'var(--line)' }} />
    </div>
  );
}

export function CompetitionsLoading() {
  return (
    <div>
      {/* Chip filter row */}
      <div className="flex flex-wrap animate-pulse" style={{ gap: '8px', marginBottom: '22px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} style={{ height: '41px', width: i === 0 ? '74px' : '118px', background: 'var(--line)' }} />
        ))}
      </div>

      {/* Results count */}
      <span className="animate-pulse" style={{ display: 'block', height: '13px', width: '210px', background: 'var(--line)', marginBottom: '14px' }} />

      {/* Column header rule + rows */}
      <div style={{ height: '18px', borderBottom: '2px solid var(--accent)', marginBottom: '2px' }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <FixtureRowSkeleton key={i} />
      ))}
    </div>
  );
}
