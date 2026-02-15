import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Calendar, Ticket, ArrowRight, Filter } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { WinnersFilter } from './winners-filter';
import { WinnersPagination } from './winners-pagination';
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
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 flex justify-center">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: '#f5f5f5' }}>
            Our Winners
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground" style={{ color: '#a0a0a0' }}>
            Real prizes, real winners. Check out the lucky collectors who have
            won amazing cards and memorabilia through WinUCard.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="border-b px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground" style={{ color: '#a0a0a0' }}>
              <Filter className="h-4 w-4" />
              <span>
                Showing {winners.length} of {totalCount} winner
                {totalCount !== 1 ? 's' : ''}
              </span>
            </div>
            <WinnersFilter
              categories={categories}
              categoryDisplayNames={categoryDisplayNames}
              currentCategory={category}
            />
          </div>
        </div>
      </section>

      {/* Winners Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {winners.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {winners.map((win) => (
                  <Card
                    key={win.id}
                    className="overflow-hidden transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-square bg-muted">
                      {win.competition.mainImageUrl ? (
                        <Image
                          src={win.competition.mainImageUrl}
                          alt={win.competition.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Trophy className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {categoryDisplayNames[win.competition.category] ||
                          win.competition.category}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-2 line-clamp-2 font-semibold" style={{ color: '#f5f5f5' }}>
                        {win.competition.title}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground" style={{ color: '#a0a0a0' }}>
                          <Trophy className="h-4 w-4 text-primary" />
                          <span>
                            Won by{' '}
                            <span className="font-medium text-foreground" style={{ color: '#f5f5f5' }}>
                              {win.user
                                ? anonymizeWinnerInitials(
                                    win.user.firstName,
                                    win.user.lastName
                                  )
                                : 'Lucky Winner'}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground" style={{ color: '#a0a0a0' }}>
                          <Ticket className="h-4 w-4" />
                          <span>
                            Ticket #{win.ticketNumber} - Prize value{' '}
                            <span className="font-medium text-foreground" style={{ color: '#f5f5f5' }}>
                              {formatPrice(
                                Number(win.competition.prizeValue)
                              )}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground" style={{ color: '#a0a0a0' }}>
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(win.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <WinnersPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    category={category}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Trophy className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="mb-2 text-lg font-semibold" style={{ color: '#f5f5f5' }}>No Winners Yet</h3>
              <p className="mb-6 text-muted-foreground" style={{ color: '#a0a0a0' }}>
                {category
                  ? 'No winners in this category yet. Be the first!'
                  : 'Our first winners will be announced soon. Enter a competition to be in with a chance!'}
              </p>
              <Link
                href="/competitions"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                View Competitions
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl" style={{ color: '#f5f5f5' }}>
            You Could Be Next!
          </h2>
          <p className="mb-8 text-muted-foreground" style={{ color: '#a0a0a0' }}>
            Browse our current competitions and enter for your chance to win
            amazing collectible cards and memorabilia.
          </p>
          <Link
            href="/competitions"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Browse Competitions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
