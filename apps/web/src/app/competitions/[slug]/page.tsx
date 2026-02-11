import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Gift, Ticket } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountdownTimer } from '@/components/common/countdown-timer';
import { ProgressBar } from '@/components/common/progress-bar';
import { ImageGallery } from '@/components/competition/image-gallery';
import { TicketSelectorPreview } from '@/components/competition/ticket-selector-preview';
import { CompetitionInfo } from '@/components/competition/competition-info';
import { FreeEntryNotice } from '@/components/competition/free-entry-notice';
import { GetTicketsButton } from '@/components/competition/get-tickets-button';
import { SafeHtml } from '@/components/common/safe-html';
import type { CompetitionCategory } from '@winthiscard/shared/types';

const CATEGORY_LABELS: Record<CompetitionCategory, string> = {
  POKEMON: 'Pokemon',
  ONE_PIECE: 'One Piece',
  SPORTS_BASKETBALL: 'Basketball',
  SPORTS_FOOTBALL: 'Football',
  SPORTS_OTHER: 'Sports',
  MEMORABILIA: 'Memorabilia',
  YUGIOH: 'Yu-Gi-Oh!',
  MTG: 'MTG',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<CompetitionCategory, string> = {
  POKEMON: 'bg-yellow-500 text-white',
  ONE_PIECE: 'bg-red-500 text-white',
  SPORTS_BASKETBALL: 'bg-orange-500 text-white',
  SPORTS_FOOTBALL: 'bg-green-600 text-white',
  SPORTS_OTHER: 'bg-blue-500 text-white',
  MEMORABILIA: 'bg-purple-500 text-white',
  YUGIOH: 'bg-indigo-500 text-white',
  MTG: 'bg-slate-600 text-white',
  OTHER: 'bg-gray-500 text-white',
};

function formatPrice(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(num);
}

function getBonusTicketsMessage(quantity: number): string | null {
  if (quantity >= 50) return 'Buy 50 tickets, get 5 FREE!';
  if (quantity >= 20) return 'Buy 20 tickets, get 3 FREE!';
  if (quantity >= 15) return 'Buy 15 tickets, get 2 FREE!';
  if (quantity >= 10) return 'Buy 10 tickets, get 1 FREE!';
  return null;
}

interface PageParams {
  slug: string;
}

async function getCompetition(slug: string) {
  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      tickets: {
        where: {
          status: {
            in: ['SOLD', 'FREE_ENTRY'],
          },
        },
        select: {
          ticketNumber: true,
        },
      },
      wins: {
        select: {
          ticketNumber: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!competition) return null;

  // Don't show draft competitions
  if (competition.status === 'DRAFT') {
    return null;
  }

  const soldTicketNumbers = competition.tickets.map((t) => t.ticketNumber);
  const winner = competition.wins[0];
  const winnerDisplayName = winner && winner.user
    ? `${winner.user.firstName} ${winner.user.lastName?.charAt(0) ?? ''}.`
    : winner ? 'Lucky Winner' : null;

  return {
    ...competition,
    prizeValue:
      typeof competition.prizeValue === 'object' && 'toNumber' in competition.prizeValue
        ? (competition.prizeValue as { toNumber: () => number }).toNumber()
        : Number(competition.prizeValue),
    ticketPrice:
      typeof competition.ticketPrice === 'object' && 'toNumber' in competition.ticketPrice
        ? (competition.ticketPrice as { toNumber: () => number }).toNumber()
        : Number(competition.ticketPrice),
    soldTickets: soldTicketNumbers.length,
    soldTicketNumbers,
    winnerDisplayName,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);

  if (!competition) {
    return {
      title: 'Competition Not Found',
    };
  }

  const title = competition.metaTitle || competition.title;
  const description =
    competition.metaDescription ||
    `Win ${competition.title} worth ${formatPrice(competition.prizeValue)}. Tickets from ${formatPrice(competition.ticketPrice)}. UK prize competition with free entry route.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | WinThisCard`,
      description,
      images: [{ url: competition.mainImageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | WinThisCard`,
      description,
      images: [competition.mainImageUrl],
    },
  };
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const competition = await getCompetition(slug);

  if (!competition) {
    notFound();
  }

  const isActive = competition.status === 'ACTIVE';
  const isCompleted = competition.status === 'COMPLETED';
  const isUpcoming = competition.status === 'UPCOMING';
  const isSoldOut = competition.status === 'SOLD_OUT';
  const isCancelled = competition.status === 'CANCELLED';

  const _progressPercent = Math.round(
    (competition.soldTickets / competition.totalTickets) * 100
  );

  const allImages = [competition.mainImageUrl, ...competition.galleryUrls];

  return (
    <main className="min-h-screen bg-background pb-24 sm:pb-8 overflow-x-hidden">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-full overflow-hidden">
        {/* Back Navigation */}
        <Link
          href="/competitions"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Competitions
        </Link>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left Column - Image Gallery */}
          <div>
            <ImageGallery images={allImages} alt={competition.title} />
          </div>

          {/* Right Column - Competition Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              {/* Category Badge */}
              <Badge
                className={`mb-3 ${CATEGORY_COLORS[competition.category as CompetitionCategory]}`}
              >
                {CATEGORY_LABELS[competition.category as CompetitionCategory]}
              </Badge>

              {/* Title */}
              <h1 className="text-2xl font-bold sm:text-3xl">{competition.title}</h1>

              {/* Subtitle */}
              {competition.subtitle && (
                <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                  {competition.subtitle}
                </p>
              )}
            </div>

            {/* Prize Value Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prize Value</p>
                    <p className="text-2xl font-bold text-primary sm:text-3xl">
                      {formatPrice(competition.prizeValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Countdown Timer - for active/upcoming competitions */}
            {(isActive || isUpcoming) && (
              <div className="rounded-lg border bg-card p-4">
                <p className="mb-3 text-center text-sm text-muted-foreground">
                  {isActive ? 'Competition ends in' : 'Sale starts in'}
                </p>
                <div className="flex justify-center">
                  <CountdownTimer targetDate={competition.drawDate} size="lg" />
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {!isCompleted && (
              <div>
                <ProgressBar
                  sold={competition.soldTickets}
                  total={competition.totalTickets}
                  showPercentage
                />
              </div>
            )}

            {/* Ticket Price and CTA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Ticket Price</span>
                </div>
                <span className="text-2xl font-bold">{formatPrice(competition.ticketPrice)}</span>
              </div>

              {/* Bonus Tickets Notice */}
              {isActive && (
                <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                  <span className="mr-2">🎁</span>
                  {getBonusTicketsMessage(10)}
                </div>
              )}

              {/* CTA Button */}
              {isActive && (
                <GetTicketsButton
                  competitionSlug={slug}
                  className="w-full text-lg"
                  size="lg"
                >
                  Get Your Tickets
                </GetTicketsButton>
              )}

              {isUpcoming && (
                <Button size="lg" className="w-full text-lg" disabled>
                  Coming Soon
                </Button>
              )}

              {isSoldOut && (
                <Button size="lg" className="w-full text-lg" variant="secondary" disabled>
                  Sold Out - Draw Pending
                </Button>
              )}

              {isCompleted && (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-lg font-semibold">Competition Completed</p>
                  <p className="text-muted-foreground">
                    Winning ticket: #{competition.winningTicketNumber}
                  </p>
                  {competition.winnerDisplayName && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Winner: {competition.winnerDisplayName}
                    </p>
                  )}
                </div>
              )}

              {isCancelled && (
                <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-center">
                  <p className="text-lg font-semibold text-destructive">
                    This competition was cancelled
                  </p>
                  <p className="text-muted-foreground">
                    All participants have been fully refunded.
                  </p>
                </div>
              )}
            </div>

            {/* Free Entry Notice */}
            {(isActive || isUpcoming) && (
              <FreeEntryNotice competitionTitle={competition.title} />
            )}
          </div>
        </div>

        {/* Ticket Selector Preview - Full width on mobile */}
        {!isCompleted && !isCancelled && (
          <div className="mt-8">
            <TicketSelectorPreview
              totalTickets={competition.totalTickets}
              soldTicketNumbers={competition.soldTicketNumbers}
              isActive={isActive}
            />
          </div>
        )}

        {/* Additional Information Sections */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Description */}
          <div>
            <h2 className="mb-4 text-xl font-semibold">About This Prize</h2>
            <SafeHtml
              html={competition.descriptionLong}
              className="prose prose-sm max-w-none dark:prose-invert"
            />
          </div>

          {/* Authentication & Draw Info */}
          <CompetitionInfo
            certificationNumber={competition.certificationNumber}
            grade={competition.grade}
            condition={competition.condition}
            provenance={competition.provenance}
            drawDate={competition.drawDate}
            actualDrawDate={competition.actualDrawDate}
            drawProofUrl={competition.drawProofUrl}
            winningTicketNumber={competition.winningTicketNumber}
            winnerDisplayName={competition.winnerDisplayName}
            status={competition.status}
          />
        </div>
      </div>

      {/* Fixed Bottom CTA - Mobile Only */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 p-4 backdrop-blur-sm sm:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ticket Price</p>
              <p className="text-xl font-bold">{formatPrice(competition.ticketPrice)}</p>
            </div>
            <GetTicketsButton competitionSlug={slug} size="lg">
              Get Tickets
            </GetTicketsButton>
          </div>
        </div>
      )}
    </main>
  );
}
