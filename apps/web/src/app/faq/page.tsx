import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Search, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/db';
import { FaqAccordion } from './faq-accordion';
import { FaqSearch } from './faq-search';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about WinThisCard prize competitions, tickets, payments, draws, delivery, and more.',
  openGraph: {
    title: 'FAQ | WinThisCard',
    description:
      'Find answers to common questions about WinThisCard prize competitions, tickets, payments, draws, delivery, and more.',
  },
};

// FAQ categories in display order
const categoryOrder = [
  'Account',
  'Tickets',
  'Payment',
  'Draw',
  'Delivery',
  'Legal',
];

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
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return { grouped, sortedCategories, allItems: faqItems };
}

export default async function FaqPage() {
  const { grouped, sortedCategories, allItems } = await getFaqItems();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex justify-center">
            <HelpCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Find answers to common questions about our prize competitions. Can
            not find what you are looking for? Contact us and we will help.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="border-b px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FaqSearch allItems={allItems} />
        </div>
      </section>

      {/* FAQ Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {sortedCategories.length > 0 ? (
            <div className="space-y-8">
              {sortedCategories.map((category) => (
                <div key={category}>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
                      {category.charAt(0)}
                    </span>
                    {category}
                  </h2>
                  <FaqAccordion items={grouped[category] ?? []} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No FAQs Available</h3>
              <p className="text-muted-foreground">
                We are working on adding frequently asked questions. In the
                meantime, please contact us with any questions you may have.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <MessageSquare className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="mb-3 text-xl font-semibold">Still Have Questions?</h2>
          <p className="mb-6 text-muted-foreground">
            Our support team is here to help. Get in touch and we will respond
            as soon as possible.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
