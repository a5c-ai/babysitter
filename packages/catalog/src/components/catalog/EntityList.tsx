"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/common/Pagination";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import { EmptyStates } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "list";

export interface EntityListProps<T> {
  /** Items to display */
  items: T[];
  /** Total number of items (for pagination) */
  totalItems?: number;
  /** Current page (1-indexed) */
  currentPage?: number;
  /** Items per page */
  itemsPerPage?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /** Current view mode */
  viewMode?: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange?: (mode: ViewMode) => void;
  /** Show view mode toggle */
  showViewToggle?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Number of skeleton items to show when loading */
  skeletonCount?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key extractor for items */
  keyExtractor: (item: T) => string | number;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Custom class name */
  className?: string;
  /** Grid columns configuration */
  gridCols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

const gridColsClasses = {
  1: "grid-cols-1",
  2: "sm:grid-cols-2",
  3: "md:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "xl:grid-cols-5",
};

export function EntityList<T>({
  items,
  totalItems,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  viewMode = "grid",
  onViewModeChange,
  showViewToggle = true,
  isLoading = false,
  skeletonCount = 6,
  renderItem,
  keyExtractor,
  emptyMessage = "No items found",
  emptyDescription = "Try adjusting your search or filters",
  className,
  gridCols = { sm: 1, md: 2, lg: 3 },
}: EntityListProps<T>) {
  const total = totalItems ?? items.length;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Generate grid columns class
  const getGridClass = () => {
    const classes = ["grid", "gap-4", "grid-cols-1"];
    if (gridCols.sm && gridCols.sm > 1)
      classes.push(gridColsClasses[gridCols.sm as keyof typeof gridColsClasses] || "");
    if (gridCols.md && gridCols.md > 1)
      classes.push(gridColsClasses[gridCols.md as keyof typeof gridColsClasses] || "");
    if (gridCols.lg && gridCols.lg > 1)
      classes.push(gridColsClasses[gridCols.lg as keyof typeof gridColsClasses] || "");
    if (gridCols.xl && gridCols.xl > 1)
      classes.push(gridColsClasses[gridCols.xl as keyof typeof gridColsClasses] || "");
    return classes.filter(Boolean).join(" ");
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className={className}>
        {showViewToggle && (
          <div className="mb-4 flex items-center justify-end">
            <ViewToggle viewMode={viewMode} disabled />
          </div>
        )}
        <div className={viewMode === "grid" ? getGridClass() : "space-y-3"}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <CardSkeleton key={index} showImage={false} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  // Render empty state
  if (items.length === 0) {
    return (
      <div className={className}>
        <EmptyStates.NoResults
          title={emptyMessage}
          description={emptyDescription}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with view toggle and count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-fg-muted)]">
          Showing{" "}
          <span className="font-medium text-[var(--color-fg-default)]">
            {Math.min((currentPage - 1) * itemsPerPage + 1, total)}-
            {Math.min(currentPage * itemsPerPage, total)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-[var(--color-fg-default)]">{total}</span>{" "}
          items
        </p>

        {showViewToggle && onViewModeChange && (
          <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        )}
      </div>

      {/* Items */}
      <div className={viewMode === "grid" ? getGridClass() : "space-y-3"}>
        {items.map((item, index) => (
          <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          showItemsPerPage={!!onItemsPerPageChange}
          className="mt-6"
        />
      )}
    </div>
  );
}

// View toggle component
interface ViewToggleProps {
  viewMode: ViewMode;
  onChange?: (mode: ViewMode) => void;
  disabled?: boolean;
}

function ViewToggle({ viewMode, onChange, disabled = false }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)]">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange?.("grid")}
        disabled={disabled}
        className={cn(
          "rounded-r-none border-r border-[var(--color-border-default)] px-2",
          viewMode === "grid" && "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]"
        )}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange?.("list")}
        disabled={disabled}
        className={cn(
          "rounded-l-none px-2",
          viewMode === "list" && "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]"
        )}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </Button>
    </div>
  );
}

export default EntityList;
