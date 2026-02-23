import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PrintButton } from '@/components/common/print-button';
import { SafeHtml } from '@/components/common/safe-html';
import { LegalLanguageBanner } from '@/components/legal/legal-language-banner';

export const metadata: Metadata = {
  title: 'Competition Rules',
  description:
    'Official competition rules for WinUCard prize competitions. Learn about eligibility, entry methods, draw process, and prize claiming.',
};

interface TableOfContentsItem {
  id: string;
  title: string;
}

const tableOfContents: TableOfContentsItem[] = [
  { id: 'overview', title: '1. Overview' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'how-to-enter', title: '3. How to Enter' },
  { id: 'free-entry', title: '4. Free Entry Route' },
  { id: 'skill-question', title: '5. Skill Question' },
  { id: 'tickets', title: '6. Tickets & Pricing' },
  { id: 'bonus-tickets', title: '7. Bonus Tickets' },
  { id: 'draw-process', title: '8. Draw Process' },
  { id: 'winner-notification', title: '9. Winner Notification' },
  { id: 'prize-claiming', title: '10. Prize Claiming' },
  { id: 'delivery', title: '11. Prize Delivery' },
  { id: 'cancellation', title: '12. Cancellation & Refunds' },
  { id: 'disputes', title: '13. Disputes' },
  { id: 'legal', title: '14. Legal Compliance' },
  { id: 'contact', title: '15. Contact' },
];

async function getCompetitionRulesContent() {
  try {
    const page = await prisma.staticPage.findUnique({
      where: { slug: 'competition-rules' },
    });
    return page;
  } catch {
    return null;
  }
}

export default async function CompetitionRulesPage() {
  const staticPage = await getCompetitionRulesContent();
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
            Competition Rules
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Language banner for non-English users */}
        <LegalLanguageBanner />

        {/* Important Notice */}
        <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">
            Important: All participants must be 18 years of age or older and
            resident in the United Kingdom. A free entry route is available for
            all competitions.
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
              <PlaceholderCompetitionRulesContent />
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

