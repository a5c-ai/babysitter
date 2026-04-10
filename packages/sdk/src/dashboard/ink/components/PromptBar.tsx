/**
 * PromptBar — fixed bottom input row for the Babysitter TUI.
 *
 * Manages its own local text input state (string typed so far).
 *
 * Keyboard bindings (via Ink's useInput, injected through InkContext):
 *   Enter      → submit and clear
 *   Escape     → clear input
 *   Backspace  → delete last character
 *   Printable  → append to buffer
 *
 * Box/Text are obtained from InkContext via useInk() — no prop drilling.
 */

import React, { useState, useCallback } from "react";
import { useSession } from "../hooks/useSession.js";
import { useTheme } from "../hooks/useTheme.js";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PromptBarProps {
  /**
   * Called when the user submits a message (presses Enter).
   * Receives the trimmed input text.
   */
  onSubmit?: (text: string) => void;
  /** Placeholder text shown when the input is empty. */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Slash commands
// ---------------------------------------------------------------------------

export interface SlashCommand {
  readonly name: string;
  readonly description: string;
}

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  { name: "/status", description: "Show run status" },
  { name: "/refresh", description: "Refresh run data" },
  { name: "/clear", description: "Clear messages" },
  { name: "/back", description: "Go back to dashboard" },
  { name: "/verbosity", description: "Cycle verbosity level" },
  { name: "/help", description: "Show available commands" },
];

export function getSlashHints(input: string): readonly SlashCommand[] {
  if (!input.startsWith("/")) return [];
  const prefix = input.toLowerCase();
  return SLASH_COMMANDS.filter((cmd) => cmd.name.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function countLines(text: string): number {
  return text.split("\n").length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PromptBar({
  onSubmit,
  placeholder = "Type a message… (Enter=submit, Esc=clear, v=verbosity)",
}: PromptBarProps): React.JSX.Element {
  const { state, dispatch } = useSession();
  const { colors } = useTheme();
  const { Box, Text, useInput } = useInk();

  // Local controlled input state
  const [value, setValue] = useState<string>("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSubmit?.(trimmed);
    dispatch({ type: "SET_INPUT_BUFFER", text: "" });
    setValue("");
  }, [value, onSubmit, dispatch]);

  // Wire Ink's useInput for keyboard handling
  useInput(
    (input: string, key: InkKey) => {
      if (key.return) {
        handleSubmit();
      } else if (key.escape) {
        setValue("");
        dispatch({ type: "SET_INPUT_BUFFER", text: "" });
      } else if (key.backspace || key.delete) {
        setValue((prev) => prev.slice(0, -1));
        dispatch({ type: "SET_INPUT_BUFFER", text: value.slice(0, -1) });
      } else if (input && input.length > 0 && !key.return) {
        // Filter to printable characters (avoid arrow keys etc. that may emit non-empty strings)
        const isPrintable = input.codePointAt(0) !== undefined && (input.codePointAt(0) ?? 0) >= 32;
        if (isPrintable) {
          const next = value + input;
          setValue(next);
          dispatch({ type: "SET_INPUT_BUFFER", text: next });
          // Mark input as active when user starts typing
          if (!state.inputActive) {
            dispatch({ type: "SET_INPUT_ACTIVE", active: true });
          }
        }
      }
    },
  );

  const lineCount = countLines(value);
  const isEmpty = value.length === 0;
  const isActive = state.inputActive;

  // Slash command hints
  const slashHints = getSlashHints(value);

  // Display text: show placeholder when empty and not active
  const displayText = isEmpty && !isActive ? placeholder : value;
  const displayColor = isEmpty && !isActive ? colors.muted : colors.foreground;

  // Line count hint (visible when multiline)
  const lineHint =
    lineCount > 1
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          `[${String(lineCount)} lines]`,
        )
      : null;

  // Cursor indicator
  const cursor = isActive
    ? React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.primary },
        "▋",
      )
    : null;

  // Prompt glyph
  const promptGlyph = React.createElement(
    Text as React.ComponentType<Record<string, unknown>>,
    { color: isActive ? colors.primary : colors.muted, bold: isActive },
    ">",
  );

  // Input display area
  const inputArea = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "row", flexGrow: 1, gap: 0 },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: displayColor, wrap: "wrap" },
      displayText,
    ),
    cursor,
  );

  // Slash command hints row (shown above the prompt when typing a slash command)
  const slashHintsRow =
    slashHints.length > 0
      ? React.createElement(
          Box as React.ComponentType<Record<string, unknown>>,
          { flexDirection: "row", paddingX: 2, gap: 2 },
          ...slashHints.map((cmd) =>
            React.createElement(
              Box as React.ComponentType<Record<string, unknown>>,
              { key: cmd.name, flexDirection: "row", gap: 1 },
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { color: colors.primary, bold: true },
                cmd.name,
              ),
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { color: colors.muted },
                cmd.description,
              ),
            ),
          ),
        )
      : null;

  // Prompt input row
  const promptRow = React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "row",
      borderStyle: "single",
      borderTop: true,
      borderBottom: false,
      borderLeft: false,
      borderRight: false,
      borderColor: colors.border,
      paddingX: 1,
      gap: 1,
    },
    promptGlyph,
    inputArea,
    lineHint,
  );

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column" },
    slashHintsRow,
    promptRow,
  );
}
