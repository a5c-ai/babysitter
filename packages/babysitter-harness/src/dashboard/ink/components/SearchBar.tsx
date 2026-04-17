/**
 * SearchBar — inline search component for the Babysitter TUI.
 *
 * Wires three helpers from helpers.ts:
 * - findMatches: find all occurrences of a pattern in text
 * - highlightText: wrap matches with markers for visual emphasis
 * - navigateMatch: cycle through match indices (next/prev with wrapping)
 *
 * Activation: isActive prop controls keyboard capture.
 * Uses InkContext pattern (useInk() for Box/Text/useInput).
 */

import React, { useState, useCallback, useMemo } from "react";
import { useInk } from "../contexts/InkContext.js";
import type { InkKey } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";
import {
  findMatches,
  highlightText,
  navigateMatch,
} from "../helpers.js";
import type { SearchMatch } from "../helpers.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SearchBarProps {
  /** The text corpus to search through. */
  readonly text: string;
  /** Whether the search bar captures keyboard input. */
  readonly isActive?: boolean;
  /** Called when search state changes (query, matches, current index). */
  readonly onSearchChange?: (state: SearchBarState) => void;
}

export interface SearchBarState {
  readonly query: string;
  readonly matches: readonly SearchMatch[];
  readonly currentIndex: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchBar({
  text,
  isActive = false,
  onSearchChange,
}: SearchBarProps): React.JSX.Element | null {
  const { Box, Text, useInput } = useInk();
  const { colors } = useTheme();

  const [query, setQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const matches = useMemo(
    () => (query ? findMatches(text, query, { ignoreCase: true }) : []),
    [text, query],
  );

  const notifyChange = useCallback(
    (q: string, m: readonly SearchMatch[], idx: number) => {
      if (onSearchChange) {
        onSearchChange({ query: q, matches: m, currentIndex: idx });
      }
    },
    [onSearchChange],
  );

  // Keyboard input: typing builds query, Enter/Shift+Enter navigate matches
  useInput(
    (input: string, key: InkKey) => {
      if (key.return) {
        // Enter = next match
        const nextIdx = navigateMatch(currentIndex, matches.length, "next");
        setCurrentIndex(nextIdx);
        notifyChange(query, matches, nextIdx);
        return;
      }

      if (key.backspace || key.delete) {
        const newQuery = query.slice(0, -1);
        setQuery(newQuery);
        const newMatches = newQuery
          ? findMatches(text, newQuery, { ignoreCase: true })
          : [];
        const newIdx = 0;
        setCurrentIndex(newIdx);
        notifyChange(newQuery, newMatches, newIdx);
        return;
      }

      if (key.upArrow) {
        // Up = previous match
        const prevIdx = navigateMatch(currentIndex, matches.length, "prev");
        setCurrentIndex(prevIdx);
        notifyChange(query, matches, prevIdx);
        return;
      }

      if (key.downArrow) {
        // Down = next match
        const nextIdx = navigateMatch(currentIndex, matches.length, "next");
        setCurrentIndex(nextIdx);
        notifyChange(query, matches, nextIdx);
        return;
      }

      if (key.escape) {
        // Clear search
        setQuery("");
        setCurrentIndex(0);
        notifyChange("", [], 0);
        return;
      }

      // Regular character input
      if (input && !key.ctrl && !key.meta) {
        const newQuery = query + input;
        setQuery(newQuery);
        const newMatches = findMatches(text, newQuery, { ignoreCase: true });
        const newIdx = 0;
        setCurrentIndex(newIdx);
        notifyChange(newQuery, newMatches, newIdx);
      }
    },
    { isActive },
  );

  // Only render when active
  if (!isActive) return null;

  // Build display: highlight current match in the status text
  const matchStatus =
    matches.length > 0
      ? `${String(currentIndex + 1)}/${String(matches.length)}`
      : query
        ? "No matches"
        : "";

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "row",
      gap: 1,
      borderStyle: "single",
      borderColor: colors.border,
      paddingX: 1,
    },
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.muted },
      "Search:",
    ),
    React.createElement(
      Text as React.ComponentType<Record<string, unknown>>,
      { color: colors.foreground },
      query || " ",
    ),
    matchStatus
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          {
            color: matches.length > 0 ? colors.success : colors.warning,
          },
          matchStatus,
        )
      : null,
  );
}

/**
 * Utility: apply search highlighting to a text string using the search bar state.
 * Intended for consumers that render highlighted text externally.
 */
export function applySearchHighlight(
  text: string,
  state: SearchBarState,
  startMarker = "\x1b[7m",
  endMarker = "\x1b[27m",
): string {
  if (state.matches.length === 0) return text;
  return highlightText(text, state.matches, startMarker, endMarker);
}
