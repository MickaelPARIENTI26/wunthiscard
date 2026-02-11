'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global admin error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/30">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Critical Error</h1>
            <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
              A critical error has occurred in the admin panel. Please refresh the page or contact
              technical support.
            </p>

            {/* Error Digest (for debugging) */}
            {error.digest && (
              <p className="mb-6 font-mono text-xs text-gray-500">
                Error Reference: {error.digest}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </button>
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
