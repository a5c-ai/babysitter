import React from 'react';
import { ScrollView, View } from 'react-native';

import { Text } from '@a5c-ai/agent-mux-ui';

export function LeanbackRow(props: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <View>
      <Text>{props.title}</Text>
      <ScrollView horizontal>{props.children}</ScrollView>
    </View>
  );
}
