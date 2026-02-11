import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

function CompetitionCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <div className="relative aspect-square">
        <Skeleton className="h-full w-full" />
      </div>

      <CardContent className="p-4">
        {/* Title skeleton */}
        <Skeleton className="mb-2 h-5 w-3/4" />
        <Skeleton className="mb-3 h-4 w-1/2" />

        {/* Price skeleton */}
        <div className="mb-3 flex items-baseline gap-1">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Progress bar skeleton */}
        <Skeleton className="mb-1.5 h-3 w-full" />
        <Skeleton className="h-2 w-full" />

        {/* Countdown skeleton */}
        <div className="mt-3">
          <Skeleton className="mb-1.5 h-3 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export function CompetitionsLoading() {
  return (
    <div>
      {/* Filters skeleton */}
      <div className="mb-6 space-y-4">
        {/* Category tabs skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Status and sort skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-[140px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-[160px]" />
          </div>
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <CompetitionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
