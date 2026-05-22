import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@a5c-ai/agent-mux-ui';

export function OnboardingScreen(props: { onScanPress(): void }): JSX.Element {
  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.eyebrow}>AgentMux on Android</Text>
        <Text style={styles.title}>Pair this device with your gateway.</Text>
        <Text>
          Scan the pairing QR from the desktop gateway. Direct-token QR codes connect immediately, and pairing-code QR
          codes are resolved through `pairing.consume` before validation before the token is written to encrypted local
          storage.
        </Text>
        <Button label="Scan Pairing QR" onPress={props.onScanPress} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 12,
  },
});
