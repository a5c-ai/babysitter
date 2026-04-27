import { useThemeMode } from "../../../providers/ThemeProvider.js";

type Theme = "dark" | "light";

export function useTheme(): { theme: Theme; toggle: () => void } {
  const { mode, toggle } = useThemeMode();
  return { theme: mode, toggle };
}

export function ThemeProvider(props: { children: React.ReactNode }) {
  return <>{props.children}</>;
}
