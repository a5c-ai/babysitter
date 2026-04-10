/**
 * RunListTable — scrollable run list with state indicators and selection highlight.
 *
 * Renders a viewport of ~15 visible rows, scrolling as the selection moves.
 * Each row shows: state symbol, truncated run ID, state label, process ID,
 * relative timestamp, and pending effect count.
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React from "react";
import { useInk } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";
import type { RunSummary } from "../data/runScanner.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RunListTableProps {
  readonly runs: readonly RunSummary[];
  readonly selectedIndex: number;
  readonly onSelect?: (index: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of rows visible at once. */
const VISIBLE_ROWS = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function stateSymbol(state: RunSummary["state"]): string {
  switch (state) {
    case "completed": return "\u2714";
    case "failed": return "\u2718";
    case "waiting": return "\u25CB";
    case "created": return "\u2500";
  }
}

export function stateColor(
  state: RunSummary["state"],
  colors: { success: string; error: string; warning: string; muted: string },
): string {
  switch (state) {
    case "completed": return colors.success;
    case "failed": return colors.error;
    case "waiting": return colors.warning;
    case "created": return colors.muted;
  }
}

export function truncateId(id: string, max: number = 12): string {
  if (id.length <= max) return id;
  return id.slice(0, max);
}

export function truncateProcess(processId: string, max: number = 20): string {
  if (processId.length <= max) return processId;
  return processId.slice(0, max - 1) + "\u2026";
}

export function formatRelativeTimestamp(iso: string, now?: Date): string {
  if (!iso) return "???";
  try {
    const d = new Date(iso);
    const ref = now ?? new Date();
    const diffMs = ref.getTime() - d.getTime();
    if (diffMs < 60_000) return "just now";
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    return `${Math.floor(diffMs / 86400_000)}d ago`;
  } catch {
    return iso.slice(0, 19);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RunListTable({
  runs,
  selectedIndex,
  onSelect: _onSelect,
}: RunListTableProps): React.JSX.Element {
  const { Box, Text } = useInk();
  const { colors } = useTheme();

  // Compute scroll window
  const total = runs.length;
  let scrollStart = 0;
  if (total > VISIBLE_ROWS) {
    // Keep the selected row roughly centered
    const half = Math.floor(VISIBLE_ROWS / 2);
    scrollStart = Math.max(0, selectedIndex - half);
    scrollStart = Math.min(scrollStart, total - VISIBLE_ROWS);
  }
  const scrollEnd = Math.min(scrollStart + VISIBLE_ROWS, total);
  const visibleRuns = runs.slice(scrollStart, scrollEnd);

  // Scroll position indicator
  const showScrollUp = scrollStart > 0;
  const showScrollDown = scrollEnd < total;

  const rows = visibleRuns.map((run, visIdx) => {
    const actualIdx = scrollStart + visIdx;
    const isSelected = actualIdx === selectedIndex;
    const color = isSelected ? colors.primary : colors.foreground;
    const prefix = isSelected ? "\u276F " : "  ";
    const sColor = stateColor(run.state, colors);
    const sym = stateSymbol(run.state);

    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { key: run.runId, flexDirection: "row", gap: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.primary, bold: isSelected },
        prefix,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: sColor },
        sym,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color, bold: isSelected },
        truncateId(run.runId),
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: sColor },
        run.state,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        truncateProcess(run.processId),
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        formatRelativeTimestamp(run.createdAt),
      ),
      run.pendingCount > 0
        ? React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: colors.warning },
            `${String(run.pendingCount)} pending`,
          )
        : null,
    );
  });

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column", paddingX: 1 },
    showScrollUp
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          `  \u25B2 ${String(scrollStart)} more above`,
        )
      : null,
    ...rows,
    showScrollDown
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          `  \u25BC ${String(total - scrollEnd)} more below`,
        )
      : null,
  );
}
