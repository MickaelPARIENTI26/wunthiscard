'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { WheelSegment } from '@winucard/shared/utils';
import { trackWheelSpin } from '@/lib/analytics-events';
import { landingRotation } from '@/lib/wheel-rotation';

/**
 * The post-purchase wheel.
 *
 * The draw has already happened server-side by the time anything turns: this
 * component asks the API for the result, then animates to whichever segment
 * matches it. The animation is theatre over a decision that is already made and
 * already committed — which is the only honest way to build one of these, and
 * the only way a refresh mid-spin cannot cost someone their prize.
 */

const SPIN_MS = 4400;
const EASING = 'cubic-bezier(0.16, 0.84, 0.24, 1)';

type SlotKind = WheelSegment['type'];

interface SpinResponse {
  ok?: true;
  result?: { type: SlotKind; value: number };
  promoCode?: string;
  codeExpiresAt?: string;
  error?: string;
  code?: string;
}

interface Revealed {
  type: SlotKind;
  value: number;
  promoCode?: string;
  codeExpiresAt?: string;
}

interface PrizeWheelProps {
  /** Unspun spin ids, oldest first. */
  spinIds: string[];
  segments: WheelSegment[];
  /** Shown above the wheel so a multi-competition page stays unambiguous. */
  competitionTitle?: string;
  /**
   * What to say once the queue is empty. The confirmation page only ever holds
   * ONE order's spins, so "your last spin for this competition" is false there
   * for a repeat buyer with spins banked from an earlier order.
   */
  lastSpinCopy?: string;
  /**
   * The real pool behind this wheel, for the odds disclosure. The segments are a
   * presentation; these are the numbers a prize promotion is expected to publish,
   * and they are computed from the same config the draw uses.
   */
  odds?: { label: string; percentage: number; remaining: number; configured: number }[];
}

const SEGMENT_FILL: Record<SlotKind, string> = {
  NO_WIN: '#141312',
  PERCENT_OFF: '#C9A227',
  JACKPOT: '#F0DFA0',
};

const SEGMENT_TEXT: Record<SlotKind, string> = {
  NO_WIN: 'rgba(244, 241, 234, 0.62)',
  PERCENT_OFF: '#0A0A0A',
  JACKPOT: '#0A0A0A',
};

/** Point on the wheel at `deg` clockwise from 12 o'clock. */
function polar(radius: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [100 + radius * Math.cos(rad), 100 + radius * Math.sin(rad)];
}

