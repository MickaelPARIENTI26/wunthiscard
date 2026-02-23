import type { Metadata } from 'next';
import Link from 'next/link';
import { PrintButton } from '@/components/common/print-button';
import { LegalLanguageBanner } from '@/components/legal/legal-language-banner';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Cookie policy for WinUCard. Learn about the cookies we use and how to manage your preferences.',
};

interface TableOfContentsItem {
  id: string;
  title: string;
}

const tableOfContents: TableOfContentsItem[] = [
  { id: 'what-are-cookies', title: '1. What Are Cookies' },
  { id: 'how-we-use', title: '2. How We Use Cookies' },
  { id: 'essential-cookies', title: '3. Essential Cookies' },
  { id: 'analytics-cookies', title: '4. Analytics Cookies' },
  { id: 'third-party-cookies', title: '5. Third-Party Cookies' },
  { id: 'manage-cookies', title: '6. Managing Cookies' },
  { id: 'changes', title: '7. Changes to This Policy' },
  { id: 'contact', title: '8. Contact Us' },
];

interface CookieInfo {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
}

const essentialCookies: CookieInfo[] = [
  {
    name: 'next-auth.session-token',
    provider: 'WinUCard',
    purpose: 'Maintains your logged-in session securely',
    expiry: '24 hours',
  },
  {
    name: 'next-auth.csrf-token',
    provider: 'WinUCard',
    purpose: 'Protects against cross-site request forgery attacks',
    expiry: 'Session',
  },
  {
    name: 'next-auth.callback-url',
    provider: 'WinUCard',
    purpose: 'Stores the URL to redirect to after authentication',
    expiry: 'Session',
  },
  {
    name: 'cookie-consent',
    provider: 'WinUCard',
    purpose: 'Remembers your cookie preferences',
    expiry: '1 year',
  },
];

const analyticsCookies: CookieInfo[] = [
  {
    name: '_ga',
    provider: 'Google Analytics',
    purpose: 'Distinguishes unique users to understand site usage',
    expiry: '2 years',
  },
  {
    name: '_ga_*',
    provider: 'Google Analytics',
    purpose: 'Maintains session state for Google Analytics 4',
    expiry: '2 years',
  },
  {
    name: '_gid',
    provider: 'Google Analytics',
    purpose: 'Distinguishes users for short-term tracking',
    expiry: '24 hours',
  },
];

const thirdPartyCookies: CookieInfo[] = [
  {
    name: '__stripe_mid',
    provider: 'Stripe',
    purpose: 'Fraud prevention and payment processing',
    expiry: '1 year',
  },
  {
    name: '__stripe_sid',
    provider: 'Stripe',
    purpose: 'Session identification for payment processing',
    expiry: '30 minutes',
  },
];

