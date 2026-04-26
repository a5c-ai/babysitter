import React from 'react';
type ThemeMode = 'light' | 'dark';
export declare function ThemeProvider(props: {
    children: React.ReactNode;
}): JSX.Element;
export declare function useThemeMode(): {
    mode: ThemeMode;
    toggle(): void;
};
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map