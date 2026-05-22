import React from 'react';
import { View } from 'react-native';

import { Text } from '@a5c-ai/agent-mux-ui';

export function RemoteShortcutBar(): JSX.Element {
  return (
    <View>
      <Text>Menu: Back</Text>
      <Text>Play/Pause: Toggle hook approvals</Text>
      <Text>Select: Open focused card</Text>
    </View>
  );
}