function PlaceholderCompetitionRulesContent() {
  return (
    <>
      <p className="lead">
        These rules apply to all prize competitions operated by WinUCard Ltd.
        By entering any competition, you agree to be bound by these rules and
        our{' '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms & Conditions
        </Link>
        .
      </p>

      <section id="overview">
        <h2>1. Overview</h2>
        <p>
          WinUCard operates prize competitions for collectible cards,
          memorabilia, and other valuable items. Our competitions are compliant
          with the UK Gambling Act 2005 as prize competitions (not lotteries),
          which require:
        </p>
        <ul>
          <li>
            A skill-based question that participants must answer correctly
          </li>
          <li>A free entry route available to all potential participants</li>
        </ul>
        <p>
          All competitions are operated fairly and transparently, with draws
          conducted using certified random number generation.
        </p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>
          To enter any WinUCard competition, you must meet ALL of the
          following requirements:
        </p>
        <ul>
          <li>
            <strong>Age:</strong> You must be at least 18 years old at the time
            of entry
          </li>
          <li>
            <strong>Residency:</strong> You must be a resident of the United
            Kingdom
          </li>
          <li>
            <strong>Account:</strong> You must have a valid WinUCard account
            with a verified email address
          </li>
          <li>
            <strong>Identity:</strong> You must provide accurate personal
            information
          </li>
        </ul>
        <p>The following persons are NOT eligible to enter:</p>
        <ul>
          <li>Employees of WinUCard Ltd and their immediate family members</li>
          <li>
            Anyone directly involved in the operation of the competitions
          </li>
          <li>
            Anyone who has been banned from the platform for any reason
          </li>
        </ul>
        <p>
          We reserve the right to verify your eligibility at any time. If you
          are found to be ineligible, your entries will be void and any prizes
          won must be returned.
        </p>
      </section>

      <section id="how-to-enter">
        <h2>3. How to Enter</h2>
        <p>There are two ways to enter our competitions:</p>

        <h3>3.1 Online Entry (Paid)</h3>
        <ol>
          <li>Create an account or log in at winucard.com</li>
          <li>Browse available competitions and select one to enter</li>
          <li>Choose your ticket number(s) manually or use random selection</li>
          <li>Select the number of tickets you wish to purchase</li>
          <li>
            Correctly answer the skill question to proceed to payment
          </li>
          <li>Complete payment via our secure checkout (powered by Stripe)</li>
          <li>
            Receive confirmation of your entry via email with your ticket
            numbers
          </li>
        </ol>

        <h3>3.2 Postal Entry (Free)</h3>
        <p>
          See Section 4 below for complete instructions on the free postal entry
          route.
        </p>
      </section>

      <section id="free-entry">
        <h2>4. Free Entry Route</h2>
        <p>
          In accordance with UK law, a free entry route is available for all
          competitions. Free entries are treated exactly the same as paid
          entries in the draw.
        </p>

        <h3>4.1 How to Enter for Free</h3>
        <ol>
          <li>
            On a postcard or plain piece of paper, clearly write:
            <ul>
              <li>Your full name (as it appears on your account, if you have one)</li>
              <li>Your email address</li>
              <li>Your date of birth</li>
              <li>The name of the competition you wish to enter</li>
              <li>Your preferred ticket number(s) (if available)</li>
              <li>Your answer to the skill question</li>
            </ul>
          </li>
          <li>
            Place in an envelope and post to:
            <br />
            <strong>WinUCard Free Entry</strong>
            <br />
            [Company Address]
            <br />
            United Kingdom
          </li>
          <li>Use Royal Mail first or second class post</li>
        </ol>

        <h3>4.2 Free Entry Terms</h3>
        <ul>
          <li>One entry per envelope (multiple envelopes permitted)</li>
          <li>
            Entries must be received before the competition closing date
          </li>
          <li>
            If your preferred ticket numbers are unavailable, alternative
            numbers will be assigned randomly
          </li>
          <li>Illegible or incomplete entries will be void</li>
          <li>We are not responsible for entries lost or delayed in the post</li>
          <li>
            Confirmation will be sent by email within 48 hours of processing
          </li>
        </ul>
      </section>

      <section id="skill-question">
        <h2>5. Skill Question</h2>
        <p>
          Each competition includes a skill-based multiple choice question. This
          is a legal requirement under UK law to qualify as a prize competition
          rather than a lottery.
        </p>
        <ul>
          <li>
            You must correctly answer the skill question to validate your entry
          </li>
          <li>
            Questions are designed to require knowledge or judgement to answer
          </li>
          <li>
            If you answer incorrectly, you may retry up to 3 times per session
          </li>
          <li>
            After 3 failed attempts, you will be temporarily blocked for 15
            minutes
          </li>
          <li>
            The correct answer is determined by WinUCard and is final
          </li>
        </ul>
      </section>

      <section id="tickets">
        <h2>6. Tickets & Pricing</h2>
        <ul>
          <li>
            All ticket prices are displayed in British Pounds (GBP) and include
            VAT where applicable
          </li>
          <li>Each competition has a fixed number of tickets available</li>
          <li>
            Each ticket is assigned a unique number from 1 to the total number
            available
          </li>
          <li>
            You may choose specific ticket numbers (if available) or have them
            randomly assigned
          </li>
          <li>
            The maximum number of tickets per person per competition is 50
            (including bonus tickets)
          </li>
          <li>Tickets are non-transferable between users</li>
        </ul>
      </section>

      <section id="bonus-tickets">
        <h2>7. Bonus Tickets</h2>
        <p>
          We offer bonus free tickets when you purchase multiple tickets in a
          single transaction:
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Tickets Purchased</th>
                <th>Bonus Tickets</th>
                <th>Total Entries</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>10</td>
                <td>+1 free</td>
                <td>11</td>
              </tr>
              <tr>
                <td>15</td>
                <td>+2 free</td>
                <td>17</td>
              </tr>
              <tr>
                <td>20</td>
                <td>+3 free</td>
                <td>23</td>
              </tr>
              <tr>
                <td>50</td>
                <td>+5 free</td>
                <td>55</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul>
          <li>
            Bonus tickets are automatically assigned random available numbers
          </li>
          <li>
            The total number of tickets (purchased + bonus) cannot exceed 50 per
            user per competition
          </li>
          <li>Bonus tier thresholds may vary and are subject to change</li>
        </ul>
      </section>

      <section id="draw-process">
        <h2>8. Draw Process</h2>
        <p>
          The draw for each competition is conducted fairly and transparently:
        </p>

        <h3>8.1 Draw Timing</h3>
        <ul>
          <li>
            Each competition has a stated draw date displayed on the competition
            page
          </li>
          <li>
            The draw will occur on the draw date OR when all tickets are sold,
            whichever comes first
          </li>
          <li>
            We reserve the right to extend the draw date if insufficient tickets
            are sold
          </li>
        </ul>

        <h3>8.2 Draw Method</h3>
        <ul>
          <li>
            All draws use a certified Random Number Generator (RNG) to ensure
            fairness
          </li>
          <li>
            For high-value prizes (over 1,000 GBP), draws are supervised by an
            independent third party
          </li>
          <li>Draws may be live-streamed for additional transparency</li>
          <li>The draw result is final and binding</li>
        </ul>

        <h3>8.3 Draw Records</h3>
        <ul>
          <li>All draws are recorded in our audit log</li>
          <li>
            Proof of the draw (video, certificate, or screenshot) is retained
            for verification
          </li>
          <li>Draw results are published on the website within 24 hours</li>
        </ul>
      </section>

      <section id="winner-notification">
        <h2>9. Winner Notification</h2>
        <p>Winners are notified and announced as follows:</p>
        <ul>
          <li>
            The winner is notified by email to the address registered on their
            account within 24 hours of the draw
          </li>
          <li>
            Winners are announced on the website with a partially anonymised
            name (e.g., &quot;J. Smith from London&quot;) and the winning ticket
            number
          </li>
          <li>
            Winners may also be announced on our social media channels with
            their consent
          </li>
          <li>
            If a winner does not respond to notification within 14 days, a new
            draw will be conducted
          </li>
        </ul>
      </section>

      <section id="prize-claiming">
        <h2>10. Prize Claiming</h2>
        <p>To claim your prize:</p>
        <ol>
          <li>Respond to the winner notification email within 14 days</li>
          <li>
            Confirm your identity by providing a copy of a valid photo ID (e.g.,
            passport, driving licence)
          </li>
          <li>
            Confirm your delivery address (must be a UK address)
          </li>
          <li>
            Complete any additional verification required for high-value prizes
          </li>
        </ol>

        <h3>10.1 Important Notes</h3>
        <ul>
          <li>Prizes cannot be exchanged for cash</li>
          <li>Prizes are non-transferable</li>
          <li>
            If a prize becomes unavailable, we may substitute it with an item of
            equal or greater value
          </li>
          <li>
            We reserve the right to void a win if the winner is found to be
            ineligible
          </li>
        </ul>
      </section>

      <section id="delivery">
        <h2>11. Prize Delivery</h2>
        <ul>
          <li>
            Prizes are shipped free of charge to UK addresses
          </li>
          <li>
            All prizes are sent via tracked and insured delivery (Royal Mail
            Special Delivery, DHL, or equivalent)
          </li>
          <li>
            Prizes are insured for their full value during transit
          </li>
          <li>
            A signature is required upon delivery
          </li>
          <li>
            Photos and/or video of the prize packaging are taken before dispatch
          </li>
          <li>
            Delivery typically occurs within 7-14 working days of prize
            confirmation
          </li>
          <li>
            The winner must confirm receipt of the prize
          </li>
        </ul>
      </section>

      <section id="cancellation">
        <h2>12. Cancellation & Refunds</h2>

        <h3>12.1 Competition Cancellation</h3>
        <p>
          We reserve the right to cancel a competition before the draw takes
          place. If a competition is cancelled:
        </p>
        <ul>
          <li>All participants will be notified by email</li>
          <li>Full refunds will be issued automatically to the original payment method</li>
          <li>Refunds are typically processed within 5-10 working days</li>
        </ul>

        <h3>12.2 Ticket Refunds</h3>
        <p>
          Tickets are generally non-refundable once purchased. However, you may
          be entitled to a refund:
        </p>
        <ul>
          <li>If the competition is cancelled before the draw</li>
          <li>If there is a technical error affecting your purchase</li>
          <li>
            Under the Consumer Rights Act 2015 within 14 days of purchase if the
            draw has not yet occurred
          </li>
        </ul>
      </section>

      <section id="disputes">
        <h2>13. Disputes</h2>
        <ul>
          <li>
            Any dispute regarding the outcome of a draw must be raised within 7
            days of the draw
          </li>
          <li>
            Disputes should be submitted in writing to{' '}
            <a
              href="mailto:disputes@winucard.com"
              className="text-primary"
            >
              disputes@winucard.com
            </a>
          </li>
          <li>
            We will investigate all disputes and respond within 14 days
          </li>
          <li>
            Our decision on any dispute is final, subject to your statutory
            rights
          </li>
          <li>
            Draw records and audit logs are available for review in case of
            disputes
          </li>
        </ul>
      </section>

      <section id="legal">
        <h2>14. Legal Compliance</h2>
        <p>Our competitions are operated in compliance with:</p>
        <ul>
          <li>
            <strong>UK Gambling Act 2005:</strong> Our competitions qualify as
            prize competitions, not lotteries, due to the skill question
            requirement and free entry route
          </li>
          <li>
            <strong>Consumer Rights Act 2015:</strong> Your statutory consumer
            rights are protected
          </li>
          <li>
            <strong>UK GDPR & Data Protection Act 2018:</strong> Your personal
            data is handled in accordance with our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <strong>ASA/CAP Advertising Codes:</strong> All promotional material
            complies with advertising standards
          </li>
        </ul>
      </section>

      <section id="contact">
        <h2>15. Contact</h2>
        <p>
          If you have any questions about our competition rules, please contact
          us:
        </p>
        <ul>
          <li>
            Email:{' '}
            <a href="mailto:support@winucard.com" className="text-primary">
              support@winucard.com
            </a>
          </li>
          <li>
            Disputes:{' '}
            <a
              href="mailto:disputes@winucard.com"
              className="text-primary"
            >
              disputes@winucard.com
            </a>
          </li>
          <li>Post: WinUCard Ltd, [Company Address], United Kingdom</li>
        </ul>
        <p>
          For full terms of use, please refer to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms & Conditions
          </Link>
          .
        </p>
      </section>
    </>
  );
}
