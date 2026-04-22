import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { FaqAccordion } from './faq-accordion';
import { FaqSearch } from './faq-search';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about WinUCard prize competitions, tickets, payments, draws, delivery, and more.',
  openGraph: {
    title: 'FAQ | WinUCard',
    description: 'Find answers to common questions about WinUCard prize competitions.',
  },
};

const categoryConfig: Record<string, { emoji: string; label: string; order: number }> = {
  General: { emoji: '⚖️', label: 'General', order: 1 },
  Account: { emoji: '👤', label: 'Account & Payments', order: 5 },
  Tickets: { emoji: '🎟', label: 'Entering Competitions', order: 2 },
  Payment: { emoji: '💳', label: 'Account & Payments', order: 5 },
  Draw: { emoji: '🏆', label: 'Draws & Winners', order: 3 },
  Delivery: { emoji: '📦', label: 'Cards & Delivery', order: 4 },
  Legal: { emoji: '⚖️', label: 'General', order: 1 },
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
      {/* Page Header */}
      <header className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
        <div
          className="inline-flex items-center gap-2.5 mb-4"
          style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}
        >
          Help Centre
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5.5vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: '12px' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '500px', lineHeight: 1.5 }}>
          Find answers to common questions about our prize competitions.
        </p>
      </header>

      {/* Search + FAQ content */}
      <section className="section-gray" style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div className="mx-auto px-5 sm:px-8" style={{ maxWidth: '820px', paddingTop: '40px', paddingBottom: '64px' }}>
          {/* Search */}
          <div style={{ marginBottom: '32px' }}>
            <FaqSearch allItems={allItems} />
          </div>

          {/* Categories */}
          {sortedCategories.length > 0 ? (
            <div className="flex flex-col gap-8">
              {sortedCategories.map((category) => {
                const config = categoryConfig[category] ?? { emoji: '❓', label: category, order: 99 };
                return (
                  <div key={category}>
                    <h3 className="flex items-center gap-2.5 mb-3.5" style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      <span>{config.emoji}</span>{config.label}
                    </h3>
                    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                      <FaqAccordion items={grouped[category] ?? []} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', padding: '48px 24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No FAQs Available</h3>
              <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>
                We are working on adding frequently asked questions. Please contact us with any questions.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Still have questions? */}
      <section className="drop-section" style={{ textAlign: 'center', paddingBottom: '80px' }}>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Still have questions?
        </h2>
        <p style={{ color: 'var(--ink-dim)', marginBottom: '24px' }}>
          Our support team is here to help. Get in touch and we will respond as soon as possible.
        </p>
        <Button variant="primary" size="xl" asChild>
          <Link href="/contact">Contact Us →</Link>
        </Button>
      </section>
    </main>
  );
}
