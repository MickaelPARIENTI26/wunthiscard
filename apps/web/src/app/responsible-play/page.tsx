import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Responsible Play',
  description: 'WinUCard responsible play policy. We take player welfare seriously.',
};

const tableOfContents = [
  { id: 'our-commitment', title: '1. Our Commitment' },
  { id: 'not-gambling', title: '2. Skill Competitions, Not Gambling' },
  { id: 'spending-limits', title: '3. Spending Limits' },
  { id: 'self-exclusion', title: '4. Self-Exclusion' },
  { id: 'support', title: '5. Support & Resources' },
  { id: 'contact', title: '6. Contact' },
];

/* ⚠️ CONTENT TO BE COMPLETED — placeholder structure only.
   Replace each section's text with final copy before going live.
   LAWYER REVIEW REQUIRED for responsible play commitments. */
export default function ResponsiblePlayPage() {
  return (
    <LegalPage title="Responsible Play" lastUpdated="Last updated: 1 April 2026" toc={tableOfContents}>
      <section id="our-commitment">
        <h3 className="legal-h">1. Our Commitment</h3>
        <p className="legal-p">WinUCard is committed to providing a safe, fair, and enjoyable experience for all participants. While our competitions are skill-based prize competitions (not gambling), we take player welfare seriously and have implemented measures to promote responsible play.</p>
      </section>

      <section id="not-gambling">
        <h3 className="legal-h">2. Skill Competitions, Not Gambling</h3>
        <p className="legal-p">WinUCard operates prize competitions under the UK Gambling Act 2005. Our competitions require participants to answer a skill-based question and offer a free postal entry route. They are not classified as gambling.</p>
        <p className="legal-p">However, we recognise that any activity involving spending money should be approached responsibly.</p>
      </section>

      <section id="spending-limits">
        <h3 className="legal-h">3. Spending Limits</h3>
        <p className="legal-p">We enforce a maximum of 50 tickets per person per competition. We monitor account activity and may contact users who display unusual purchasing patterns.</p>
        <p className="legal-p">We encourage all participants to set a personal budget for competition entries and to never spend more than they can afford.</p>
      </section>

      <section id="self-exclusion">
        <h3 className="legal-h">4. Self-Exclusion</h3>
        <p className="legal-p">If you feel you need a break from entering competitions, you can request self-exclusion from your account settings or by emailing us. Self-exclusion periods range from 24 hours to 6 months.</p>
        <p className="legal-p">During a self-exclusion period, you will not be able to purchase tickets or enter any competitions.</p>
      </section>

      <section id="support">
        <h3 className="legal-h">5. Support & Resources</h3>
        <p className="legal-p">If you or someone you know needs help with problem gambling or compulsive spending, the following free and confidential services are available:</p>
        <p className="legal-p"><strong>GamCare</strong> — 0808 8020 133 — <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>gamcare.org.uk</a></p>
        <p className="legal-p"><strong>GambleAware</strong> — <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>begambleaware.org</a></p>
        <p className="legal-p"><strong>National Gambling Helpline</strong> — 0808 8020 133 (free, 24/7)</p>
      </section>

      <section id="contact">
        <h3 className="legal-h">6. Contact</h3>
        <p className="legal-p">For any questions about responsible play or to request self-exclusion, email <a href="mailto:support@winucard.com" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>support@winucard.com</a>.</p>
      </section>
    </LegalPage>
  );
}
