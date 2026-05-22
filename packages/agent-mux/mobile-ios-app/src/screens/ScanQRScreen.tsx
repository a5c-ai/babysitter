import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';

import { Button, Card, Text } from '@a5c-ai/agent-mux-ui';

import type { PairingPayload, StoredGatewayAuth } from '../types.js';

type ScanState = 'idle' | 'working' | 'failed';

function normalizeGatewayUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function toSocketUrl(gatewayUrl: string): string {
  if (gatewayUrl.startsWith('https://')) return `wss://${gatewayUrl.slice('https://'.length)}`;
  if (gatewayUrl.startsWith('http://')) return `ws://${gatewayUrl.slice('http://'.length)}`;
  return gatewayUrl;
}

async function resolvePairingPayload(payload: PairingPayload): Promise<StoredGatewayAuth> {
  const gatewayUrl = normalizeGatewayUrl(payload.url);
  if (payload.token) {
    return { gatewayUrl, token: payload.token };
  }
  const response = await fetch(`${gatewayUrl}/api/v1/pairing/consume`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: payload.code }),
  });
  if (!response.ok) {
    throw new Error(`Pairing code could not be consumed: ${response.status}`);
  }
  const resolved = (await response.json()) as { url: string; token: string };
  return { gatewayUrl: normalizeGatewayUrl(resolved.url), token: resolved.token };
}

async function validateGateway(auth: StoredGatewayAuth): Promise<void> {
  const { GatewayClient } = await import('@a5c-ai/agent-mux-ui');
  const { createWebSocket } = await import('../../../ui/src/client/transports/ws-react-native.js');
  const client = new GatewayClient({
    url: toSocketUrl(auth.gatewayUrl),
    token: auth.token,
    createSocket: createWebSocket,
    shouldReconnect: false,
  });
  try {
    await client.connect();
    await client.request({ type: 'agents.list' });
  } finally {
    await client.close();
  }
}

export function ScanQRScreen(props: { onBack(): void; onSuccess(auth: StoredGatewayAuth): Promise<void> }): JSX.Element {
  const [status, setStatus] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleScan(result: BarcodeScanningResult): Promise<void> {
    if (status === 'working') {
      return;
    }
    setStatus('working');
    setError(null);
    try {
      const parsed = JSON.parse(result.data) as PairingPayload;
      const resolved = await resolvePairingPayload(parsed);
      await validateGateway(resolved);
      await props.onSuccess(resolved);
    } catch (scanError) {
      setStatus('failed');
      setError(scanError instanceof Error ? scanError.message : 'The scanned QR code is invalid.');
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={(result: BarcodeScanningResult) => void handleScan(result)}
      />
      <Card>
        <Text style={styles.title}>Scan the gateway QR</Text>
        <Text>{error ?? 'The token is validated with `agents.list` before the app stores it in Keychain.'}</Text>
        <View style={styles.actions}>
          <Button label="Back" onPress={props.onBack} />
          {status === 'failed' ? <Button label="Try Again" onPress={() => setStatus('idle')} /> : null}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 16,
  },
  camera: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});
