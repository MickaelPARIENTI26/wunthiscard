import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Target, Shield, Heart, Users, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { SafeHtml } from '@/components/common/safe-html';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about WinThisCard, the UK-based prize competition platform for collectible cards and memorabilia. Our mission, values, and commitment to fair competitions.',
  openGraph: {
    title: 'About Us | WinThisCard',
    description:
      'Learn about WinThisCard, the UK-based prize competition platform for collectible cards and memorabilia.',
  },
};

const values = [
  {
    icon: Shield,
    title: 'Transparency',
    description:
      'Every draw is conducted using certified RNG with results published publicly. We believe in complete transparency in everything we do.',
  },
  {
    icon: Heart,
    title: 'Passion for Collecting',
    description:
      'We are collectors ourselves. We understand the thrill of finding that grail card and want to make it accessible to everyone.',
  },
  {
    icon: Target,
    title: 'Fair Play',
    description:
      'Our competitions are designed to give everyone a fair chance. Free postal entry ensures accessibility for all.',
  },
  {
    icon: Users,
    title: 'Community First',
    description:
      'We are building a community of collectors who share our passion. Your trust and satisfaction are our top priorities.',
  },
];

async function getAboutContent() {
  const page = await prisma.staticPage.findUnique({
    where: { slug: 'about-us' },
  });
  return page;
}

export default async function AboutPage() {
  const aboutContent = await getAboutContent();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex justify-center">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            About WinThisCard
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Your trusted destination for premium collectible card and
            memorabilia prize competitions in the United Kingdom.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
            <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
            <p className="mb-4 text-muted-foreground">
              At WinThisCard, we believe that everyone should have the
              opportunity to own their dream collectibles. Whether it is a PSA
              10 Charizard, a signed sports jersey, or a rare One Piece TCG
              card, we make it possible through fair, transparent, and exciting
              prize competitions.
            </p>
            <p className="text-muted-foreground">
              Founded by collectors, for collectors, we understand the passion
              that drives our community. Our mission is to create a trusted
              platform where collectors can compete for amazing prizes while
              enjoying a fair and regulated experience.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Content from CMS */}
      {aboutContent && (
        <section className="bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SafeHtml
              html={aboutContent.content}
              className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-muted-foreground prose-a:text-primary"
            />
          </div>
        </section>
      )}

      {/* Values Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
            Our Values
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section Placeholder */}
      <section className="bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Meet the Team
          </h2>
          <p className="mb-8 text-muted-foreground">
            We are a passionate team of collectors and tech enthusiasts
            dedicated to creating the best prize competition experience.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted" />
                <h3 className="font-semibold">Team Member</h3>
                <p className="text-sm text-muted-foreground">Position</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Compliance */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
            <h2 className="mb-4 text-2xl font-bold">
              UK Compliance & Regulation
            </h2>
            <p className="mb-4 text-muted-foreground">
              WinThisCard operates as a prize competition platform in full
              compliance with the UK Gambling Act 2005. Our competitions include
              a skill-based question requirement and a free postal entry route,
              ensuring we meet all regulatory standards.
            </p>
            <p className="text-muted-foreground">
              We are committed to responsible gaming practices. All participants
              must be 18 years or older, and we encourage responsible
              participation in our competitions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary/5 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Get in Touch</h2>
          <p className="mb-8 text-muted-foreground">
            Have questions about WinThisCard? We would love to hear from you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Contact Us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
