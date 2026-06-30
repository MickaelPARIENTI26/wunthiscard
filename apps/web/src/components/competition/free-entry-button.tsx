'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, CheckCircle, CalendarClock } from 'lucide-react';

interface FreeEntryButtonProps {
  competitionId: string;
  competitionSlug: string;
  userTicketCount: number;
  maxTicketsPerUser: number;
}

export function FreeEntryButton({
  competitionId,
  competitionSlug,
  userTicketCount,
  maxTicketsPerUser,
}: FreeEntryButtonProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = !!session?.user;
  const isLoading = sessionStatus === 'loading';

  const [isSubmitting, setIsSubmitting] = useState(false);
  // The user is "already entered" only once they've used up their free-entry
  // allowance. Free comps can allow more than one entry, so a single existing
  // ticket must not block further entries while under the per-user cap.
  const [enteredCount, setEnteredCount] = useState(userTicketCount);
  // maxTicketsPerUser <= 0 means "no per-user limit" — never blocked.
  const hasEntered = maxTicketsPerUser > 0 && enteredCount >= maxTicketsPerUser;
  const [error, setError] = useState<string | null>(null);
  // No date of birth on file (e.g. Google sign-in doesn't share it) -> show a clear
  // path to set it instead of a dead "confirm your DOB" error.
  const [needsAge, setNeedsAge] = useState(false);

  const handleFreeEntry = async () => {
    if (!isAuthenticated) {
      router.push(`/register?callbackUrl=/competitions/${competitionSlug}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tickets/free-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'AGE_VERIFICATION_REQUIRED') {
          setNeedsAge(true);
          setIsSubmitting(false);
          return;
        }
        setError(data.error || 'Failed to enter competition');
        setIsSubmitting(false);
        return;
      }

      setEnteredCount((count) => count + 1);
      router.refresh();
      setIsSubmitting(false);
    } catch {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Already entered state
  if (hasEntered) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full flex items-center justify-center gap-2"
          style={{
            minHeight: 'var(--btn-height-lg)',
            padding: '0 24px',
            borderRadius: 'var(--radius-btn)',
            background: 'var(--bg-3)',
            color: 'var(--ink-faint)',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          <CheckCircle style={{ width: '20px', height: '20px' }} />
          Already Entered
        </button>
        <p style={{ fontSize: '13px', color: 'var(--ink-dim)', textAlign: 'center' }}>
          {maxTicketsPerUser === 1
            ? 'You already have a ticket for this draw. Good luck!'
            : `You've used all ${maxTicketsPerUser} of your free entries for this draw. Good luck!`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Ticket limit info */}
      <p style={{ fontSize: '14px', color: 'var(--ink-dim)' }}>
        {maxTicketsPerUser === 1
          ? '1 free ticket per account'
          : `Up to ${maxTicketsPerUser} free ticket${maxTicketsPerUser > 1 ? 's' : ''} per account`}
      </p>

      {needsAge ? (
        /* Missing date of birth (e.g. Google sign-in) — guide them to set it. */
        <div
          role="alert"
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'var(--surface)',
            border: '1.5px solid var(--ink)',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: 'var(--ink)',
              marginBottom: '12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              lineHeight: 1.45,
            }}
          >
            <CalendarClock style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
            <span>
              UK law requires you to be 18+. You signed in with Google, which doesn&apos;t
              share your date of birth — add it once to your profile, then come back to enter.
            </span>
          </p>
          <Link
            href="/profile?reason=age"
            className="w-full flex items-center justify-center"
            style={{
              minHeight: 'var(--btn-height-lg)',
              padding: '0 24px',
              borderRadius: 'var(--radius-btn)',
              background: 'var(--ink)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: 'var(--shadow)',
            }}
          >
            Add your date of birth →
          </Link>
        </div>
      ) : (
        <>
          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                color: '#DC2626',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleFreeEntry}
            disabled={isSubmitting || isLoading}
            className="w-full flex items-center justify-center gap-2"
            style={{
              minHeight: 'var(--btn-height-lg)',
              padding: '0 24px',
              borderRadius: 'var(--radius-btn)',
              background: 'var(--ink)',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || isLoading ? 0.7 : 1,
              transition: 'all 0.3s',
              boxShadow: 'var(--shadow)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Entering...
              </>
            ) : isAuthenticated ? (
              'Enter for Free'
            ) : (
              'Sign Up to Enter for Free'
            )}
          </button>
        </>
      )}
    </div>
  );
}
