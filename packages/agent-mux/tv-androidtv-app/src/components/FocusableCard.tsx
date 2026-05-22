import React from 'react';
import { Pressable, View } from 'react-native';

import { Card, Text } from '@a5c-ai/agent-mux-ui';

import { useAndroidTVFocus } from '../focus/FocusManager.js';

export function FocusableCard(props: { id: string; title: string; subtitle?: string; onPress?(): void }): JSX.Element {
  const { focusedId, setFocusedId } = useAndroidTVFocus();
  const focused = focusedId === props.id;
  return (
    <Pressable
      onFocus={() => setFocusedId(props.id)}
      onBlur={() => setFocusedId(null)}
      onPress={props.onPress}
      nextFocusDown={0}
      nextFocusUp={0}
      nextFocusLeft={0}
      nextFocusRight={0}
    >
      <Card>
        <View>
          <Text>{focused ? '>> ' : ''}{props.title}</Text>
          {props.subtitle ? <Text>{props.subtitle}</Text> : null}
        </View>
      </Card>
    </Pressable>
  );
}
