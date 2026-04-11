/**
 * RunningIndicator — animated spinner + elapsed time display.
 *
 * Uses the shared ClockContext tick to drive spinner animation so that
 * all running indicators in the tree stay in sync without each needing
 * their own interval.
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React from "react";
import { useClock } from "../hooks/useClock.js";
import { useInk } from "../contexts/InkContext.js";
import { formatElapsed } from "../../components/StatusLine.js";

// ---------------------------------------------------------------------------
// Braille spinner frames
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
const DONE_SYMBOL = "✓";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RunningIndicatorProps {
  /** Whether the run is currently active (drives animation). */
  active: boolean;
  /**
   * Wall-clock ms at which the run started.
   * Used to compute the elapsed display.  Null when not running.
   */
  startedAt: number | null;
  /** Color for the spinner / checkmark symbol. */
  color?: string;
  /** Color for the elapsed time text. */
  elapsedColor?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RunningIndicator({
  active,
  startedAt,
  color = "cyan",
  elapsedColor = "#6b7280",
}: RunningIndicatorProps): React.JSX.Element {
  const { Box, Text } = useInk();
  const { tick, now } = useClock();

  const frame = active
    ? SPINNER_FRAMES[tick % SPINNER_FRAMES.length]
    : DONE_SYMBOL;

  const symbolColor = active ? color : "#22c55e";

  const elapsed =
    startedAt !== null ? (active ? now - startedAt : now - startedAt) : 0;
  const elapsedText = startedAt !== null ? formatElapsed(elapsed) : "--:--";

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 1 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: symbolColor },
      frame,
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: elapsedColor },
      elapsedText,
    ),
  );
}
