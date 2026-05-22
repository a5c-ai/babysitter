import React, { useEffect } from 'react';

import { GatewayClient } from '@a5c-ai/agent-mux-ui';
import { createWebSocket } from '../../../ui/src/client/transports/ws-react-native.js';

import { HOOK_ALLOW_ACTION, HOOK_DENY_ACTION } from '../native/push.js';
import { useNotifications } from './NotificationProvider.js';
import { useTokenStore } from './TokenStoreProvider.js';

function toSocketUrl(gatewayUrl: string): string {
  if (gatewayUrl.startsWith('https://')) return `wss://${gatewayUrl.slice('https://'.length)}`;
  if (gatewayUrl.startsWith('http://')) return `ws://${gatewayUrl.slice('http://'.length)}`;
  return gatewayUrl;
}

async function respondToHook(gatewayUrl: string, token: string, hookRequestId: string, decision: 'allow' | 'deny'): Promise<void> {
  const client = new GatewayClient({
    url: toSocketUrl(gatewayUrl),
    token,
    createSocket: createWebSocket,
    shouldReconnect: false,
    requestTimeoutMs: 30000,
  });
  try {
    await client.connect();
    await client.request({ type: 'hook.decision', hookRequestId, decision });
  } finally {
    await client.close();
  }
}

export function BackgroundHookHandler(): JSX.Element | null {
  const { auth } = useTokenStore();
  const { lastActionIdentifier, lastHookPayload } = useNotifications();

  useEffect(() => {
    const decision =
      lastActionIdentifier === HOOK_ALLOW_ACTION ? 'allow' : lastActionIdentifier === HOOK_DENY_ACTION ? 'deny' : null;
    if (!decision || !lastHookPayload) {
      return;
    }
    const token = lastHookPayload.token ?? auth?.token;
    const gatewayUrl = lastHookPayload.gatewayUrl || auth?.gatewayUrl;
    if (!token || !gatewayUrl) {
      return;
    }
    void respondToHook(gatewayUrl, token, lastHookPayload.hookRequestId, decision);
  }, [auth, lastActionIdentifier, lastHookPayload]);

  return null;
}
