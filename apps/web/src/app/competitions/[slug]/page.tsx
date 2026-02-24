import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Trophy, Calendar, Award, Play } from 'lucide-react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { SimpleTicketSelector } from '@/components/competition/simple-ticket-selector';
import { FreeEntryAccordion } from '@/components/competition/free-entry-accordion';
import { PremiumCardImage } from '@/components/competition/premium-card-image';
import { LiveCountdown } from '@/components/competition/live-countdown';
import { UrgencyProgressBar } from '@/components/competition/urgency-progress-bar';
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
    <main className="min-h-screen relative overflow-hidden" style={{ background: '#ffffff', paddingTop: '100px' }}>
      {/* Background ambiance blobs */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          right: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `${categoryColor}08`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.04)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container mx-auto px-4 relative z-10" style={{ maxWidth: '1100px' }}>
        {/* Main Content - 2 Column Layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column - Image (45%) */}
          <div className="lg:w-[45%]">
            {/* Premium Card Image with 3D tilt */}
            <PremiumCardImage
              src={competition.mainImageUrl}
              alt={competition.title}
              categoryColor={categoryColor}
              categoryEmoji={CATEGORY_EMOJIS[category]}
            />

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
              {/* Category Badge - Floating effect */}
              <span
                style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  background: categoryColor,
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  boxShadow: `0 4px 12px ${categoryColor}40`,
                }}
              >
                {CATEGORY_LABELS[category]}
              </span>

              {/* Status Badge - Live with pulsing dot */}
              {isActive && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    color: '#16A34A',
                    fontSize: '11px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#16A34A',
                      animation: 'livePulse 1.5s ease-in-out infinite',
                    }}
                  />
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

            {/* Prize Value - WOW effect */}
            <div>
              <p
                className="font-[family-name:var(--font-outfit)]"
                style={{
                  fontSize: '42px',
                  fontWeight: 900,
                  color: '#1a1a2e',
                  lineHeight: 1.1,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                }}
              >
                {formattedPrizeValue}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: categoryColor,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginTop: '4px',
                  fontWeight: 600,
                }}
              >
                Card Value
              </p>
            </div>

            {/* Progress Bar with Urgency */}
            {!isCompleted && !isCancelled && (
              <UrgencyProgressBar
                soldPercentage={soldPercentage}
                ticketsRemaining={ticketsRemaining}
                categoryColor={categoryColor}
              />
            )}

            {/* Info Grid - Premium style */}
            <div
              className="grid grid-cols-3"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px' }}>
                <p
                  style={{
                    fontSize: '10px',
                    color: categoryColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}
                >
                  Ticket Price
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a2e' }}>
                  {formatPrice(competition.ticketPrice)}
                </p>
              </div>
              <div
                style={{
                  padding: '16px 20px',
                  borderLeft: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRight: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    color: categoryColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}
                >
                  Tickets Left
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a2e' }}>
                  {ticketsRemaining.toLocaleString()}/{competition.totalTickets.toLocaleString()}
                </p>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <p
                  style={{
                    fontSize: '10px',
                    color: categoryColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}
                >
                  Draw Date
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a2e' }}>
                  {new Date(competition.drawDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Countdown - Live with animations */}
            {(isActive || isUpcoming) && (
              <LiveCountdown targetDate={new Date(competition.drawDate)} categoryColor={categoryColor} />
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
              borderLeft: `3px solid ${categoryColor}`,
              borderRadius: '20px',
              padding: '32px',
            }}
          >
            <h2
              className="font-[family-name:var(--font-outfit)] mb-4 flex items-center gap-2"
              style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}
            >
              <span style={{ fontSize: '20px' }}>{CATEGORY_EMOJIS[category]}</span>
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
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b7088' }}>Grade</span>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background: '#F0B90B',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {competition.grade}
                  </span>
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
              borderLeft: `3px solid ${categoryColor}`,
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
                  {isActive ? (
                    <span
                      className="live-badge-pulse"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: '#16A34A',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          animation: 'livePulse 1.5s ease-in-out infinite',
                        }}
                      />
                      Live
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: isCompleted
                          ? 'rgba(107, 112, 136, 0.1)'
                          : 'rgba(59, 130, 246, 0.1)',
                        color: isCompleted ? '#6b7088' : '#3B82F6',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : 'Pending'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CSS for Live badge pulse */}
            <style>{`
              @keyframes livePulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
              }
            `}</style>

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
