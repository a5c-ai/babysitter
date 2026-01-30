import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Base skeleton element with animation */
function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--color-neutral-muted)]",
        className
      )}
    />
  );
}

export interface CardSkeletonProps {
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Custom class name */
  className?: string;
}

/** Skeleton for card components */
export function CardSkeleton({
  showImage = true,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] p-4",
        className
      )}
    >
      {showImage && (
        <Skeleton className="mb-4 h-32 w-full" />
      )}
      <Skeleton className="mb-2 h-5 w-3/4" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export interface ListSkeletonProps {
  /** Number of items */
  count?: number;
  /** Show avatar/icon */
  showAvatar?: boolean;
  /** Custom class name */
  className?: string;
}

/** Skeleton for list components */
export function ListSkeleton({
  count = 5,
  showAvatar = true,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] p-3"
        >
          {showAvatar && (
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export interface DetailSkeletonProps {
  /** Show breadcrumb */
  showBreadcrumb?: boolean;
  /** Number of sections */
  sections?: number;
  /** Custom class name */
  className?: string;
}

/** Skeleton for detail/entity pages */
export function DetailSkeleton({
  showBreadcrumb = true,
  sections = 3,
  className,
}: DetailSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] p-6"
        >
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface TableSkeletonProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Custom class name */
  className?: string;
}

/** Skeleton for table components */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--color-border-default)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex gap-4 border-b border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)] p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            "flex gap-4 p-4",
            rowIndex < rows - 1 && "border-b border-[var(--color-border-default)]"
          )}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "w-1/4 flex-none"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Default export with all skeleton variants */
export const LoadingSkeleton = {
  Card: CardSkeleton,
  List: ListSkeleton,
  Detail: DetailSkeleton,
  Table: TableSkeleton,
  Base: Skeleton,
};

export default LoadingSkeleton;
