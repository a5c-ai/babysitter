import React from 'react';
import { Pressable } from 'react-native';

import { Card } from './primitives/Card.js';
import { Text } from './primitives/Text.js';

export function SessionListItem(props: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}): JSX.Element {
  return (
    <Pressable onPress={props.onPress}>
      <Card>
        <Text style={{ fontWeight: '700' }}>{props.title}</Text>
        {props.subtitle ? <Text>{props.subtitle}</Text> : null}
      </Card>
    </Pressable>
  );
}
