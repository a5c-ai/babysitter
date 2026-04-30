import React from "react";
type Theme = "dark" | "light";
export declare function useTheme(): {
    theme: Theme;
    toggle: () => void;
};
export declare function ThemeProvider(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
