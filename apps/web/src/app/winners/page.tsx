import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Suspense } from 'react';
import { WinnersFilter } from './winners-filter';
import { WinnersPagination } from './winners-pagination';
import { HomeCTABand } from '@/components/home/home-cta-band';
import { formatDate, formatPrice } from '@winucard/shared/utils';

export const metadata: Metadata = {
  title: 'Winners',
  description:
    'See all the lucky winners of WinUPrize prize competitions. Real prizes, real winners. You could be next!',
  openGraph: {
    title: 'Winners | WinUPrize',
    description:
      'See all the lucky winners of WinUPrize prize competitions. Real prizes, real winners. You could be next!',
  },
};

const ITEMS_PER_PAGE = 12;

interface WinnersPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

// Map category enum to display name
const categoryDisplayNames: Record<string, string> = {
  POKEMON: 'Pokemon',
  ONE_PIECE: 'One Piece',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_OTHER: 'Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh',
  MTG: 'Magic: The Gathering',
  OTHER: 'Other',
};

function anonymizeWinnerInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}. ${lastInitial}.`;
}

async function getWinners(category?: string, page: number = 1) {
  const where = category
    ? { competition: { category: category as never } }
    : {};

  const [winners, totalCount, prizeValueAgg] = await Promise.all([
    prisma.win.findMany({
      where,
      include: {
        competition: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            prizeValue: true,
            mainImageUrl: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.win.count({ where }),
    // Real total prize value across every win (all pages), derived from the
    // linked competitions — never an invented marketing figure.
    prisma.win.findMany({
      where,
      select: { competition: { select: { prizeValue: true } } },
    }),
  ]);

  const totalPrizeValue = prizeValueAgg.reduce(
    (sum, w) => sum + Number(w.competition.prizeValue),
    0
  );

  return {
    winners,
    totalCount,
    totalPrizeValue,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    currentPage: page,
  };
}

async function getCategories() {
  const categories = await prisma.competition.findMany({
    where: {
      wins: {
        some: {},
      },
    },
    select: {
      category: true,
    },
    distinct: ['category'],
  });

  return categories.map((c) => c.category);
}

export default async function WinnersPage({ searchParams }: WinnersPageProps) {
  const params = await searchParams;
  const category = params.category;
  const page = parseInt(params.page || '1', 10);

  const [
    { winners, totalCount, totalPrizeValue, totalPages, currentPage },
    categories,
  ] = await Promise.all([getWinners(category, page), getCategories()]);

  return (
    <main>
      {/* Page header on the raised panel surface */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: 'clamp(30px, 4.4vw, 66px) clamp(14px, 3vw, 34px)',
        }}
      >
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          <p className="wup-eyebrow" style={{ margin: '0 0 10px' }}>Published results</p>
          <h1 className="wup-h1" style={{ margin: '0 0 14px' }}>Winners.</h1>
          <p className="wup-body" style={{ maxWidth: '620px', margin: 0 }}>
            Every draw is run by an independent third party and the result is published
            here within 24 hours. Real winners, real cards, verifiable every time.
          </p>
        </div>
      </header>

      <section style={{ padding: 'clamp(24px, 3.4vw, 44px) clamp(14px, 3vw, 34px)' }}>
        <div className="mx-auto" style={{ maxWidth: '1400px' }}>
          {/* Stat tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: 'clamp(14px, 1.8vw, 22px)',
              marginBottom: 'clamp(22px, 3vw, 34px)',
            }}
          >
            {[
              { l: 'Total prizes', v: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(totalPrizeValue) },
              { l: 'Cards won', v: String(totalCount) },
              { l: 'Winners paid', v: String(totalCount) },
            ].map((s) => (
              <div key={s.l} className="wup-panel wup-panel--accent-top" style={{ padding: 'clamp(18px, 2vw, 26px)' }}>
                <div className="wup-meta">{s.l}</div>
                <div className="wup-num" style={{ fontSize: 'clamp(30px, 4vw, 44px)', color: 'var(--accent)', marginTop: '6px' }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          {/* Count + category filter */}
          <div className="flex flex-wrap items-center justify-between gap-4" style={{ marginBottom: '14px' }}>
            <span className="wup-meta">
              Showing {winners.length} of {totalCount} winner{totalCount !== 1 ? 's' : ''}
            </span>
            <Suspense fallback={null}>
              <WinnersFilter
                categories={categories}
                categoryDisplayNames={categoryDisplayNames}
                currentCategory={category}
              />
            </Suspense>
          </div>

          {/* Winners table — Prize · Winner · Ticket · Drawn */}
          {winners.length > 0 ? (
            <div>
              <div
                className="flex items-center"
                style={{ gap: '10px', padding: '0 0 10px', borderBottom: '2px solid var(--accent)' }}
              >
                <span className="wup-thead" style={{ flex: 'none', width: 'clamp(74px, 8vw, 96px)' }} aria-hidden="true" />
                <span className="wup-thead" style={{ flex: '1 1 200px', minWidth: '140px' }}>Prize</span>
                <span className="wup-thead winners-col-who" style={{ flex: 'none', width: 'clamp(120px, 16vw, 200px)' }}>Winner</span>
                <span className="wup-thead" style={{ flex: 'none', width: 'clamp(70px, 9vw, 110px)', textAlign: 'right' }}>Ticket</span>
                <span className="wup-thead winners-col-when" style={{ flex: 'none', width: 'clamp(90px, 10vw, 120px)', textAlign: 'right' }}>Drawn</span>
              </div>

              {winners.map((win) => (
                <div key={win.id} className="wup-row" style={{ cursor: 'default' }}>
                  <span className="wup-row__thumb">
                    {win.competition.mainImageUrl && (
                      <Image
                        src={win.competition.mainImageUrl}
                        alt=""
                        fill
                        sizes="96px"
                        style={{ objectFit: 'contain' }}
                      />
                    )}
                  </span>
                  <span style={{ flex: '1 1 200px', minWidth: '140px', paddingLeft: '4px' }}>
                    <span className="wup-title" style={{ display: 'block' }}>{win.competition.title}</span>
                    <span className="wup-meta" style={{ display: 'block', marginTop: '4px' }}>
                      {(categoryDisplayNames[win.competition.category] ?? win.competition.category)}
                      {' · '}{formatPrice(Number(win.competition.prizeValue))}
                    </span>
                  </span>
                  <span
                    className="winners-col-who"
                    style={{ flex: 'none', width: 'clamp(120px, 16vw, 200px)', fontSize: '15px', color: 'var(--ink)' }}
                  >
                    {win.user ? anonymizeWinnerInitials(win.user.firstName, win.user.lastName) : 'Lucky Winner'}
                  </span>
                  <span
                    className="wup-num"
                    style={{ flex: 'none', width: 'clamp(70px, 9vw, 110px)', textAlign: 'right', fontSize: '19px', color: 'var(--accent)' }}
                  >
                    #{win.ticketNumber}
                  </span>
                  <span
                    className="winners-col-when"
                    style={{
                      flex: 'none', width: 'clamp(90px, 10vw, 120px)', textAlign: 'right',
                      fontFamily: 'var(--display)', fontWeight: 600, fontSize: '14px',
                      letterSpacing: '0.06em', color: 'rgba(244, 241, 234, .6)', fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatDate(win.createdAt)}
                  </span>
                </div>
              ))}

              <p className="wup-fine" style={{ marginTop: '18px' }}>
                Draw proof is retained for every competition. Any dispute must be raised
                within 7 days of the published result.
              </p>
            </div>
          ) : (
            <div className="wup-panel text-center" style={{ padding: '48px 24px' }}>
              <Trophy className="mx-auto mb-4 h-14 w-14" style={{ color: 'var(--ink-faint)' }} />
              <h3 className="wup-title" style={{ marginBottom: '8px' }}>No winners yet</h3>
              <p className="wup-body-sm" style={{ marginBottom: '24px' }}>
                {category ? 'No winners in this category yet. Be the first!' : 'Our first winners will be announced soon.'}
              </p>
              <Link href="/competitions" className="wup-btn wup-btn--primary">
                View Competitions
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12">
              <WinnersPagination currentPage={currentPage} totalPages={totalPages} category={category} />
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <HomeCTABand />
    </main>
  );
}
