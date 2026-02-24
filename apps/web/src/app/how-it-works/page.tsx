import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how WinUCard prize competitions work. Browse competitions, select tickets, answer a skill question, and win amazing collectible cards and memorabilia.',
  openGraph: {
    title: 'How It Works | WinUCard',
    description:
      'Learn how WinUCard prize competitions work. Browse competitions, select tickets, answer a skill question, and win amazing collectible cards and memorabilia.',
  },
};

const steps = [
  {
    number: 1,
    emoji: '🔍',
    title: 'Browse',
    description:
      'Explore our curated selection of premium collectible cards including rare Pokémon, One Piece TCG, sports cards, and signed memorabilia. Each competition displays the prize value, ticket price, total tickets available, and draw date so you can make an informed choice.',
    bgGradient: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
    borderColor: 'rgba(232, 160, 0, 0.12)',
    numberBg: '#E8A000',
    shadowColor: 'rgba(232, 160, 0, 0.25)',
  },
  {
    number: 2,
    emoji: '✏️',
    title: 'Answer',
    description:
      'To comply with UK prize competition law, each entry requires a skill-based question. Answer correctly to validate your entry. Questions test genuine knowledge related to collectibles — challenging but fair for anyone with an interest in the hobby.',
    bgGradient: 'linear-gradient(135deg, #EEF4FF, #DBEAFE)',
    borderColor: 'rgba(37, 99, 235, 0.12)',
    numberBg: '#2563EB',
    shadowColor: 'rgba(37, 99, 235, 0.25)',
  },
  {
    number: 3,
    emoji: '🎟️',
    title: 'Enter',
    description:
      'Choose your lucky ticket numbers manually or let our system randomly select available numbers for you. The more tickets you purchase, the better your chances. Bonus tickets are included with larger purchases to give you even more opportunities to win.',
    bgGradient: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
    borderColor: 'rgba(22, 163, 74, 0.12)',
    numberBg: '#16A34A',
    shadowColor: 'rgba(22, 163, 74, 0.25)',
  },
  {
    number: 4,
    emoji: '🏆',
    title: 'Win',
    description:
      'Once all tickets sell out or the draw date arrives, we conduct a transparent draw using certified Random Number Generation. The winning ticket is published publicly, and the lucky winner receives their prize via tracked, insured delivery with full documentation.',
    bgGradient: 'linear-gradient(135deg, #FEF2F2, #FECACA)',
    borderColor: 'rgba(239, 68, 68, 0.12)',
    numberBg: '#EF4444',
    shadowColor: 'rgba(239, 68, 68, 0.25)',
  },
];

const faqItems = [
  {
    question: 'Is this legal in the UK?',
    answer:
      'Yes, absolutely. Our competitions are classified as prize competitions under the UK Gambling Act 2005, not lotteries. This is because entry requires answering a skill-based question correctly. We also offer a free postal entry route as required by UK regulations.',
  },
  {
    question: 'How is the winner selected?',
    answer:
      'Winners are selected using a certified Random Number Generator (RNG) that is cryptographically secure and cannot be manipulated. For high-value prizes, draws may be conducted under independent supervision or live-streamed for complete transparency.',
  },
  {
    question: 'Can I enter for free?',
    answer:
      'Yes. In accordance with UK regulations, we offer a free postal entry route for all competitions. Simply send a letter with your details, chosen ticket number, and answer to the skill question to our registered address. One free entry per person per competition is permitted.',
  },
  {
    question: 'How will I receive my prize?',
    answer:
      'Winners receive their prizes via tracked, insured delivery within 7-14 business days of the draw. Every item is carefully packaged, photographed before dispatch, and shipped with full tracking and insurance for your peace of mind.',
  },
];

export default function HowItWorksPage() {
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
            How It Works
          </h1>
          <p style={{ color: '#6b7088', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
            Win your dream collectible cards in just four simple steps.
          </p>
        </div>
      </section>

      {/* Steps Section - 2 Column Grid */}
      <section style={{ background: '#F7F7FA', padding: '48px 0 64px' }}>
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {steps.map((step) => (
              <div
                key={step.number}
                style={{
                  background: step.bgGradient,
                  border: `1px solid ${step.borderColor}`,
                  borderRadius: '20px',
                  padding: '40px 30px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Step Number Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: step.numberBg,
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '20px',
                    boxShadow: `0 4px 12px ${step.shadowColor}`,
                  }}
                >
                  {step.number}
                </div>

                {/* Emoji + Title */}
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ fontSize: '28px' }}>{step.emoji}</span>
                  <h3
                    className="font-[family-name:var(--font-outfit)]"
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#1a1a2e',
                    }}
                  >
                    {step.title}
                  </h3>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: '#555',
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ background: '#ffffff', padding: '64px 0' }}>
        <div className="container mx-auto px-4" style={{ maxWidth: '700px' }}>
          <h2
            className="font-[family-name:var(--font-outfit)] text-center mb-8"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Common Questions
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group"
                style={{
                  background: '#F7F7FA',
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}
              >
                <summary
                  className="flex items-center justify-between cursor-pointer"
                  style={{
                    padding: '18px 24px',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#1a1a2e',
                    listStyle: 'none',
                  }}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className="h-5 w-5 transition-transform group-open:rotate-180"
                    style={{ color: '#6b7088' }}
                  />
                </summary>
                <div
                  style={{
                    padding: '0 24px 18px',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: '#555',
                  }}
                >
                  {item.answer}
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/faq"
              style={{
                color: '#E8A000',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* Golden CTA */}
      <section
        style={{
          background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC, #FFECB3, #FFF3D6)',
          padding: '72px 40px',
        }}
      >
        <div className="container mx-auto text-center" style={{ maxWidth: '600px' }}>
          <h2
            className="font-[family-name:var(--font-outfit)] mb-4"
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Ready to Enter?
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#5a5a6e',
              marginBottom: '32px',
            }}
          >
            Browse our current competitions and find your next grail piece.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 font-medium transition-all duration-300"
              style={{
                padding: '14px 32px',
                borderRadius: '14px',
                background: '#1a1a2e',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              Sign Up Free
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/competitions"
              className="inline-flex items-center gap-2 font-medium transition-all duration-300"
              style={{
                padding: '14px 32px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                color: '#1a1a2e',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              View Competitions
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
