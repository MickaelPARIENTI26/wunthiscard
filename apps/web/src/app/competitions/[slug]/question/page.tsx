import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { QuestionForm } from './question-form';

interface PageParams {
  slug: string;
}

async function getCompetition(slug: string) {
  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      mainImageUrl: true,
      category: true,
      questionText: true,
      questionChoices: true,
      ticketPrice: true,
      status: true,
    },
  });

  if (!competition || competition.status !== 'ACTIVE') {
    return null;
  }

  return {
    ...competition,
    ticketPrice:
      typeof competition.ticketPrice === 'object' && 'toNumber' in competition.ticketPrice
        ? (competition.ticketPrice as { toNumber: () => number }).toNumber()
        : Number(competition.ticketPrice),
    questionChoices: competition.questionChoices as string[],
  };
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);
  if (!competition) return { title: 'Competition Not Found' };
  return {
    title: `Skill Question - ${competition.title}`,
    description: `Answer the skill question for ${competition.title}`,
  };
}

export default async function QuestionPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const competition = await getCompetition(slug);
  if (!competition) notFound();

  const formatCategory = (cat: string) => cat.replace(/_/g, ' ').replace(/^SPORTS /i, '');

  return (
    <main style={{ paddingBottom: '60px' }}>
      {/* Back link */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 32px 0',
        }}
      >
        <Link
          href={`/competitions/${slug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--ink-dim)',
            padding: '10px 0',
          }}
        >
          ← Back to Competition
        </Link>
      </div>

      {/* Enter head — compact hero bar */}
      <section className="enter-head">
        <div className="enter-head-card">
          <img src={competition.mainImageUrl} alt={competition.title} />
        </div>
        <div className="enter-head-body">
          <div className="enter-head-kicker">Enter · {formatCategory(competition.category)}</div>
          <h1 className="enter-head-title">{competition.title}</h1>
          <div className="enter-head-meta">
            <span>Auto pick</span>
            <span>·</span>
            <span>
              Total <b>£{(competition.ticketPrice / 100).toFixed(2)}</b>
            </span>
          </div>
        </div>
        <div className="enter-tracker">
          <div className="enter-tracker-step done">
            <span className="enter-tracker-num">✓</span>
            <span>Tickets</span>
          </div>
          <div className="enter-tracker-step active">
            <span className="enter-tracker-num">2</span>
            <span>Skill Q</span>
          </div>
          <div className="enter-tracker-step">
            <span className="enter-tracker-num">3</span>
            <span>Details</span>
          </div>
        </div>
      </section>

      {/* Step 02 — Skill Question */}
      <section className="enter-step enter-step-live">
        <div className="enter-step-head">
          <span className="step-num" style={{ background: 'var(--warn)' }}>
            02
          </span>
          <div>
            <div className="step-kicker">Step 02 · Skill question</div>
            <h2 className="step-title">Answer correctly to validate your entry.</h2>
          </div>
          <Link href={`/competitions/${slug}`} className="btn btn-ghost">
            ← Change tickets
          </Link>
        </div>

        <QuestionForm
          competitionId={competition.id}
          competitionSlug={competition.slug}
          competitionTitle={competition.title}
          questionText={competition.questionText}
          questionChoices={competition.questionChoices}
          ticketPrice={competition.ticketPrice}
        />
      </section>
    </main>
  );
}
