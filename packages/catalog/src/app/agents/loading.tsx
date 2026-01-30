import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout/PageContainer";

export default function AgentsLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-6 w-48" />

        {/* Title skeleton */}
        <Skeleton className="h-10 w-64" />

        {/* Search and filter bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:max-w-md" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Grid of card skeletons */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex justify-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </PageContainer>
  );
}
