import { Skeleton } from '@/components/ui/skeleton';
import { CompetitionsLoading } from './competitions-loading';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Page Header skeleton */}
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 w-48 sm:h-10 sm:w-64" />
          <Skeleton className="mt-2 h-4 w-64 sm:h-5 sm:w-96" />
        </div>

        <CompetitionsLoading />
      </div>
    </main>
  );
}
