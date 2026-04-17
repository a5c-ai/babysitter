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
import {
  createInputHistory,
  addToHistory,
  navigateHistory,
  isPasteSequence,
  extractPasteContent,
} from "../helpers.js";
import type { InputHistory } from "../helpers.js";

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
  { name: "/harness", description: "Switch harness" },
  { name: "/model", description: "Switch model" },
  { name: "/help", description: "Show available commands" },
  { name: "/search", description: "Search messages" },
  { name: "/effects", description: "Toggle effects panel" },
];

export function getSlashHints(input: string): readonly SlashCommand[] {
  if (!input.startsWith("/")) return [];
  const prefix = input.toLowerCase();
  return SLASH_COMMANDS.filter((cmd) => cmd.name.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Tab completion
// ---------------------------------------------------------------------------

/**
 * Attempt to complete a slash command from the current input.
 * Returns the completed string (with trailing space) if exactly one match,
 * the longest common prefix if multiple matches, or null if no matches.
 */
export function completeSlashCommand(input: string): string | null {
  if (!input.startsWith("/") || input.includes(" ")) return null;
  const hints = getSlashHints(input);
  if (hints.length === 0) return null;
  if (hints.length === 1) return hints[0].name + " ";
  // Multiple matches — find longest common prefix
  const names = hints.map((h) => h.name);
  let lcp = names[0];
  for (let i = 1; i < names.length; i++) {
    while (!names[i].startsWith(lcp)) {
      lcp = lcp.slice(0, -1);
    }
  }
  // Only return if it's longer than what the user typed
  return lcp.length > input.length ? lcp : null;
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
  // Input history for Up/Down command recall
  const [history, setHistory] = useState<InputHistory>(() => createInputHistory());
  // Saved input when entering history navigation (restored on Down past end)
  const [savedInput, setSavedInput] = useState<string>("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSubmit?.(trimmed);
    setHistory((prev) => addToHistory(prev, trimmed));
    setSavedInput("");
    dispatch({ type: "SET_INPUT_BUFFER", text: "" });
    dispatch({ type: "SET_INPUT_ACTIVE", active: false });
    setValue("");
  }, [value, onSubmit, dispatch]);

  // Wire Ink's useInput for keyboard handling.
  // The PromptBar is the primary input target in the session view — it's
  // always active so keystrokes go here first and not to global shortcuts.
  useInput(
    (input: string, key: InkKey) => {
      if (key.return) {
        handleSubmit();
      } else if (key.escape) {
        setValue("");
        dispatch({ type: "SET_INPUT_BUFFER", text: "" });
        dispatch({ type: "SET_INPUT_ACTIVE", active: false });
      } else if (key.upArrow) {
        // Save current input before entering history navigation
        if (history.cursor >= history.entries.length && value.length > 0) {
          setSavedInput(value);
        }
        const result = navigateHistory(history, "up");
        setHistory(result.history);
        if (result.entry !== null) {
          setValue(result.entry);
          dispatch({ type: "SET_INPUT_BUFFER", text: result.entry });
        }
      } else if (key.downArrow) {
        const result = navigateHistory(history, "down");
        setHistory(result.history);
        if (result.entry !== null) {
          setValue(result.entry);
          dispatch({ type: "SET_INPUT_BUFFER", text: result.entry });
        } else {
          // Past end of history — restore saved input or clear
          const restored = savedInput;
          setValue(restored);
          dispatch({ type: "SET_INPUT_BUFFER", text: restored });
          setSavedInput("");
        }
      } else if (key.tab) {
        // Tab completion for slash commands
        const completed = completeSlashCommand(value);
        if (completed !== null) {
          setValue(completed);
          dispatch({ type: "SET_INPUT_BUFFER", text: completed });
        }
      } else if (key.backspace || key.delete) {
        setValue((prev) => prev.slice(0, -1));
        dispatch({ type: "SET_INPUT_BUFFER", text: value.slice(0, -1) });
      } else if (input && input.length > 0 && !key.return) {
        // Check for bracketed paste sequences first
        if (isPasteSequence(input)) {
          const pastedContent = extractPasteContent(input);
          const next = value + pastedContent;
          setValue(next);
          dispatch({ type: "SET_INPUT_BUFFER", text: next });
          if (!state.inputActive) {
            dispatch({ type: "SET_INPUT_ACTIVE", active: true });
          }
          return;
        }
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
