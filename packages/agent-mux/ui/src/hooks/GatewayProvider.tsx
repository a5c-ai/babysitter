import React, { createContext, useEffect, useMemo } from 'react';

import type { GatewayClient } from '../client/GatewayClient.js';
import { createGatewayStore, type GatewayStore } from '../store/index.js';

export const GatewayClientContext = createContext<GatewayClient | null>(null);
export const GatewayStoreContext = createContext<GatewayStore | null>(null);

function bindClientToStore(client: GatewayClient, store: GatewayStore): () => void {
  const disconnectors = [
    client.on('connected', () => store.getState().actions.setConnection('connected')),
    client.on('disconnected', (event) => store.getState().actions.setConnection('disconnected', event.reason ?? null)),
    client.on('error', (error) => store.getState().actions.setConnection('disconnected', error instanceof Error ? error.message : String(error))),
    client.on('frame', (frame) => {
      const type = frame['type'];
      if (type === 'run.event' && typeof frame['runId'] === 'string' && typeof frame['seq'] === 'number') {
        const runId = frame['runId'];
        const event = frame['event'] as Record<string, unknown>;
        store.getState().actions.mergeRunEvent(
          runId,
          frame['seq'],
          String(frame['source'] ?? 'gateway'),
          event,
        );
        if (event['type'] === 'session_start' && typeof event['sessionId'] === 'string') {
          store.getState().actions.mergeRun(runId, { sessionId: event['sessionId'] });
          store.getState().actions.mergeSession(event['sessionId'], {
            agent: event['agent'],
            activeRunId: runId,
            latestRunId: runId,
            status: 'active',
          });
        }
        if (event['type'] === 'run.finalized') {
          const exitReason = String(event['exitReason'] ?? 'failed');
          const status =
            exitReason === 'completed'
              ? 'completed'
              : exitReason === 'aborted' || exitReason === 'interrupted' || exitReason === 'killed'
                ? 'aborted'
                : 'failed';
          store.getState().actions.mergeRun(runId, { status, exitReason });
          const run = store.getState().runs.byId[runId];
          const sessionId = typeof run?.sessionId === 'string' ? run.sessionId : null;
          if (sessionId) {
            store.getState().actions.mergeSession(sessionId, {
              status: 'inactive',
              activeRunId: null,
              latestRunId: runId,
            });
          }
        }
      }
      if (type === 'hook.request') {
        store.getState().actions.addHookRequest({
          hookRequestId: String(frame['hookRequestId']),
          runId: String(frame['runId']),
          hookKind: String(frame['hookKind']),
          payload: (frame['payload'] ?? {}) as Record<string, unknown>,
          deadlineTs: Number(frame['deadlineTs'] ?? 0),
        });
      }
      if (type === 'hook.resolved') {
        const requests = Object.entries(store.getState().hooks.byRunId);
        for (const [runId, pending] of requests) {
          if (pending.some((request) => request.hookRequestId === frame['hookRequestId'])) {
            store.getState().actions.resolveHookRequest(runId, String(frame['hookRequestId']));
          }
        }
      }
    }),
  ];
  return () => {
    for (const disconnect of disconnectors) disconnect();
  };
}

export interface GatewayProviderProps {
  client: GatewayClient;
  children: React.ReactNode;
}

export function GatewayProvider({ client, children }: GatewayProviderProps): JSX.Element {
  const store = useMemo(() => createGatewayStore(client), [client]);

  useEffect(() => {
    store.getState().actions.setConnection('connecting');
    const unbind = bindClientToStore(client, store);
    void client.connect().catch((error) => {
      store.getState().actions.setConnection(
        'disconnected',
        error instanceof Error ? error.message : String(error),
      );
    });
    return () => {
      unbind();
      void client.close();
    };
  }, [client, store]);

  return (
    <GatewayClientContext.Provider value={client}>
      <GatewayStoreContext.Provider value={store}>
        {children}
      </GatewayStoreContext.Provider>
    </GatewayClientContext.Provider>
  );
}
