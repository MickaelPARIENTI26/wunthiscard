import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Verify Your Email',
  description: 'Confirm your email address to finish setting up your WinUPrize account.',
};

import { EmailNotVerifiedContent } from './email-not-verified-content';

export default function EmailNotVerifiedPage() {
  return (
    <Suspense fallback={<EmailNotVerifiedSkeleton />}>
      <EmailNotVerifiedContent />
    </Suspense>
  );
}

function EmailNotVerifiedSkeleton() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center px-4 py-8">
      <div className="w-full animate-pulse space-y-4 border p-6">
        <div className="mx-auto h-12 w-12 bg-muted" />
        <div className="mx-auto h-6 w-48 rounded bg-muted" />
        <div className="mx-auto h-4 w-64 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
      </div>
    </div>
  );
}
