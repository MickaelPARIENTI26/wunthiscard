import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { SafeHtml } from '@/components/common/safe-html';
import { LegalPage } from '@/components/legal/legal-page';
import { DEFAULT_BONUS_TIERS } from '@winucard/shared/constants';

export const metadata: Metadata = {
  title: 'Competition Rules',
  description:
    'Official competition rules for WinUPrize prize competitions. Learn about eligibility, entry methods, draw process, and prize claiming.',
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
  { id: 'buyer-wheel', title: '8. The Buyer Wheel' },
  { id: 'draw-process', title: '9. Draw Process' },
  { id: 'winner-notification', title: '10. Winner Notification' },
  { id: 'prize-claiming', title: '11. Prize Claiming' },
  { id: 'delivery', title: '12. Prize Delivery' },
  { id: 'cancellation', title: '13. Cancellation & Refunds' },
  { id: 'disputes', title: '14. Disputes' },
  { id: 'legal', title: '15. Legal Compliance' },
  { id: 'contact', title: '16. Contact' },
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
    <LegalPage title="Competition Rules" lastUpdated={`Last updated: ${lastUpdated}`} toc={tableOfContents}>
      {staticPage?.content ? (
        <SafeHtml html={staticPage.content} />
      ) : (
        <PlaceholderCompetitionRulesContent />
      )}
    </LegalPage>
  );
}

