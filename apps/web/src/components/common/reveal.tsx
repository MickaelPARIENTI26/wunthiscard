'use client';

import { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** Position within its batch — drives the stagger (index % 5 × 80ms). */
  index?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'section' | 'article' | 'li';
}

/**
 * Below-the-fold entrance (spec "Entrance timing"): an IntersectionObserver
 * (threshold 0.1, rootMargin '0px 0px -6% 0px') applies slamIn once and then
 * unobserves. Stagger within a batch is index % 5 × 80ms.
 *
 * Content is visible from the first paint and only *animates* on reveal, so a
 * failed observer, a no-JS client or a crawler never hides the content.
 * Under prefers-reduced-motion the animation resolves instantly (globals.css).
 */
export function Reveal({ children, index = 0, className = '', style, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;

    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [revealed]);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={`${revealed ? 'wup-in-slam' : ''} ${className}`.trim()}
      style={{ ...style, ...(revealed ? { animationDelay: `${(index % 5) * 80}ms` } : {}) }}
    >
      {children}
    </Tag>
  );
}
