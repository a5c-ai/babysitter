import React from 'react';
import { Text as NativeText, StyleSheet, type TextProps as NativeTextProps } from 'react-native';

import { useTheme } from './theme.js';

export function Text(props: NativeTextProps): JSX.Element {
  const theme = useTheme();
  return <NativeText {...props} style={[styles.base, { color: theme.colors.text }, props.style]} />;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 14,
    lineHeight: 20,
  },
});
