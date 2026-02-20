import Link from 'next/link';
import { Home, Search, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompetitionNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
        </div>

        {/* Error Message */}
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Competition Not Found</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Sorry, we couldn&apos;t find this competition. It may have ended, been removed, or
          the URL might be incorrect.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/competitions">
              <Search className="mr-2 h-4 w-4" />
              Browse Competitions
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/competitions"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to all competitions
          </Link>
        </div>
      </div>
    </main>
  );
}
