import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Trophy, Calendar, Award, Play } from 'lucide-react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { SimpleTicketSelector } from '@/components/competition/simple-ticket-selector';
import { FreeEntryAccordion } from '@/components/competition/free-entry-accordion';
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

const CATEGORY_COLORS: Record<CompetitionCategory, string> = {
  POKEMON: '#F0B90B',
  ONE_PIECE: '#DC2626',
  SPORTS_BASKETBALL: '#F97316',
  SPORTS_FOOTBALL: '#22C55E',
  SPORTS_OTHER: '#3B82F6',
  MEMORABILIA: '#8B5CF6',
  YUGIOH: '#6366F1',
  MTG: '#1a1a2e',
  OTHER: '#6b7088',
};

const CATEGORY_EMOJIS: Record<CompetitionCategory, string> = {
  POKEMON: '🔥',
  ONE_PIECE: '🏴‍☠️',
  SPORTS_BASKETBALL: '🏀',
  SPORTS_FOOTBALL: '⚽',
  SPORTS_OTHER: '🏆',
  MEMORABILIA: '🏆',
  YUGIOH: '🎴',
  MTG: '🃏',
  OTHER: '🎴',
};

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
              status: { in: ['SOLD', 'FREE_ENTRY'] },
            },
          },
        },
      },
      wins: {
        select: {
          ticketNumber: true,
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!competition || competition.status === 'DRAFT') return null;

  const soldTicketsCount = competition._count.tickets;
  const winner = competition.wins[0];
  const winnerDisplayName = winner?.user
    ? `${winner.user.firstName} ${winner.user.lastName?.charAt(0) ?? ''}.`
    : winner
      ? 'Lucky Winner'
      : null;

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

async function getUserTicketCount(competitionId: string, userId: string | undefined) {
  if (!userId) return 0;
  return prisma.ticket.count({
    where: { competitionId, userId, status: 'SOLD' },
  });
}

async function getAvailableTicketCount(competitionId: string) {
  const now = new Date();
  return prisma.ticket.count({
    where: {
      competitionId,
      OR: [
        { status: 'AVAILABLE' },
        { status: 'RESERVED', reservedUntil: { lte: now } },
      ],
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);

  if (!competition) return notFound();

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

// Countdown component (server-rendered initial state)
function CountdownBlock({ targetDate }: { targetDate: Date }) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  const blocks = [
    { value: days, label: 'DAYS' },
    { value: hours, label: 'HOURS' },
    { value: mins, label: 'MINS' },
    { value: secs, label: 'SECS' },
  ];

  return (
    <div className="flex gap-2">
      {blocks.map((block) => (
        <div key={block.label} className="text-center">
          <div
            style={{
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F7F7FA',
              borderRadius: '10px',
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            {block.value.toString().padStart(2, '0')}
          </div>
          <p style={{ fontSize: '10px', color: '#9a9eb0', marginTop: '4px' }}>{block.label}</p>
        </div>
      ))}
    </div>
  );
}

export default async function CompetitionDetailPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const [competition, session] = await Promise.all([getCompetition(slug), auth()]);

  if (!competition) notFound();

  const isActive = competition.status === 'ACTIVE';
  const isCompleted = competition.status === 'COMPLETED';
  const isUpcoming = competition.status === 'UPCOMING';
  const isSoldOut = competition.status === 'SOLD_OUT';
  const isCancelled = competition.status === 'CANCELLED';

  const [userTicketCount, availableTicketCount] = isActive
    ? await Promise.all([
        getUserTicketCount(competition.id, session?.user?.id),
        getAvailableTicketCount(competition.id),
      ])
    : [0, 0];

  const category = competition.category as CompetitionCategory;
  const categoryColor = CATEGORY_COLORS[category];
  const soldPercentage = Math.round((competition.soldTickets / competition.totalTickets) * 100);
  const ticketsRemaining = competition.totalTickets - competition.soldTickets;

  // Format prize value without decimals
  const formattedPrizeValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(competition.prizeValue);

  return (
    <main className="min-h-screen" style={{ background: '#ffffff', paddingTop: '100px' }}>
      <div className="container mx-auto px-4" style={{ maxWidth: '1100px' }}>
        {/* Main Content - 2 Column Layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column - Image (45%) */}
          <div className="lg:w-[45%]">
            {/* Image Container */}
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: '3/4',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%)`,
              }}
            >
              {competition.mainImageUrl ? (
                <Image
                  src={competition.mainImageUrl}
                  alt={competition.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: '80px' }}>{CATEGORY_EMOJIS[category]}</span>
                </div>
              )}
            </div>

            {/* Back Link */}
            <Link
              href="/competitions"
              className="mt-4 inline-flex items-center gap-1 transition-colors hover:text-[#1a1a2e]"
              style={{ fontSize: '14px', color: '#6b7088' }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Competitions
            </Link>
          </div>

          {/* Right Column - Details (55%) */}
          <div className="lg:w-[55%] space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Badge */}
              <span
                style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  background: categoryColor,
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {CATEGORY_LABELS[category]}
              </span>

              {/* Status Badge */}
              {isActive && (
                <span
                  style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    color: '#16A34A',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Live
                </span>
              )}
              {isUpcoming && (
                <span
                  style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3B82F6',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Coming Soon
                </span>
              )}
              {isSoldOut && (
                <span
                  style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: '#F97316',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Sold Out
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-[family-name:var(--font-outfit)]"
              style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 }}
            >
              {competition.title}
            </h1>

            {/* Prize Value */}
            <p
              className="font-[family-name:var(--font-outfit)]"
              style={{ fontSize: '36px', fontWeight: 800, color: '#1a1a2e' }}
            >
              {formattedPrizeValue}
            </p>

            {/* Progress Bar */}
            {!isCompleted && !isCancelled && (
              <div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontSize: '13px', color: '#6b7088' }}>
                    {ticketsRemaining} tickets remaining
                  </span>
                  <span style={{ fontSize: '13px', color: '#6b7088' }}>{soldPercentage}% sold</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    background: '#f0f0f4',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${soldPercentage}%`,
                      background: categoryColor,
                      borderRadius: '4px',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div
              className="grid grid-cols-3 gap-4"
              style={{
                background: '#F7F7FA',
                borderRadius: '16px',
                padding: '16px 20px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#9a9eb0',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Ticket Price
                </p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>
                  {formatPrice(competition.ticketPrice)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#9a9eb0',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Tickets Left
                </p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>
                  {ticketsRemaining}/{competition.totalTickets}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#9a9eb0',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Draw Date
                </p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>
                  {new Date(competition.drawDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Countdown */}
            {(isActive || isUpcoming) && (
              <CountdownBlock targetDate={new Date(competition.drawDate)} />
            )}

            {/* Active Competition - Ticket Selector */}
            {isActive && (
              <SimpleTicketSelector
                competitionId={competition.id}
                competitionSlug={slug}
                ticketPrice={competition.ticketPrice}
                maxTicketsPerUser={competition.maxTicketsPerUser}
                availableTicketCount={availableTicketCount}
                userTicketCount={userTicketCount}
                categoryColor={categoryColor}
              />
            )}

            {/* Upcoming */}
            {isUpcoming && (
              <div className="space-y-3">
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: '#F7F7FA',
                    color: '#6b7088',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                  }}
                >
                  Coming Soon
                </button>
              </div>
            )}

            {/* Sold Out */}
            {isSoldOut && (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2"
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: '#F7F7FA',
                  color: '#6b7088',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'not-allowed',
                }}
              >
                Sold Out - Draw Pending
              </button>
            )}

            {/* Completed */}
            {isCompleted && (
              <div
                style={{
                  background: '#F7F7FA',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy style={{ width: '24px', height: '24px', color: categoryColor }} />
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
                    Competition Completed
                  </p>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7088' }}>
                  Winning ticket:{' '}
                  <span style={{ fontWeight: 700, color: categoryColor }}>
                    #{competition.winningTicketNumber}
                  </span>
                </p>
                {competition.winnerDisplayName && (
                  <p style={{ fontSize: '14px', color: '#9a9eb0', marginTop: '4px' }}>
                    Winner: {competition.winnerDisplayName}
                  </p>
                )}
              </div>
            )}

            {/* Cancelled */}
            {isCancelled && (
              <div
                style={{
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626' }}>
                  This competition was cancelled
                </p>
                <p style={{ fontSize: '14px', color: '#6b7088', marginTop: '4px' }}>
                  All participants have been fully refunded.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Below the Fold - Additional Info */}
        <div className="grid gap-6 lg:grid-cols-2 mt-12 pb-16">
          {/* About This Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '20px',
              padding: '32px',
            }}
          >
            <h2
              className="font-[family-name:var(--font-outfit)] mb-4"
              style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}
            >
              About This Card
            </h2>

            {competition.descriptionLong ? (
              <SafeHtml
                html={competition.descriptionLong}
                className="prose prose-sm max-w-none"
                style={{ fontSize: '15px', color: '#555', lineHeight: 1.7 }}
              />
            ) : (
              <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.7 }}>
                {competition.descriptionShort || 'No description available.'}
              </p>
            )}

            {/* Card Details */}
            <div className="mt-6 space-y-3">
              {competition.certificationNumber && (
                <div className="flex justify-between">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b7088' }}>
                    Certification
                  </span>
                  <span style={{ fontSize: '14px', color: '#1a1a2e' }}>
                    {competition.certificationNumber}
                  </span>
                </div>
              )}
              {competition.grade && (
                <div className="flex justify-between">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b7088' }}>Grade</span>
                  <span style={{ fontSize: '14px', color: '#1a1a2e' }}>{competition.grade}</span>
                </div>
              )}
              {competition.condition && (
                <div className="flex justify-between">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b7088' }}>
                    Condition
                  </span>
                  <span style={{ fontSize: '14px', color: '#1a1a2e' }}>{competition.condition}</span>
                </div>
              )}
            </div>
          </div>

          {/* Draw Details */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '20px',
              padding: '32px',
            }}
          >
            <h2
              className="font-[family-name:var(--font-outfit)] mb-4"
              style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}
            >
              Draw Details
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar style={{ width: '18px', height: '18px', color: '#6b7088', marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7088' }}>Draw Date</p>
                  <p style={{ fontSize: '14px', color: '#1a1a2e' }}>
                    {new Date(competition.drawDate).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {competition.certificationNumber && (
                <div className="flex items-start gap-3">
                  <Award style={{ width: '18px', height: '18px', color: '#6b7088', marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7088' }}>Certification</p>
                    <p style={{ fontSize: '14px', color: '#1a1a2e' }}>
                      {competition.certificationNumber}
                      {competition.grade && (
                        <span
                          style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: categoryColor,
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {competition.grade}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Play style={{ width: '18px', height: '18px', color: '#6b7088', marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7088' }}>Status</p>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: isActive
                        ? 'rgba(22, 163, 74, 0.1)'
                        : isCompleted
                          ? 'rgba(107, 112, 136, 0.1)'
                          : 'rgba(59, 130, 246, 0.1)',
                      color: isActive ? '#16A34A' : isCompleted ? '#6b7088' : '#3B82F6',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {isActive ? 'Live' : isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* RNG Disclaimer */}
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: '#F7F7FA',
                borderRadius: '12px',
              }}
            >
              <p style={{ fontSize: '13px', color: '#6b7088', lineHeight: 1.6 }}>
                The winning ticket will be selected using a certified Random Number Generator (RNG).
                The draw will be livestreamed on TikTok for full transparency.
              </p>
            </div>
          </div>
        </div>

        {/* Free Entry Section - Subtle Accordion */}
        <div style={{ marginBottom: '48px' }}>
          <FreeEntryAccordion />
        </div>
      </div>
    </main>
  );
}
