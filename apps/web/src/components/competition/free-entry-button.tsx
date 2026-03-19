'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, CheckCircle } from 'lucide-react';

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
  const [hasEntered, setHasEntered] = useState(userTicketCount > 0);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error || 'Failed to enter competition');
        setIsSubmitting(false);
        return;
      }

      setHasEntered(true);
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
            padding: '16px',
            borderRadius: '14px',
            background: '#E0E0E4',
            color: '#9a9eb0',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          <CheckCircle style={{ width: '20px', height: '20px' }} />
          Already Entered
        </button>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
          You already have a ticket for this draw. Good luck!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Ticket limit info */}
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
        {maxTicketsPerUser === 1
          ? '1 free ticket per account'
          : `Up to ${maxTicketsPerUser} free ticket${maxTicketsPerUser > 1 ? 's' : ''} per account`}
      </p>

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
          padding: '16px',
          borderRadius: '14px',
          background: '#1a1a2e',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isSubmitting || isLoading ? 'not-allowed' : 'pointer',
          opacity: isSubmitting || isLoading ? 0.7 : 1,
          transition: 'all 0.3s',
          boxShadow: '0 8px 28px rgba(26, 26, 46, 0.2)',
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
    </div>
  );
}
