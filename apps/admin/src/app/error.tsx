'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin application error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Something went wrong</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          An unexpected error has occurred in the admin panel. Please try again or contact
          technical support.
        </p>

        {/* Error Digest (for debugging) */}
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-muted-foreground">
            Error Reference: {error.digest}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
