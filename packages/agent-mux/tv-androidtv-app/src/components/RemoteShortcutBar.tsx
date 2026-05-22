import React from 'react';
import { View } from 'react-native';

import { Text } from '@a5c-ai/agent-mux-ui';

export function RemoteShortcutBar(): JSX.Element {
  return (
    <View>
      <Text>D-pad: move focus</Text>
      <Text>OK: open focused card</Text>
      <Text>Play/Pause: toggle hook approval</Text>
    </View>
  );
}
