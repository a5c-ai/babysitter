import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text.js';
import { useTheme } from './theme.js';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
}

export function Button({ label, onPress }: ButtonProps): JSX.Element {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md }]}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
