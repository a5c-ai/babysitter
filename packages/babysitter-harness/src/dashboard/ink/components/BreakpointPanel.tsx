/**
 * BreakpointPanel — interactive breakpoint approval component.
 *
 * Wires three helpers from helpers.ts:
 * - formatBreakpointPrompt: human-readable prompt with icon/status/metadata
 * - formatBreakpointOptions: action list (Approve/Reject/Always Approve/etc.)
 * - getBreakpointStatusColor: color by approval tri-state
 *
 * Uses InkContext pattern (useInk() for Box/Text/useInput).
 * Focus gating: isActive controls when keyboard input is captured.
 */

import React, { useState, useCallback } from "react";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";
import type { BreakpointState } from "../types.js";
import {
  formatBreakpointPrompt,
  formatBreakpointOptions,
  getBreakpointStatusColor,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BreakpointPanelProps {
  /** The breakpoint to render. */
  readonly breakpoint: BreakpointState;
  /** Called when the user selects an option. */
  readonly onSelect?: (option: string) => void;
  /** Whether this panel captures keyboard input. */
  readonly isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BreakpointPanel({
  breakpoint,
  onSelect,
  isActive = true,
}: BreakpointPanelProps): React.JSX.Element {
  const { Box, Text, useInput } = useInk();
  const { colors } = useTheme();

  const prompt = formatBreakpointPrompt(breakpoint);
  const options = formatBreakpointOptions(breakpoint);
  const statusColorKey = getBreakpointStatusColor(breakpoint.approved);
  const statusColor = colors[statusColorKey as keyof typeof colors] ?? colors.foreground;

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation
  useInput(
    (_input: string, key: InkKey) => {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1));
      } else if (key.return) {
        const selected = options[selectedIndex];
        if (selected && onSelect) {
          onSelect(selected);
        }
      }
    },
    { isActive },
  );

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "column",
      borderStyle: "round",
      borderColor: statusColor,
      paddingX: 1,
      paddingY: 0,
    },
    // Prompt text
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: statusColor, wrap: "wrap" },
      prompt,
    ),
    // Options list
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "column", marginTop: 1 },
      ...options.map((option, idx) =>
        React.createElement(
          Box as React.ComponentType<Record<string, unknown>>,
          { key: option, flexDirection: "row" },
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: idx === selectedIndex ? colors.primary : colors.muted },
            idx === selectedIndex ? "\u25B6 " : "  ",
          ),
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            {
              bold: idx === selectedIndex,
              color: idx === selectedIndex ? colors.foreground : colors.muted,
            },
            option,
          ),
        ),
      ),
    ),
    // Instructions
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted, dimColor: true },
      "\u2191\u2193 navigate  Enter select",
    ),
  );
}
