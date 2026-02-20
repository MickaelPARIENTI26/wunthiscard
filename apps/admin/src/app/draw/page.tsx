'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, Loader2, Trophy, Sparkles } from 'lucide-react';

interface PendingCompetition {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  mainImageUrl: string;
  prizeValue: number;
  category: string;
  totalTickets: number;
  ticketsSold: number;
  participantsCount: number;
  drawDate: string;
  status: string;
  isOverdue: boolean;
}

interface DrawHistoryItem {
  id: string;
  slug: string;
  competition: {
    title: string;
    subtitle: string | null;
    mainImageUrl: string;
    prizeValue: number;
    category: string;
  };
  draw: {
    date: string;
    winningTicketNumber: number;
    winnerNotified: boolean;
  };
  winner: {
    id: string;
    name: string;
    email: string;
    ticketNumber: number;
  } | null;
}

const categoryEmojis: Record<string, string> = {
  POKEMON: '🔥',
  ONE_PIECE: '🏴‍☠️',
  SPORTS_FOOTBALL: '⚽',
  SPORTS_BASKETBALL: '🏀',
  SPORTS_OTHER: '🏆',
  MEMORABILIA: '✨',
  YUGIOH: '🃏',
  MTG: '🧙',
  OTHER: '🎯',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full opacity-30 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: '#FFD700',
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.1;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-10px) translateX(-5px);
            opacity: 0.2;
          }
          75% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.3;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/50">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
      <span className="text-red-400 font-semibold text-sm tracking-wide">LIVE DRAW</span>
    </div>
  );
}

export default function DrawDashboardPage() {
  const router = useRouter();
  const [pendingDraws, setPendingDraws] = useState<PendingCompetition[]>([]);
  const [drawHistory, setDrawHistory] = useState<DrawHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetch('/api/admin/draw/pending'),
        fetch('/api/admin/draw/history?limit=10'),
      ]);

      if (!pendingRes.ok || !historyRes.ok) {
        throw new Error('Failed to fetch draw data');
      }

      const pendingData = await pendingRes.json();
      const historyData = await historyRes.json();

      setPendingDraws(pendingData.competitions || []);
      setDrawHistory(historyData.draws || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLaunchDraw = (competitionId: string) => {
    router.push(`/draw/${competitionId}`);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/draw/login' });
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#050508' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#FFD700' }} />
          <p className="text-gray-400 font-[family-name:var(--font-outfit)]">Loading draw dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: '#050508' }}
    >
      <ParticleBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: '#FFD700', color: '#050508' }}
            >
              W
            </div>
            <h1
              className="text-2xl font-bold tracking-wider"
              style={{
                color: '#FFD700',
                fontFamily: 'var(--font-orbitron), sans-serif'
              }}
            >
              WINUCARD
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <LiveBadge />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-[family-name:var(--font-outfit)]">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
            {error}
          </div>
        )}

        {/* Section 1: Today's Draws */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6" style={{ color: '#FFD700' }} />
            <h2
              className="text-xl font-bold tracking-wide"
              style={{
                color: '#FFD700',
                fontFamily: 'var(--font-orbitron), sans-serif'
              }}
            >
              TODAY'S DRAWS
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">
              {pendingDraws.length}
            </span>
          </div>

          {pendingDraws.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-white/10 bg-white/5">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-2xl text-gray-400 font-[family-name:var(--font-outfit)]">
                No draws pending
              </p>
              <p className="text-gray-500 mt-2">All caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDraws.map((competition) => (
                <div
                  key={competition.id}
                  className="group relative rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all duration-300 hover:border-yellow-500/50 hover:bg-white/10 hover:translate-x-2"
                  style={{
                    boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Glow effect on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 215, 0, 0.06), transparent 40%)',
                    }}
                  />

                  <div className="relative flex items-center gap-6 p-6">
                    {/* Category Emoji */}
                    <div className="text-4xl">
                      {categoryEmojis[competition.category] || '🎯'}
                    </div>

                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                      <img
                        src={competition.mainImageUrl}
                        alt={competition.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate font-[family-name:var(--font-outfit)]">
                        {competition.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span>{competition.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{competition.ticketsSold} / {competition.totalTickets} tickets</span>
                        <span>•</span>
                        <span>{competition.participantsCount} participants</span>
                      </div>
                      {competition.isOverdue && (
                        <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <p
                        className="text-2xl font-bold"
                        style={{
                          color: '#FFD700',
                          fontFamily: 'var(--font-orbitron), sans-serif'
                        }}
                      >
                        {formatCurrency(competition.prizeValue)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Prize Value</p>
                    </div>

                    {/* Launch Button */}
                    <button
                      onClick={() => handleLaunchDraw(competition.id)}
                      className="flex-shrink-0 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: '#FFD700',
                        color: '#050508',
                        fontFamily: 'var(--font-orbitron), sans-serif',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                      }}
                    >
                      LAUNCH DRAW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Recent Draws */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2
              className="text-lg font-bold tracking-wide text-gray-400"
              style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
            >
              RECENT DRAWS
            </h2>
          </div>

          {drawHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">No draws yet</p>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {drawHistory.map((draw) => (
                    <tr key={draw.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-400 font-[family-name:var(--font-outfit)]">
                        {formatDate(draw.draw.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {categoryEmojis[draw.competition.category] || '🎯'}
                          </span>
                          <span className="text-sm text-white font-[family-name:var(--font-outfit)]">
                            {draw.competition.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-[family-name:var(--font-outfit)]">
                        {draw.winner?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="font-bold"
                          style={{
                            color: '#FFD700',
                            fontFamily: 'var(--font-orbitron), sans-serif'
                          }}
                        >
                          #{draw.draw.winningTicketNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {draw.draw.winnerNotified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            ✓ Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-600 font-[family-name:var(--font-outfit)]">
            Draw Master Console v1.0
          </p>
          <p className="text-xs text-gray-600">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </footer>
    </div>
  );
}
