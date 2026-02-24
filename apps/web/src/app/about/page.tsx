import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about WinUCard, the UK-based prize competition platform for collectible cards and memorabilia. Our mission, values, and commitment to fair competitions.',
  openGraph: {
    title: 'About Us | WinUCard',
    description:
      'Learn about WinUCard, the UK-based prize competition platform for collectible cards and memorabilia.',
  },
};

const categoryCards = [
  { emoji: '🔥', gradient: 'linear-gradient(135deg, #FFF8E7, #FFE8A0)', borderColor: '#F0B90B', rotation: '-3deg' },
  { emoji: '🏴‍☠️', gradient: 'linear-gradient(135deg, #FEE2E2, #FECACA)', borderColor: '#EF4444', rotation: '2deg' },
  { emoji: '⚽', gradient: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)', borderColor: '#22C55E', rotation: '-2deg' },
  { emoji: '🏀', gradient: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', borderColor: '#3B82F6', rotation: '3deg' },
];

const valueCards = [
  {
    emoji: '🎬',
    title: 'Fully Transparent',
    text: 'Every single draw is streamed live on TikTok. No pre-recorded videos, no hidden results. You can watch the winning ticket being selected in real time.',
    gradient: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)',
    borderColor: 'rgba(239,68,68,0.1)',
  },
  {
    emoji: '⭐',
    title: 'Only Graded Cards',
    text: 'We only offer PSA graded cards. Every card is authenticated and verified before being listed. You know exactly what you\'re winning.',
    gradient: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
    borderColor: 'rgba(232,160,0,0.1)',
  },
  {
    emoji: '✉️',
    title: 'Free Postal Entry',
    text: 'Every competition offers a free postal entry route. No purchase necessary — we\'re fully compliant with UK competition law.',
    gradient: 'linear-gradient(135deg, #EFF4FF, #DBEAFE)',
    borderColor: 'rgba(37,99,235,0.1)',
  },
];

const stats = [
  { value: '100%', label: 'Live Draws', color: '#EF4444' },
  { value: 'PSA 10', label: 'Graded Only', color: '#E8A000' },
  { value: 'Free', label: 'Postal Entry', color: '#2563EB' },
  { value: '24h', label: 'Winner Notification', color: '#16A34A' },
];

