import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { FaqAccordion } from './faq-accordion';
import { FaqSearch } from './faq-search';
import { StructuredData } from '@/components/common/structured-data';
import { generateFaqSchema } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about WinUPrize prize competitions, tickets, payments, draws, delivery, and more.',
  openGraph: {
    title: 'FAQ | WinUPrize',
    description: 'Find answers to common questions about WinUPrize prize competitions.',
  },
};

// Keys must match the FaqItem.category values seeded in bootstrap.ts (and in prod),
// otherwise headings fall back to a generic ❓ and unordered raw category string.
const categoryConfig: Record<string, { emoji: string; label: string; order: number }> = {
  'Getting Started': { emoji: '🚀', label: 'Getting Started', order: 1 },
  'Tickets & Entry': { emoji: '🎟', label: 'Tickets & Entry', order: 2 },
  Payment: { emoji: '💳', label: 'Payment', order: 3 },
  'The Draw': { emoji: '🏆', label: 'The Draw', order: 4 },
  'Winners & Delivery': { emoji: '📦', label: 'Winners & Delivery', order: 5 },
  'Legal & Eligibility': { emoji: '⚖️', label: 'Legal & Eligibility', order: 6 },
};

async function getFaqItems() {
  const faqItems = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  const grouped = faqItems.reduce<Record<string, typeof faqItems>>((acc, item) => {
    const category = item.category;
    if (!acc[category]) acc[category] = [];
    acc[category]!.push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = categoryConfig[a]?.order ?? 99;
    const orderB = categoryConfig[b]?.order ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });

  return { grouped, sortedCategories, allItems: faqItems };
}

export default async function FaqPage() {
  const { grouped, sortedCategories, allItems } = await getFaqItems();

  return (
    <main>
      <StructuredData data={generateFaqSchema(allItems)} />

      {/* Page header on the raised panel surface */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>Help centre</p>
          <h1 className="wup-h1" style={{ margin: '0 0 14px' }}>Frequently Asked Questions</h1>
          <p className="wup-body" style={{ maxWidth: '560px', margin: 0 }}>
            Find answers to common questions about our prize competitions.
          </p>
        </div>
      </header>

      {/* Search + grouped questions */}
      <section style={{ padding: 'clamp(24px, 3.4vw, 44px) clamp(14px, 3vw, 34px)' }}>
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
          <div style={{ marginBottom: '32px' }}>
            <FaqSearch allItems={allItems} />
          </div>

          {sortedCategories.length > 0 ? (
            <div className="flex flex-col" style={{ gap: 'clamp(26px, 3.4vw, 42px)' }}>
              {sortedCategories.map((category) => {
                const config = categoryConfig[category] ?? { emoji: '❓', label: category, order: 99 };
                return (
                  <div key={category}>
                    <h2
                      className="wup-h2-doc flex items-center"
                      style={{ gap: '10px', color: 'var(--accent)', borderBottomColor: 'rgba(201, 162, 39, .4)', marginBottom: '16px' }}
                    >
                      <span aria-hidden="true">{config.emoji}</span>{config.label}
                    </h2>
                    <div className="flex flex-col" style={{ gap: '10px' }}>
                      <FaqAccordion items={grouped[category] ?? []} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="wup-panel text-center" style={{ padding: '48px 24px' }}>
              <h3 className="wup-title" style={{ marginBottom: '8px' }}>No FAQs available</h3>
              <p className="wup-body-sm" style={{ margin: 0 }}>
                We are working on adding frequently asked questions. Please contact us with any questions.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Still have questions? */}
      <section style={{ padding: '0 clamp(14px, 3vw, 34px) clamp(40px, 6vw, 80px)' }}>
        <div
          className="wup-panel wup-panel--accent-top mx-auto text-center"
          style={{ maxWidth: '900px', padding: 'clamp(26px, 3.4vw, 44px)' }}
        >
          <h2 className="wup-h2" style={{ fontSize: 'clamp(24px, 3.4vw, 38px)', margin: '0 0 12px' }}>
            Still have questions?
          </h2>
          <p className="wup-body-sm" style={{ margin: '0 auto 24px', maxWidth: '520px' }}>
            Our support team is here to help. Get in touch and we will respond as soon as possible.
          </p>
          <Link href="/contact" className="wup-btn wup-btn--primary">Contact Us →</Link>
        </div>
      </section>
    </main>
  );
}
