"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Read initial theme from DOM (set by inline script in layout)
  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme") as Theme;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.dataset.compendiumTheme = next === "light" ? "vellum" : "void";
      document.documentElement.className = next;
      localStorage.setItem("kanban-theme", next);
      localStorage.removeItem("observer-theme");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