const howItWorksSteps = [
  {
    number: '01',
    title: 'Browse',
    description: 'Explore our live competitions featuring rare graded cards and memorabilia.',
    gradient: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
    borderColor: 'rgba(232,160,0,0.15)',
    color: '#E8A000',
  },
  {
    number: '02',
    title: 'Answer',
    description: 'Answer a simple skill question to qualify for the competition.',
    gradient: 'linear-gradient(135deg, #EFF4FF, #DBEAFE)',
    borderColor: 'rgba(37,99,235,0.15)',
    color: '#2563EB',
  },
  {
    number: '03',
    title: 'Enter',
    description: 'Purchase your tickets or use our free postal entry route.',
    gradient: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
    borderColor: 'rgba(22,163,74,0.15)',
    color: '#16A34A',
  },
  {
    number: '04',
    title: 'Win',
    description: 'Watch the live draw and see if you\'re our next lucky winner!',
    gradient: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)',
    borderColor: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Styles for hover effects */}
      <style>{`
        .value-card {
          padding: 32px;
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .value-card:hover {
          transform: translateY(-4px);
        }
        .how-card {
          padding: 28px;
          border-radius: 18px;
          transition: all 0.3s ease;
        }
        .how-card:hover {
          transform: translateY(-4px);
        }
        .cta-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 32px;
          border-radius: 14px;
          background: #1a1a2e;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .cta-btn-primary:hover {
          background: #2a2a3e;
          transform: translateY(-2px);
        }
        .cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 32px;
          border-radius: 14px;
          background: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(232,160,0,0.3);
          color: #1a1a2e;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
        }
        .cta-btn-secondary:hover {
          background: rgba(255,255,255,0.9);
          border-color: rgba(232,160,0,0.5);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ══════ SECTION 1 — Hero (fond blanc) ══════ */}
      <section style={{ padding: '80px 40px 60px', background: '#ffffff' }}>
        <div className="container mx-auto text-center" style={{ maxWidth: '1000px' }}>
          <h1
            className="font-[family-name:var(--font-outfit)] mb-4"
            style={{
              fontSize: '46px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            About WinUCard
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: '#6b7088',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            The UK's premium skill-based card competition platform.
          </p>
        </div>
      </section>

      {/* ══════ SECTION 2 — Notre mission (fond #F7F7FA) ══════ */}
      <section style={{ padding: '80px 40px', background: '#F7F7FA' }}>
        <div
          className="container mx-auto"
          style={{ maxWidth: '1000px' }}
        >
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left column - Text (60%) */}
            <div className="lg:w-[60%]">
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#F0B90B',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}
              >
                Our Mission
              </span>
              <h2
                className="font-[family-name:var(--font-outfit)] mt-3 mb-5"
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#1a1a2e',
                  lineHeight: 1.3,
                }}
              >
                Giving Every Collector a Chance to Win
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#333344',
                  lineHeight: 1.75,
                }}
              >
                WinUCard was created with one goal: making rare, high-value graded cards accessible
                to everyone. We believe you shouldn't need thousands of pounds to own a PSA 10 gem
                mint card. Through our skill-based competitions, collectors across the UK can enter
                for a fraction of the card's value and have a real chance of winning.
              </p>
            </div>

            {/* Right column - Category cards (40%) */}
            <div className="lg:w-[40%] flex justify-center">
              <div
                className="grid grid-cols-2 gap-3"
                style={{ width: 'fit-content' }}
              >
                {categoryCards.map((card, index) => (
                  <div
                    key={index}
                    style={{
                      width: '120px',
                      height: '160px',
                      borderRadius: '14px',
                      background: card.gradient,
                      border: `2px solid ${card.borderColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: `rotate(${card.rotation})`,
                    }}
                  >
                    <span style={{ fontSize: '40px' }}>{card.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ SECTION 3 — Nos valeurs (fond blanc) ══════ */}
      <section style={{ padding: '80px 40px', background: '#ffffff' }}>
        <div className="container mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="text-center mb-12">
            <h2
              className="font-[family-name:var(--font-outfit)] mb-3"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a1a2e',
              }}
            >
              Why WinUCard?
            </h2>
            <p style={{ fontSize: '15px', color: '#6b7088' }}>
              What sets us apart from other competition platforms.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {valueCards.map((card, index) => (
              <div
                key={index}
                className="value-card"
                style={{
                  background: card.gradient,
                  border: `1.5px solid ${card.borderColor}`,
                }}
              >
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '16px' }}>
                  {card.emoji}
                </span>
                <h3
                  className="font-[family-name:var(--font-outfit)]"
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#1a1a2e',
                    marginBottom: '12px',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7088',
                    lineHeight: 1.6,
                  }}
                >
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SECTION 4 — Les chiffres (fond #F7F7FA) ══════ */}
      <section style={{ padding: '80px 40px', background: '#F7F7FA' }}>
        <div className="container mx-auto" style={{ maxWidth: '1000px' }}>
          <h2
            className="font-[family-name:var(--font-outfit)] text-center mb-12"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            WinUCard in Numbers
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <p
                  className="font-[family-name:var(--font-outfit)]"
                  style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6b7088',
                    marginTop: '4px',
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SECTION 5 — Comment ça marche (fond blanc) ══════ */}
      <section style={{ padding: '80px 40px', background: '#ffffff' }}>
        <div className="container mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="text-center mb-12">
            <h2
              className="font-[family-name:var(--font-outfit)] mb-3"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a1a2e',
              }}
            >
              How It Works
            </h2>
            <p style={{ fontSize: '15px', color: '#6b7088' }}>
              Four simple steps to enter any competition.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <div
                key={index}
                className="how-card"
                style={{
                  background: step.gradient,
                  border: `1.5px solid ${step.borderColor}`,
                }}
              >
                <span
                  className="font-[family-name:var(--font-outfit)]"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: step.color,
                    display: 'block',
                    marginBottom: '12px',
                  }}
                >
                  {step.number}
                </span>
                <h3
                  className="font-[family-name:var(--font-outfit)]"
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#1a1a2e',
                    marginBottom: '8px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6b7088',
                    lineHeight: 1.6,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SECTION 6 — CTA (gradient doré) ══════ */}
      <section
        style={{
          padding: '80px 40px',
          background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC, #FFECB3, #FFF3D6)',
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
              color: '#555',
              marginBottom: '32px',
            }}
          >
            Create your free account and browse our live competitions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="cta-btn-primary">
              Sign Up Free
            </Link>
            <Link href="/competitions" className="cta-btn-secondary">
              View Competitions
            </Link>
          </div>

          <p
            style={{
              fontSize: '12px',
              color: '#8a8a8a',
              marginTop: '24px',
            }}
          >
            18+ Only. Free postal entry available. Terms apply.
          </p>
        </div>
      </section>
    </main>
  );
}
