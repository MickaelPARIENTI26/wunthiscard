import type { Metadata } from 'next';
import Link from 'next/link';
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
    'See all the lucky winners of WinUCard prize competitions. Real prizes, real winners. You could be next!',
  openGraph: {
    title: 'Winners | WinUCard',
    description:
      'See all the lucky winners of WinUCard prize competitions. Real prizes, real winners. You could be next!',
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

  const [winners, totalCount] = await Promise.all([
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
  ]);

  return {
    winners,
    totalCount,
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

  const [{ winners, totalCount, totalPages, currentPage }, categories] =
    await Promise.all([getWinners(category, page), getCategories()]);

  return (
    <main>
      {/* Page Header */}
      <header className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
        <div className="inline-flex items-center gap-2.5 mb-4" style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
          Hall of Fame
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5.5vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: '12px' }}>
          Our Winners
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '500px', lineHeight: 1.5 }}>
          Real winners, real cards, real wins. Every draw verified on TikTok Live.
        </p>
      </header>

      {/* Stats + Winners */}
      <section className="section-gray" style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div className="mx-auto px-5 sm:px-8 py-10 sm:py-12" style={{ maxWidth: '1100px' }}>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
            <div style={{ background: 'var(--accent)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Total prizes</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '6px' }}>£2.4M</div>
            </div>
            <div style={{ background: 'var(--hot)', color: '#fff', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Cards won</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '6px' }}>{totalCount}</div>
            </div>
            <div style={{ background: 'var(--ink)', color: '#fff', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent)' }}>Happy winners</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '6px' }}>{totalCount}</div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>
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

          {/* Winners table */}
          {winners.length > 0 ? (
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
              {/* Table header */}
              <div className="hidden sm:grid" style={{ gridTemplateColumns: '120px 1fr 1fr 120px 120px', padding: '16px 24px', borderBottom: '1.5px solid var(--ink)', background: 'var(--ink)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                <span>Date</span><span>Winner</span><span>Prize</span><span>Ticket</span><span style={{ textAlign: 'right' }}>Value</span>
              </div>
              {/* Rows */}
              {winners.map((win, i) => (
                <div key={win.id} className="hidden sm:grid" style={{ gridTemplateColumns: '120px 1fr 1fr 120px 120px', padding: '14px 24px', borderBottom: i < winners.length - 1 ? '1px dashed var(--line-2)' : 'none', alignItems: 'center', fontSize: '14px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink-dim)' }}>{formatDate(win.createdAt)}</span>
                  <span>
                    <b>{win.user ? anonymizeWinnerInitials(win.user.firstName, win.user.lastName) : 'Lucky Winner'}</b>
                  </span>
                  <span>{win.competition.title}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>#{win.ticketNumber}</span>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 700, letterSpacing: '-0.01em' }}>{formatPrice(Number(win.competition.prizeValue))}</span>
                </div>
              ))}
              {/* Mobile cards */}
              {winners.map((win) => (
                <div key={`m-${win.id}`} className="sm:hidden" style={{ padding: '16px 20px', borderBottom: '1px dashed var(--line-2)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <b>{win.competition.title}</b>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 700 }}>{formatPrice(Number(win.competition.prizeValue))}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>
                    Won by {win.user ? anonymizeWinnerInitials(win.user.firstName, win.user.lastName) : 'Winner'} · Ticket #{win.ticketNumber} · {formatDate(win.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', padding: '48px 24px' }}>
              <Trophy className="mx-auto mb-4 h-16 w-16" style={{ color: 'var(--ink-faint)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Winners Yet</h3>
              <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginBottom: '24px' }}>
                {category ? 'No winners in this category yet. Be the first!' : 'Our first winners will be announced soon.'}
              </p>
              <Link href="/competitions" className="inline-flex items-center gap-2 font-semibold" style={{ padding: '11px 18px', background: 'var(--ink)', color: 'var(--bg)', border: '1.5px solid var(--ink)', borderRadius: '10px', boxShadow: 'var(--shadow-sm)' }}>
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
