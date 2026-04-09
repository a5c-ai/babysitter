/**
 * DashboardView — main run-list screen for the Babysitter TUI shell.
 *
 * Shows a header with version and run counts, a scrollable run list with
 * state indicators, and keyboard navigation.
 *
 * Keys:
 *   Up/Down   — select a run
 *   Enter     — navigate to run-detail
 *   n         — new run (placeholder)
 *   q/Escape  — quit
 *   r         — refresh
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React, { useState, useCallback } from "react";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useRunScanner } from "../hooks/useRunScanner.js";
import { RunListTable } from "../components/RunListTable.js";
import { ActionMenu } from "../components/ActionMenu.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DashboardViewProps {
  readonly runsDir: string;
  readonly version?: string;
  readonly onQuit?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardView({
  runsDir,
  version,
  onQuit,
}: DashboardViewProps): React.JSX.Element {
  const { Box, Text, useInput } = useInk();
  const { colors } = useTheme();
  const { dispatch: navDispatch } = useNavigation();
  const { runs, loading, error, refresh } = useRunScanner(runsDir);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const maxIndex = Math.max(0, runs.length - 1);

  // Keyboard navigation
  useInput(
    useCallback(
      (input: string, key: InkKey) => {
        if (key.upArrow) {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
        } else if (key.downArrow) {
          setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
        } else if (key.return && runs.length > 0) {
          const run = runs[selectedIndex];
          if (run) {
            navDispatch({ type: "NAVIGATE_TO_RUN_DETAIL", runId: run.runId });
          }
        } else if (key.escape || input === "q") {
          onQuit?.();
        } else if (input === "r") {
          refresh();
        } else if (input === "s" && runs.length > 0) {
          const run = runs[selectedIndex];
          if (run) {
            navDispatch({ type: "NAVIGATE_TO_SESSION", runId: run.runId });
          }
        }
      },
      [maxIndex, runs, selectedIndex, navDispatch, onQuit, refresh],
    ),
  );

  // Clamp selected index when runs change
  const clampedIndex = Math.min(selectedIndex, maxIndex);
  if (clampedIndex !== selectedIndex) {
    setSelectedIndex(clampedIndex);
  }

  // Action menu handler — must be declared before any early returns so
  // the hook call order is stable across renders (Rules of Hooks).
  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case "details":
          if (runs.length > 0 && runs[clampedIndex]) {
            navDispatch({ type: "NAVIGATE_TO_RUN_DETAIL", runId: runs[clampedIndex].runId });
          }
          break;
        case "session":
          if (runs.length > 0 && runs[clampedIndex]) {
            navDispatch({ type: "NAVIGATE_TO_SESSION", runId: runs[clampedIndex].runId });
          }
          break;
        case "refresh":
          refresh();
          break;
        case "quit":
          onQuit?.();
          break;
        default:
          break;
      }
    },
    [runs, clampedIndex, navDispatch, refresh, onQuit],
  );

  // --- Everything below here is render logic (no more hooks) ---

  // Count stats
  const completedCount = runs.filter((r) => r.state === "completed").length;
  const waitingCount = runs.filter((r) => r.state === "waiting").length;
  const failedCount = runs.filter((r) => r.state === "failed").length;

  // Header
  const versionText = version ? ` v${version}` : "";
  const header = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column", paddingX: 1, marginBottom: 1 },
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "row", gap: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.primary, bold: true },
        "babysitter tui",
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        versionText,
      ),
    ),
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "row", gap: 2 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.foreground },
        `${String(runs.length)} runs:`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.success },
        `${String(completedCount)} done`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.warning },
        `${String(waitingCount)} waiting`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.error },
        `${String(failedCount)} failed`,
      ),
    ),
  );

  // Loading state
  if (loading && runs.length === 0) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column" },
      header,
      React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { paddingX: 2 },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          "Scanning runs...",
        ),
      ),
    );
  }

  // Error state
  if (error) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column" },
      header,
      React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { paddingX: 2 },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.error },
          `Error: ${error}`,
        ),
      ),
    );
  }

  // Empty state
  if (runs.length === 0) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column" },
      header,
      React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { paddingX: 2 },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          "No runs found. Press 'n' to create a new run, or 'q' to quit.",
        ),
      ),
    );
  }

  // Normal state: run list + action menu
  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column", height: "100%" },
    header,
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column", flexGrow: 1 },
      React.createElement(RunListTable, {
        runs,
        selectedIndex: clampedIndex,
      }),
    ),
    React.createElement(ActionMenu, { onAction: handleAction }),
  );
}
