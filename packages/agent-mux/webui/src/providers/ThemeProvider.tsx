import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as UiThemeProvider, darkTheme, lightTheme } from '@a5c-ai/agent-mux-ui';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'amux.webui.theme';
const ThemeModeContext = createContext<{ mode: ThemeMode; toggle(): void } | null>(null);

function readThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider(props: { children: React.ReactNode }): JSX.Element {
  const [mode, setMode] = useState<ThemeMode>(() => readThemeMode());

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.compendiumTheme = mode === 'light' ? 'vellum' : 'void';
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggle() {
        const nextMode = mode === 'light' ? 'dark' : 'light';
        window.localStorage.setItem(STORAGE_KEY, nextMode);
        setMode(nextMode);
      },
    }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <UiThemeProvider value={mode === 'light' ? lightTheme : darkTheme}>
        {props.children}
      </UiThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): { mode: ThemeMode; toggle(): void } {
  const value = useContext(ThemeModeContext);
  if (!value) {
    throw new Error('useThemeMode must be used inside ThemeProvider');
  }
  return value;
}