function PlaceholderCompetitionRulesContent() {
  return (
    <>
      <p className="lead">
        These rules apply to all prize competitions operated by YD PARTNERS LTD (trading as WinUPrize).
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
          WinUPrize operates prize competitions for collectible cards,
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
          All competitions are operated fairly and transparently. Each winner is
          drawn by an independent third party, and the result is published and
          verifiable on the competition page.
        </p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>
          To enter any WinUPrize competition, you must meet ALL of the
          following requirements:
        </p>
        <ul>
          <li>
            <strong>Age:</strong> You must be at least 18 years old at the time
            of entry
          </li>
          <li>
            <strong>Account:</strong> You must have a valid WinUPrize account
            with a verified email address
          </li>
          <li>
            <strong>Identity:</strong> You must provide accurate personal
            information
          </li>
        </ul>
        <p>The following persons are NOT eligible to enter:</p>
        <ul>
          <li>Employees of YD PARTNERS LTD (trading as WinUPrize) and their immediate family members</li>
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
          <li>Create an account or log in at winuprize.com</li>
          <li>Browse available competitions and select one to enter</li>
          <li>Choose your ticket number(s) manually or use random selection</li>
          <li>Select the number of tickets you wish to purchase</li>
          <li>
            Correctly answer the skill question to proceed to payment
          </li>
          <li>Complete payment via our secure checkout</li>
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
            <strong>WinUPrize Free Entry</strong>
            <br />
            71-75 Shelton Street, Covent Garden, London WC2H 9JQ
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
            The correct answer is determined by WinUPrize and is final
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
            The maximum number of tickets per person is set for each competition
            and shown on its page; some competitions have no per-person limit
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
              {DEFAULT_BONUS_TIERS.map((tier) => (
                <tr key={tier.ticketsBought}>
                  <td>{tier.ticketsBought}</td>
                  <td>+{tier.bonusTickets} free</td>
                  <td>{tier.ticketsBought + tier.bonusTickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul>
          <li>
            Bonus tickets are automatically assigned random available numbers
          </li>
          <li>
            Where a competition sets a per-person limit, purchased and bonus
            tickets both count towards it. Many competitions have no per-person
            limit — the limit that applies is always shown on the competition
            page
          </li>
          <li>Bonus tier thresholds may vary and are subject to change</li>
        </ul>
      </section>

      <section id="buyer-wheel">
        <h2>8. The Buyer Wheel</h2>
        <p>
          Some competitions include a wheel as a thank-you for buying tickets. It is
          separate from the competition draw and has no effect on it: your tickets are in
          the draw either way, and spinning changes nothing about your chance of winning
          the prize.
        </p>
        <ul>
          <li>
            <strong>One spin for every entry.</strong> It makes no difference whether you
            bought your ticket or claimed it through the free postal route — both earn the
            same single spin, on the same wheel, with the same chances. Bonus tickets are an
            extra on a purchase and do not earn additional spins
          </li>
          <li>
            <strong>Spins last until that competition closes.</strong> They are yours to
            use whenever you like until then, and we email you before they expire
          </li>
          <li>
            <strong>The prizes come from a fixed pool</strong> set before the competition
            opens, drawn without replacement — every prize won is one fewer left. The exact
            make-up of that pool, and how much of it remains, is shown on the wheel itself
          </li>
          <li>
            <strong>Discount codes are single-use and cannot be combined.</strong> One code
            per order. Each has an expiry date shown in My Rewards
          </li>
          <li>
            <strong>If a payment is reversed, the rewards go with it.</strong> A refund or a
            chargeback cancels the spins that order earned and any unused code won on them,
            because the tickets that earned them were not paid for. A code you have already
            spent is not clawed back
          </li>
          <li>
            <strong>If we cancel a competition</strong>, its spins end with it — but any code
            you already won stays valid, and we extend it. That cancellation is our decision,
            not yours
          </li>
          <li>
            <strong>A graded card won on the wheel</strong> is shipped tracked and insured,
            like any other prize. Where the payment behind it has been reversed or disputed,
            we hold delivery until that is settled and will contact you
          </li>
        </ul>
      </section>

      <section id="draw-process">
        <h2>9. Draw Process</h2>
        <p>
          The draw for each competition is conducted fairly and transparently:
        </p>

        <h3>9.1 Draw Timing</h3>
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

        <h3>9.2 Draw Method</h3>
        <ul>
          <li>
            The winning ticket number is selected by an independent third party
            to ensure fairness
          </li>
          <li>
            The result is published on the competition page, and the winner is
            notified, within 24 hours of the draw
          </li>
          <li>
            The winning ticket number is verifiable against the published entry
            list
          </li>
          <li>The draw result is final and binding</li>
        </ul>

        <h3>9.3 Draw Records</h3>
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
        <h2>10. Winner Notification</h2>
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
        <h2>11. Prize Claiming</h2>
        <p>To claim your prize:</p>
        <ol>
          <li>Respond to the winner notification email within 14 days</li>
          <li>
            Confirm your identity by providing a copy of a valid photo ID (e.g.,
            passport, driving licence)
          </li>
          <li>
            Confirm your delivery address
          </li>
          <li>
            Complete any additional verification required for high-value prizes
          </li>
        </ol>

        <h3>11.1 Important Notes</h3>
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
        <h2>12. Prize Delivery</h2>
        <ul>
          <li>
            Prizes are shipped free of charge
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
        <h2>13. Cancellation & Refunds</h2>

        <h3>13.1 Competition Cancellation</h3>
        <p>
          We reserve the right to cancel a competition before the draw takes
          place. If a competition is cancelled:
        </p>
        <ul>
          <li>All participants will be notified by email</li>
          <li>Full refunds will be issued automatically to the original payment method</li>
          <li>Refunds are typically processed within 5-10 working days</li>
        </ul>

        <h3>13.2 Ticket Refunds</h3>
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
        <h2>14. Disputes</h2>
        <ul>
          <li>
            Any dispute regarding the outcome of a draw must be raised within 7
            days of the draw
          </li>
          <li>
            Disputes should be submitted in writing to{' '}
            <a
              href="mailto:contact@winuprize.com"
              className="text-primary"
            >
              contact@winuprize.com
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
        <h2>15. Legal Compliance</h2>
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
        <h2>16. Contact</h2>
        <p>
          If you have any questions about our competition rules, please contact
          us:
        </p>
        <ul>
          <li>
            Email:{' '}
            <a href="mailto:contact@winuprize.com" className="text-primary">
              contact@winuprize.com
            </a>
          </li>
          <li>
            Disputes:{' '}
            <a
              href="mailto:contact@winuprize.com"
              className="text-primary"
            >
              contact@winuprize.com
            </a>
          </li>
          <li>Post: YD PARTNERS LTD (WinUPrize), 71-75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom</li>
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
