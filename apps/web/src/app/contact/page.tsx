import type { Metadata } from 'next';
import { Mail, MapPin, Clock } from 'lucide-react';
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
  { name: 'TikTok', href: 'https://tiktok.com/@winucard' },
  { name: 'Instagram', href: 'https://instagram.com/winucard' },
  { name: 'YouTube', href: 'https://youtube.com/@winucard' },
  { name: 'Discord', href: 'https://discord.gg/winucard' },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Hero Mini */}
      <section
        style={{
          padding: '80px 40px 40px',
          background: '#ffffff',
        }}
      >
        <div className="container mx-auto text-center">
          <h1
            className="font-[family-name:var(--font-outfit)] mb-3"
            style={{
              fontSize: '46px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Contact Us
          </h1>
          <p style={{ color: '#6b7088', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
            Have a question or need help? We are here for you.
          </p>
        </div>
      </section>

      {/* Main Content - 2 Column Layout */}
      <section style={{ background: '#F7F7FA', padding: '48px 0 80px' }}>
        <div
          className="container mx-auto px-4"
          style={{ maxWidth: '1000px' }}
        >
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Info Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e8e8ec',
                padding: '40px 32px',
                height: 'fit-content',
              }}
            >
              <h2
                className="font-[family-name:var(--font-outfit)] mb-6"
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1a1a2e',
                }}
              >
                Get in Touch
              </h2>

              {/* Contact Info Items */}
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Mail style={{ width: '20px', height: '20px', color: '#E8A000' }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1a1a2e',
                        marginBottom: '4px',
                      }}
                    >
                      Email
                    </h3>
                    <a
                      href="mailto:hello@winucard.com"
                      style={{
                        fontSize: '14px',
                        color: '#6b7088',
                      }}
                    >
                      hello@winucard.com
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #EEF4FF, #DBEAFE)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1a1a2e',
                        marginBottom: '4px',
                      }}
                    >
                      Address
                    </h3>
                    <address
                      style={{
                        fontSize: '14px',
                        color: '#6b7088',
                        fontStyle: 'normal',
                        lineHeight: 1.6,
                      }}
                    >
                      WinUCard Ltd
                      <br />
                      [Address Line 1]
                      <br />
                      [City, Postcode]
                      <br />
                      United Kingdom
                    </address>
                  </div>
                </div>

                {/* Response Time */}
                <div className="flex items-start gap-4">
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock style={{ width: '20px', height: '20px', color: '#16A34A' }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1a1a2e',
                        marginBottom: '4px',
                      }}
                    >
                      Response Time
                    </h3>
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#6b7088',
                        lineHeight: 1.6,
                      }}
                    >
                      We aim to respond within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  background: '#e8e8ec',
                  margin: '28px 0',
                }}
              />

              {/* Social Links */}
              <div>
                <style>{`
                  .contact-social-btn {
                    padding: 8px 16px;
                    border-radius: 10px;
                    background: #F7F7FA;
                    color: #6b7088;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                  }
                  .contact-social-btn:hover {
                    background: #E8A000;
                    color: #ffffff;
                  }
                `}</style>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1a1a2e',
                    marginBottom: '12px',
                  }}
                >
                  Follow Us
                </h3>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-social-btn"
                    >
                      {social.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e8e8ec',
                padding: '40px 32px',
              }}
            >
              <h2
                className="font-[family-name:var(--font-outfit)] mb-6"
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1a1a2e',
                }}
              >
                Send a Message
              </h2>

              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Prompt */}
      <section
        style={{
          background: '#ffffff',
          padding: '56px 40px',
          borderTop: '1px solid #e8e8ec',
        }}
      >
        <div className="container mx-auto text-center" style={{ maxWidth: '500px' }}>
          <h2
            className="font-[family-name:var(--font-outfit)] mb-3"
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Looking for Quick Answers?
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#6b7088',
              marginBottom: '24px',
            }}
          >
            Check out our FAQ section for answers to common questions.
          </p>
          <style>{`
            .contact-faq-btn {
              display: inline-block;
              padding: 12px 28px;
              border-radius: 12px;
              background: #F7F7FA;
              border: 1px solid #e8e8ec;
              color: #1a1a2e;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.2s ease;
            }
            .contact-faq-btn:hover {
              background: #EDEDF0;
            }
          `}</style>
          <a href="/faq" className="contact-faq-btn">
            View FAQ
          </a>
        </div>
      </section>
    </main>
  );
}
