"use client";

import * as React from "react";
import { Toggle } from "@a5c-ai/compendium";

const STORAGE_KEY = "atlas-theme";

export function ThemeToggle() {
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem(STORAGE_KEY) === "void");
    } catch {}
  }, []);

  React.useEffect(() => {
    const theme = darkMode ? "void" : "vellum";
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [darkMode]);

  return (
    <div className="atlas-theme-toggle">
      <Toggle checked={darkMode} onChange={setDarkMode} label="Dark mode" />
    </div>
  );
}
