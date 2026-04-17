/**
 * Theme provider for the Babysitter TUI.
 *
 * Supplies a neon-dark default theme and allows overrides via props.
 * All color values are Ink-compatible (named CSS colors or hex strings).
 */

import React, { createContext, useContext, type ReactNode } from "react";

import type { Theme, ThemeColors } from "../types.js";

// ---------------------------------------------------------------------------
// Default neon-dark theme
// ---------------------------------------------------------------------------

const neonDarkColors: ThemeColors = {
  primary: "cyan",
  secondary: "#7b61ff",
  muted: "#6b7280",
  error: "#ef4444",
  warning: "#f59e0b",
  success: "#22c55e",
  foreground: "#e5e7eb",
  background: "#0a0a0f",
  border: "#374151",
  toolCall: "#a78bfa",
  subagent: "#38bdf8",
};

export const neonDarkTheme: Theme = {
  name: "neonDark",
  colors: neonDarkColors,
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<Theme>(neonDarkTheme);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
  theme?: Theme;
}

export function ThemeProvider({
  children,
  theme = neonDarkTheme,
}: ThemeProviderProps): React.JSX.Element {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Raw context accessor (used by useTheme hook)
// ---------------------------------------------------------------------------

export function useThemeContext(): Theme {
  return useContext(ThemeContext);
}
