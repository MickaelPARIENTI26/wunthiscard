'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

const faqItems = [
  {
    q: 'Is WinUCard legal in the UK?',
    a: 'Yes. WinUCard operates as a skill-based prize competition in full compliance with UK law. Every competition requires a skill question and offers a free postal entry route, as required by the Gambling Act 2005.',
  },
  {
    q: 'How is the winner selected?',
    a: 'Every competition uses certified Random Number Generation (RNG). Draws are streamed live on our socials, and the winning ticket number is published publicly on the competition page.',
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
  const [open, setOpen] = useState(0);

  return (
    <section className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
      {/* Header */}
      <div className="mb-10">
        <Eyebrow>FAQ</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(28px, 5.5vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 0.96,
            marginTop: '12px',
          }}
        >
          Common{' '}
          <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--accent)', textDecorationThickness: '5px', textUnderlineOffset: '6px' }}>
            Questions
          </span>.
        </h2>
      </div>

      {/* Accordion */}
      <div className="flex flex-col gap-3" style={{ maxWidth: '820px', margin: '0 auto' }}>
        {faqItems.map((f, i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--ink)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between gap-5 text-left cursor-pointer"
              style={{ padding: '18px 22px', fontWeight: 700 }}
            >
              <span>{f.q}</span>
              <span
                className="transition-transform duration-200 flex-shrink-0"
                style={{ fontSize: '20px', transform: open === i ? 'rotate(45deg)' : 'none' }}
              >
                +
              </span>
            </button>
            {open === i && (
              <div style={{ padding: '0 22px 20px', color: 'var(--ink-dim)', fontSize: '14px', lineHeight: 1.6 }}>
                {f.a}
              </div>
            )}
          </div>
        ))}

        <div className="text-center mt-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/faq">View all FAQs →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
