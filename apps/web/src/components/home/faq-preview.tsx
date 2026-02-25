'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const faqItems = [
  {
    question: 'Is this legal in the UK?',
    answer:
      'Yes, absolutely. Our competitions are classified as prize competitions under the UK Gambling Act 2005, not lotteries. This is because entry requires answering a skill-based question correctly. We also offer a free postal entry route as required by UK regulations.',
  },
  {
    question: 'How is the winner selected?',
    answer:
      'Winners are selected using a certified Random Number Generator (RNG) that is cryptographically secure and cannot be manipulated. For high-value prizes, draws may be conducted under independent supervision or live-streamed for complete transparency.',
  },
  {
    question: 'Can I enter for free?',
    answer:
      'Yes. In accordance with UK regulations, we offer a free postal entry route for all competitions. Simply send a letter with your details, chosen ticket number, and answer to the skill question to our registered address. One free entry per person per competition is permitted.',
  },
  {
    question: 'How will I receive my prize?',
    answer:
      'Winners receive their prizes via tracked, insured delivery within 7-14 business days of the draw. Every item is carefully packaged, photographed before dispatch, and shipped with full tracking and insurance for your peace of mind.',
  },
];

export function FAQPreview() {
  return (
    <section style={{ background: '#ffffff', padding: '64px 0' }}>
      <div className="container mx-auto px-4" style={{ maxWidth: '700px' }}>
        <h2
          className="font-[family-name:var(--font-outfit)] text-center mb-8"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1a1a2e',
          }}
        >
          Common Questions
        </h2>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="group"
              style={{
                background: '#F7F7FA',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              <summary
                className="flex items-center justify-between cursor-pointer"
                style={{
                  padding: '18px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#1a1a2e',
                  listStyle: 'none',
                }}
              >
                <span>{item.question}</span>
                <ChevronDown
                  className="h-5 w-5 transition-transform group-open:rotate-180"
                  style={{ color: '#6b7088' }}
                />
              </summary>
              <div
                style={{
                  padding: '0 24px 18px',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: '#555',
                }}
              >
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/faq"
            style={{
              color: '#E8A000',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            View all FAQs
          </Link>
        </div>
      </div>
    </section>
  );
}
