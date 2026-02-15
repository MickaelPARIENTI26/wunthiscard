import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PrintButton } from '@/components/common/print-button';
import { SafeHtml } from '@/components/common/safe-html';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms and conditions for using WinUCard prize competition platform. Read our full terms of service.',
};

interface TableOfContentsItem {
  id: string;
  title: string;
}

const tableOfContents: TableOfContentsItem[] = [
  { id: 'definitions', title: '1. Definitions' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'account', title: '3. Account Registration' },
  { id: 'competitions', title: '4. Competitions' },
  { id: 'tickets', title: '5. Ticket Purchases' },
  { id: 'skill-question', title: '6. Skill Question Requirement' },
  { id: 'free-entry', title: '7. Free Entry Route' },
  { id: 'draw', title: '8. Draw Process' },
  { id: 'prizes', title: '9. Prizes' },
  { id: 'refunds', title: '10. Refunds & Cancellations' },
  { id: 'intellectual-property', title: '11. Intellectual Property' },
  { id: 'liability', title: '12. Limitation of Liability' },
  { id: 'privacy', title: '13. Privacy' },
  { id: 'changes', title: '14. Changes to Terms' },
  { id: 'governing-law', title: '15. Governing Law' },
  { id: 'contact', title: '16. Contact Us' },
];

async function getTermsContent() {
  try {
    const page = await prisma.staticPage.findUnique({
      where: { slug: 'terms' },
    });
    return page;
  } catch {
    return null;
  }
}

export default async function TermsPage() {
  const staticPage = await getTermsContent();
  const lastUpdated = staticPage?.updatedAt
    ? new Date(staticPage.updatedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '10 February 2026';

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Table of Contents - Desktop Sidebar */}
          <nav className="hidden lg:block print:hidden">
            <div className="sticky top-8">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Table of Contents
              </h2>
              <ul className="space-y-2 text-sm">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Table of Contents - Mobile Collapsible */}
          <details className="mb-6 rounded-lg border border-border bg-card p-4 lg:hidden print:hidden">
            <summary className="cursor-pointer font-semibold text-foreground">
              Table of Contents
            </summary>
            <ul className="mt-4 space-y-2 text-sm">
              {tableOfContents.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          {/* Content */}
          <article className="prose prose-gray max-w-none dark:prose-invert print:max-w-full">
            {staticPage?.content ? (
              <SafeHtml html={staticPage.content} />
            ) : (
              <PlaceholderTermsContent />
            )}
          </article>
        </div>

        {/* Print Button */}
        <div className="mt-12 border-t border-border pt-8 print:hidden">
          <PrintButton />
        </div>
      </main>
    </div>
  );
}