export default function CookiesPage() {
  const lastUpdated = '10 February 2026';

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
            Cookie Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Language banner for non-English users */}
        <LegalLanguageBanner />

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
            <p className="lead">
              This Cookie Policy explains how WinUCard Ltd uses cookies and
              similar technologies when you visit our website. By using our
              website, you consent to the use of cookies as described in this
              policy.
            </p>

            <section id="what-are-cookies">
              <h2>1. What Are Cookies</h2>
              <p>
                Cookies are small text files that are placed on your device when
                you visit a website. They are widely used to make websites work
                more efficiently, provide information to website owners, and
                enhance user experience.
              </p>
              <p>
                Cookies can be &quot;persistent&quot; (remaining on your device
                until they expire or are deleted) or &quot;session&quot; cookies
                (deleted when you close your browser).
              </p>
            </section>

            <section id="how-we-use">
              <h2>2. How We Use Cookies</h2>
              <p>We use cookies for the following purposes:</p>
              <ul>
                <li>
                  <strong>Essential functionality:</strong> To enable core
                  features like user authentication and security
                </li>
                <li>
                  <strong>Remember preferences:</strong> To store your cookie
                  consent choices
                </li>
                <li>
                  <strong>Analytics:</strong> To understand how visitors
                  interact with our website
                </li>
                <li>
                  <strong>Payment processing:</strong> To facilitate secure
                  payments through Stripe
                </li>
              </ul>
            </section>

            <section id="essential-cookies">
              <h2>3. Essential Cookies</h2>
              <p>
                These cookies are necessary for the website to function
                properly. They enable core functionality such as security,
                session management, and basic accessibility. You cannot opt out
                of these cookies as they are essential for the site to work.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th>Cookie Name</th>
                      <th>Provider</th>
                      <th>Purpose</th>
                      <th>Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {essentialCookies.map((cookie) => (
                      <tr key={cookie.name}>
                        <td>
                          <code>{cookie.name}</code>
                        </td>
                        <td>{cookie.provider}</td>
                        <td>{cookie.purpose}</td>
                        <td>{cookie.expiry}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="analytics-cookies">
              <h2>4. Analytics Cookies</h2>
              <p>
                We use Google Analytics to understand how visitors use our
                website. This helps us improve our services and user experience.
                These cookies collect information anonymously, including the
                number of visitors, where visitors came from, and the pages they
                viewed.
              </p>
              <p>
                You can opt out of analytics cookies through our cookie consent
                banner or by installing the{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Google Analytics opt-out browser add-on
                </a>
                .
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th>Cookie Name</th>
                      <th>Provider</th>
                      <th>Purpose</th>
                      <th>Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsCookies.map((cookie) => (
                      <tr key={cookie.name}>
                        <td>
                          <code>{cookie.name}</code>
                        </td>
                        <td>{cookie.provider}</td>
                        <td>{cookie.purpose}</td>
                        <td>{cookie.expiry}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="third-party-cookies">
              <h2>5. Third-Party Cookies</h2>
              <p>
                Some cookies are placed by third-party services that appear on
                our pages. We do not control these cookies.
              </p>

              <h3>5.1 Stripe (Payment Processing)</h3>
              <p>
                We use Stripe to process payments securely. Stripe may set
                cookies to help prevent fraud and facilitate payment processing.
                For more information, see{' '}
                <a
                  href="https://stripe.com/gb/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Stripe&apos;s Privacy Policy
                </a>
                .
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th>Cookie Name</th>
                      <th>Provider</th>
                      <th>Purpose</th>
                      <th>Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thirdPartyCookies.map((cookie) => (
                      <tr key={cookie.name}>
                        <td>
                          <code>{cookie.name}</code>
                        </td>
                        <td>{cookie.provider}</td>
                        <td>{cookie.purpose}</td>
                        <td>{cookie.expiry}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3>5.2 Google (Analytics)</h3>
              <p>
                Google Analytics cookies are set when you consent to analytics
                tracking. For more information, see{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  Google&apos;s Privacy Policy
                </a>
                .
              </p>
            </section>

            <section id="manage-cookies">
              <h2>6. Managing Cookies</h2>
              <p>
                You have several options for managing cookies:
              </p>

              <h3>6.1 Cookie Consent Banner</h3>
              <p>
                When you first visit our website, you will see a cookie consent
                banner. You can choose to accept or decline non-essential
                cookies. Your preference is saved in a cookie for future visits.
              </p>

              <h3>6.2 Browser Settings</h3>
              <p>
                Most web browsers allow you to control cookies through their
                settings. You can usually find these settings in the
                &quot;Options&quot; or &quot;Preferences&quot; menu of your
                browser.
              </p>
              <ul>
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    Apple Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-gb/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>

              <h3>6.3 Impact of Disabling Cookies</h3>
              <p>
                If you disable essential cookies, some parts of our website may
                not function correctly. For example:
              </p>
              <ul>
                <li>You may not be able to log in to your account</li>
                <li>Your shopping basket may not work properly</li>
                <li>Security features may be compromised</li>
              </ul>
            </section>

            <section id="changes">
              <h2>7. Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect
                changes in technology, legislation, or our data practices. We
                will notify you of any significant changes by updating the
                &quot;Last updated&quot; date at the top of this page.
              </p>
            </section>

            <section id="contact">
              <h2>8. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies, please
                contact us:
              </p>
              <ul>
                <li>
                  Email:{' '}
                  <a
                    href="mailto:privacy@winucard.com"
                    className="text-primary"
                  >
                    privacy@winucard.com
                  </a>
                </li>
                <li>Post: WinUCard Ltd, [Company Address], United Kingdom</li>
              </ul>
              <p>
                For more information about how we handle your personal data,
                please see our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
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
