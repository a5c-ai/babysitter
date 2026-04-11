/**
 * StatusBar — fixed top row of the Babysitter TUI.
 *
 * Layout (single row, flex row, space-between):
 *   LEFT:   harness name badge  |  model name
 *   CENTER: run ID (≤12 chars)  |  iteration counter
 *   RIGHT:  pending/resolved effect counts  |  elapsed HH:MM:SS  |  spinner
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React from "react";
import { useSession } from "../hooks/useSession.js";
import { useClock } from "../hooks/useClock.js";
import { useTheme } from "../hooks/useTheme.js";
import { useInk } from "../contexts/InkContext.js";
import { RunningIndicator } from "./RunningIndicator.js";
import type { RunStatus } from "../types.js";
import { truncateRunId, formatCost, formatElapsedClock, formatTurnElapsed, formatTokenSummary } from "../helpers.js";
export { formatCost };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StatusBarProps {
  /** Human-readable harness name, e.g. "claude-code". */
  harness?: string;
  /** Model identifier, e.g. "claude-opus-4-5". */
  model?: string;
  /** Current iteration number (0-based). */
  iteration?: number;
  /** Number of currently pending effects. */
  pendingEffects?: number;
  /** Total number of resolved effects this run. */
  resolvedEffects?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatTokenCount(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 1_000_000) {
    const k = count / 1000;
    return `${k.toFixed(1)}k`;
  }
  const m = count / 1_000_000;
  return `${m.toFixed(1)}M`;
}

export function statusToIndicator(status: RunStatus): string {
  switch (status) {
    case "running":
      return "●";
    case "waiting_effect":
      return "◌";
    case "complete":
      return "✓";
    case "failed":
      return "✗";
    case "idle":
      return "·";
  }
}

export function statusToColor(
  status: RunStatus,
  colors: { success: string; warning: string; error: string; muted: string; primary: string },
): string {
  switch (status) {
    case "running":
      return colors.primary;
    case "waiting_effect":
      return colors.warning;
    case "complete":
      return colors.success;
    case "failed":
      return colors.error;
    case "idle":
      return colors.muted;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatusBar({
  harness = "babysitter",
  model,
  iteration = 0,
  pendingEffects = 0,
  resolvedEffects = 0,
}: StatusBarProps): React.JSX.Element {
  const { state } = useSession();
  const { colors } = useTheme();
  const { Box, Text } = useInk();

  const { now } = useClock(); // Subscribe to clock ticks for live timer updates
  const { runId, status, runStartedAt, turnStartedAt, tokenUsage, cost } = state;
  const isActive = status === "running" || status === "waiting_effect";
  const hasRun = runId !== null;
  const elapsedMs = runStartedAt !== null ? now - runStartedAt : 0;
  const elapsedText = runStartedAt !== null ? formatElapsedClock(elapsedMs) : "--:--";
  const turnMs = turnStartedAt !== null ? now - turnStartedAt : 0;
  const turnText = turnStartedAt !== null ? formatTurnElapsed(turnMs) : null;

  const indicatorSymbol = statusToIndicator(status);
  const indicatorColor = statusToColor(status, colors);

  // Left section: harness badge + model
  const leftSection = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 1 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.primary, bold: true },
      harness,
    ),
    model
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          model,
        )
      : null,
  );

  // Center section: status indicator + run ID + iteration
  const centerSection = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 1 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: indicatorColor },
      indicatorSymbol,
    ),
    hasRun
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.secondary },
          truncateRunId(runId as string),
        )
      : React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          "no run — start one or pass --run-id",
        ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      `iter:${String(iteration)}`,
    ),
  );

  // Right section: token/cost + turn timer + effects counts + elapsed + spinner
  const rightSection = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 1 },
    tokenUsage
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          formatTokenSummary(tokenUsage),
        )
      : null,
    cost !== null && cost > 0
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.success },
          `$${cost.toFixed(4)}`,
        )
      : null,
    turnText
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.primary },
          `turn:${turnText}`,
        )
      : null,
    pendingEffects > 0
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.warning },
          `${String(pendingEffects)} pending`,
        )
      : null,
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      `${String(resolvedEffects)} done`,
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      elapsedText,
    ),
    isActive
      ? React.createElement(RunningIndicator, {
          active: isActive,
          startedAt: runStartedAt,
          color: colors.primary,
          elapsedColor: colors.muted,
        })
      : React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: indicatorColor },
          indicatorSymbol,
        ),
  );

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "row",
      justifyContent: "space-between",
      height: 1,
      paddingX: 1,
    },
    leftSection,
    centerSection,
    rightSection,
  );
}
