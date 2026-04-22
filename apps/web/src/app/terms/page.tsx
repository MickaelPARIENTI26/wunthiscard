import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { SafeHtml } from '@/components/common/safe-html';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms and conditions for using WinUCard prize competition platform. Read our full terms of service.',
};

const tableOfContents = [
  { id: 'definitions', title: '1. Definitions' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'account', title: '3. Account Registration' },
  { id: 'competitions', title: '4. Competitions' },
  { id: 'tickets', title: '5. Ticket Purchases' },
  { id: 'skill-question', title: '6. Skill Question Requirement' },
  { id: 'free-entry', title: '7. Free Entry Route' },
  { id: 'draw', title: '8. Draw Process' },
  { id: 'prizes', title: '9. Prizes' },
  { id: 'winner-publicity', title: '10. Winner Publicity' },
  { id: 'refunds', title: '11. Refunds & Cancellations' },
  { id: 'intellectual-property', title: '12. Intellectual Property' },
  { id: 'liability', title: '13. Limitation of Liability' },
  { id: 'privacy', title: '14. Privacy' },
  { id: 'changes', title: '15. Changes to Terms' },
  { id: 'governing-law', title: '16. Governing Law' },
  { id: 'contact', title: '17. Contact Us' },
];

async function getTermsContent() {
  try {
    return await prisma.staticPage.findUnique({ where: { slug: 'terms' } });
  } catch {
    return null;
  }
}

