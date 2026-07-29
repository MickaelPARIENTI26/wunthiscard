'use client';

import { useEffect, useState } from 'react';

interface ScoreboardClockProps {
  /** Server-provided ISO end date — countdowns never derive from a client-relative offset. */
  targetDate: string | Date;
}

interface Parts {
  days: number;
  hrs: number;
  min: number;
  sec: number;
  ended: boolean;
}

function computeParts(target: number, now: number): Parts {
  const delta = Math.max(0, target - now);
  return {
    days: Math.floor(delta / 86_400_000),
    hrs: Math.floor((delta % 86_400_000) / 3_600_000),
    min: Math.floor((delta % 3_600_000) / 60_000),
    sec: Math.floor((delta % 60_000) / 1_000),
    ended: delta <= 0,
  };
}

/** Zero-pad to two digits; days is not padded past 99. */
function pad(v: number): string {
  return v > 99 ? String(v) : String(v).padStart(2, '0');
}

/**
 * Broadcast-scoreboard countdown: DAYS · HRS · MIN in deep cells,
 * SEC in a solid gold cell whose numeral jolts every second.
 * Renders placeholders until mounted so SSR/client markup never mismatches.
 * translate="no": without it, browser auto-translate rewrites the numerals.
 */
export function ScoreboardClock({ targetDate }: ScoreboardClockProps) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => setParts(computeParts(target, Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const cells: { label: string; value: string }[] = [
    { label: 'Days', value: parts ? pad(parts.days) : '--' },
    { label: 'Hrs', value: parts ? pad(parts.hrs) : '--' },
    { label: 'Min', value: parts ? pad(parts.min) : '--' },
    { label: 'Sec', value: parts ? pad(parts.sec) : '--' },
  ];

  return (
    <div className="wup-clock notranslate" translate="no" role="timer" aria-live="off">
      {cells.map((cell, i) => (
        <div key={cell.label} className={`wup-clock__cell${i === 3 ? ' wup-clock__cell--sec' : ''}`}>
          <span className="wup-clock__v">{cell.value}</span>
          <div className="wup-clock__l">{cell.label}</div>
        </div>
      ))}
    </div>
  );
}
