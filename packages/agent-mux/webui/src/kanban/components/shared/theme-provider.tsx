import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "kanban-theme";
const ThemeContext = createContext<{ theme: Theme; toggle(): void } | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.className = theme;
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: "dark", toggle: () => undefined };
  }
  return context;
}

export function ThemeProvider(props: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggle() {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}
