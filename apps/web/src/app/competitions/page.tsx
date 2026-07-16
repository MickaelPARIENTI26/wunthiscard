import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { FINISHED_VISIBLE_DAYS, isFinished, isWithinFinishedWindow } from '@/lib/competition-visibility';
import { CompetitionsContent } from './competitions-content';
import { CompetitionsLoading } from './competitions-loading';

// Revalidate competitions page every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Competitions',
  description:
    'Browse all active prize competitions. Win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based competitions with free entry route available.',
  openGraph: {
    title: 'Competitions | Lucky TCG',
    description:
      'Browse all active prize competitions. Win rare Pokemon cards, One Piece TCG, sports memorabilia and more.',
  },
};

interface SearchParams {
  category?: string;
  status?: string;
  sort?: string;
  page?: string;
}

const ITEMS_PER_PAGE = 12;

const CATEGORY_FILTER_MAP: Record<string, string[]> = {
  all: [],
  pokemon: ['POKEMON'],
  'one-piece': ['ONE_PIECE'],
  sports: ['SPORTS_BASKETBALL', 'SPORTS_FOOTBALL', 'SPORTS_OTHER'],
  memorabilia: ['MEMORABILIA'],
  other: ['YUGIOH', 'MTG', 'OTHER'],
};

// Finished competitions (sold out / drawn) keep showing — with their red
// "SOLD OUT" / "FINISHED" banner — for FINISHED_VISIBLE_DAYS days, then auto-hide
// (published results live on /winners).
const FINISHED_VISIBLE_MS = FINISHED_VISIBLE_DAYS * 24 * 60 * 60 * 1000;

const STATUS_FILTER_MAP: Record<string, string[]> = {
  all: ['ACTIVE', 'SOLD_OUT', 'UPCOMING', 'DRAWING', 'COMPLETED'],
  live: ['ACTIVE'],
  'ending-soon': ['ACTIVE', 'SOLD_OUT'],
  'coming-soon': ['UPCOMING'],
};

// Status priority for sorting: ACTIVE first, then SOLD_OUT, UPCOMING, DRAWING,
// COMPLETED last.
const STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 1,
  SOLD_OUT: 2,
  UPCOMING: 3,
  DRAWING: 4,
  COMPLETED: 5,
};

type SortOption = 'end-date' | 'price-low' | 'price-high' | 'popularity';

async function getCompetitions(searchParams: SearchParams) {
  const category = searchParams.category ?? 'all';
  const status = searchParams.status ?? 'all';
  const sort = (searchParams.sort ?? 'end-date') as SortOption;
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));

  const categoryFilter = CATEGORY_FILTER_MAP[category] ?? [];
  const statusFilter = STATUS_FILTER_MAP[status] ?? STATUS_FILTER_MAP['all'];

  // Build where clause
  const where: Record<string, unknown> = {
    status: {
      in: statusFilter,
    },
  };

  if (categoryFilter.length > 0) {
    where.category = {
      in: categoryFilter,
    };
  }

  // DB pre-filter — a deliberately loose SUPERSET of what will actually show. The
  // precise per-competition auto-hide runs in memory below via the shared helper, so
  // this query and the unit-tested rule stay a single source of truth. A row survives
  // the pre-filter if its draw is still ahead, or it finished (by EITHER its scheduled
  // or actual draw time) within the window.
  const now = new Date();
  const finishedCutoff = new Date(now.getTime() - FINISHED_VISIBLE_MS);
  if (status === 'ending-soon') {
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    where.drawDate = { lte: in48Hours, gte: now };
  } else {
    where.OR = [
      { drawDate: { gt: finishedCutoff } },
      { actualDrawDate: { gt: finishedCutoff } },
    ];
  }

  // Fetch ALL candidates (no DB pagination): the auto-hide filter, the status-priority
  // ordering, and pagination must all agree, so they're computed together in memory.
  // At this catalogue size (a page or two of live/recent competitions) that's cheap.
  const rows = await prisma.competition.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      mainImageUrl: true,
      category: true,
      status: true,
      prizeValue: true,
      ticketPrice: true,
      totalTickets: true,
      drawDate: true,
      actualDrawDate: true,
      isFree: true,
      isMystery: true,
      isRevealed: true,
      drawType: true,
      prizes: true,
      _count: {
        select: { tickets: { where: { status: { in: ['SOLD', 'FREE_ENTRY'] } } } },
      },
    },
  });

  const toNum = (v: { toNumber: () => number } | number) =>
    typeof v === 'object' && 'toNumber' in v ? v.toNumber() : Number(v);

  // Precise auto-hide: a finished competition drops off FINISHED_VISIBLE_DAYS after it
  // ACTUALLY finished (actualDrawDate for a drawn comp), not its scheduled draw date.
  const visible = rows.filter((c) =>
    isWithinFinishedWindow({ status: c.status, drawDate: c.drawDate, actualDrawDate: c.actualDrawDate }, now)
  );

  // Order: still-enterable / upcoming first (by status priority), finished last; then
  // by the chosen sort within each group. Done before pagination so page 1 is the
  // live competitions, not the finished ones.
  const rank = (c: (typeof visible)[number]) =>
    isFinished({ status: c.status, drawDate: c.drawDate, actualDrawDate: c.actualDrawDate }, now)
      ? 100
      : (STATUS_PRIORITY[c.status] ?? 99);
  visible.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    switch (sort) {
      case 'price-low':
        return toNum(a.ticketPrice) - toNum(b.ticketPrice);
      case 'price-high':
        return toNum(b.ticketPrice) - toNum(a.ticketPrice);
      case 'popularity':
        return b._count.tickets - a._count.tickets;
      case 'end-date':
      default:
        return new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime();
    }
  });

  const totalCount = visible.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const pageItems = visible.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return {
    competitions: pageItems.map((comp) => ({
      id: comp.id,
      slug: comp.slug,
      title: comp.title,
      subtitle: comp.subtitle,
      mainImageUrl: comp.mainImageUrl,
      category: comp.category,
      status: comp.status,
      prizeValue: toNum(comp.prizeValue),
      ticketPrice: toNum(comp.ticketPrice),
      totalTickets: comp.totalTickets,
      drawDate: comp.drawDate,
      soldTickets: comp._count.tickets,
      isFree: comp.isFree,
      isMystery: comp.isMystery,
      isRevealed: comp.isRevealed,
      drawType: comp.drawType,
      prizeCount: Array.isArray(comp.prizes) ? (comp.prizes as unknown[]).length : 1,
      // Closed (draw date passed) but not yet drawn — shown as "Drawing soon".
      pendingDraw: new Date(comp.drawDate) <= now,
    })),
    pagination: {
      page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    filters: {
      category,
      status,
      sort,
    },
  };
}

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getCompetitions(params);

  return (
    <main>
      {/* Page Header */}
      <header className="mx-auto px-5 sm:px-8 py-15 sm:py-20" style={{ maxWidth: '1440px' }}>
        <div
          className="inline-flex items-center gap-2.5 mb-4"
          style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}
        >
          Prize Draws
        </div>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(28px, 5.5vw, 72px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: '12px' }}>
          All Competitions
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.5 }}>
          Browse all our live and upcoming competitions. Tickets from £14.90.
        </p>
      </header>

      {/* Competitions Content */}
      <section className="section-gray" style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
        <div className="mx-auto px-5 sm:px-8 py-10 sm:py-12" style={{ maxWidth: '1440px' }}>
          <Suspense fallback={<CompetitionsLoading />}>
            <CompetitionsContent
              competitions={data.competitions}
              pagination={data.pagination}
              filters={data.filters}
            />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
