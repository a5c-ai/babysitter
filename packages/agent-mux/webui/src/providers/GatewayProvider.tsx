import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GatewayClient, GatewayProvider as UiGatewayProvider, useGateway } from '@a5c-ai/agent-mux-ui';
import type { AgentRecord } from '@a5c-ai/agent-mux-ui';

type SavedGatewayAuth = {
  gatewayUrl: string;
  token: string;
};

type GatewayAuthContextValue = {
  auth: SavedGatewayAuth | null;
  isAuthenticated: boolean;
  login(input: SavedGatewayAuth): Promise<void>;
  logout(): void;
};

const STORAGE_KEY = 'amux.webui.auth';
const SNAPSHOT_POLL_INTERVAL_MS = 15_000;
const GatewayAuthContext = createContext<GatewayAuthContextValue | null>(null);

function sanitizeGatewayUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function toSocketUrl(gatewayUrl: string): string {
  if (gatewayUrl.startsWith('https://')) return `wss://${gatewayUrl.slice('https://'.length)}`;
  if (gatewayUrl.startsWith('http://')) return `ws://${gatewayUrl.slice('http://'.length)}`;
  return gatewayUrl;
}

function defaultGatewayUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:7878';
  }
  return `${window.location.protocol}//${window.location.host}`;
}

function readStoredAuth(): SavedGatewayAuth | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SavedGatewayAuth;
    if (!parsed.token || !parsed.gatewayUrl) {
      return null;
    }
    return {
      gatewayUrl: sanitizeGatewayUrl(parsed.gatewayUrl),
      token: parsed.token,
    };
  } catch {
    return null;
  }
}

async function validateAuth(input: SavedGatewayAuth): Promise<void> {
  const client = new GatewayClient({
    url: toSocketUrl(input.gatewayUrl),
    token: input.token,
  });
  try {
    await client.connect();
    await client.request({ type: 'agents.list' });
  } finally {
    await client.close();
  }
}

