'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type Phase = 'loading' | 'presentation' | 'slot-machine' | 'reveal';

interface Competition {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  mainImageUrl: string;
  prizeValue: number;
  category: string;
  totalTickets: number;
  ticketsSold: number;
  ticketPrice: number;
  participantsCount: number;
}

interface DrawResult {
  winning_ticket: {
    id: string;
    number: number;
    isBonus: boolean;
    isFreeEntry: boolean;
  };
  winner: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    email: string;
    name: string;
  };
  competition: {
    id: string;
    slug: string;
    title: string;
    prizeValue: number;
    mainImageUrl: string;
  };
}

const categoryLabels: Record<string, string> = {
  POKEMON: 'POKÉMON',
  ONE_PIECE: 'ONE PIECE',
  SPORTS_FOOTBALL: 'FOOTBALL',
  SPORTS_BASKETBALL: 'BASKETBALL',
  SPORTS_OTHER: 'SPORTS',
  MEMORABILIA: 'MEMORABILIA',
  YUGIOH: 'YU-GI-OH!',
  MTG: 'MAGIC',
  OTHER: 'COLLECTIBLE',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Particle background component
function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            backgroundColor: '#FFD700',
            opacity: 0.1 + Math.random() * 0.3,
            animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; }
          25% { transform: translateY(-30px) translateX(15px); opacity: 0.4; }
          50% { transform: translateY(-15px) translateX(-10px); opacity: 0.2; }
          75% { transform: translateY(-40px) translateX(20px); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

// Confetti component
function Confetti() {
  const colors = ['#FFD700', '#FF6B35', '#4ECDC4', '#45B7D1', '#FF69B4', '#98D8C8'];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
      {[...Array(120)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${10 + Math.random() * 20}px`,
            width: `${8 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 8}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti ${3 + Math.random() * 4}s ease-out forwards`,
            animationDelay: `${Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Pulsing rings component
function PulsingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[400, 500, 600].map((size, i) => (
        <div
          key={size}
          className="absolute rounded-full border-2"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderColor: 'rgba(255, 215, 0, 0.3)',
            animation: `pulse-ring 2s ease-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// Sound bars component (equalizer effect)
function SoundBars() {
  return (
    <div className="flex items-end justify-center gap-1 h-12">
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className="w-2 rounded-full"
          style={{
            backgroundColor: '#FFD700',
            animation: `soundbar 0.5s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`,
            height: '100%',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes soundbar {
          0% { transform: scaleY(0.3); opacity: 0.5; }
          100% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Slot reel component
function SlotReel({
  targetDigit,
  isSpinning,
  isStopped
}: {
  targetDigit: number;
  isSpinning: boolean;
  isStopped: boolean;
}) {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const [displayDigit, setDisplayDigit] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSpinning && !isStopped) {
      intervalRef.current = setInterval(() => {
        setDisplayDigit(prev => (prev + 1) % 10);
      }, 80);
    } else if (isStopped) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setDisplayDigit(targetDigit);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSpinning, isStopped, targetDigit]);

  return (
    <div
      className="relative w-20 h-28 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        border: isStopped ? '3px solid #FFD700' : '3px solid rgba(255, 215, 0, 0.3)',
        boxShadow: isStopped ? '0 0 30px rgba(255, 215, 0, 0.5)' : 'none',
      }}
    >
      <span
        className="text-5xl font-bold transition-all duration-100"
        style={{
          fontFamily: 'var(--font-orbitron), monospace',
          color: isStopped ? '#FFD700' : '#ffffff',
          textShadow: isStopped ? '0 0 20px rgba(255, 215, 0, 0.8)' : 'none',
        }}
      >
        {displayDigit}
      </span>
    </div>
  );
}

// Main draw page component
export default function DrawExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.id as string;

  const [phase, setPhase] = useState<Phase>('loading');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Slot machine state
  const [isSpinning, setIsSpinning] = useState(false);
  const [stoppedReels, setStoppedReels] = useState<boolean[]>([]);
  const [ticketDigits, setTicketDigits] = useState<number[]>([]);

  // Fetch competition data
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const res = await fetch('/api/admin/draw/pending');
        if (!res.ok) throw new Error('Failed to fetch competitions');

        const data = await res.json();
        const comp = data.competitions?.find((c: Competition) => c.id === competitionId);

        if (!comp) {
          setError('Competition not found or not ready for draw');
          return;
        }

        setCompetition(comp);
        setPhase('presentation');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchCompetition();
  }, [competitionId]);

  // Execute the draw
  const executeDraw = useCallback(async () => {
    if (!competition) return;

    try {
      const res = await fetch('/api/admin/draw/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_id: competitionId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to execute draw');
      }

      const result: DrawResult = await res.json();
      setDrawResult(result);

      // Prepare slot machine
      const ticketNum = result.winning_ticket.number;
      const digits = String(ticketNum).padStart(4, '0').split('').map(Number);
      setTicketDigits(digits);
      setStoppedReels(new Array(digits.length).fill(false));

      // Start slot machine phase
      setPhase('slot-machine');
      setIsSpinning(true);

      // Stop reels one by one
      digits.forEach((_, index) => {
        setTimeout(() => {
          setStoppedReels(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        }, 2000 + index * 1000);
      });

      // After all reels stop, wait 1.5s then show reveal
      setTimeout(() => {
        setIsSpinning(false);
        setTimeout(() => {
          setPhase('reveal');
        }, 1500);
      }, 2000 + digits.length * 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute draw');
    }
  }, [competition, competitionId]);

  // Confirm draw and send email
  const confirmDraw = async () => {
    if (!drawResult) return;

    setIsConfirming(true);
    try {
      const res = await fetch('/api/admin/draw/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_id: competitionId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to confirm draw');
      }

      setIsConfirmed(true);
      toast({
        title: '✅ Winner email sent!',
        description: `Email sent to ${drawResult.winner.email}`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050508' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#FFD700' }} />
          <p className="text-gray-400 font-[family-name:var(--font-outfit)]">Loading competition...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#050508' }}>
        <p className="text-red-400 text-xl">{error}</p>
        <button
          onClick={() => router.push('/draw')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Draws
        </button>
      </div>
    );
  }

  // Phase 1: Presentation
  if (phase === 'presentation' && competition) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#050508' }}>
        <ParticleBackground />

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
          {/* Category Badge */}
          <div
            className="px-6 py-2 rounded-full mb-6"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            <span
              className="text-sm font-bold tracking-widest"
              style={{
                color: '#FFD700',
                fontFamily: 'var(--font-orbitron), sans-serif',
              }}
            >
              {categoryLabels[competition.category] || competition.category}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl font-bold text-center mb-8 max-w-4xl"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              background: 'linear-gradient(180deg, #ffffff 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
            }}
          >
            {competition.title}
          </h1>

          {/* Card Image */}
          <div
            className="relative mb-8"
            style={{ animation: 'float-card 4s ease-in-out infinite' }}
          >
            <div
              className="w-64 h-80 md:w-80 md:h-96 rounded-xl overflow-hidden"
              style={{
                border: '3px solid rgba(255, 215, 0, 0.5)',
                boxShadow: '0 0 60px rgba(255, 215, 0, 0.3)',
              }}
            >
              <img
                src={competition.mainImageUrl}
                alt={competition.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Prize Value */}
          <div
            className="text-6xl md:text-7xl font-bold mb-8"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              color: '#FFD700',
              textShadow: '0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 215, 0, 0.3)',
            }}
          >
            {formatCurrency(competition.prizeValue)}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}>
                {competition.ticketsSold}
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Tickets Sold</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}>
                {formatCurrency(competition.ticketPrice)}
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Per Ticket</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}>
                {competition.participantsCount}
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Participants</p>
            </div>
          </div>

          {/* Start Draw Button */}
          <button
            onClick={executeDraw}
            className="px-12 py-5 rounded-xl font-bold text-xl tracking-wider transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              backgroundColor: '#FFD700',
              color: '#050508',
              boxShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
              animation: 'pulse-button 2s ease-in-out infinite',
            }}
          >
            ⚡ START DRAW ⚡
          </button>
        </div>

        <style jsx>{`
          @keyframes float-card {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes pulse-button {
            0%, 100% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.5); }
            50% { box-shadow: 0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.4); }
          }
        `}</style>
      </div>
    );
  }

  // Phase 2: Slot Machine
  if (phase === 'slot-machine') {
    const displayedNumber = ticketDigits.map((digit, i) =>
      stoppedReels[i] ? digit : '-'
    ).join('');

    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center" style={{ backgroundColor: '#050508' }}>
        <ParticleBackground />

        <div className="relative z-10 flex flex-col items-center">
          {/* Title */}
          <h2
            className="text-2xl md:text-3xl mb-12"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              color: '#FFD700',
              opacity: 0.7,
              letterSpacing: '6px',
            }}
          >
            Finding your winner...
          </h2>

          {/* Sound Bars */}
          <div className="mb-12">
            <SoundBars />
          </div>

          {/* Slot Reels */}
          <div className="flex items-center gap-4 mb-12">
            {ticketDigits.map((digit, index) => (
              <SlotReel
                key={index}
                targetDigit={digit}
                isSpinning={isSpinning}
                isStopped={stoppedReels[index] ?? false}
              />
            ))}
          </div>

          {/* Progressive Ticket Number */}
          <div
            className="text-4xl font-bold"
            style={{
              fontFamily: 'var(--font-orbitron), monospace',
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
            }}
          >
            TICKET #{displayedNumber}
          </div>
        </div>
      </div>
    );
  }

  // Phase 3: Winner Reveal
  if (phase === 'reveal' && drawResult) {
    const winnerInitial = drawResult.winner.lastName ? drawResult.winner.lastName[0] + '.' : '';
    const displayName = drawResult.winner.displayName
      ? `@${drawResult.winner.displayName.toLowerCase()}`
      : `@${drawResult.winner.firstName.toLowerCase()}${drawResult.winner.lastName?.toLowerCase() || ''}`;

    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center" style={{ backgroundColor: '#050508' }}>
        <Confetti />
        <PulsingRings />
        <ParticleBackground />

        <div className="relative z-10 flex flex-col items-center text-center px-4">
          {/* Winner Title */}
          <h1
            className="text-3xl md:text-4xl font-bold mb-8"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              color: '#FFD700',
              letterSpacing: '8px',
              animation: 'fadeInUp 0.8s ease-out 0.5s both',
            }}
          >
            🏆 THE WINNER IS 🏆
          </h1>

          {/* Winning Ticket Number */}
          <div
            className="text-7xl md:text-8xl font-bold mb-8"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'fadeInUp 0.8s ease-out 1s both, shimmer 3s linear infinite',
              textShadow: '0 0 60px rgba(255, 215, 0, 0.5)',
            }}
          >
            #{String(drawResult.winning_ticket.number).padStart(4, '0')}
          </div>

          {/* Winner Name */}
          <p
            className="text-4xl md:text-5xl font-bold text-white mb-2"
            style={{
              animation: 'fadeInUp 0.8s ease-out 1.8s both',
            }}
          >
            {drawResult.winner.firstName} {winnerInitial}
          </p>

          {/* Username */}
          <p
            className="text-xl text-gray-500 italic mb-8"
            style={{
              animation: 'fadeInUp 0.8s ease-out 2.2s both',
            }}
          >
            {displayName}
          </p>

          {/* Card Name */}
          <p
            className="text-2xl font-bold mb-4"
            style={{
              color: '#FFD700',
              animation: 'fadeInUp 0.8s ease-out 2.8s both',
            }}
          >
            {drawResult.competition.title}
          </p>

          {/* Prize Value */}
          <p
            className="text-3xl md:text-4xl font-bold mb-10"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              color: '#FFD700',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
              animation: 'fadeInUp 0.8s ease-out 3.2s both',
            }}
          >
            {formatCurrency(drawResult.competition.prizeValue)}
          </p>

          {/* Card Image */}
          <div
            className="mb-12"
            style={{
              animation: 'fadeInUp 0.8s ease-out 3.8s both, cardFlip 1s ease-out 3.8s both',
            }}
          >
            <div
              className="w-56 h-72 md:w-72 md:h-96 rounded-xl overflow-hidden"
              style={{
                border: '4px solid #FFD700',
                boxShadow: '0 0 60px rgba(255, 215, 0, 0.5), 0 20px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              <img
                src={drawResult.competition.mainImageUrl}
                alt={drawResult.competition.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Confirm Button (discrete) */}
          <div className="flex flex-col items-center gap-4 mt-4">
            {!isConfirmed ? (
              <button
                onClick={confirmDraw}
                disabled={isConfirming}
                className="px-6 py-3 rounded-lg text-sm transition-all duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {isConfirming ? 'Sending...' : 'Confirm & Send Email'}
              </button>
            ) : (
              <button
                onClick={() => router.push('/draw')}
                className="px-6 py-3 rounded-lg text-sm transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  color: '#FFD700',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                }}
              >
                ← Back to Draws
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes cardFlip {
            0% {
              transform: perspective(1000px) rotateY(90deg) scale(0.8);
              opacity: 0;
            }
            100% {
              transform: perspective(1000px) rotateY(0deg) scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
