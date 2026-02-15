import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Gift, Ticket, Sparkles, Trophy, Clock } from 'lucide-react';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/common/countdown-timer';
import { ProgressBar } from '@/components/common/progress-bar';
import { ImageGallery } from '@/components/competition/image-gallery';
import { CompetitionInfo } from '@/components/competition/competition-info';
import { FreeEntryNotice } from '@/components/competition/free-entry-notice';
import { GetTicketsButton } from '@/components/competition/get-tickets-button';
import { SafeHtml } from '@/components/common/safe-html';
import type { CompetitionCategory } from '@winucard/shared/types';
import { formatPrice } from '@winucard/shared/utils';

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

const CATEGORY_GRADIENTS: Record<CompetitionCategory, string> = {
  POKEMON: 'linear-gradient(135deg, oklch(0.75 0.18 85) 0%, oklch(0.65 0.15 85) 100%)',
  ONE_PIECE: 'linear-gradient(135deg, oklch(0.55 0.2 25) 0%, oklch(0.45 0.18 25) 100%)',
  SPORTS_BASKETBALL: 'linear-gradient(135deg, oklch(0.65 0.18 45) 0%, oklch(0.55 0.16 45) 100%)',
  SPORTS_FOOTBALL: 'linear-gradient(135deg, oklch(0.55 0.18 145) 0%, oklch(0.45 0.15 145) 100%)',
  SPORTS_OTHER: 'linear-gradient(135deg, oklch(0.55 0.18 250) 0%, oklch(0.45 0.15 250) 100%)',
  MEMORABILIA: 'linear-gradient(135deg, oklch(0.55 0.18 300) 0%, oklch(0.45 0.15 300) 100%)',
  YUGIOH: 'linear-gradient(135deg, oklch(0.5 0.18 280) 0%, oklch(0.4 0.15 280) 100%)',
  MTG: 'linear-gradient(135deg, oklch(0.4 0.1 270) 0%, oklch(0.3 0.08 270) 100%)',
  OTHER: 'linear-gradient(135deg, oklch(0.45 0.05 270) 0%, oklch(0.35 0.04 270) 100%)',
};

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

  const soldTicketsCount = competition._count.tickets;
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
    soldTickets: soldTicketsCount,
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
      title: `${title} | WinUCard`,
      description,
      images: [{ url: competition.mainImageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | WinUCard`,
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
    <main className="min-h-screen pb-24 sm:pb-8 overflow-x-hidden">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-full overflow-hidden">
        {/* Back Navigation */}
        <Link
          href="/competitions"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
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
                className="mb-3 font-semibold"
                style={{
                  background: CATEGORY_GRADIENTS[competition.category as CompetitionCategory],
                  color: 'white',
                  border: 'none',
                }}
              >
                {CATEGORY_LABELS[competition.category as CompetitionCategory]}
              </Badge>

              {/* Title */}
              <h1 className="text-2xl font-bold sm:text-3xl font-[family-name:var(--font-display)]">
                {competition.title}
              </h1>

              {/* Subtitle */}
              {competition.subtitle && (
                <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                  {competition.subtitle}
                </p>
              )}
            </div>

            {/* Prize Value Card */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, oklch(0.14 0.02 270) 0%, oklch(0.10 0.02 270) 100%)',
                border: '1px solid oklch(0.25 0.02 270)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                  }}
                >
                  <Gift className="h-7 w-7 text-black" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prize Value</p>
                  <p className="text-3xl font-bold text-gradient-gold sm:text-4xl font-[family-name:var(--font-display)]">
                    {formatPrice(competition.prizeValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown Timer - for active/upcoming competitions */}
            {(isActive || isUpcoming) && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.12 0.02 270) 0%, oklch(0.08 0.02 270) 100%)',
                  border: '1px solid oklch(0.22 0.02 270)',
                }}
              >
                <p className="mb-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
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
              <div
                className="flex items-center justify-between rounded-xl p-4"
                style={{
                  background: 'oklch(0.12 0.02 270)',
                  border: '1px solid oklch(0.22 0.02 270)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary/70" />
                  <span className="text-muted-foreground">Ticket Price</span>
                </div>
                <span className="text-2xl font-bold font-[family-name:var(--font-display)]">
                  {formatPrice(competition.ticketPrice)}
                </span>
              </div>

              {/* Bonus Tickets Notice */}
              {isActive && (
                <div
                  className="rounded-xl p-3 text-center text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.2 0.08 145) 0%, oklch(0.15 0.06 145) 100%)',
                    border: '1px solid oklch(0.35 0.1 145)',
                    color: 'oklch(0.8 0.15 145)',
                  }}
                >
                  <span className="mr-2">🎁</span>
                  {getBonusTicketsMessage(10)}
                </div>
              )}

              {/* CTA Button */}
              {isActive && (
                <>
                  <GetTicketsButton
                    competitionSlug={slug}
                    className="w-full text-lg font-semibold"
                    size="lg"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                      color: 'black',
                    }}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Get Your Tickets
                  </GetTicketsButton>
                  <FreeEntryNotice competitionTitle={competition.title} />
                </>
              )}

              {isUpcoming && (
                <>
                  <Button
                    size="lg"
                    className="w-full text-lg"
                    disabled
                    style={{
                      background: 'oklch(0.25 0.02 270)',
                      color: 'oklch(0.6 0.02 270)',
                    }}
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Coming Soon
                  </Button>
                  <FreeEntryNotice competitionTitle={competition.title} />
                </>
              )}

              {isSoldOut && (
                <Button
                  size="lg"
                  className="w-full text-lg"
                  variant="secondary"
                  disabled
                  style={{
                    background: 'oklch(0.2 0.02 270)',
                    color: 'oklch(0.6 0.02 270)',
                  }}
                >
                  Sold Out - Draw Pending
                </Button>
              )}

              {isCompleted && (
                <div
                  className="rounded-2xl p-5 text-center"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.15 0.05 85) 0%, oklch(0.12 0.04 85) 100%)',
                    border: '1px solid oklch(0.3 0.08 85)',
                  }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-6 w-6 text-primary" />
                    <p className="text-lg font-semibold text-gradient-gold">Competition Completed</p>
                  </div>
                  <p className="text-muted-foreground">
                    Winning ticket: <span className="font-mono font-bold text-primary">#{competition.winningTicketNumber}</span>
                  </p>
                  {competition.winnerDisplayName && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Winner: {competition.winnerDisplayName}
                    </p>
                  )}
                </div>
              )}

              {isCancelled && (
                <div
                  className="rounded-2xl p-5 text-center"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.2 0.12 25) 0%, oklch(0.15 0.1 25) 100%)',
                    border: '2px solid oklch(0.45 0.18 25)',
                  }}
                >
                  <p className="text-lg font-semibold" style={{ color: 'oklch(0.7 0.18 25)' }}>
                    This competition was cancelled
                  </p>
                  <p className="text-muted-foreground">
                    All participants have been fully refunded.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information Sections */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Description */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, oklch(0.12 0.02 270) 0%, oklch(0.08 0.02 270) 100%)',
              border: '1px solid oklch(0.22 0.02 270)',
            }}
          >
            <h2 className="mb-4 text-xl font-semibold font-[family-name:var(--font-display)] text-gradient-gold">
              About This Prize
            </h2>
            <SafeHtml
              html={competition.descriptionLong}
              className="prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground"
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
        <div
          className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-xl sm:hidden"
          style={{
            background: 'linear-gradient(180deg, oklch(0.08 0.02 270 / 0.95) 0%, oklch(0.06 0.02 270 / 0.98) 100%)',
            borderTop: '1px solid oklch(0.25 0.02 270)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Ticket Price</p>
              <p className="text-xl font-bold font-[family-name:var(--font-display)]">
                {formatPrice(competition.ticketPrice)}
              </p>
            </div>
            <GetTicketsButton
              competitionSlug={slug}
              size="lg"
              className="font-semibold"
              style={{
                background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                color: 'black',
              }}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Get Tickets
            </GetTicketsButton>
          </div>
        </div>
      )}
    </main>
  );
}
