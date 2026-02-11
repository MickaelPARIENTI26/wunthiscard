'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
        </div>

        {/* Error Message */}
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Page Not Found</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          The admin page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </main>
  );
}
