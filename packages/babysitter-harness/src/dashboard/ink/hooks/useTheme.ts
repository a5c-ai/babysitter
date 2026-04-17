/**
 * useTheme — convenience hook that returns the current Theme.
 *
 * Must be called from within a ThemeProvider subtree.
 */

import { useThemeContext } from "../contexts/ThemeContext.js";
import type { Theme } from "../types.js";

export function useTheme(): Theme {
  return useThemeContext();
}
