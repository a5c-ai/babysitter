'use client';

import { useEffect } from 'react';

export const THEME_STORAGE_KEY = 'krate-theme';
export const THEME_CHANGED_EVENT = 'krate-theme-changed';

export function readStoredTheme(fallback = 'light') {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function resolveKrateTheme(theme) {
  if (typeof window !== 'undefined' && theme === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme = readStoredTheme()) {
  if (typeof document === 'undefined') return;
  const resolvedTheme = resolveKrateTheme(theme);
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function storeTheme(theme) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme } }));
}

export function ThemeRuntime() {
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const applyStoredTheme = () => applyTheme(readStoredTheme());
    const handleSystemThemeChange = () => {
      if (readStoredTheme() === 'system') applyTheme('system');
    };
    const handleStorage = (event) => {
      if (!event.key || event.key === THEME_STORAGE_KEY) applyStoredTheme();
    };
    const handleThemeChange = (event) => applyTheme(event.detail?.theme || readStoredTheme());

    applyStoredTheme();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_CHANGED_EVENT, handleThemeChange);
    mediaQuery?.addEventListener('change', handleSystemThemeChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChange);
      mediaQuery?.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return null;
}
