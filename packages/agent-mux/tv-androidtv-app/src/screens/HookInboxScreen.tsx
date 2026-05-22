import React from 'react';
import { View } from 'react-native';

import { Button, Text } from '@a5c-ai/agent-mux-ui';

export function HookInboxScreen(props: { enabled: boolean; onToggle(enabled: boolean): void }): JSX.Element {
  return (
    <View>
      <Text>{props.enabled ? 'Hook approvals enabled' : 'Hook approvals disabled'}</Text>
      <Text>Focused hook toast can approve or deny when enabled.</Text>
      <Button label="Disable Hook Approval" onPress={() => props.onToggle(false)} />
    </View>
  );
}