export default async function TermsPage() {
  const staticPage = await getTermsContent();
  const lastUpdated = staticPage?.updatedAt
    ? `Last updated: ${new Date(staticPage.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : 'Last updated: 10 February 2026';

  return (
    <LegalPage title="Terms & Conditions" lastUpdated={lastUpdated} toc={tableOfContents}>
      {staticPage?.content ? (
        <SafeHtml html={staticPage.content} />
      ) : (
        <TermsContent />
      )}
    </LegalPage>
  );
}

/* ⚠️ LAWYER REVIEW REQUIRED — This content is placeholder-quality and must be reviewed
   by a qualified UK solicitor before going live. Key areas: eligibility, free postal entry
   route (Gambling Act 2005), liability limitations, refund policy, winner publicity rights. */
function TermsContent() {
  return (
    <>
      <section id="definitions">
        <h3 className="legal-h">1. Definitions</h3>
        <p className="legal-p">In these Terms and Conditions:</p>
        <p className="legal-p">
          <strong>&quot;WinUCard&quot;</strong>, <strong>&quot;we&quot;</strong>, <strong>&quot;us&quot;</strong>, or <strong>&quot;our&quot;</strong> refers to WinUCard Ltd, a company registered in England. <strong>&quot;Competition&quot;</strong> means any prize competition offered on our platform. <strong>&quot;Ticket&quot;</strong> means an entry into a Competition. <strong>&quot;Prize&quot;</strong> means the item(s) offered as the prize. <strong>&quot;User&quot;</strong>, <strong>&quot;you&quot;</strong>, or <strong>&quot;your&quot;</strong> refers to any person accessing or using our services.
        </p>
      </section>

      <section id="eligibility">
        <h3 className="legal-h">2. Eligibility</h3>
        <p className="legal-p">To participate in our Competitions, you must be at least 18 years of age, be a resident of the United Kingdom, have a valid email address, and not be an employee or immediate family member of WinUCard.</p>
        <p className="legal-p">We reserve the right to verify your eligibility at any time. If you are found to be ineligible, any tickets purchased will be refunded and any prizes won must be returned.</p>
      </section>

      <section id="account">
        <h3 className="legal-h">3. Account Registration</h3>
        <p className="legal-p">To participate in Competitions, you must create an account. You agree to provide accurate and complete information, keep your account credentials secure, notify us immediately of any unauthorised access, and not create multiple accounts.</p>
      </section>

      <section id="competitions">
        <h3 className="legal-h">4. Competitions</h3>
        <p className="legal-p">Our Competitions are prize competitions as defined by the UK Gambling Act 2005. They are not lotteries. Each Competition has a clearly stated Prize with an estimated value, a fixed number of tickets available, a clearly stated end date, requires participants to correctly answer a skill question, and offers a free entry route via postal entry.</p>
      </section>

      <section id="tickets">
        <h3 className="legal-h">5. Ticket Purchases</h3>
        <p className="legal-p">All prices are displayed in British Pounds (GBP). Payment is processed securely via Stripe. You may purchase a maximum of 50 tickets per Competition per person. Bonus tickets may be awarded based on the number of tickets purchased. Tickets are non-transferable.</p>
      </section>

      <section id="skill-question">
        <h3 className="legal-h">6. Skill Question Requirement</h3>
        <p className="legal-p">In accordance with UK law, each Competition includes a skill-based question that you must answer correctly to validate your entry. This ensures our Competitions comply with the UK Gambling Act 2005 as prize competitions rather than lotteries.</p>
        <p className="legal-p">If you answer the skill question incorrectly, you may retry up to 3 times. After 3 failed attempts, you will be temporarily blocked from that Competition for 15 minutes.</p>
      </section>

      <section id="free-entry">
        <h3 className="legal-h">7. Free Entry Route</h3>
        <p className="legal-p">A free entry route is available for all Competitions via postal entry. Write your full name, email address, the Competition name, your preferred ticket number(s), and your answer to the skill question on a postcard or piece of paper. Post it to: WinUCard Free Entry, Unit 14 Skyline House, 200 Union Street, London SE1 0LX. One entry per envelope. No purchase necessary.</p>
        <p className="legal-p">Free entries are treated equally to paid entries in the draw. Postal entries must be received before the Competition closing date.</p>
      </section>

      <section id="draw">
        <h3 className="legal-h">8. Draw Process</h3>
        <p className="legal-p">The draw for each Competition is conducted using a certified Random Number Generator (RNG). The draw takes place on the stated draw date or when all tickets sell, may be live-streamed for transparency, and results are final and binding.</p>
        <p className="legal-p">Winners are notified by email within 24 hours of the draw. If a winner does not respond within 14 days, a new winner may be selected.</p>
      </section>

      <section id="prizes">
        <h3 className="legal-h">9. Prizes</h3>
        <p className="legal-p">Prizes are as described on the Competition page. We guarantee authenticity of all items, accurate grading information where applicable, and free delivery to UK addresses via tracked and insured shipping. Prizes cannot be exchanged for cash.</p>
      </section>

      <section id="winner-publicity">
        <h3 className="legal-h">10. Winner Publicity and Photo Requirement</h3>
        <p className="legal-p">Upon receiving your prize, you are required to provide at least one photograph of yourself with the prize item within 7 days of delivery. By submitting your photograph, you grant WinUCard a non-exclusive, royalty-free, worldwide licence to use, reproduce, and publish your photograph and first name across our marketing channels.</p>
        <p className="legal-p">We will only publish your first name and last initial. You may opt out by emailing <a href="mailto:winners@winucard.co.uk" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>winners@winucard.co.uk</a> within 48 hours of being notified as a winner.</p>
      </section>

      <section id="refunds">
        <h3 className="legal-h">11. Refunds & Cancellations</h3>
        <p className="legal-p">Tickets are generally non-refundable once purchased. However, refunds will be issued if we cancel a Competition before the draw, if there is a technical error with your purchase, or if required by law under the Consumer Rights Act 2015 (within 14 days of purchase if the draw has not occurred).</p>
      </section>

      <section id="intellectual-property">
        <h3 className="legal-h">12. Intellectual Property</h3>
        <p className="legal-p">All content on our website, including text, graphics, logos, images, and software, is the property of WinUCard or its licensors and is protected by copyright and other intellectual property laws.</p>
      </section>

      <section id="liability">
        <h3 className="legal-h">13. Limitation of Liability</h3>
        <p className="legal-p">To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid for tickets. Nothing in these Terms limits our liability for fraud, personal injury, or death caused by our negligence.</p>
      </section>

      <section id="privacy">
        <h3 className="legal-h">14. Privacy</h3>
        <p className="legal-p">Your privacy is important to us. Please review our <Link href="/privacy" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>Privacy Policy</Link> for information on how we collect, use, and protect your personal data.</p>
      </section>

      <section id="changes">
        <h3 className="legal-h">15. Changes to Terms</h3>
        <p className="legal-p">We may update these Terms from time to time. Any changes will be posted on this page with an updated date. Your continued use of our services constitutes acceptance of the updated terms.</p>
      </section>

      <section id="governing-law">
        <h3 className="legal-h">16. Governing Law</h3>
        <p className="legal-p">These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
      </section>

      <section id="contact">
        <h3 className="legal-h">17. Contact Us</h3>
        <p className="legal-p">If you have any questions, please contact us at <a href="mailto:legal@winucard.com" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>legal@winucard.com</a> or by post: WinUCard Ltd, Unit 14 Skyline House, 200 Union Street, London SE1 0LX.</p>
      </section>
    </>
  );
}
