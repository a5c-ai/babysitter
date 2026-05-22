import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';

import { GatewayClient, GatewayProvider as UiGatewayProvider, useGateway } from '@a5c-ai/agent-mux-ui';
import type { AgentRecord } from '@a5c-ai/agent-mux-ui';
import { createWebSocket } from '../../../ui/src/client/transports/ws-react-native.js';

import { useTokenStore } from './TokenStoreProvider.js';

type GatewayAuthContextValue = {
  isAuthenticated: boolean;
  gatewayUrl: string | null;
};

const GatewayAuthContext = createContext<GatewayAuthContextValue>({ isAuthenticated: false, gatewayUrl: null });

function toSocketUrl(gatewayUrl: string): string {
  if (gatewayUrl.startsWith('https://')) return `wss://${gatewayUrl.slice('https://'.length)}`;
  if (gatewayUrl.startsWith('http://')) return `ws://${gatewayUrl.slice('http://'.length)}`;
  return gatewayUrl;
}

async function fetchAuthorized<T>(gatewayUrl: string, token: string, pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${gatewayUrl}${pathname}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

function GatewayBootstrap(props: { gatewayUrl: string; token: string; children: React.ReactNode }): JSX.Element {
  const { client, store } = useGateway();
  const subscriptionsRef = useRef(new Map<string, () => void>());

  function normalizeAgents(raw: unknown): AgentRecord[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.flatMap((item) => {
      if (typeof item === 'string') {
        return [{ agent: item, displayName: item }];
      }
      if (!item || typeof item !== 'object') {
        return [];
      }
      const record = item as Record<string, unknown>;
      const agent = typeof record['agent'] === 'string' ? record['agent'] : '';
      if (!agent) {
        return [];
      }
      return [{ agent, displayName: typeof record['displayName'] === 'string' ? record['displayName'] : agent }];
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function syncSnapshot(): Promise<void> {
      const [agentsResponse, runsResponse] = await Promise.all([
        fetchAuthorized<{ agents: unknown[]; agentDescriptors?: unknown[] }>(props.gatewayUrl, props.token, '/api/v1/agents'),
        fetchAuthorized<{ runs: Array<Record<string, unknown>> }>(props.gatewayUrl, props.token, '/api/v1/runs'),
      ]);
      if (cancelled) {
        return;
      }
      const actions = store.getState().actions;
      actions.setAgents(normalizeAgents(agentsResponse.agentDescriptors ?? agentsResponse.agents));
      for (const run of runsResponse.runs) {
        const runId = String(run['runId'] ?? '');
        if (!runId) continue;
        actions.mergeRun(runId, run);
        if (typeof run['sessionId'] === 'string') {
          actions.mergeSession(run['sessionId'], { title: run['runId'], agent: run['agent'] });
        }
        if (!subscriptionsRef.current.has(runId)) {
          subscriptionsRef.current.set(runId, client.subscribeRun(runId));
        }
      }
    }

    void syncSnapshot();
    const timer = setInterval(() => {
      void syncSnapshot();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      for (const unsubscribe of subscriptionsRef.current.values()) {
        unsubscribe();
      }
      subscriptionsRef.current.clear();
    };
  }, [client, props.gatewayUrl, props.token, store]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        store.getState().actions.setConnection('connecting');
        void client.connect().catch(() => undefined);
        return;
      }
      void client.close();
    });
    return () => {
      subscription.remove();
    };
  }, [client, store]);

  return <>{props.children}</>;
}

export function GatewayProvider(props: { children: React.ReactNode }): JSX.Element {
  const { auth } = useTokenStore();
  const client = useMemo(() => {
    if (!auth) return null;
    return new GatewayClient({
      url: toSocketUrl(auth.gatewayUrl),
      token: auth.token,
      createSocket: createWebSocket,
    });
  }, [auth]);

  if (!client || !auth) {
    return (
      <GatewayAuthContext.Provider value={{ isAuthenticated: false, gatewayUrl: null }}>
        {props.children}
      </GatewayAuthContext.Provider>
    );
  }

  return (
    <GatewayAuthContext.Provider value={{ isAuthenticated: true, gatewayUrl: auth.gatewayUrl }}>
      <UiGatewayProvider client={client}>
        <GatewayBootstrap gatewayUrl={auth.gatewayUrl} token={auth.token}>
          {props.children}
        </GatewayBootstrap>
      </UiGatewayProvider>
    </GatewayAuthContext.Provider>
  );
}

export function useGatewayAuth(): GatewayAuthContextValue {
  return useContext(GatewayAuthContext);
}
