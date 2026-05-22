import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from './theme.js';

export function Card(props: ViewProps): JSX.Element {
  const theme = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 12,
  },
});
