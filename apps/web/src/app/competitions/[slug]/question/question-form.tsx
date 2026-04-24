'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface QuestionFormProps {
  competitionId: string;
  competitionSlug: string;
  competitionTitle: string;
  questionText: string;
  questionChoices: string[];
  ticketPrice: number;
}

export function QuestionForm({
  competitionId,
  competitionSlug,
  questionText,
  questionChoices,
}: QuestionFormProps) {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    message: string;
    blocked?: boolean;
    attemptsRemaining?: number;
    blockUntil?: number;
  } | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [_pendingQuantity, setPendingQuantity] = useState<number>(0);
  const [reservation, setReservation] = useState<{ expiresAt: number } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Format countdown timer
  const formatCountdown = useCallback((ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Load tickets and reservation from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`tickets_${competitionId}`);
    const reservationStored = sessionStorage.getItem(`reservation_${competitionId}`);
    const pendingQuantityStored = sessionStorage.getItem(`pending_quantity_${competitionId}`);

    // For authenticated users: check for reserved tickets
    if (stored) {
      setSelectedTickets(JSON.parse(stored));
    }

    // Check for authenticated user reservation (with expiresAt)
    if (reservationStored) {
      const res = JSON.parse(reservationStored);
      setReservation(res);

      // If reservation looks expired locally, don't block - let the user try anyway
      // The backend will attempt to recreate the reservation using the ticket numbers
      // Only clear data if the user tries and fails
    } else if (pendingQuantityStored) {
      // Anonymous user - no reservation timer, just pending quantity
      const pending = JSON.parse(pendingQuantityStored);
      setPendingQuantity(pending.quantity);

      // Check if selection is not too old (e.g., 1 hour)
      const ONE_HOUR = 60 * 60 * 1000;
      if (Date.now() - pending.timestamp > ONE_HOUR) {
        setError('Your ticket selection has expired. Please select tickets again.');
        sessionStorage.removeItem(`pending_quantity_${competitionId}`);
        setIsLoading(false);
        return;
      }
    } else if (!stored) {
      // No tickets or quantity selected, redirect back
      router.push(`/competitions/${competitionSlug}/tickets`);
      return;
    }

    // Check QCM status
    checkQcmStatus();
    setIsLoading(false);
  }, [competitionId, competitionSlug, router]);

  // Countdown timer for reservation
  useEffect(() => {
    if (!reservation) return;

    const updateCountdown = () => {
      const remaining = reservation.expiresAt - Date.now();
      if (remaining <= 0) {
        // Timer expired but don't show hard error - user can still try
        // Backend will attempt to recreate reservation using ticket numbers
        setCountdown('expired');
      } else {
        setCountdown(formatCountdown(remaining));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [reservation, formatCountdown]);

  const checkQcmStatus = async () => {
    try {
      const response = await fetch(`/api/qcm/validate?competitionId=${competitionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.passed) {
          // Store that they passed in sessionStorage before redirecting
          sessionStorage.setItem(`qcm_passed_${competitionId}`, 'true');
          // Already passed - redirect directly to checkout
          router.push(`/competitions/${competitionSlug}/checkout`);
          return;
        } else if (data.blocked) {
          setResult({
            correct: false,
            blocked: true,
            message: `Please wait ${Math.ceil(data.remainingTime / 60)} minutes before trying again.`,
            attemptsRemaining: 0,
          });
        }
      }
    } catch {
      // Ignore errors during status check
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/qcm/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          answer: selectedAnswer,
          turnstileToken: turnstileToken || undefined,
          // Include ticket numbers so backend can recreate reservation if expired
          ticketNumbers: selectedTickets.length > 0 ? selectedTickets : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.correct && !data.blocked) {
        setError(data.error || 'An error occurred');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setIsSubmitting(false);
        return;
      }

      setResult({
        correct: data.correct,
        message: data.message,
        blocked: data.blocked,
        attemptsRemaining: data.attemptsRemaining,
        blockUntil: data.blockUntil,
      });

      if (data.correct) {
        // Store that they passed
        sessionStorage.setItem(`qcm_passed_${competitionId}`, 'true');

        // Update reservation expiry if backend extended/recreated it
        if (data.expiresAt) {
          const reservationData = sessionStorage.getItem(`reservation_${competitionId}`);
          if (reservationData) {
            const parsed = JSON.parse(reservationData);
            parsed.expiresAt = data.expiresAt;
            sessionStorage.setItem(`reservation_${competitionId}`, JSON.stringify(parsed));
          }
        }

        // Redirect directly to checkout - no intermediate success page
        router.push(`/competitions/${competitionSlug}/checkout`);
        return;
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setResult(null);
    setError(null);
    turnstileRef.current?.reset();
    setTurnstileToken(null);
  };

  const handleBackToTickets = () => {
    router.push(`/competitions/${competitionSlug}/tickets`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Reservation Expired</h3>
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginBottom: '20px' }}>{error}</p>
        <button onClick={handleBackToTickets} className="btn btn-primary btn-xl">Select Tickets Again →</button>
      </div>
    );
  }

  // Show blocked state
  if (result?.blocked) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', background: 'var(--surface)', border: '1.5px solid var(--ink)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Too Many Incorrect Attempts</h3>
        <p style={{ color: 'var(--ink-dim)', fontSize: '14px', marginBottom: '20px' }}>{result.message}</p>
        <button onClick={() => router.push(`/competitions/${competitionSlug}`)} className="btn btn-ghost btn-xl">Back to Competition</button>
      </div>
    );
  }


  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div>
      {/* Reservation timer */}
      {reservation && countdown && (
        <div style={{ padding: '10px 14px', background: countdown === 'expired' ? 'var(--hot)' : 'var(--warn)', color: 'var(--ink)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow-sm)', marginBottom: '20px' }}>
          {countdown === 'expired' ? 'Timer expired — submit now to keep your tickets' : `⏱ Tickets reserved for ${countdown}`}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--hot)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid var(--ink)', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Skill prompt card */}
      <div className="skill-prompt">
        <span className="skill-prompt-icon">?</span>
        <p>{questionText}</p>
      </div>

      {/* Answer options — 2x2 grid */}
      <div className="skill-opts">
        {questionChoices.map((choice, index) => {
          const selected = selectedAnswer === index;
          const isCorrect = result?.correct && selected;
          const isWrong = result && !result.correct && selected;
          const state = isCorrect ? 'correct' : isWrong ? 'wrong' : selected ? 'selected' : '';
          const locked = isSubmitting || (result?.correct);
          return (
            <button
              key={index}
              type="button"
              onClick={() => !locked && setSelectedAnswer(index)}
              className={`skill-opt ${state}`}
              disabled={!!locked}
            >
              <span className="skill-letter">{letters[index]}</span>
              <span className="skill-text">{choice}</span>
              {isCorrect && <span className="skill-check">✓</span>}
              {isWrong && <span className="skill-check">✕</span>}
            </button>
          );
        })}
      </div>

      {/* Wrong answer message */}
      {result && !result.correct && !result.blocked && (
        <div style={{ padding: '10px 14px', background: 'var(--hot)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1.5px solid var(--ink)', marginBottom: '16px' }}>
          {result.message || `Incorrect. ${result.attemptsRemaining} attempt${result.attemptsRemaining !== 1 ? 's' : ''} left.`}
        </div>
      )}

      {/* Turnstile */}
      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
          onError={() => setTurnstileToken(null)}
          onExpire={() => setTurnstileToken(null)}
          options={{ size: 'invisible', theme: 'auto' }}
        />
      )}

      {/* Footer: hint + action button */}
      <div className="enter-step-foot">
        <span className="skill-hint">UK law · 3 attempts · fair trivia about the card</span>
        {result && !result.correct && !result.blocked ? (
          <button onClick={handleTryAgain} className="btn btn-primary btn-xl">
            Try again · {result.attemptsRemaining} left →
          </button>
        ) : result?.correct ? (
          <span className="skill-ok-lg">✓ Correct — redirecting to checkout…</span>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || isSubmitting}
            className={`btn ${selectedAnswer === null ? 'btn-mute' : 'btn-hot'} btn-xl`}
          >
            {isSubmitting ? 'Checking...' : 'Submit answer →'}
          </button>
        )}
      </div>
    </div>
  );
}