async function fetchAuthorized<T>(gatewayUrl: string, token: string, pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${sanitizeGatewayUrl(gatewayUrl)}${pathname}`, {
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
  const syncInFlightRef = useRef<Promise<void> | null>(null);

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
      return [{
        agent,
        displayName: typeof record['displayName'] === 'string' ? record['displayName'] : agent,
        adapterType: typeof record['adapterType'] === 'string' ? record['adapterType'] : undefined,
        structuredSessionTransport:
          record['structuredSessionTransport'] === 'restart-per-turn' || record['structuredSessionTransport'] === 'persistent'
            ? record['structuredSessionTransport']
            : 'none',
        sessionControlPlane:
          record['sessionControlPlane'] === 'external-host' || record['sessionControlPlane'] === 'mcp-mediated'
            ? record['sessionControlPlane']
            : 'self-managed',
        supportsInteractiveMode: typeof record['supportsInteractiveMode'] === 'boolean' ? record['supportsInteractiveMode'] : undefined,
        canResume: typeof record['canResume'] === 'boolean' ? record['canResume'] : undefined,
      }];
    });
  }

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    async function syncSnapshot(): Promise<void> {
      if (syncInFlightRef.current) {
        return await syncInFlightRef.current;
      }

      const run = (async () => {
        const [agentsResponse, runsResponse, sessionsResponse] = await Promise.allSettled([
          fetchAuthorized<{ agents: unknown[]; agentDescriptors?: unknown[] }>(props.gatewayUrl, props.token, '/api/v1/agents'),
          fetchAuthorized<{ runs: Array<Record<string, unknown>> }>(props.gatewayUrl, props.token, '/api/v1/runs'),
          fetchAuthorized<{ sessions: Array<Record<string, unknown>> }>(props.gatewayUrl, props.token, '/api/v1/sessions'),
        ]);

        if (cancelled) {
          return;
        }

        const actions = store.getState().actions;
        if (agentsResponse.status === 'fulfilled') {
          actions.setAgents(normalizeAgents(agentsResponse.value.agentDescriptors ?? agentsResponse.value.agents));
        }

        for (const run of runsResponse.status === 'fulfilled' ? runsResponse.value.runs : []) {
          const runId = String(run['runId'] ?? '');
          if (!runId) continue;
          actions.mergeRun(runId, run);
          if (typeof run['sessionId'] === 'string') {
            actions.mergeSession(run['sessionId'], {
              agent: run['agent'],
            });
          }
        }

        const activeRunIds = new Set<string>();
        for (const session of sessionsResponse.status === 'fulfilled' ? sessionsResponse.value.sessions : []) {
          const sessionId = typeof session['sessionId'] === 'string' ? session['sessionId'] : '';
          if (!sessionId) {
            continue;
          }
          actions.mergeSession(sessionId, session);
          if (typeof session['activeRunId'] === 'string' && session['activeRunId'].length > 0) {
            activeRunIds.add(session['activeRunId']);
          }
        }

        for (const [runId, unsubscribe] of subscriptionsRef.current.entries()) {
          if (activeRunIds.has(runId)) {
            continue;
          }
          unsubscribe();
          subscriptionsRef.current.delete(runId);
        }

        for (const runId of activeRunIds) {
          if (subscriptionsRef.current.has(runId)) {
            continue;
          }
          subscriptionsRef.current.set(runId, client.subscribeRun(runId));
        }
      })().finally(() => {
        syncInFlightRef.current = null;
      });

      syncInFlightRef.current = run;
      return await run;
    }

    function scheduleNextPoll(): void {
      if (cancelled) {
        return;
      }
      timer = window.setTimeout(async () => {
        try {
          await syncSnapshot();
        } finally {
          scheduleNextPoll();
        }
      }, SNAPSHOT_POLL_INTERVAL_MS);
    }

    void syncSnapshot().finally(() => {
      scheduleNextPoll();
    });

    return () => {
      cancelled = true;
      if (timer != null) {
        window.clearTimeout(timer);
      }
      for (const unsubscribe of subscriptionsRef.current.values()) {
        unsubscribe();
      }
      subscriptionsRef.current.clear();
    };
  }, [client, props.gatewayUrl, props.token, store]);

  return <>{props.children}</>;
}

export function GatewayProvider(props: { children: React.ReactNode }): JSX.Element {
  const [auth, setAuth] = useState<SavedGatewayAuth | null>(() => readStoredAuth());

  const value = useMemo<GatewayAuthContextValue>(
    () => ({
      auth,
      isAuthenticated: auth !== null,
      async login(input) {
        const nextAuth = {
          gatewayUrl: sanitizeGatewayUrl(input.gatewayUrl || defaultGatewayUrl()),
          token: input.token.trim(),
        };
        await validateAuth(nextAuth);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
        setAuth(nextAuth);
      },
      logout() {
        window.localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      },
    }),
    [auth],
  );

  const client = useMemo(() => {
    if (!auth) {
      return null;
    }
    return new GatewayClient({
      url: toSocketUrl(auth.gatewayUrl),
      token: auth.token,
    });
  }, [auth]);

  return (
    <GatewayAuthContext.Provider value={value}>
      {client && auth ? (
        <UiGatewayProvider client={client}>
          <GatewayBootstrap gatewayUrl={auth.gatewayUrl} token={auth.token}>
            {props.children}
          </GatewayBootstrap>
        </UiGatewayProvider>
      ) : (
        props.children
      )}
    </GatewayAuthContext.Provider>
  );
}

export function useGatewayAuth(): GatewayAuthContextValue {
  const value = useContext(GatewayAuthContext);
  if (!value) {
    throw new Error('useGatewayAuth must be used inside the web gateway provider');
  }
  return value;
}

export function useGatewayFetch(): (pathname: string, init?: RequestInit) => Promise<Response> {
  const { auth } = useGatewayAuth();
  return useMemo(
    () => async (pathname: string, init?: RequestInit) => {
      if (!auth) {
        throw new Error('Gateway auth is required');
      }
      return await fetch(`${sanitizeGatewayUrl(auth.gatewayUrl)}${pathname}`, {
        ...init,
        headers: {
          authorization: `Bearer ${auth.token}`,
          ...(init?.headers ?? {}),
        },
      });
    },
    [auth],
  );
}
