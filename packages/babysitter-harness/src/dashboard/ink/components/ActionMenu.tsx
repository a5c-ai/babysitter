/**
 * ActionMenu — fixed-height bottom bar showing available keyboard shortcuts.
 *
 * Renders a horizontal row of shortcut hints and handles keyboard input,
 * dispatching matched shortcuts to the onAction callback.
 *
 *   [Enter] Details  [s] Session  [n] New  [r] Refresh  [q] Quit
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React, { useCallback } from "react";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActionMenuProps {
  readonly onAction: (action: string) => void;
}

// ---------------------------------------------------------------------------
// Shortcut definitions
// ---------------------------------------------------------------------------

export interface Shortcut {
  readonly key: string;
  readonly label: string;
  readonly action: string;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { key: "Enter", label: "Details", action: "details" },
  { key: "s", label: "Session", action: "session" },
  { key: "n", label: "New", action: "new" },
  { key: "r", label: "Refresh", action: "refresh" },
  { key: "q", label: "Quit", action: "quit" },
];

// ---------------------------------------------------------------------------
// Key mapping (pure function, exported for testing)
// ---------------------------------------------------------------------------

/**
 * Map a raw key input + modifier flags to an action ID, or null if unrecognized.
 */
export function mapKeyToAction(
  input: string,
  key: Partial<InkKey>,
): string | null {
  if (key.return) return "details";
  if (key.escape) return "quit";
  // Arrow keys are navigation — not action menu shortcuts
  if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow) return null;

  const match = SHORTCUTS.find((s) => s.key === input);
  return match?.action ?? null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActionMenu({
  onAction,
}: ActionMenuProps): React.JSX.Element {
  const { Box, Text, useInput } = useInk();
  const { colors } = useTheme();

  // Handle shortcut keys and dispatch to onAction
  useInput(
    useCallback(
      (input: string, key: InkKey) => {
        const action = mapKeyToAction(input, key);
        if (action !== null) {
          onAction(action);
        }
      },
      [onAction],
    ),
  );

  const items = SHORTCUTS.map((shortcut) =>
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { key: shortcut.key, flexDirection: "row", gap: 0 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted, dimColor: true },
        "[",
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.primary, bold: true },
        shortcut.key,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted, dimColor: true },
        "]",
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.foreground },
        ` ${shortcut.label}`,
      ),
    ),
  );

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "row",
      gap: 2,
      height: 1,
      paddingX: 1,
      marginTop: 1,
    },
    ...items,
  );
}
