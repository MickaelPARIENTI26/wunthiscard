'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Instagram, Twitter, Facebook, Trophy, Shield, Sparkles } from 'lucide-react';

// TikTok icon (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

// Discord icon (not in lucide-react)
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// Payment card icons - muted grey versions
function VisaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.1" />
      <path d="M19.5 21H17L18.75 11H21.25L19.5 21Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M28.5 11.25C28 11.083 27.25 10.917 26.333 10.917C23.833 10.917 22.083 12.167 22.083 14C22.083 15.417 23.417 16.167 24.417 16.667C25.417 17.167 25.833 17.5 25.833 17.917C25.833 18.583 25 18.917 24.25 18.917C23.167 18.917 22.583 18.75 21.667 18.333L21.25 18.167L20.833 20.75C21.5 21.083 22.75 21.333 24.083 21.333C26.75 21.333 28.5 20.083 28.5 18.167C28.5 17.083 27.833 16.25 26.333 15.583C25.417 15.167 24.833 14.833 24.833 14.417C24.833 14.083 25.25 13.667 26.083 13.667C26.833 13.667 27.417 13.833 27.833 14L28.083 14.083L28.5 11.25Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M32.5 11H30.5C29.917 11 29.417 11.167 29.167 11.833L25.5 21H28.167L28.667 19.5H31.833L32.167 21H34.5L32.5 11ZM29.333 17.5L30.5 14.167L31.167 17.5H29.333Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M16.167 11L13.667 17.833L13.417 16.583C12.917 15 11.417 13.25 9.75 12.333L12 21H14.667L18.833 11H16.167Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M11.667 11H7.5L7.417 11.25C10.583 12 12.75 14 13.417 16.583L12.667 11.833C12.583 11.167 12.083 11 11.667 11Z" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="19" cy="16" r="9" fill="currentColor" fillOpacity="0.3" />
      <circle cx="29" cy="16" r="9" fill="currentColor" fillOpacity="0.4" />
      <path d="M24 9.3C25.8 10.8 27 12.8 27 16C27 19.2 25.8 21.2 24 22.7C22.2 21.2 21 19.2 21 16C21 12.8 22.2 10.8 24 9.3Z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

function ApplePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.1" />
      <path d="M15.5 10.5C15.9 10 16.2 9.3 16.1 8.6C15.5 8.6 14.7 9 14.3 9.5C13.9 10 13.5 10.7 13.6 11.4C14.3 11.4 15 11 15.5 10.5Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M16.1 11.5C15 11.4 14.1 12.1 13.5 12.1C13 12.1 12.2 11.5 11.3 11.5C10.1 11.5 9 12.2 8.4 13.3C7.1 15.5 8.1 18.7 9.4 20.5C10 21.4 10.8 22.4 11.8 22.4C12.7 22.3 13.1 21.8 14.2 21.8C15.3 21.8 15.6 22.4 16.6 22.3C17.6 22.3 18.3 21.4 18.9 20.5C19.6 19.5 19.9 18.6 19.9 18.5C19.9 18.5 17.8 17.7 17.8 15.3C17.8 13.2 19.5 12.3 19.5 12.3C18.7 11.1 17.3 11.5 16.1 11.5Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M25.5 9.5V22H27.3V17.6H30C32.3 17.6 34 16 34 13.6C34 11.2 32.4 9.5 30.1 9.5H25.5ZM27.3 11.2H29.5C31.1 11.2 32.1 12.2 32.1 13.6C32.1 15 31.1 16 29.5 16H27.3V11.2Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M38.5 22.1C40 22.1 41.3 21.3 41.9 20.1H41.9V22H43.6V15.6C43.6 13.5 42 12.2 39.6 12.2C37.4 12.2 35.7 13.5 35.6 15.3H37.3C37.5 14.5 38.3 13.9 39.5 13.9C40.9 13.9 41.7 14.6 41.7 15.9V16.6L38.9 16.8C36.4 16.9 35 18.1 35 19.9C35 21.8 36.5 22.1 38.5 22.1ZM38.9 20.5C37.7 20.5 36.9 19.9 36.9 19C36.9 18 37.6 17.5 39.1 17.4L41.7 17.2V17.9C41.7 19.4 40.5 20.5 38.9 20.5Z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

function GooglePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.1" />
      <path d="M22.7 16.3V20H21.2V11H25C25.8 11 26.5 11.3 27 11.8C27.6 12.3 27.9 13 27.9 13.8C27.9 14.6 27.6 15.3 27 15.8C26.5 16.3 25.8 16.5 25 16.5L22.7 16.3ZM22.7 12.4V14.9H25.1C25.5 14.9 25.8 14.7 26.1 14.5C26.3 14.2 26.5 13.9 26.5 13.6C26.5 13.3 26.4 13.1 26.1 12.8C25.9 12.6 25.5 12.4 25.1 12.4H22.7Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M31.5 14C32.4 14 33.1 14.3 33.6 14.8C34.1 15.3 34.4 16 34.4 16.9V20H33V19.1H32.9C32.5 19.7 31.9 20.1 31.1 20.1C30.4 20.1 29.8 19.9 29.4 19.5C28.9 19.1 28.7 18.5 28.7 17.9C28.7 17.2 29 16.7 29.5 16.3C30 15.9 30.7 15.7 31.5 15.7C32.2 15.7 32.8 15.8 33.2 16V15.8C33.2 15.4 33 15.1 32.8 14.8C32.5 14.6 32.2 14.5 31.8 14.5C31.2 14.5 30.7 14.7 30.4 15.2L29.1 14.5C29.7 13.5 30.5 14 31.5 14ZM30.2 17.9C30.2 18.2 30.3 18.4 30.5 18.6C30.7 18.8 31 18.9 31.3 18.9C31.8 18.9 32.2 18.7 32.5 18.4C32.9 18.1 33 17.7 33 17.3C32.7 17.1 32.2 17 31.6 17C31.1 17 30.7 17.1 30.5 17.3C30.3 17.5 30.2 17.7 30.2 17.9Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M40.4 14.1L36.8 22H35.2L36.6 19.1L34.2 14.1H35.9L37.5 17.7L39 14.1H40.4Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M17.7 15.4C17.7 15 17.7 14.7 17.6 14.3H13V16.2H15.7C15.6 16.9 15.2 17.5 14.6 17.9V19.3H16.3C17.2 18.4 17.7 17.1 17.7 15.4Z" fill="currentColor" fillOpacity="0.4" />
      <path d="M13 20.5C14.5 20.5 15.8 20 16.7 19.2L14.9 17.8C14.4 18.1 13.8 18.3 13 18.3C11.6 18.3 10.4 17.4 10 16.1H8.3V17.5C9.2 19.3 11 20.5 13 20.5Z" fill="currentColor" fillOpacity="0.4" />
      <path d="M10 16.1C9.8 15.5 9.8 14.8 10 14.2V12.8H8.3C7.5 14.3 7.5 16.1 8.3 17.5L10 16.1Z" fill="currentColor" fillOpacity="0.4" />
      <path d="M13 12C13.8 12 14.6 12.3 15.2 12.8L16.7 11.3C15.8 10.5 14.5 10 13 10C11 10 9.2 11.2 8.3 13L10 14.4C10.4 13.1 11.6 12 13 12Z" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

function StripeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="currentColor" fillOpacity="0.1" />
      <path fillRule="evenodd" clipRule="evenodd" d="M22.2 13.5C22.2 12.7 22.9 12.4 24 12.4C25.5 12.4 27.4 12.9 28.9 13.7V9.5C27.3 8.9 25.6 8.6 24 8.6C20.3 8.6 17.8 10.6 17.8 13.7C17.8 18.6 24.5 17.8 24.5 19.9C24.5 20.9 23.6 21.2 22.4 21.2C20.8 21.2 18.7 20.5 17 19.6V23.9C18.9 24.6 20.7 24.9 22.4 24.9C26.2 24.9 28.9 23 28.9 19.8C28.9 14.5 22.2 15.4 22.2 13.5Z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