function PlaceholderTermsContent() {
  return (
    <>
      <p className="lead">
        Welcome to WinUCard. These Terms and Conditions govern your use of
        our website and participation in our prize competitions. By using our
        services, you agree to be bound by these terms.
      </p>

      <section id="definitions">
        <h2>1. Definitions</h2>
        <p>In these Terms and Conditions:</p>
        <ul>
          <li>
            <strong>&quot;WinUCard&quot;</strong>,{' '}
            <strong>&quot;we&quot;</strong>, <strong>&quot;us&quot;</strong>, or{' '}
            <strong>&quot;our&quot;</strong> refers to WinUCard Ltd, a
            company registered in England.
          </li>
          <li>
            <strong>&quot;Competition&quot;</strong> means any prize competition
            offered on our platform.
          </li>
          <li>
            <strong>&quot;Ticket&quot;</strong> means an entry into a
            Competition.
          </li>
          <li>
            <strong>&quot;Prize&quot;</strong> means the item or items offered
            as the prize in a Competition.
          </li>
          <li>
            <strong>&quot;User&quot;</strong>, <strong>&quot;you&quot;</strong>,
            or <strong>&quot;your&quot;</strong> refers to any person accessing
            or using our services.
          </li>
        </ul>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>To participate in our Competitions, you must:</p>
        <ul>
          <li>Be at least 18 years of age</li>
          <li>Be a resident of the United Kingdom</li>
          <li>Have a valid email address</li>
          <li>Not be an employee or immediate family member of WinUCard</li>
        </ul>
        <p>
          We reserve the right to verify your eligibility at any time. If you
          are found to be ineligible, any tickets purchased will be refunded and
          any prizes won must be returned.
        </p>
      </section>

      <section id="account">
        <h2>3. Account Registration</h2>
        <p>
          To participate in Competitions, you must create an account. You agree
          to:
        </p>
        <ul>
          <li>Provide accurate and complete information</li>
          <li>Keep your account credentials secure</li>
          <li>Notify us immediately of any unauthorised access</li>
          <li>Not create multiple accounts</li>
        </ul>
        <p>
          We may suspend or terminate your account if we believe you have
          violated these terms.
        </p>
      </section>

      <section id="competitions">
        <h2>4. Competitions</h2>
        <p>
          Our Competitions are prize competitions as defined by the UK Gambling
          Act 2005. They are not lotteries. Each Competition:
        </p>
        <ul>
          <li>Has a clearly stated Prize with an estimated value</li>
          <li>Has a fixed number of tickets available</li>
          <li>Has a clearly stated end date or will end when sold out</li>
          <li>Requires participants to correctly answer a skill question</li>
          <li>Offers a free entry route via postal entry</li>
        </ul>
      </section>

      <section id="tickets">
        <h2>5. Ticket Purchases</h2>
        <p>When purchasing tickets:</p>
        <ul>
          <li>All prices are displayed in British Pounds (GBP)</li>
          <li>Payment is processed securely via Stripe</li>
          <li>
            You may purchase a maximum of 50 tickets per Competition per person
          </li>
          <li>
            Bonus tickets may be awarded based on the number of tickets
            purchased
          </li>
          <li>Tickets are non-transferable</li>
        </ul>
      </section>

      <section id="skill-question">
        <h2>6. Skill Question Requirement</h2>
        <p>
          In accordance with UK law, each Competition includes a skill-based
          question that you must answer correctly to validate your entry. This
          ensures our Competitions comply with the UK Gambling Act 2005 as prize
          competitions rather than lotteries.
        </p>
        <p>
          If you answer the skill question incorrectly, you may retry up to 3
          times. After 3 failed attempts, you will be temporarily blocked from
          that Competition for 15 minutes.
        </p>
      </section>

      <section id="free-entry">
        <h2>7. Free Entry Route</h2>
        <p>
          A free entry route is available for all Competitions via postal entry.
          To enter for free:
        </p>
        <ol>
          <li>
            Write your full name, email address, the Competition name, your
            preferred ticket number(s), and your answer to the skill question on
            a postcard or piece of paper
          </li>
          <li>
            Post it to: WinUCard Free Entry, [Company Address], United
            Kingdom
          </li>
          <li>
            Use first or second class post. One entry per envelope. No purchase
            necessary.
          </li>
        </ol>
        <p>
          Free entries are treated equally to paid entries in the draw. Postal
          entries must be received before the Competition closing date.
        </p>
      </section>

      <section id="draw">
        <h2>8. Draw Process</h2>
        <p>
          The draw for each Competition is conducted using a certified Random
          Number Generator (RNG). The draw:
        </p>
        <ul>
          <li>Takes place on the stated draw date or when all tickets sell</li>
          <li>May be live-streamed for transparency</li>
          <li>Is supervised by an independent third party for high-value Prizes</li>
          <li>Results are final and binding</li>
        </ul>
        <p>
          Winners are notified by email within 24 hours of the draw. If a winner
          does not respond within 14 days, a new winner may be selected.
        </p>
      </section>

      <section id="prizes">
        <h2>9. Prizes</h2>
        <p>Prizes are as described on the Competition page. We guarantee:</p>
        <ul>
          <li>Authenticity of all items</li>
          <li>Accurate grading information where applicable</li>
          <li>Free delivery to UK addresses via tracked and insured shipping</li>
        </ul>
        <p>
          Prizes cannot be exchanged for cash. If a Prize becomes unavailable,
          we may substitute it with an item of equal or greater value.
        </p>
      </section>

      <section id="refunds">
        <h2>10. Refunds & Cancellations</h2>
        <p>
          Tickets are generally non-refundable once purchased. However, refunds
          will be issued in the following circumstances:
        </p>
        <ul>
          <li>If we cancel a Competition before the draw</li>
          <li>If there is a technical error with your purchase</li>
          <li>
            If required by law under the Consumer Rights Act 2015 (within 14
            days of purchase if the draw has not occurred)
          </li>
        </ul>
      </section>

      <section id="intellectual-property">
        <h2>11. Intellectual Property</h2>
        <p>
          All content on our website, including but not limited to text,
          graphics, logos, images, and software, is the property of WinUCard
          or its licensors and is protected by copyright and other intellectual
          property laws.
        </p>
      </section>

      <section id="liability">
        <h2>12. Limitation of Liability</h2>
        <p>To the fullest extent permitted by law:</p>
        <ul>
          <li>
            We are not liable for any indirect, incidental, or consequential
            damages
          </li>
          <li>Our total liability is limited to the amount you paid for tickets</li>
          <li>
            We are not responsible for postal delays affecting free entries
          </li>
          <li>
            We are not liable for any loss arising from the use of third-party
            services
          </li>
        </ul>
      </section>

      <section id="privacy">
        <h2>13. Privacy</h2>
        <p>
          Your privacy is important to us. Please review our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{' '}
          for information on how we collect, use, and protect your personal
          data.
        </p>
      </section>

      <section id="changes">
        <h2>14. Changes to Terms</h2>
        <p>
          We may update these Terms and Conditions from time to time. Any
          changes will be posted on this page with an updated &quot;Last
          updated&quot; date. Your continued use of our services after changes
          are posted constitutes acceptance of the updated terms.
        </p>
      </section>

      <section id="governing-law">
        <h2>15. Governing Law</h2>
        <p>
          These Terms and Conditions are governed by the laws of England and
          Wales. Any disputes shall be subject to the exclusive jurisdiction of
          the courts of England and Wales.
        </p>
      </section>

      <section id="contact">
        <h2>16. Contact Us</h2>
        <p>
          If you have any questions about these Terms and Conditions, please
          contact us:
        </p>
        <ul>
          <li>
            Email:{' '}
            <a href="mailto:legal@winucard.com" className="text-primary">
              legal@winucard.com
            </a>
          </li>
          <li>
            Post: WinUCard Ltd, [Company Address], United Kingdom
          </li>
        </ul>
      </section>
    </>
  );
}
