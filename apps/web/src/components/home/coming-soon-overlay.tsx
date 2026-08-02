'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';

// The six launch cards teased behind the gate (public/coming-soon/*).
const CARDS = [
  { src: '/coming-soon/wemby.jpg', alt: 'Victor Wembanyama Bowman Chrome Superfractor 1/1 PSA 10' },
  { src: '/coming-soon/red-manga.jpg', alt: 'Monkey D. Luffy Red Manga Alternate Art PSA 10' },
  { src: '/coming-soon/rayquaza.jpg', alt: 'Rayquaza Gold Star Japanese 1st Edition PSA 10' },
  { src: '/coming-soon/lugia.jpg', alt: 'Lugia Neo Genesis 1st Edition CGC 10' },
  { src: '/coming-soon/kobe.jpg', alt: 'Kobe Bryant Panini Flawless Dual Patch Auto BGS 9.5' },
  { src: '/coming-soon/kaido.jpg', alt: 'Kaido One Piece Championship Winner promo BGS 10' },
];

/**
 * Non-dismissable pre-launch gate layered over the homepage: no close button,
 * no backdrop click-through, body scroll locked while mounted. Collects an
 * email for the waiting list via POST /api/waitlist; the launch announcement
 * is sent automatically when the first competition goes live.
 */
export function ComingSoonOverlay() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Lock page scroll while the gate is up.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading' || status === 'done') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data: { ok?: boolean; error?: string } = await res.json();
      if (res.ok && data.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
      className="fixed inset-0 z-[10000] overflow-y-auto"
      style={{
        background: 'rgba(10, 10, 10, 0.94)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        className="flex min-h-full items-center justify-center"
        style={{ padding: 'clamp(16px, 3vw, 40px)' }}
      >
        <div
          className="wup-panel wup-panel--accent-top wup-in-slam text-center"
          style={{ width: '100%', maxWidth: '860px', padding: 'clamp(18px, 2.6vw, 30px)' }}
        >
          {/* Wordmark */}
          <div className="flex items-center justify-center" style={{ gap: '10px', marginBottom: '12px' }}>
            <span className="wup-wedge" aria-hidden="true" />
            <span
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: 'clamp(22px, 3vw, 28px)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                lineHeight: 1,
                color: 'var(--ink)',
              }}
            >
              WinU<span style={{ color: 'var(--accent)' }}>Prize</span>
            </span>
          </div>

          <p className="wup-eyebrow" style={{ fontSize: '13px', margin: '0 0 8px' }}>The UK&apos;s premium card competitions</p>

          <h1 id="coming-soon-title" className="wup-h2" style={{ fontSize: 'clamp(30px, 4.6vw, 48px)', margin: '0 0 10px' }}>
            Coming <span style={{ color: 'var(--accent)' }}>soon.</span>
          </h1>

          <p className="wup-body-sm" style={{ fontSize: '14.5px', margin: '0 auto 18px', maxWidth: '520px' }}>
            Graded grails, independent draws, free postal entry. Join the waiting
            list and be first in when our launch drops go live.
          </p>

          {/* The six launch cards — one auto-rotating line (marquee), ~3 in view.
              Same duplicate-track mechanic as the site ticker; pauses under
              prefers-reduced-motion via the global wup-marquee kill rule. */}
          <div className="wup-marquee" style={{ margin: '0 0 20px' }}>
            <div className="wup-marquee__track" style={{ animationDuration: '28s' }}>
              {[false, true].map((hidden) => (
                <div
                  key={hidden ? 'dup' : 'main'}
                  className="wup-marquee__set"
                  aria-hidden={hidden || undefined}
                  style={{ gap: 'clamp(8px, 1.4vw, 14px)', paddingRight: 'clamp(8px, 1.4vw, 14px)' }}
                >
                  {CARDS.map((card, i) => (
                    <div
                      key={card.src}
                      className="wup-well"
                      style={{
                        height: 'clamp(190px, 32vh, 330px)',
                        aspectRatio: '3 / 4',
                        border: '1px solid var(--line)',
                        flex: 'none',
                      }}
                    >
                      <Image
                        src={card.src}
                        alt={hidden ? '' : card.alt}
                        fill
                        sizes="260px"
                        style={{ objectFit: 'cover' }}
                        priority={!hidden && i < 4}
                      />
                      <span className="wup-well__shimmer" aria-hidden="true" style={{ animationDelay: `${i * 0.7}s` }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Waiting list form */}
          {status === 'done' ? (
            <div
              className="flex items-center justify-center"
              style={{
                gap: '10px',
                background: 'rgba(201, 162, 39, 0.10)',
                border: '1px solid var(--accent)',
                padding: '16px 18px',
                maxWidth: '520px',
                margin: '0 auto',
              }}
            >
              <Check className="h-5 w-5" style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--ink)' }}>
                You&apos;re on the list — we&apos;ll email you the moment we launch.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row"
              style={{ gap: '10px', maxWidth: '520px', margin: '0 auto' }}
            >
              <label htmlFor="waitlist-email" className="sr-only">Email address</label>
              <input
                id="waitlist-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                className="input"
                style={{ flex: '1 1 auto', fontSize: '16px' }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '14px 22px', fontSize: '15px' }}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  'Join the waiting list'
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p role="alert" style={{ margin: '10px 0 0', fontSize: '13.5px', color: 'var(--warn)' }}>
              {errorMsg}
            </p>
          )}

          <p className="wup-fine" style={{ margin: '12px 0 0' }}>
            One email at launch — no spam. 18+ · UK residents only.
          </p>
        </div>
      </div>
    </div>
  );
}