function segmentPath(index: number, count: number): string {
  const arc = 360 / count;
  const [x1, y1] = polar(96, index * arc);
  const [x2, y2] = polar(96, (index + 1) * arc);
  return `M 100 100 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 96 96 0 ${arc > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

/** Long labels ("Graded Card") need two lines to survive a 60° wedge. */
function labelLines(label: string): string[] {
  if (label.length <= 9) return [label];
  const words = label.split(' ');
  if (words.length < 2) return [label];
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')];
}

export function PrizeWheel({
  spinIds,
  segments,
  competitionTitle,
  lastSpinCopy,
  odds,
}: PrizeWheelProps) {
  const router = useRouter();
  // The queue is local: once a spin is spent it must leave the list even though
  // the server component that supplied it has not re-rendered yet.
  const [queue, setQueue] = useState(spinIds);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The result is announced in a live region; focus goes there too so a keyboard
  // or screen-reader user is standing on the outcome rather than on a button
  // that just changed meaning underneath them.
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const count = segments.length;
  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const spin = useCallback(async () => {
    const spinId = queue[0];
    if (!spinId || spinning) return;

    setSpinning(true);
    setError(null);
    setRevealed(null);
    setCopied(false);

    let data: SpinResponse;
    try {
      const response = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinId }),
      });

      try {
        data = (await response.json()) as SpinResponse;
      } catch {
        // The request reached the server but the body did not come back — a
        // gateway error page, a dropped connection after the commit. We cannot
        // claim the spin is unused, because it may well have been drawn and
        // awarded. Send them somewhere that reads the truth from the database.
        setSpinning(false);
        setError(
          'We could not read the result. Check My Rewards before spinning again — the spin may have counted.'
        );
        router.refresh();
        return;
      }

      if (!response.ok || !data.result) {
        setSpinning(false);
        setError(data.error ?? 'Something went wrong. Please try again.');
        // A spin that can never succeed must not stay at the head of the queue
        // blocking the ones behind it.
        // Every terminal reason, not just the first two: a spin that can never
        // succeed must not sit at the head of the queue blocking the live ones
        // behind it. A chargeback landing mid-session used to leave the buyer
        // clicking a dead spin forever.
        if (
          data.code === 'ALREADY_SPUN' ||
          data.code === 'EXPIRED' ||
          data.code === 'REVERSED' ||
          data.code === 'WHEEL_DISABLED'
        ) {
          setQueue((q) => q.slice(1));
          router.refresh();
        }
        return;
      }
    } catch {
      setSpinning(false);
      // The request never left, so nothing was drawn. This one IS safe to assert.
      setError('Network error — nothing was used. Please try again.');
      return;
    }

    const result = data.result;
    // Land on a segment that actually matches the result. If the pool changed
    // under us and no segment matches any more, the wheel still turns and the
    // reveal below tells the truth — the text is what the customer is owed.
    const matches = segments
      .map((s, i) => (s.type === result.type && s.value === result.value ? i : -1))
      .filter((i) => i >= 0);
    const target = matches[Math.floor(Math.random() * matches.length)] ?? 0;

    // Stop anywhere inside the wedge rather than dead-centre every time.
    const jitter = Math.random() - 0.5;
    setRotation((previous) => landingRotation(previous, target, count, jitter));

    trackWheelSpin(result.type, result.value);

    timer.current = setTimeout(
      () => {
        setRevealed({
          type: result.type,
          value: result.value,
          promoCode: data.promoCode,
          codeExpiresAt: data.codeExpiresAt,
        });
        setSpinning(false);
        setQueue((q) => q.slice(1));
        // Focus the outcome, not the button: the button is about to relabel
        // itself, and disabling a focused control drops focus to <body>.
        requestAnimationFrame(() => resultRef.current?.focus());
        // Refresh once the spin is spent so My Rewards, the code list and the
        // remaining-spin counts all agree with what just happened.
        router.refresh();
      },
      reduceMotion ? 400 : SPIN_MS
    );
  }, [queue, spinning, segments, count, reduceMotion, router]);

  const copyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // In-app webviews (Instagram, TikTok) reject the clipboard write. Saying
      // nothing left the button looking broken with no way forward.
      setCopied(false);
      setCopyFailed(true);
    }
  }, []);

  if (count === 0) {
    return (
      <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
        This wheel has no rewards left.
      </p>
    );
  }

  const remaining = queue.length;
  const motion = spinning && !reduceMotion;

  return (
    <div style={{ textAlign: 'center' }}>
      {competitionTitle && (
        <p
          style={{
            fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '10px',
          }}
        >
          {competitionTitle}
        </p>
      )}

      {/* role="img" on the wheel collapsed every prize label, so the outcomes
          existed nowhere as text. This is the real list. */}
      <ul className="sr-only">
        {[...new Map(segments.map((seg) => [`${seg.type}:${seg.value}`, seg])).values()].map(
          (seg) => (
            <li key={`${seg.type}-${seg.value}`}>{seg.label}</li>
          )
        )}
      </ul>

      <div
        style={{
          position: 'relative',
          width: 'min(320px, 78vw)',
          aspectRatio: '1 / 1',
          margin: '0 auto',
        }}
      >
        {/* Pointer — stays put while the wheel turns beneath it. */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)',
            width: '30px', height: '30px', zIndex: 2,
            filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.75))',
          }}
        >
          <path d="M12 23 L1.5 2 L22.5 2 Z" fill="var(--gold-pale)" stroke="#0A0A0A" strokeWidth="1.5" />
        </svg>

        <svg
          viewBox="0 0 200 200"
          aria-hidden="true"
          focusable="false"
          style={{
            width: '100%', height: '100%', display: 'block',
            transform: `rotate(${rotation}deg)`,
            transition: motion ? `transform ${SPIN_MS}ms ${EASING}` : 'none',
          }}
        >
          {segments.map((segment, i) => {
            const arc = 360 / count;
            const mid = i * arc + arc / 2;
            const [lx, ly] = polar(60, mid);
            const lines = labelLines(segment.label.toUpperCase());
            return (
              <g key={`${segment.type}-${segment.value}-${i}`}>
                <path
                  d={segmentPath(i, count)}
                  fill={SEGMENT_FILL[segment.type]}
                  stroke="#0A0A0A"
                  strokeWidth="1.2"
                />
                {/* Labels counter-rotate against the wheel so they are upright
                    at every resting angle. Text welded to the wedge reads
                    upside-down on half the wheel, whatever it stops on. */}
                <g
                  style={{
                    transform: `rotate(${-rotation}deg)`,
                    transformOrigin: `${lx.toFixed(2)}px ${ly.toFixed(2)}px`,
                    transformBox: 'view-box',
                    transition: motion ? `transform ${SPIN_MS}ms ${EASING}` : 'none',
                  }}
                >
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={lx.toFixed(2)}
                      y={(ly + (lines.length === 1 ? 3 : li * 10 - 2)).toFixed(2)}
                      textAnchor="middle"
                      fill={SEGMENT_TEXT[segment.type]}
                      style={{
                        fontFamily: 'var(--display)', fontSize: '10.5px', fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="96" fill="none" stroke="var(--accent)" strokeWidth="3" />
          <circle cx="100" cy="100" r="13" fill="#0A0A0A" stroke="var(--accent)" strokeWidth="3" />
        </svg>
      </div>

      {/* One live region for both outcomes, so a screen reader announces the
          result and the errors that replace it. tabIndex -1 lets focus land here
          when the wheel stops. */}
      <div ref={resultRef} tabIndex={-1} role="status" aria-live="polite" style={{ outline: 'none' }}>
        {revealed && (
          <RevealCard
            revealed={revealed}
            copied={copied}
            copyFailed={copyFailed}
            onCopy={copyCode}
          />
        )}

        {error && (
          <p style={{ color: 'var(--warn)', fontSize: '14px', marginTop: '16px' }}>{error}</p>
        )}
      </div>

      {odds && odds.length > 0 && (
        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary
            style={{
              cursor: 'pointer', fontFamily: 'var(--display)', fontSize: '12.5px',
              letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)',
              fontWeight: 700,
            }}
          >
            Your chances
          </summary>
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--ink-faint)', fontWeight: 600 }}>
                    Outcome
                  </th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--ink-faint)', fontWeight: 600 }}>
                    Share of pool
                  </th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: 'var(--ink-faint)', fontWeight: 600 }}>
                    Left
                  </th>
                </tr>
              </thead>
              <tbody>
                {odds.map((o) => (
                  <tr key={o.label} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '6px 0' }}>{o.label}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>{o.percentage}%</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--ink-dim)' }}>
                      {o.remaining} of {o.configured}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '8px' }}>
            Prizes are drawn from this fixed pool without replacement, so every prize won is
            one fewer left. The share shown is of the pool as originally set.
          </p>
        </details>
      )}

      <div style={{ marginTop: '20px' }}>
        {remaining > 0 ? (
          <>
            <button
              onClick={spin}
              aria-disabled={spinning}
              aria-describedby="wheel-spins-left"
              className={`btn ${spinning ? 'btn-mute' : 'btn-hot'} btn-xl`}
            >
              {spinning ? (
                <>
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }}
                  />
                  Spinning…
                </>
              ) : revealed ? (
                <>Spin again →</>
              ) : (
                <>Spin the wheel →</>
              )}
            </button>
            <p
              id="wheel-spins-left"
              style={{
                fontFamily: 'var(--display)', fontSize: '12.5px', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: '10px',
              }}
            >
              {remaining} spin{remaining !== 1 ? 's' : ''} left
            </p>
          </>
        ) : (
          <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
            {lastSpinCopy ?? 'That was your last spin for this competition.'}
          </p>
        )}
      </div>
    </div>
  );
}

function RevealCard({
  revealed,
  copied,
  copyFailed,
  onCopy,
}: {
  revealed: Revealed;
  copied: boolean;
  copyFailed: boolean;
  onCopy: (code: string) => void;
}) {
  const expiry = revealed.codeExpiresAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(revealed.codeExpiresAt))
    : null;

  return (
    <div
      className="drop-card"
      style={{ marginTop: '22px', textAlign: 'center', borderColor: 'var(--accent)' }}
    >
      {revealed.type === 'NO_WIN' && (
        <>
          <p style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            No win this time
          </p>
          <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginTop: '6px' }}>
            Your tickets are still in the draw — that is the prize that matters.
          </p>
        </>
      )}

      {revealed.type === 'PERCENT_OFF' && (
        <>
          <div style={{ fontSize: '34px', lineHeight: 1 }}>🎉</div>
          <p
            style={{
              fontFamily: 'var(--display)', fontSize: 'clamp(26px, 7vw, 36px)', fontWeight: 700,
              letterSpacing: '-0.03em', marginTop: '8px',
            }}
          >
            {revealed.value}% OFF
          </p>
          {revealed.promoCode && (
            <>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  flexWrap: 'wrap', marginTop: '14px',
                }}
              >
                <code
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '19px', fontWeight: 700,
                    letterSpacing: '0.1em', padding: '9px 14px', background: 'var(--bg-input)',
                    border: '1px solid var(--accent)', color: 'var(--accent-text)',
                  }}
                >
                  {revealed.promoCode}
                </code>
                <button
                  onClick={() => onCopy(revealed.promoCode!)}
                  className="btn btn-ghost"
                  style={{ padding: '9px 16px' }}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              {copyFailed && (
                <p style={{ color: 'var(--ink-faint)', fontSize: '12.5px', marginTop: '8px' }}>
                  Press and hold the code to copy it.
                </p>
              )}
              <p style={{ color: 'var(--ink-dim)', fontSize: '13.5px', marginTop: '12px' }}>
                Use it on your next ticket purchase — one code per order.
                {expiry ? ` Valid until ${expiry}.` : ''}
              </p>
            </>
          )}
        </>
      )}

      {revealed.type === 'JACKPOT' && (
        <>
          <div style={{ fontSize: '38px', lineHeight: 1 }}>🏆</div>
          <p
            style={{
              fontFamily: 'var(--display)', fontSize: 'clamp(24px, 6vw, 34px)', fontWeight: 700,
              letterSpacing: '-0.03em', marginTop: '8px', color: 'var(--gold-bright)',
            }}
          >
            You won the graded card!
          </p>
          <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginTop: '8px' }}>
            It is yours — we have been alerted and will email you to arrange delivery.
          </p>
        </>
      )}
    </div>
  );
}
