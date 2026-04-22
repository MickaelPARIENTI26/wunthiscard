'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface CarouselCard {
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  status: string;
}

interface HeroCarouselProps {
  cards: CarouselCard[];
}

export function HeroCarousel({ cards }: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = cards.length;

  useEffect(() => {
    if (paused || n === 0) return;
    // Respect prefers-reduced-motion: disable auto-advance
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    timer.current = setInterval(() => setActive((p) => (p + 1) % n), 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, n]);

  const getSlideClass = (idx: number) => {
    const d = ((idx - active) % n + n) % n;
    if (d === 0) return 'active';
    if (d === 1) return 'next-1';
    if (d === n - 1) return 'prev-1';
    if (d === 2) return 'next-2';
    if (d === n - 2) return 'prev-2';
    return 'slide-hidden';
  };

  const current = cards[active];
  if (!current) return null;

  const formatCategory = (cat: string) => cat.replace(/_/g, ' ').replace(/SPORTS /i, '');

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* Info pill */}
      <div
        className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 whitespace-nowrap"
        style={{
          padding: '7px 16px',
          background: 'var(--surface)',
          border: '1.5px solid var(--ink)',
          borderRadius: '999px',
          boxShadow: '3px 3px 0 var(--ink)',
          fontFamily: 'var(--display)',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <span>{formatCategory(current.category)}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>£{current.prizeValue.toLocaleString('en-GB')}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span style={{ color: 'var(--accent-2)' }}>● {current.status === 'ACTIVE' ? 'Open' : 'Coming Soon'}</span>
      </div>

      {/* Track */}
      <div className="carousel-track">
        {cards.map((c, idx) => (
          <div key={c.slug} className={`carousel-slide ${getSlideClass(idx)}`}>
            <Image
              src={c.mainImageUrl}
              alt={c.title}
              fill
              sizes="340px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
        <button
          onClick={() => setActive((p) => (p - 1 + n) % n)}
          className="grid place-items-center transition-all duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--ink)]"
          style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'var(--surface)', border: '1.5px solid var(--ink)',
            fontSize: '16px', boxShadow: '2px 2px 0 var(--ink)',
          }}
          aria-label="Previous card"
        >
          ←
        </button>

        <div className="flex gap-2">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className="transition-all duration-200"
              style={{
                width: idx === active ? 32 : 10,
                height: 10,
                borderRadius: idx === active ? '5px' : '50%',
                background: idx === active ? 'var(--ink)' : 'var(--bg-3)',
                border: '1.5px solid var(--ink)',
              }}
              aria-label={`Go to card ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setActive((p) => (p + 1) % n)}
          className="grid place-items-center transition-all duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--ink)]"
          style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'var(--surface)', border: '1.5px solid var(--ink)',
            fontSize: '16px', boxShadow: '2px 2px 0 var(--ink)',
          }}
          aria-label="Next card"
        >
          →
        </button>
      </div>
    </div>
  );
}
