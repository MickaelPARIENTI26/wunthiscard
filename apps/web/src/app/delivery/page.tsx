import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Delivery Info',
  description: 'Delivery information for WinUPrize prize wins. Free tracked, insured delivery on all prizes.',
};

const tableOfContents = [
  { id: 'prize-delivery', title: '1. Prize Delivery' },
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
      <section id="prize-delivery">
        <h3 className="legal-h">1. Prize Delivery</h3>
        <p className="legal-p">All prizes are delivered free of charge via insured, tracked courier, wherever you are. We use Royal Mail Special Delivery or DPD in the UK, and an equivalent tracked and insured service elsewhere.</p>
        <p className="legal-p">Every parcel is photographed before dispatch and shipped with full tracking and insurance covering the prize value.</p>
      </section>

      <section id="international">
        <h3 className="legal-h">2. International Delivery</h3>
        <p className="legal-p">Shipping is on us, but customs duties and import taxes charged by your own country are outside our control and remain your responsibility. We will contact you after the draw to arrange international shipping.</p>
      </section>

      <section id="tracking">
        <h3 className="legal-h">3. Tracking & Insurance</h3>
        <p className="legal-p">All shipments are fully tracked and insured. We will provide your tracking number once your prize is dispatched. Insurance covers the full declared value of the prize.</p>
      </section>

      <section id="timeframes">
        <h3 className="legal-h">4. Delivery Timeframes</h3>
        <p className="legal-p">Prizes are delivered within 7–14 working days of the draw. Dispatch is typically within 7 working days, and delivery then takes 1–3 working days in the UK. International delivery may take 5–14 working days depending on destination.</p>
      </section>

      <section id="issues">
        <h3 className="legal-h">5. Delivery Issues</h3>
        <p className="legal-p">If your prize arrives damaged or does not arrive within the expected timeframe, please contact us immediately. All shipments are insured and we will resolve any delivery issues promptly.</p>
      </section>

      <section id="contact">
        <h3 className="legal-h">6. Contact</h3>
        <p className="legal-p">For delivery enquiries, email <a href="mailto:contact@winuprize.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>contact@winuprize.com</a> or contact us via the <a href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Contact page</a>.</p>
      </section>
    </LegalPage>
  );
}