const socialLinks = [
  {
    href: 'https://instagram.com/winucard',
    label: 'Instagram',
    icon: Instagram,
    followers: '12.5K',
  },
  {
    href: 'https://twitter.com/winucard',
    label: 'Twitter',
    icon: Twitter,
    followers: '8.2K',
  },
  {
    href: 'https://tiktok.com/@winucard',
    label: 'TikTok',
    icon: TikTokIcon,
    followers: '25.1K',
  },
  {
    href: 'https://facebook.com/winucard',
    label: 'Facebook',
    icon: Facebook,
    followers: '5.8K',
  },
  {
    href: 'https://discord.gg/winucard',
    label: 'Discord',
    icon: DiscordIcon,
    followers: '3.2K',
  },
];


export function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/competitions', label: t('nav.competitions') },
    { href: '/how-it-works', label: t('nav.howItWorks') },
    { href: '/winners', label: t('nav.winners') },
    { href: '/faq', label: t('nav.faq') },
  ];

  const supportLinks = [
    { href: '/contact', label: t('nav.contact') },
    { href: '/about', label: t('nav.about') },
  ];

  const legalLinks = [
    { href: '/terms', label: t('footer.terms') },
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/cookies', label: t('footer.cookies') },
    { href: '/competition-rules', label: t('footer.competitionRules') },
  ];

  return (
    <footer className="relative">
      {/* Gold gradient top border */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #C9990A 20%, #F0B90B 50%, #C9990A 80%, transparent 100%)',
        }}
      />

      {/* Main footer content */}
      <div
        className="pt-12 pb-8"
        style={{
          background: 'linear-gradient(180deg, #0c0e16 0%, #080a10 100%)',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Logo, tagline, social */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="group inline-flex items-center gap-3">
                <div
                  className="relative flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                  <Trophy className="h-6 w-6 relative z-10" style={{ color: '#12151e' }} />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-outfit)] text-gradient-gold">
                    WinUCard
                  </span>
                  <span className="block text-xs text-muted-foreground">{t('meta.premiumCollectibles')}</span>
                </div>
              </Link>

              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                {t('footer.tagline')}
              </p>

              {/* Trust badges */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary/70" />
                  <span>{t('footer.sslSecured')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary/70" />
                  <span>{t('footer.verifiedDraws')}</span>
                </div>
              </div>

              {/* Social links with hover glow */}
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-foreground/80">{t('footer.followUs')}</p>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/social flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #1a1e2e 0%, #161a28 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                      aria-label={`Follow us on ${social.label}`}
                    >
                      <social.icon className="h-4 w-4 transition-colors group-hover/social:text-primary" />
                      <span className="text-xs text-muted-foreground transition-colors group-hover/social:text-foreground">
                        {social.followers}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground font-[family-name:var(--font-outfit)]">
                {t('footer.quickLinks')}
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group relative inline-block text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      <span>{link.label}</span>
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground font-[family-name:var(--font-outfit)]">
                {t('footer.support')}
              </h3>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group relative inline-block text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      <span>{link.label}</span>
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground font-[family-name:var(--font-outfit)]">
                {t('footer.legal')}
              </h3>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group relative inline-block text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      <span>{link.label}</span>
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="py-6"
        style={{
          background: '#080a10',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left side: Payment methods */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground">{t('footer.securePayments')}</span>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <VisaIcon className="h-7 w-auto" />
                <MastercardIcon className="h-7 w-auto" />
                <ApplePayIcon className="h-7 w-auto" />
                <GooglePayIcon className="h-7 w-auto" />
                <StripeIcon className="h-7 w-auto" />
              </div>
            </div>

            {/* Middle: 18+ badge and warnings */}
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(224, 85, 85, 0.2) 0%, rgba(224, 85, 85, 0.1) 100%)',
                  border: '1px solid rgba(224, 85, 85, 0.3)',
                }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    border: '2px solid #E05555',
                    color: '#E05555',
                  }}
                >
                  18+
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: '#E05555' }}
                >
                  {t('footer.over18Only')}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {t('footer.freePostalEntry')}
              </span>
            </div>

            {/* Right side: Copyright */}
            <div className="text-xs text-muted-foreground">
              <p>{t('footer.copyright', { year: currentYear })}</p>
              <p className="mt-1 opacity-70">{t('footer.registered')}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
