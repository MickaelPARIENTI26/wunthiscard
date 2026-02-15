import type { Metadata } from 'next';
import {
  Mail,
  MapPin,
  Clock,
  Instagram,
  Twitter,
  Facebook,
} from 'lucide-react';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with WinUCard. Contact us for questions about competitions, payments, delivery, or partnership enquiries.',
  openGraph: {
    title: 'Contact Us | WinUCard',
    description:
      'Get in touch with WinUCard. Contact us for questions about competitions, payments, delivery, or partnership enquiries.',
  },
};

const socialLinks = [
  {
    name: 'Instagram',
    icon: Instagram,
    href: 'https://instagram.com/winucard',
    handle: '@winucard',
  },
  {
    name: 'Twitter',
    icon: Twitter,
    href: 'https://twitter.com/winucard',
    handle: '@winucard',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    href: 'https://facebook.com/winucard',
    handle: 'WinUCard',
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex justify-center">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: '#f5f5f5' }}>
            Contact Us
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground" style={{ color: '#a0a0a0' }}>
            Have a question or need help? We are here for you. Send us a message
            and we will get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
                <h2 className="mb-6 text-xl font-semibold" style={{ color: '#f5f5f5' }}>Send us a Message</h2>
                <ContactForm />
              </div>
            </div>

            {/* Contact Info Sidebar */}
            <div className="space-y-6">
              {/* Email */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold" style={{ color: '#f5f5f5' }}>Email</h3>
                </div>
                <a
                  href="mailto:hello@winucard.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  style={{ color: '#a0a0a0' }}
                >
                  hello@winucard.com
                </a>
              </div>

              {/* Address */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold" style={{ color: '#f5f5f5' }}>Address</h3>
                </div>
                <address className="text-sm not-italic text-muted-foreground" style={{ color: '#a0a0a0' }}>
                  WinUCard Ltd
                  <br />
                  [Address Line 1]
                  <br />
                  [City]
                  <br />
                  [Postcode]
                  <br />
                  United Kingdom
                </address>
              </div>

              {/* Response Time */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold" style={{ color: '#f5f5f5' }}>Response Time</h3>
                </div>
                <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
                  We aim to respond to all enquiries within 24-48 hours during
                  business days.
                </p>
              </div>

              {/* Social Media */}
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-semibold" style={{ color: '#f5f5f5' }}>Follow Us</h3>
                <div className="space-y-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
                      style={{ color: '#a0a0a0' }}
                    >
                      <social.icon className="h-5 w-5" />
                      <span>{social.handle}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Prompt */}
      <section className="bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-xl font-semibold" style={{ color: '#f5f5f5' }}>
            Looking for Quick Answers?
          </h2>
          <p className="mb-6 text-muted-foreground" style={{ color: '#a0a0a0' }}>
            Check out our FAQ section for answers to common questions about
            competitions, payments, delivery, and more.
          </p>
          <a
            href="/faq"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            View FAQ
          </a>
        </div>
      </section>
    </main>
  );
}
