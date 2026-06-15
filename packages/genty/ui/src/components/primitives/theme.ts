import React, { createContext, useContext } from 'react';

import type { ThemeTokens } from '../../theme/tokens.js';
import { lightTheme } from '../../theme/light.js';

export const ThemeContext = createContext<ThemeTokens>(lightTheme);

export function ThemeProvider(props: { value: ThemeTokens; children: React.ReactNode }): JSX.Element {
  return React.createElement(ThemeContext.Provider, { value: props.value }, props.children);
}

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
