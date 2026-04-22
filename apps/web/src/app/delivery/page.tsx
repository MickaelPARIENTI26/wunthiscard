import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Delivery Info',
  description: 'Delivery information for WinUCard prize wins. Free tracked UK delivery on all prizes.',
};

const tableOfContents = [
  { id: 'uk-delivery', title: '1. UK Delivery' },
  { id: 'international', title: '2. International Delivery' },
  { id: 'tracking', title: '3. Tracking & Insurance' },
  { id: 'timeframes', title: '4. Delivery Timeframes' },
  { id: 'issues', title: '5. Delivery Issues' },
  { id: 'contact', title: '6. Contact' },
];

/* ⚠️ CONTENT TO BE COMPLETED — placeholder structure only.
   Replace each section's text with final copy before going live. */
export default function DeliveryPage() {
  return (
    <LegalPage title="Delivery Info" lastUpdated="Last updated: 1 April 2026" toc={tableOfContents}>
      <section id="uk-delivery">
        <h3 className="legal-h">1. UK Delivery</h3>
        <p className="legal-p">All prizes are delivered to UK winners free of charge via insured, tracked courier. We use Royal Mail Special Delivery or DPD for all prize shipments.</p>
        <p className="legal-p">Every parcel is photographed before dispatch and shipped with full tracking and insurance covering the prize value.</p>
      </section>

      <section id="international">
        <h3 className="legal-h">2. International Delivery</h3>
        <p className="legal-p">International winners are responsible for any customs duties, import taxes, or additional shipping costs. We will contact you after the draw to arrange international shipping.</p>
      </section>

      <section id="tracking">
        <h3 className="legal-h">3. Tracking & Insurance</h3>
        <p className="legal-p">All shipments are fully tracked and insured. You will receive a tracking number by email once your prize is dispatched. Insurance covers the full declared value of the prize.</p>
      </section>

      <section id="timeframes">
        <h3 className="legal-h">4. Delivery Timeframes</h3>
        <p className="legal-p">UK delivery typically takes 1–3 working days from dispatch. We aim to dispatch all prizes within 7 working days of the draw. International delivery may take 5–14 working days depending on destination.</p>
      </section>

      <section id="issues">
        <h3 className="legal-h">5. Delivery Issues</h3>
        <p className="legal-p">If your prize arrives damaged or does not arrive within the expected timeframe, please contact us immediately. All shipments are insured and we will resolve any delivery issues promptly.</p>
      </section>

      <section id="contact">
        <h3 className="legal-h">6. Contact</h3>
        <p className="legal-p">For delivery enquiries, email <a href="mailto:delivery@winucard.com" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>delivery@winucard.com</a> or contact us via the <a href="/contact" style={{ color: 'var(--accent-2)', textDecoration: 'underline' }}>Contact page</a>.</p>
      </section>
    </LegalPage>
  );
}
