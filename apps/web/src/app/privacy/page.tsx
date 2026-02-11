import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PrintButton } from '@/components/common/print-button';
import { SafeHtml } from '@/components/common/safe-html';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy policy for WinThisCard. Learn how we collect, use, and protect your personal data in compliance with UK GDPR.',
};

interface TableOfContentsItem {
  id: string;
  title: string;
}

const tableOfContents: TableOfContentsItem[] = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'data-controller', title: '2. Data Controller' },
  { id: 'data-collection', title: '3. Data We Collect' },
  { id: 'how-we-use', title: '4. How We Use Your Data' },
  { id: 'legal-basis', title: '5. Legal Basis for Processing' },
  { id: 'data-sharing', title: '6. Data Sharing' },
  { id: 'data-retention', title: '7. Data Retention' },
  { id: 'your-rights', title: '8. Your Rights' },
  { id: 'cookies', title: '9. Cookies' },
  { id: 'security', title: '10. Data Security' },
  { id: 'international-transfers', title: '11. International Transfers' },
  { id: 'children', title: '12. Children\'s Privacy' },
  { id: 'changes', title: '13. Changes to This Policy' },
  { id: 'contact', title: '14. Contact Us' },
];

async function getPrivacyContent() {
  try {
    const page = await prisma.staticPage.findUnique({
      where: { slug: 'privacy' },
    });
    return page;
  } catch {
    return null;
  }
}

