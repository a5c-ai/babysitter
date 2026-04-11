/**
 * RunDetailView — detailed run inspection view for the Babysitter TUI.
 *
 * Replaces the RunDetailPlaceholder in App.tsx. Shows:
 * - Header: run ID, process ID, state badge, creation time, prompt
 * - Scrollable event timeline using formatEventTimeline/getEventIcon/getEventColor
 * - Task status summary (pending/resolved/total effects)
 * - Keyboard navigation: Escape=back, s=session, r=refresh, Up/Down=scroll
 *
 * Uses useRunDetail hook for polling, InkContext for Box/Text/useInput.
 */

import React, { useState } from "react";
import * as path from "node:path";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useRunDetail } from "../hooks/useRunDetail.js";
import { EffectsPanel } from "../components/EffectsPanel.js";
import {
  formatEventTimeline,
  getEventIcon,
  getEventColor,
  formatTimestamp,
  formatElapsedCompact,
  clampScrollOffset,
  computeVisibleRange,
  formatKeyboardHelp,
} from "../helpers.js";
import {
  stateSymbol,
  stateColor,
  truncateId,
} from "../components/RunListTable.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of event lines visible at once. */
const EVENT_VIEWPORT = 15;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RunDetailViewProps {
  readonly runsDir: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RunDetailView({ runsDir }: RunDetailViewProps): React.JSX.Element {
  const { Box, Text, useInput } = useInk();
  const { colors } = useTheme();
  const { state: navState, dispatch: navDispatch } = useNavigation();

  const runId = navState.selectedRunId;
  const runDir = runId ? path.resolve(runsDir, runId) : null;
  const { detail, loading, error, refresh } = useRunDetail(runDir);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  const eventCount = detail?.events.length ?? 0;

  // Keyboard navigation
  useInput(
    (input: string, key: InkKey) => {
      if (input === "?") {
        setShowHelp((prev) => !prev);
        return;
      }
      if (key.escape) {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        navDispatch({ type: "GO_BACK" });
      } else if (input === "s" && runId) {
        navDispatch({ type: "NAVIGATE_TO_SESSION", runId });
      } else if (input === "r") {
        refresh();
      } else if (key.upArrow) {
        setScrollOffset((prev) =>
          clampScrollOffset(prev - 1, eventCount, EVENT_VIEWPORT));
      } else if (key.downArrow) {
        setScrollOffset((prev) =>
          clampScrollOffset(prev + 1, eventCount, EVENT_VIEWPORT));
      } else if (key.pageUp) {
        setScrollOffset((prev) =>
          clampScrollOffset(prev - EVENT_VIEWPORT, eventCount, EVENT_VIEWPORT));
      } else if (key.pageDown) {
        setScrollOffset((prev) =>
          clampScrollOffset(prev + EVENT_VIEWPORT, eventCount, EVENT_VIEWPORT));
      } else if (input === "g") {
        setScrollOffset(0);
      } else if (input === "G") {
        setScrollOffset(clampScrollOffset(eventCount, eventCount, EVENT_VIEWPORT));
      } else if (input === "e") {
        setShowEffects((prev) => !prev);
      }
    },
  );

  // --- No run selected ---
  if (!runId) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        "No run selected. Press Escape to go back.",
      ),
    );
  }

  // --- Loading state ---
  if (loading && !detail) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.primary, bold: true },
        `Run: ${runId}`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        "Loading run details...",
      ),
    );
  }

  // --- Error state ---
  if (error && !detail) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.error, bold: true },
        `Error loading run: ${error}`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        "Press Escape to go back, or 'r' to retry.",
      ),
    );
  }

  if (!detail) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        "No data available.",
      ),
    );
  }

  // --- Metadata header ---
  const stSym = stateSymbol(detail.state);
  const stCol = stateColor(detail.state, colors);
  const elapsedMs = Date.now() - new Date(detail.createdAt).getTime();

  const header = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column", paddingX: 1, marginBottom: 1 },
    // Row 1: Run ID + state
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "row", gap: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.primary, bold: true },
        `Run: ${truncateId(detail.runId)}`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: stCol, bold: true },
        `${stSym} ${detail.state}`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        `(${formatElapsedCompact(elapsedMs)})`,
      ),
    ),
    // Row 2: Process + created
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "row", gap: 2 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.foreground },
        `Process: ${detail.processId}`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        `Created: ${formatTimestamp(detail.createdAt)}`,
      ),
    ),
    // Row 3: Prompt (if available)
    detail.prompt
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted, wrap: "wrap" },
          `Prompt: ${detail.prompt.length > 100 ? detail.prompt.slice(0, 100) + "..." : detail.prompt}`,
        )
      : null,
  );

  // --- Task status bar ---
  const taskStatus = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 2, paddingX: 1, marginBottom: 1 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground },
      `Events: ${String(detail.eventCount)}`,
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.success },
      `Resolved: ${String(detail.resolvedCount)}`,
    ),
    detail.pendingCount > 0
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.warning, bold: true },
          `Pending: ${String(detail.pendingCount)}`,
        )
      : React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          "Pending: 0",
        ),
  );

  // --- Event timeline ---
  const timelineLines = formatEventTimeline(detail.events);
  const { start, end } = computeVisibleRange(scrollOffset, timelineLines.length, EVENT_VIEWPORT);
  const visibleLines = timelineLines.slice(start, end);

  const topOverflow = start > 0
    ? React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted, dimColor: true },
        `  \u25B2 ${String(start)} earlier events`,
      )
    : null;

  const bottomOverflow = end < timelineLines.length
    ? React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted, dimColor: true },
        `  \u25BC ${String(timelineLines.length - end)} more events`,
      )
    : null;

  const timelineElements = visibleLines.map((line, idx) => {
    const event = detail.events[start + idx];
    const eventColor = event ? getEventColor(event.type, colors) : colors.muted;
    return React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { key: `evt-${start + idx}`, color: eventColor },
      `  ${line}`,
    );
  });

  const timeline = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column", paddingX: 1, flexGrow: 1 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground, bold: true },
      "Event Timeline",
    ),
    topOverflow,
    ...timelineElements,
    bottomOverflow,
    timelineLines.length === 0
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted, dimColor: true },
          "  No events recorded yet.",
        )
      : null,
  );

  // --- Action bar ---
  const actionBar = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", gap: 2, paddingX: 1, paddingY: 0, borderStyle: "single", borderColor: colors.border },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      "[",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.primary },
      "Esc",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground },
      "Back",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      "]  [",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.primary },
      "s",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground },
      "Session",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      "]  [",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.primary },
      "r",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground },
      "Refresh",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      "]  [",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.primary },
      "\u2191\u2193",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground },
      "Scroll",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      "]",
    ),
  );

  // --- Help overlay ---
  const helpOverlay = showHelp
    ? React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { flexDirection: "column", paddingX: 2, paddingY: 1, borderStyle: "round", borderColor: colors.primary },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.primary, bold: true },
          "Keyboard Shortcuts",
        ),
        ...formatKeyboardHelp("run-detail").map((line, idx) =>
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { key: `help-${idx}`, color: colors.foreground },
            line,
          ),
        ),
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted, dimColor: true },
          "\n  Press ? or Esc to close",
        ),
      )
    : null;

  // --- Full layout ---
  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column", height: "100%" },
    header,
    taskStatus,
    showEffects
      ? React.createElement(EffectsPanel as React.ComponentType<Record<string, unknown>>, { showPendingSummary: true, maxTreeItems: 15 })
      : null,
    showHelp ? helpOverlay : timeline,
    actionBar,
  );
}
