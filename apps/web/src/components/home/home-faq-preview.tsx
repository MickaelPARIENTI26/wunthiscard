'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqItems = [
  {
    q: 'Is WinUPrize legal in the UK?',
    a: 'Yes. WinUPrize operates as a skill-based prize competition in full compliance with UK law. Every competition requires a skill question and offers a free postal entry route, as required by the Gambling Act 2005.',
  },
  {
    q: 'How is the winner selected?',
    a: 'The winning ticket number is drawn by an independent third party. The result is published and verifiable on the competition page, and the winner is notified, within 24 hours of the draw.',
  },
  {
    q: 'Is there a free entry route?',
    a: 'Yes. UK law requires every competition to offer a free postal entry route. Send a handwritten entry to our registered address — full details on the Competition Rules page.',
  },
  {
    q: 'How will I receive my prize?',
    a: 'Winners receive their prizes via tracked, insured delivery within 7-14 business days of the draw. Every item is carefully packaged, photographed before dispatch, and shipped with full tracking.',
  },
];

export function HomeFAQPreview() {
  // Single-open accordion; the first item is open by default (spec).
  const [open, setOpen] = useState(0);

  return (
    <section style={{ padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)' }}>
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '26px' }}>
          <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>FAQ</p>
          <h2 className="wup-h2" style={{ margin: 0 }}>Common Questions.</h2>
        </div>

        {/* Accordion */}
        <div className="flex flex-col" style={{ gap: '10px' }}>
          {faqItems.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="wup-accordion-item"
                style={{ background: 'var(--surface)', border: '1px solid rgba(244, 241, 234, 0.16)' }}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                  style={{ gap: '18px', padding: '17px 18px', background: 'none', border: 'none' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--display)',
                      fontWeight: 600,
                      fontSize: '18.5px',
                      letterSpacing: '0.02em',
                      color: 'var(--ink)',
                    }}
                  >
                    {f.q}
                  </span>
                  {/* The square stays square — only the + glyph rotates to an ×. */}
                  <span
                    aria-hidden="true"
                    className="grid place-items-center flex-shrink-0 transition-colors duration-[250ms]"
                    style={{
                      width: 26,
                      height: 26,
                      background: isOpen ? 'var(--accent)' : 'var(--bg-3)',
                      color: isOpen ? '#0A0A0A' : 'var(--ink-faint)',
                    }}
                  >
                    <span
                      className="block transition-transform duration-[250ms]"
                      style={{ fontSize: '17px', lineHeight: 1, transform: isOpen ? 'rotate(45deg)' : 'none' }}
                    >
                      +
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <div
                    className="wup-in-wipe"
                    style={{ padding: '0 18px 19px', color: 'rgba(244, 241, 234, 0.66)', fontSize: '15.5px', lineHeight: 1.68, animationDuration: '.3s' }}
                  >
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center" style={{ marginTop: '22px' }}>
          <Link href="/faq" className="wup-btn wup-btn--link">
            View all FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
}
