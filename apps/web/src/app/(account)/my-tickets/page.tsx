import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Calendar, Trophy } from 'lucide-react';

export const metadata = {
  title: 'My Tickets | WinUCard',
  description: 'View all your competition entries and ticket numbers',
};

type CompetitionStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'ACTIVE'
  | 'SOLD_OUT'
  | 'DRAWING'
  | 'COMPLETED'
  | 'CANCELLED';

const STATUS_CONFIG: Record<CompetitionStatus, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Draft', bg: 'var(--bg-2)', color: 'var(--ink-faint)' },
  UPCOMING: { label: 'Upcoming', bg: 'var(--pop)', color: '#fff' },
  ACTIVE: { label: 'Live', bg: 'var(--accent)', color: 'var(--ink)' },
  SOLD_OUT: { label: 'Sold out', bg: 'var(--warn)', color: 'var(--ink)' },
  DRAWING: { label: 'Drawing', bg: 'var(--pop)', color: '#fff' },
  COMPLETED: { label: 'Completed', bg: 'var(--bg-2)', color: 'var(--ink-faint)' },
  CANCELLED: { label: 'Cancelled', bg: 'var(--hot)', color: '#fff' },
};

function StatusPill({ status }: { status: CompetitionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: config.bg,
        color: config.color,
        border: '1.5px solid var(--ink)',
        borderRadius: '6px',
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      {config.label}
    </span>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function MyTicketsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/my-tickets');
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      userId: session.user.id,
      status: 'SOLD',
    },
    include: {
      competition: {
        select: {
          id: true,
          slug: true,
          title: true,
          mainImageUrl: true,
          status: true,
          drawDate: true,
          prizeValue: true,
          winningTicketNumber: true,
        },
      },
    },
    orderBy: {
      competition: {
        drawDate: 'desc',
      },
    },
  });

  const userWins = await prisma.win.findMany({
    where: { userId: session.user.id },
    select: { competitionId: true, ticketNumber: true },
  });
  const winsMap = new Map(userWins.map((w) => [w.competitionId, w.ticketNumber]));

  const competitionTickets = tickets.reduce<
    Record<
      string,
      {
        competition: (typeof tickets)[0]['competition'];
        ticketNumbers: number[];
      }
    >
  >((acc, ticket) => {
    const compId = ticket.competitionId;
    acc[compId] ??= {
      competition: ticket.competition,
      ticketNumbers: [],
    };
    acc[compId].ticketNumbers.push(ticket.ticketNumber);
    return acc;
  }, {});

  const entries = Object.values(competitionTickets);

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          marginBottom: '32px',
          paddingBottom: '22px',
          borderBottom: '1.5px solid var(--ink)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            fontWeight: 700,
            marginBottom: '10px',
          }}
        >
          Your account · Tickets
        </div>
        <h1
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 0.95,
            marginBottom: '10px',
          }}
        >
          My <span className="chip">tickets</span>.
        </h1>
        <p style={{ color: 'var(--ink-dim)', fontSize: '15px' }}>
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} across {entries.length} competition
          {entries.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--ink)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            padding: '64px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎟</div>
          <h3
            style={{
              fontFamily: 'var(--display)',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            No tickets yet
          </h3>
          <p
            style={{
              color: 'var(--ink-dim)',
              fontSize: '14px',
              maxWidth: '360px',
              margin: '0 auto 24px',
            }}
          >
            You haven&apos;t entered any competitions yet. Browse our live drops and get your tickets.
          </p>
          <Link href="/competitions" className="btn btn-hot btn-xl">
            Browse competitions →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {entries.map(({ competition, ticketNumbers }) => {
            const winningTicket = winsMap.get(competition.id);
            const isWinner = winningTicket !== undefined;

            return (
              <div
                key={competition.id}
                style={{
                  overflow: 'hidden',
                  background: 'var(--surface)',
                  border: `1.5px solid ${isWinner ? 'var(--accent)' : 'var(--ink)'}`,
                  borderRadius: 'var(--radius)',
                  boxShadow: isWinner ? `4px 4px 0 var(--accent)` : 'var(--shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                className="sm:flex-row"
              >
                <div className="flex flex-col sm:flex-row" style={{ flex: 1 }}>
                  {/* Image */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 10',
                      background: 'var(--bg-2)',
                      flexShrink: 0,
                    }}
                    className="sm:w-40 sm:aspect-square"
                  >
                    <Image
                      src={competition.mainImageUrl}
                      alt={competition.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 160px"
                    />
                    {isWinner && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(0, 0, 0, 0.55)',
                        }}
                      >
                        <Trophy className="h-10 w-10" style={{ color: 'var(--warn)' }} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ padding: '18px 20px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      {isWinner && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            background: 'var(--accent)',
                            color: 'var(--ink)',
                            border: '1.5px solid var(--ink)',
                            borderRadius: '6px',
                            fontFamily: 'var(--mono)',
                            fontSize: '10px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                          }}
                        >
                          <Trophy className="h-3 w-3" /> Winner
                        </span>
                      )}
                      <StatusPill status={competition.status as CompetitionStatus} />
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '11px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: 'var(--accent-2)',
                        }}
                      >
                        {Number(competition.prizeValue).toLocaleString('en-GB', {
                          style: 'currency',
                          currency: 'GBP',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>

                    <Link
                      href={`/competitions/${competition.slug}`}
                      style={{
                        fontFamily: 'var(--display)',
                        fontSize: '18px',
                        fontWeight: 700,
                        letterSpacing: '-0.015em',
                        lineHeight: 1.2,
                        display: 'block',
                      }}
                      className="hover:underline"
                    >
                      {competition.title}
                    </Link>

                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: 'var(--ink-dim)',
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Draw · {formatDate(competition.drawDate)}</span>
                    </div>

                    {competition.status === 'COMPLETED' &&
                      competition.winningTicketNumber &&
                      !isWinner && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            background: 'var(--bg-2)',
                            border: '1px dashed var(--line-2)',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                          }}
                        >
                          <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Better luck next time</p>
                          <p style={{ color: 'var(--ink-dim)', fontFamily: 'var(--mono)' }}>
                            Winning ticket: #{competition.winningTicketNumber}
                          </p>
                        </div>
                      )}

                    {/* Ticket numbers */}
                    <div style={{ marginTop: '14px' }}>
                      <div
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '10px',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-faint)',
                          fontWeight: 700,
                          marginBottom: '8px',
                        }}
                      >
                        Your tickets · {ticketNumbers.length}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {ticketNumbers
                          .sort((a, b) => a - b)
                          .map((num) => {
                            const isWin = num === winningTicket;
                            return (
                              <span
                                key={num}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  minWidth: '44px',
                                  justifyContent: 'center',
                                  fontFamily: 'var(--mono)',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  background: isWin ? 'var(--accent)' : 'var(--bg-2)',
                                  color: 'var(--ink)',
                                  border: '1.5px solid var(--ink)',
                                  borderRadius: '6px',
                                  boxShadow: isWin ? '2px 2px 0 var(--ink)' : 'none',
                                }}
                              >
                                #{num}
                                {isWin && <Trophy className="h-3 w-3" />}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
