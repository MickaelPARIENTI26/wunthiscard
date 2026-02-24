import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { FaqAccordion } from './faq-accordion';
import { FaqSearch } from './faq-search';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about WinUCard prize competitions, tickets, payments, draws, delivery, and more.',
  openGraph: {
    title: 'FAQ | WinUCard',
    description:
      'Find answers to common questions about WinUCard prize competitions, tickets, payments, draws, delivery, and more.',
  },
};

// Category display configuration with emojis
const categoryConfig: Record<string, { emoji: string; label: string; order: number }> = {
  General: { emoji: '📋', label: 'General', order: 1 },
  Account: { emoji: '👤', label: 'Account & Payments', order: 5 },
  Tickets: { emoji: '🎟️', label: 'Entering Competitions', order: 2 },
  Payment: { emoji: '💳', label: 'Account & Payments', order: 5 },
  Draw: { emoji: '🎲', label: 'Draws & Winners', order: 3 },
  Delivery: { emoji: '📦', label: 'Cards & Delivery', order: 4 },
  Legal: { emoji: '⚖️', label: 'General', order: 1 },
};

async function getFaqItems() {
  const faqItems = await prisma.faqItem.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  // Group by category
  const grouped = faqItems.reduce<Record<string, typeof faqItems>>(
    (acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(item);
      return acc;
    },
    {}
  );

  // Sort categories by predefined order
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
    <main className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Hero Mini */}
      <section
        style={{
          padding: '80px 40px 40px',
          background: '#ffffff',
        }}
      >
        <div className="container mx-auto text-center">
          <h1
            className="font-[family-name:var(--font-outfit)] mb-3"
            style={{
              fontSize: '46px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Frequently Asked Questions
          </h1>
          <p style={{ color: '#6b7088', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
            Find answers to common questions about our prize competitions.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section
        style={{
          background: '#F7F7FA',
          padding: '24px 0',
          borderBottom: '1px solid #e8e8ec',
        }}
      >
        <div className="container mx-auto px-4" style={{ maxWidth: '700px' }}>
          <FaqSearch allItems={allItems} />
        </div>
      </section>

      {/* FAQ Content */}
      <section style={{ background: '#F7F7FA', padding: '40px 0 64px' }}>
        <div className="container mx-auto px-4" style={{ maxWidth: '700px' }}>
          {sortedCategories.length > 0 ? (
            <div className="space-y-8">
              {sortedCategories.map((category) => {
                const config = categoryConfig[category] ?? { emoji: '❓', label: category, order: 99 };
                return (
                  <div key={category}>
                    {/* Category Header */}
                    <div
                      className="flex items-center gap-3 mb-4"
                      style={{
                        paddingBottom: '12px',
                        borderBottom: '1px solid #e8e8ec',
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{config.emoji}</span>
                      <h2
                        className="font-[family-name:var(--font-outfit)]"
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#1a1a2e',
                        }}
                      >
                        {config.label}
                      </h2>
                    </div>

                    {/* FAQ Items */}
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e8e8ec',
                        overflow: 'hidden',
                      }}
                    >
                      <FaqAccordion items={grouped[category] ?? []} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="text-center"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e8e8ec',
                padding: '48px 24px',
              }}
            >
              <Search
                className="mx-auto mb-4"
                style={{ width: '48px', height: '48px', color: '#d0d0d4' }}
              />
              <h3
                className="font-[family-name:var(--font-outfit)] mb-2"
                style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}
              >
                No FAQs Available
              </h3>
              <p style={{ color: '#6b7088', fontSize: '14px' }}>
                We are working on adding frequently asked questions. In the
                meantime, please contact us with any questions you may have.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Golden CTA */}
      <section
        style={{
          background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC, #FFECB3, #FFF3D6)',
          padding: '72px 40px',
        }}
      >
        <div className="container mx-auto text-center" style={{ maxWidth: '600px' }}>
          <h2
            className="font-[family-name:var(--font-outfit)] mb-4"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Still Have Questions?
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#5a5a6e',
              marginBottom: '32px',
            }}
          >
            Our support team is here to help. Get in touch and we will respond
            as soon as possible.
          </p>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 font-medium transition-all duration-300"
            style={{
              padding: '14px 32px',
              borderRadius: '14px',
              background: '#1a1a2e',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Contact Us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
