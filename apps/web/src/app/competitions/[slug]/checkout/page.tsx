import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CheckoutClient } from './checkout-client';
import { GuestCheckoutForm } from './guest-checkout-form';

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
  };
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);
  if (!competition) return { title: 'Competition Not Found' };
  return {
    title: 'Checkout - ' + competition.title,
    description: 'Complete your ticket purchase for ' + competition.title,
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<{ tickets?: string }>;
}) {
  const session = await auth();
  const { slug } = await params;
  const { tickets } = await searchParams;
  const competition = await getCompetition(slug);
  if (!competition) notFound();

  const ticketCount = tickets ? parseInt(tickets, 10) : 1;
  const formatCategory = (cat: string) => cat.replace(/_/g, ' ').replace(/^SPORTS /i, '');

  const enterHead = (
    <>
      {/* Back link */}
      <div className="comp-back">
        <Link href={`/competitions/${slug}`} className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-dim)', padding: '12px 0' }}>
          ← Back to Competition
        </Link>
      </div>

      {/* Enter head */}
      <section className="enter-head">
        <div className="enter-head-card">
          <img src={competition.mainImageUrl} alt={competition.title} />
        </div>
        <div className="enter-head-body">
          <div className="enter-head-kicker">Enter · {formatCategory(competition.category)}</div>
          <h1 className="enter-head-title">{competition.title}</h1>
          <div className="enter-head-meta">
            <span>Auto Pick</span>
            <span>·</span>
            <span>Total <b>£{(competition.ticketPrice / 100).toFixed(2)}</b></span>
          </div>
        </div>
        <div className="enter-tracker">
          <div className="enter-tracker-step done">
            <span className="enter-tracker-num">✓</span>
            <span className="enter-tracker-t">Tickets</span>
          </div>
          <div className="enter-tracker-step done">
            <span className="enter-tracker-num">✓</span>
            <span className="enter-tracker-t">Skill Q</span>
          </div>
          <div className="enter-tracker-step active">
            <span className="enter-tracker-num">3</span>
            <span className="enter-tracker-t">Details</span>
          </div>
        </div>
      </section>
    </>
  );

  if (session?.user?.id) {
    return (
      <main>
        {enterHead}
        <section className="enter-step">
          <div className="enter-step-head">
            <span className="step-num" style={{ background: 'var(--pop)', color: '#fff' }}>03</span>
            <div>
              <div className="step-kicker">Step 03 · Your details</div>
              <h2 className="step-title">Complete your entry.</h2>
            </div>
            <Link href={`/competitions/${slug}/question`} className="btn btn-ghost">← Back</Link>
          </div>
          <CheckoutClient
            competitionId={competition.id}
            competitionSlug={competition.slug}
            competitionTitle={competition.title}
            mainImageUrl={competition.mainImageUrl}
            ticketPrice={competition.ticketPrice}
          />
        </section>
      </main>
    );
  }

  return (
    <main>
      {enterHead}
      <section className="enter-step">
        <div className="enter-step-head">
          <span className="step-num" style={{ background: 'var(--pop)', color: '#fff' }}>03</span>
          <div>
            <div className="step-kicker">Step 03 · Your details</div>
            <h2 className="step-title">Where do we send your win?</h2>
          </div>
          <Link href={`/competitions/${slug}/question`} className="btn btn-ghost">← Back</Link>
        </div>
        <GuestCheckoutForm
          competitionId={competition.id}
          competitionSlug={competition.slug}
          competitionTitle={competition.title}
          mainImageUrl={competition.mainImageUrl}
          ticketPrice={competition.ticketPrice}
          ticketCount={ticketCount > 0 ? ticketCount : 1}
        />
      </section>
    </main>
  );
}
