import React from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

import { useTheme } from './theme.js';

export function ScrollContainer(props: ScrollViewProps): JSX.Element {
  const theme = useTheme();
  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        styles.content,
        { backgroundColor: theme.colors.background },
        props.contentContainerStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
