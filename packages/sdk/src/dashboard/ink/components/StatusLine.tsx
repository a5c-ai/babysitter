/**
 * StatusLine — orchestration status line component for the Babysitter TUI.
 *
 * Exports:
 *   - formatElapsed(ms)                   — pure helper
 *   - phaseToColorKey(phase)              — pure helper
 *   - formatCostForStatus(cost)           — pure helper
 *   - truncateRunId(id)                   — pure helper
 *   - formatStatusSegments(status, colors) — pure function
 *   - StatusLine                          — React component
 */

import React from "react";
import { useInk } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";
import type { OrchestrationStatus, OrchestrationPhase, ThemeColors } from "../types.js";
import { truncateRunId, formatCost } from "../helpers.js";
export { truncateRunId };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatusSegment {
  readonly text: string;
  readonly colorKey: string;
  readonly bold?: boolean;
}

export interface StatusLineProps {
  status: OrchestrationStatus;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes}m`;
}

export function phaseToColorKey(phase: OrchestrationPhase): string {
  switch (phase) {
    case "complete":
      return "success";
    case "failed":
      return "error";
    case "waiting":
      return "warning";
    case "planning":
    case "executing":
    case "verifying":
      return "primary";
  }
}

/** @deprecated Use formatCost from helpers.ts instead. Re-exported for backward compatibility. */
export const formatCostForStatus = formatCost;

export function formatStatusSegments(
  status: OrchestrationStatus,
  _colors: ThemeColors,
): StatusSegment[] {
  const segments: StatusSegment[] = [];

  // Phase segment (bold)
  segments.push({
    text: status.phase.toUpperCase(),
    colorKey: phaseToColorKey(status.phase),
    bold: true,
  });

  // Run ID segment
  segments.push({
    text: truncateRunId(status.runId),
    colorKey: "muted",
  });

  // Iteration segment
  segments.push({
    text: `iter:${status.iteration}`,
    colorKey: "foreground",
  });

  // Effects segment
  segments.push({
    text: `effects:${status.resolvedEffects}/${status.totalEffects}`,
    colorKey: status.pendingEffects > 0 ? "warning" : "success",
  });

  // Elapsed segment
  segments.push({
    text: formatElapsed(status.elapsedMs),
    colorKey: "muted",
  });

  // Optional: token usage
  if (status.tokenUsage) {
    segments.push({
      text: `tokens:${status.tokenUsage.total}`,
      colorKey: "muted",
    });
  }

  // Optional: cost
  if (status.cost !== undefined) {
    segments.push({
      text: formatCostForStatus(status.cost),
      colorKey: "muted",
    });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function resolveColor(colors: ThemeColors, key: string): string {
  if (key in colors) {
    return colors[key as keyof ThemeColors];
  }
  return colors.foreground;
}

export function StatusLine({ status }: StatusLineProps): React.JSX.Element {
  const { Box, Text } = useInk();
  const { colors } = useTheme();
  const segments = formatStatusSegments(status, colors);

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 1 },
    ...segments.map((seg, idx) =>
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        {
          key: idx,
          color: resolveColor(colors, seg.colorKey),
          bold: seg.bold ?? false,
        },
        seg.text,
      ),
    ),
  );
}
