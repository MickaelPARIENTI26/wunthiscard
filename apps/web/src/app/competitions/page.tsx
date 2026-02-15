import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { CompetitionsContent } from './competitions-content';
import { CompetitionsLoading } from './competitions-loading';

// Revalidate competitions page every 60 seconds
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Competitions',
  description:
    'Browse all active prize competitions. Win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based competitions with free entry route available.',
  openGraph: {
    title: 'Competitions | WinUCard',
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

// Only show ACTIVE, SOLD_OUT, and UPCOMING competitions
// COMPLETED, CANCELLED, and DRAFT are hidden from the public competitions page
// (Users can see completed competitions on the /winners page)
const STATUS_FILTER_MAP: Record<string, string[]> = {
  all: ['ACTIVE', 'SOLD_OUT', 'UPCOMING'],
  active: ['ACTIVE', 'SOLD_OUT'], // Include SOLD_OUT with active (draw is still pending)
  upcoming: ['UPCOMING'],
};

// Status priority for sorting: ACTIVE first, then SOLD_OUT, then UPCOMING
const STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 1,
  SOLD_OUT: 2,
  UPCOMING: 3,
};

type SortOption = 'end-date' | 'price-low' | 'price-high' | 'popularity';

interface CompetitionWithCount {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  mainImageUrl: string;
  category: string;
  status: string;
  prizeValue: { toNumber: () => number } | number;
  ticketPrice: { toNumber: () => number } | number;
  totalTickets: number;
  drawDate: Date;
  _count: {
    tickets: number;
  };
}

async function getCompetitions(searchParams: SearchParams) {
  const category = searchParams.category || 'all';
  const status = searchParams.status || 'all';
  const sort = (searchParams.sort || 'end-date') as SortOption;
  const page = Math.max(1, parseInt(searchParams.page || '1', 10));

  const categoryFilter = CATEGORY_FILTER_MAP[category] || [];
  const statusFilter = STATUS_FILTER_MAP[status] || STATUS_FILTER_MAP['all'];

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

  // Build orderBy clause
  let orderBy: Record<string, string>[] = [];
  switch (sort) {
    case 'end-date':
      orderBy = [{ drawDate: 'asc' }];
      break;
    case 'price-low':
      orderBy = [{ ticketPrice: 'asc' }];
      break;
    case 'price-high':
      orderBy = [{ ticketPrice: 'desc' }];
      break;
    case 'popularity':
      // Order by sold tickets count (calculated from tickets with status SOLD)
      orderBy = [{ createdAt: 'desc' }];
      break;
    default:
      orderBy = [{ drawDate: 'asc' }];
  }

  // Get total count
  const totalCount = await prisma.competition.count({ where });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get competitions with sold ticket counts
  const competitions = await prisma.competition.findMany({
    where,
    orderBy,
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
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
      _count: {
        select: {
          tickets: {
            where: {
              status: {
                in: ['SOLD', 'FREE_ENTRY'],
              },
            },
          },
        },
      },
    },
  });

  // Sort competitions: first by status priority (ACTIVE > SOLD_OUT > UPCOMING), then by user's sort preference
  let sortedCompetitions = [...competitions].sort((a, b) => {
    // First, sort by status priority
    const statusA = STATUS_PRIORITY[a.status] ?? 99;
    const statusB = STATUS_PRIORITY[b.status] ?? 99;
    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // Within the same status, apply the user's sort preference
    switch (sort) {
      case 'price-low': {
        const priceA = typeof a.ticketPrice === 'object' && 'toNumber' in a.ticketPrice
          ? a.ticketPrice.toNumber()
          : Number(a.ticketPrice);
        const priceB = typeof b.ticketPrice === 'object' && 'toNumber' in b.ticketPrice
          ? b.ticketPrice.toNumber()
          : Number(b.ticketPrice);
        return priceA - priceB;
      }
      case 'price-high': {
        const priceA = typeof a.ticketPrice === 'object' && 'toNumber' in a.ticketPrice
          ? a.ticketPrice.toNumber()
          : Number(a.ticketPrice);
        const priceB = typeof b.ticketPrice === 'object' && 'toNumber' in b.ticketPrice
          ? b.ticketPrice.toNumber()
          : Number(b.ticketPrice);
        return priceB - priceA;
      }
      case 'popularity':
        return b._count.tickets - a._count.tickets;
      case 'end-date':
      default:
        return new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime();
    }
  }) as unknown as CompetitionWithCount[];

  return {
    competitions: sortedCompetitions.map((comp) => ({
      ...comp,
      prizeValue:
        typeof comp.prizeValue === 'object' && 'toNumber' in comp.prizeValue
          ? comp.prizeValue.toNumber()
          : Number(comp.prizeValue),
      ticketPrice:
        typeof comp.ticketPrice === 'object' && 'toNumber' in comp.ticketPrice
          ? comp.ticketPrice.toNumber()
          : Number(comp.ticketPrice),
      soldTickets: comp._count.tickets,
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
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl font-[family-name:var(--font-display)]" style={{ color: '#f5f5f5' }}>
            <span className="text-gradient-gold">Competitions</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base" style={{ color: '#a0a0a0' }}>
            Browse our latest prize competitions and win amazing collectibles
          </p>
        </div>

        <Suspense fallback={<CompetitionsLoading />}>
          <CompetitionsContent
            competitions={data.competitions}
            pagination={data.pagination}
            filters={data.filters}
          />
        </Suspense>
      </div>
    </main>
  );
}
