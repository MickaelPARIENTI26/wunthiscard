import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function CompetitionDetailLoading() {
  return (
    <main className="min-h-screen bg-background pb-24 sm:pb-8">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Back Navigation skeleton */}
        <Skeleton className="mb-4 h-5 w-40" />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left Column - Image Gallery Skeleton */}
          <div>
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 flex-shrink-0 rounded-md" />
              ))}
            </div>
          </div>

          {/* Right Column - Details Skeleton */}
          <div className="space-y-6">
            {/* Category Badge */}
            <Skeleton className="h-6 w-24 rounded-full" />

            {/* Title */}
            <div>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="mt-2 h-5 w-1/2" />
            </div>

            {/* Prize Value Card */}
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-1 h-8 w-32" />
                </div>
              </CardContent>
            </Card>

            {/* Countdown Timer */}
            <div className="rounded-lg border p-4">
              <Skeleton className="mx-auto mb-3 h-4 w-40" />
              <div className="flex justify-center gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="mb-1.5 flex justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>

            {/* Ticket Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>

            {/* Bonus Notice */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* CTA Button */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Free Entry Notice */}
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>

        {/* Ticket Selector Preview */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Description */}
          <div>
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          {/* Competition Info Cards */}
          <div className="space-y-6">
            <Card>
              <div className="p-4">
                <Skeleton className="mb-4 h-5 w-48" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <Skeleton className="mb-4 h-5 w-40" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
