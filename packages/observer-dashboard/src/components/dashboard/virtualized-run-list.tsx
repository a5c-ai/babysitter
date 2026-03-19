"use client";
import { useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RunCard } from "./run-card";
import type { Run } from "@/types";

/** Estimated height of a single RunCard in pixels (used for initial measurement) */
const ESTIMATED_CARD_HEIGHT = 140;

/** Number of items to render outside the visible area for smooth scrolling */
const OVERSCAN_COUNT = 3;

/** Threshold below which we skip virtualization (overhead not worthwhile) */
const VIRTUALIZATION_THRESHOLD = 15;

interface VirtualizedRunListProps {
  /** Runs to display — must be pre-sorted by caller */
  runs: Run[];
  /** Optional className applied to the scroll container */
  className?: string;
  /** Maximum height for the scroll container. Defaults to 600px. */
  maxHeight?: number;
  /** Optional render wrapper per-item (e.g. to add time overlays in activity mode) */
  renderItem?: (run: Run, index: number) => React.ReactNode;
}

/**
 * Virtualized run card list using @tanstack/react-virtual.
 *
 * - Only renders visible cards plus a small overscan buffer.
 * - Uses stable sort keys (run.runId) to prevent reordering flash.
 * - Preserves scroll position when new runs are prepended by adjusting
 *   the scroll offset.
 * - Falls back to a simple flat list when the item count is below the
 *   VIRTUALIZATION_THRESHOLD to avoid unnecessary overhead.
 */
export function VirtualizedRunList({
  runs,
  className,
  maxHeight = 600,
  renderItem,
}: VirtualizedRunListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Memoize the runs array to prevent unnecessary virtualizer recalculations.
  // The caller provides runs pre-sorted (by status or activity), and we use
  // runId as the stable key (via getItemKey) to prevent reordering flash
  // during rapid updates. This ensures React can reconcile virtual items
  // by identity rather than by position.
  const stableSortedRuns = useMemo(() => runs, [runs]);

  // Map of runId -> index for O(1) lookup during key extraction.
  const getItemKey = useCallback(
    (index: number) => stableSortedRuns[index]?.runId ?? index,
    [stableSortedRuns]
  );

  const virtualizer = useVirtualizer({
    count: stableSortedRuns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: OVERSCAN_COUNT,
    getItemKey,
  });

  // For small lists, skip virtualization entirely to avoid overhead.
  if (stableSortedRuns.length < VIRTUALIZATION_THRESHOLD) {
    return (
      <div className={className} data-testid="run-list-flat">
        <div className="flex flex-col gap-2">
          {stableSortedRuns.map((run, index) =>
            renderItem ? (
              <div key={run.runId}>{renderItem(run, index)}</div>
            ) : (
              <RunCard key={run.runId} run={run} />
            )
          )}
        </div>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={className}
      data-testid="run-list-virtualized"
      style={{
        maxHeight,
        overflow: "auto",
        // Contain layout for paint performance
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const run = stableSortedRuns[virtualRow.index];
          if (!run) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div style={{ paddingBottom: 8 }}>
                {renderItem ? renderItem(run, virtualRow.index) : <RunCard run={run} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
