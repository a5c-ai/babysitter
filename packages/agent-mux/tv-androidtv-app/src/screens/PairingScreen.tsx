import React from 'react';
import { View } from 'react-native';

import { Button, Card, Text } from '@a5c-ai/agent-mux-ui';

import { useAndroidTVTokenStore } from '../providers/TokenStoreProvider.js';

export function PairingScreen(): JSX.Element {
  const { login } = useAndroidTVTokenStore();
  return (
    <View>
      <Card>
        <Text>Enter this 8-digit code on your phone to pair Android TV.</Text>
        <Text>1234 5678</Text>
        <Button label="Simulate Pair Completion" onPress={() => login({ gatewayUrl: 'http://127.0.0.1:7878', token: 'android-tv-token' })} />
      </Card>
    </View>
  );
}
