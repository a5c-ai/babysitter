/**
 * BorderBox — bordered container primitive for the Babysitter TUI.
 *
 * Exports:
 *   - getBorderChars(style)      — pure function returning unicode border characters
 *   - borderBoxReducer(state, action) — state machine for BorderBox
 *   - BorderBox                  — React component (uses InkContext + ThemeContext)
 */

import React from "react";
import { useInk } from "../../contexts/InkContext.js";
import { useTheme } from "../../hooks/useTheme.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BorderStyle = "single" | "double" | "round" | "bold" | "none";

export interface BorderBoxState {
  readonly style: BorderStyle;
  readonly title: string | undefined;
  readonly collapsed: boolean;
  readonly padding: number;
}

export type BorderBoxAction =
  | { type: "SET_STYLE"; style: BorderStyle }
  | { type: "SET_TITLE"; title: string | undefined }
  | { type: "TOGGLE_COLLAPSE" }
  | { type: "SET_PADDING"; padding: number };

export interface BorderChars {
  readonly topLeft: string;
  readonly topRight: string;
  readonly bottomLeft: string;
  readonly bottomRight: string;
  readonly horizontal: string;
  readonly vertical: string;
}

export interface BorderBoxProps {
  style?: BorderStyle;
  title?: string;
  collapsed?: boolean;
  padding?: number;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

export function getBorderChars(style: BorderStyle): BorderChars {
  switch (style) {
    case "single":
      return {
        topLeft: "\u250c",
        topRight: "\u2510",
        bottomLeft: "\u2514",
        bottomRight: "\u2518",
        horizontal: "\u2500",
        vertical: "\u2502",
      };
    case "double":
      return {
        topLeft: "\u2554",
        topRight: "\u2557",
        bottomLeft: "\u255a",
        bottomRight: "\u255d",
        horizontal: "\u2550",
        vertical: "\u2551",
      };
    case "round":
      return {
        topLeft: "\u256d",
        topRight: "\u256e",
        bottomLeft: "\u2570",
        bottomRight: "\u256f",
        horizontal: "\u2500",
        vertical: "\u2502",
      };
    case "bold":
      return {
        topLeft: "\u250f",
        topRight: "\u2513",
        bottomLeft: "\u2517",
        bottomRight: "\u251b",
        horizontal: "\u2501",
        vertical: "\u2503",
      };
    case "none":
      return {
        topLeft: "",
        topRight: "",
        bottomLeft: "",
        bottomRight: "",
        horizontal: "",
        vertical: "",
      };
  }
}

export function borderBoxReducer(
  state: BorderBoxState,
  action: BorderBoxAction,
): BorderBoxState {
  switch (action.type) {
    case "SET_STYLE":
      return { ...state, style: action.style };
    case "SET_TITLE":
      return { ...state, title: action.title };
    case "TOGGLE_COLLAPSE":
      return { ...state, collapsed: !state.collapsed };
    case "SET_PADDING": {
      const clamped = Math.max(0, Math.min(4, action.padding));
      return { ...state, padding: clamped };
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BorderBox({
  style = "single",
  title,
  collapsed = false,
  padding = 0,
  children,
}: BorderBoxProps): React.JSX.Element {
  const { Box, Text } = useInk();
  const { colors } = useTheme();
  const _chars = getBorderChars(style);

  if (collapsed) {
    return React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "row" },
      title
        ? React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: colors.border },
            `${_chars.topLeft}${_chars.horizontal} ${title} ${_chars.horizontal}${_chars.topRight} (collapsed)`,
          )
        : React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { color: colors.muted },
            "(collapsed)",
          ),
    );
  }

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    {
      flexDirection: "column",
      borderStyle: style === "none" ? undefined : style,
      borderColor: colors.border,
      paddingX: padding,
      paddingY: padding > 0 ? 1 : 0,
    },
    title
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.primary, bold: true },
          title,
        )
      : null,
    children,
  );
}
