import React from 'react';
import { View } from 'react-native';

import { Button, Text } from '@a5c-ai/agent-mux-ui';

export function HookInboxScreen(props: { enabled: boolean; onToggle(enabled: boolean): void }): JSX.Element {
  return (
    <View>
      <Text>{props.enabled ? 'TV hook approvals enabled' : 'TV hook approvals disabled'}</Text>
      <Text>Focused hook card can approve or deny when opt-in is enabled.</Text>
      <Button label="Disable Hook Approval" onPress={() => props.onToggle(false)} />
    </View>
  );
}
