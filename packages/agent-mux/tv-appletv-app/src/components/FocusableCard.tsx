import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@a5c-ai/agent-mux-ui';

import { useFocusManager } from '../focus/FocusManager.js';

export function FocusableCard(props: { id: string; title: string; subtitle?: string; onPress?(): void }): JSX.Element {
  const { focusedId, setFocusedId } = useFocusManager();
  const focused = focusedId === props.id;
  return (
    <Pressable
      hasTVPreferredFocus={focused}
      onFocus={() => setFocusedId(props.id)}
      onBlur={() => setFocusedId(null)}
      onPress={props.onPress}
    >
      <Card>
        <View style={[styles.inner, focused ? styles.focused : null]}>
          <Text style={styles.title}>{props.title}</Text>
          {props.subtitle ? <Text>{props.subtitle}</Text> : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    minWidth: 280,
    padding: 24,
  },
  focused: {
    borderWidth: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8,
  },
});
