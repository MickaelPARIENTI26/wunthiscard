import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Target,
  Ticket,
  HelpCircle,
  Trophy,
  ShieldCheck,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how WinThisCard prize competitions work. Browse competitions, select tickets, answer a skill question, and win amazing collectible cards and memorabilia.',
  openGraph: {
    title: 'How It Works | WinThisCard',
    description:
      'Learn how WinThisCard prize competitions work. Browse competitions, select tickets, answer a skill question, and win amazing collectible cards and memorabilia.',
  },
};

const steps = [
  {
    icon: Target,
    title: 'Browse & Choose',
    description: 'Find a competition you love',
    details:
      'Explore our selection of premium collectible cards including Pokemon, One Piece TCG, sports cards, and signed memorabilia. Each competition clearly shows the prize value, ticket price, and number of tickets available.',
  },
  {
    icon: Ticket,
    title: 'Select Your Tickets',
    description: 'Pick your lucky numbers or use random',
    details:
      'Choose specific ticket numbers that feel lucky to you, or let our system randomly select available numbers. The more tickets you purchase, the better your chances of winning. Bonus tickets are included with larger purchases.',
  },
  {
    icon: HelpCircle,
    title: 'Answer the Question',
    description: 'Prove your knowledge with our skill question',
    details:
      'To comply with UK law, each entry requires you to correctly answer a skill-based question. This ensures our competitions are classified as prize competitions rather than lotteries, keeping everything legal and fair.',
  },
  {
    icon: Trophy,
    title: 'Win Amazing Prizes',
    description: 'Winners drawn fairly using certified RNG',
    details:
      'Once all tickets are sold or the draw date arrives, we conduct a transparent draw using certified Random Number Generation. The winning ticket number is published, and the lucky winner receives their prize.',
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8"
        style={{
          background: 'linear-gradient(180deg, oklch(0.10 0.02 270) 0%, oklch(0.08 0.02 270) 100%)',
        }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl font-[family-name:var(--font-display)]">
            <span className="text-gradient-gold">How It Works</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground" style={{ color: '#a0a0a0' }}>
            Win your dream collectible cards and memorabilia in just four simple
            steps. Our competitions are fair, transparent, and fully compliant
            with UK law.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((step, index) => (
              <Card
                key={step.title}
                className="relative overflow-hidden transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold" style={{ color: '#f5f5f5' }}>{step.title}</h3>
                  <p className="mb-3 font-medium text-primary" style={{ color: '#FFD700' }}>
                    {step.description}
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>{step.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Question Section */}
      <section
        className="px-4 py-12 sm:px-6 lg:px-8"
        style={{ background: 'oklch(0.06 0.02 270)' }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold sm:text-3xl font-[family-name:var(--font-display)]">
              The Skill Question
            </h2>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
            <p className="mb-4 text-muted-foreground" style={{ color: '#a0a0a0' }}>
              Under the UK Gambling Act 2005, prize competitions must include an
              element of skill to distinguish them from lotteries. This is why
              we include a multiple-choice question with every entry.
            </p>
            <p className="mb-4 text-muted-foreground" style={{ color: '#a0a0a0' }}>
              The questions are designed to test genuine knowledge related to
              the collectibles world. They are challenging enough to require
              thought, but fair for anyone with an interest in the hobby.
            </p>
            <div className="rounded-md bg-primary/5 p-4">
              <p className="text-sm font-medium">
                <strong>Example question:</strong> In what year was the first
                Pokemon TCG Base Set released in Japan?
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This type of question requires actual knowledge, not just luck,
                ensuring our competitions remain legal and fair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Draw Process Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold sm:text-3xl font-[family-name:var(--font-display)]">
              The Draw Process
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-3 font-semibold" style={{ color: '#f5f5f5' }}>Certified RNG</h3>
              <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
                We use a certified Random Number Generator to ensure every draw
                is completely fair and unbiased. The RNG is cryptographically
                secure and cannot be manipulated.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-3 font-semibold" style={{ color: '#f5f5f5' }}>Transparent Results</h3>
              <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
                Every draw result is published publicly, showing the winning
                ticket number, date and time of the draw, and the anonymised
                winner details. Full transparency is our priority.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-3 font-semibold" style={{ color: '#f5f5f5' }}>Independent Supervision</h3>
              <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
                For high-value prizes, draws are conducted under independent
                supervision. We may also live stream draws on social media for
                complete transparency.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-3 font-semibold" style={{ color: '#f5f5f5' }}>Secure Delivery</h3>
              <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
                Winners receive their prizes via tracked, insured delivery.
                Every item is carefully packaged and photographed before
                dispatch for your peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Entry Section */}
      <section
        className="px-4 py-12 sm:px-6 lg:px-8"
        style={{ background: 'oklch(0.06 0.02 270)' }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold sm:text-3xl font-[family-name:var(--font-display)]">Free Entry Route</h2>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
            <p className="mb-4 text-muted-foreground" style={{ color: '#a0a0a0' }}>
              In accordance with UK regulations, we offer a free postal entry
              route for all our competitions. This ensures everyone has the
              opportunity to participate, regardless of their financial
              situation.
            </p>
            <div className="mb-4 rounded-md bg-primary/5 p-4">
              <h3 className="mb-2 font-semibold" style={{ color: '#f5f5f5' }}>How to Enter for Free:</h3>
              <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
                <li>
                  Write a letter including your full name, email address, and
                  the competition you wish to enter
                </li>
                <li>
                  Include your chosen ticket number(s) and your answer to the
                  skill question
                </li>
                <li>
                  Send via standard post (1st or 2nd class) to our registered
                  address
                </li>
                <li>
                  One free entry per person per competition is permitted
                </li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
              Free postal entries are treated exactly the same as paid entries
              in the draw. There is no discrimination between entry methods.
            </p>
            <div className="mt-4 rounded-md border p-4">
              <p className="text-sm font-medium" style={{ color: '#f5f5f5' }}>Postal Address:</p>
              <p className="text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
                WinThisCard Ltd
                <br />
                Competition Entry
                <br />
                [Address Line 1]
                <br />
                [City, Postcode]
                <br />
                United Kingdom
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl font-[family-name:var(--font-display)]">
            <span className="text-gradient-gold">Ready to Win Your Dream Card?</span>
          </h2>
          <p className="mb-8 text-muted-foreground" style={{ color: '#a0a0a0' }}>
            Browse our current competitions and find your next grail piece.
          </p>
          <Link
            href="/competitions"
            className="inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold shadow transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
              color: 'black',
            }}
          >
            Browse Competitions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