export default async function PrivacyPage() {
  const staticPage = await getPrivacyContent();
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
            Privacy Policy
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
              <PlaceholderPrivacyContent />
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

function PlaceholderPrivacyContent() {
  return (
    <>
      <p className="lead">
        This Privacy Policy explains how WinThisCard Ltd (&quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) collects, uses, shares, and protects
        your personal data when you use our website and services. We are
        committed to protecting your privacy in compliance with the UK General
        Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
      </p>

      <section id="introduction">
        <h2>1. Introduction</h2>
        <p>
          WinThisCard operates a prize competition platform for collectible
          cards and memorabilia. This policy applies to all personal data we
          collect through our website, mobile applications, and related
          services.
        </p>
        <p>
          By using our services, you acknowledge that you have read and
          understood this Privacy Policy. If you do not agree with our
          practices, please do not use our services.
        </p>
      </section>

      <section id="data-controller">
        <h2>2. Data Controller</h2>
        <p>WinThisCard Ltd is the data controller for your personal data.</p>
        <ul>
          <li>Company Name: WinThisCard Ltd</li>
          <li>Registered in: England and Wales</li>
          <li>
            Email:{' '}
            <a href="mailto:privacy@winthiscard.com" className="text-primary">
              privacy@winthiscard.com
            </a>
          </li>
          <li>Address: [Company Address], United Kingdom</li>
        </ul>
      </section>

      <section id="data-collection">
        <h2>3. Data We Collect</h2>
        <p>We collect the following categories of personal data:</p>

        <h3>3.1 Information You Provide</h3>
        <ul>
          <li>
            <strong>Account Information:</strong> Name, email address, password,
            date of birth, phone number
          </li>
          <li>
            <strong>Profile Information:</strong> Display name, avatar, delivery
            addresses
          </li>
          <li>
            <strong>Transaction Information:</strong> Competition entries,
            ticket purchases, payment details (processed securely by Stripe)
          </li>
          <li>
            <strong>Communication Information:</strong> Messages you send us,
            customer support enquiries
          </li>
        </ul>

        <h3>3.2 Information Collected Automatically</h3>
        <ul>
          <li>
            <strong>Device Information:</strong> IP address, browser type,
            operating system, device identifiers
          </li>
          <li>
            <strong>Usage Information:</strong> Pages visited, features used,
            time spent on site, referral sources
          </li>
          <li>
            <strong>Location Information:</strong> General location based on IP
            address
          </li>
        </ul>

        <h3>3.3 Information from Third Parties</h3>
        <ul>
          <li>
            <strong>OAuth Providers:</strong> If you sign in with Google, we
            receive your name, email, and profile picture
          </li>
          <li>
            <strong>Payment Processor:</strong> Stripe provides transaction
            status and fraud prevention data
          </li>
        </ul>
      </section>

      <section id="how-we-use">
        <h2>4. How We Use Your Data</h2>
        <p>We use your personal data for the following purposes:</p>
        <ul>
          <li>
            <strong>Service Delivery:</strong> To create and manage your
            account, process ticket purchases, conduct draws, and deliver prizes
          </li>
          <li>
            <strong>Communication:</strong> To send order confirmations, draw
            results, account notifications, and respond to enquiries
          </li>
          <li>
            <strong>Legal Compliance:</strong> To verify your age and
            eligibility, comply with gambling regulations, and maintain audit
            records
          </li>
          <li>
            <strong>Security:</strong> To detect and prevent fraud, protect
            against abuse, and ensure platform security
          </li>
          <li>
            <strong>Improvement:</strong> To analyse usage patterns, improve our
            services, and develop new features
          </li>
          <li>
            <strong>Marketing:</strong> With your consent, to send promotional
            communications about new competitions
          </li>
        </ul>
      </section>

      <section id="legal-basis">
        <h2>5. Legal Basis for Processing</h2>
        <p>
          Under UK GDPR, we process your personal data on the following legal
          bases:
        </p>
        <ul>
          <li>
            <strong>Contract:</strong> Processing necessary to provide our
            services and fulfil our agreement with you
          </li>
          <li>
            <strong>Legal Obligation:</strong> Processing required to comply
            with UK gambling laws, tax regulations, and consumer protection laws
          </li>
          <li>
            <strong>Legitimate Interests:</strong> Processing for fraud
            prevention, security, service improvement, and business operations
          </li>
          <li>
            <strong>Consent:</strong> Marketing communications and non-essential
            cookies (you may withdraw consent at any time)
          </li>
        </ul>
      </section>

      <section id="data-sharing">
        <h2>6. Data Sharing</h2>
        <p>We may share your personal data with:</p>
        <ul>
          <li>
            <strong>Payment Processors:</strong> Stripe processes payments on
            our behalf and receives necessary transaction data
          </li>
          <li>
            <strong>Delivery Partners:</strong> Royal Mail, DHL, or other
            carriers to deliver prizes
          </li>
          <li>
            <strong>Service Providers:</strong> Hosting providers (Vercel),
            email services (Resend), analytics (Google Analytics)
          </li>
          <li>
            <strong>Legal Authorities:</strong> When required by law, court
            order, or to protect our legal rights
          </li>
          <li>
            <strong>Independent Draw Supervisors:</strong> Third-party
            verification for draw integrity
          </li>
        </ul>
        <p>
          We do not sell your personal data to third parties for marketing
          purposes.
        </p>
      </section>

      <section id="data-retention">
        <h2>7. Data Retention</h2>
        <p>We retain your personal data for the following periods:</p>
        <ul>
          <li>
            <strong>Account Data:</strong> For as long as your account is active
            plus 6 years after closure (for legal and tax purposes)
          </li>
          <li>
            <strong>Transaction Records:</strong> 7 years (as required by UK tax
            law)
          </li>
          <li>
            <strong>Draw Records:</strong> Indefinitely (for regulatory
            compliance and dispute resolution)
          </li>
          <li>
            <strong>Marketing Data:</strong> Until you withdraw consent or
            unsubscribe
          </li>
          <li>
            <strong>Analytics Data:</strong> 26 months (anonymised after this
            period)
          </li>
        </ul>
      </section>

      <section id="your-rights">
        <h2>8. Your Rights</h2>
        <p>Under UK GDPR, you have the following rights:</p>
        <ul>
          <li>
            <strong>Right of Access:</strong> Request a copy of your personal
            data
          </li>
          <li>
            <strong>Right to Rectification:</strong> Request correction of
            inaccurate data
          </li>
          <li>
            <strong>Right to Erasure:</strong> Request deletion of your data
            (subject to legal retention requirements)
          </li>
          <li>
            <strong>Right to Restrict Processing:</strong> Request limitation of
            how we use your data
          </li>
          <li>
            <strong>Right to Data Portability:</strong> Receive your data in a
            structured, machine-readable format
          </li>
          <li>
            <strong>Right to Object:</strong> Object to processing based on
            legitimate interests or for direct marketing
          </li>
          <li>
            <strong>Right to Withdraw Consent:</strong> Withdraw consent at any
            time where processing is based on consent
          </li>
        </ul>
        <p>
          To exercise your rights, please contact us at{' '}
          <a href="mailto:privacy@winthiscard.com" className="text-primary">
            privacy@winthiscard.com
          </a>
          . We will respond within one month.
        </p>
        <p>
          You also have the right to lodge a complaint with the Information
          Commissioner&apos;s Office (ICO) at{' '}
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            ico.org.uk
          </a>
          .
        </p>
      </section>

      <section id="cookies">
        <h2>9. Cookies</h2>
        <p>
          We use cookies and similar technologies to enhance your experience.
          For detailed information about the cookies we use and how to manage
          them, please see our{' '}
          <Link href="/cookies" className="text-primary hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
      </section>

      <section id="security">
        <h2>10. Data Security</h2>
        <p>
          We implement appropriate technical and organisational measures to
          protect your personal data, including:
        </p>
        <ul>
          <li>Encryption of data in transit (HTTPS/TLS)</li>
          <li>Encryption of data at rest</li>
          <li>Secure password hashing (bcrypt)</li>
          <li>Regular security assessments</li>
          <li>Access controls and authentication</li>
          <li>Audit logging of sensitive operations</li>
        </ul>
        <p>
          While we strive to protect your data, no method of transmission over
          the Internet is 100% secure. We cannot guarantee absolute security.
        </p>
      </section>

      <section id="international-transfers">
        <h2>11. International Transfers</h2>
        <p>
          Your data may be transferred to and processed in countries outside the
          UK. We ensure appropriate safeguards are in place, such as:
        </p>
        <ul>
          <li>Transfers to countries with UK adequacy decisions</li>
          <li>Standard Contractual Clauses approved by the ICO</li>
          <li>
            Binding Corporate Rules for transfers within corporate groups
          </li>
        </ul>
      </section>

      <section id="children">
        <h2>12. Children&apos;s Privacy</h2>
        <p>
          Our services are only available to individuals aged 18 or over. We do
          not knowingly collect personal data from children under 18. If we
          discover that we have collected data from someone under 18, we will
          delete it immediately.
        </p>
      </section>

      <section id="changes">
        <h2>13. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of significant changes by email or through a notice on our
          website. The &quot;Last updated&quot; date at the top indicates when
          this policy was last revised.
        </p>
      </section>

      <section id="contact">
        <h2>14. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or our data
          practices, please contact us:
        </p>
        <ul>
          <li>
            Email:{' '}
            <a href="mailto:privacy@winthiscard.com" className="text-primary">
              privacy@winthiscard.com
            </a>
          </li>
          <li>Post: WinThisCard Ltd, [Company Address], United Kingdom</li>
        </ul>
      </section>
    </>
  );
}
