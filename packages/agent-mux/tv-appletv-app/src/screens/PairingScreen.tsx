import React from 'react';
import { View } from 'react-native';

import { Button, Card, Text } from '@a5c-ai/agent-mux-ui';

import { useTVTokenStore } from '../providers/TokenStoreProvider.js';

export function PairingScreen(): JSX.Element {
  const { login } = useTVTokenStore();
  return (
    <View>
      <Card>
        <Text>Apple TV can auto-read the shared access-group token when present.</Text>
        <Text>If no paired phone is available, use QR or a short pairing code from the gateway.</Text>
        <Button label="Simulate Pair" onPress={() => login({ gatewayUrl: 'http://127.0.0.1:7878', token: 'tv-token' })} />
      </Card>
    </View>
  );
}
