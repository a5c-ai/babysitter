import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GatewayClient, GatewayProvider as UiGatewayProvider, useGateway } from '@a5c-ai/agent-mux-ui';
import type { AgentRecord } from '@a5c-ai/agent-mux-ui';

type SavedGatewayAuth = {
  gatewayUrl: string;
  token: string;
};

function normalizeAuth(input: SavedGatewayAuth): SavedGatewayAuth {
  return {
    gatewayUrl: normalizeGatewayUrlCandidate(input.gatewayUrl),
    token: input.token.trim(),
  };
}

type GatewayAuthContextValue = {
  auth: SavedGatewayAuth | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login(input: SavedGatewayAuth): Promise<void>;
  logout(message?: string): void;
};

const STORAGE_KEY = 'amux.webui.auth';
const AUTH_ERROR_STORAGE_KEY = 'amux.webui.auth-error';
const SNAPSHOT_POLL_INTERVAL_MS = 15_000;
const GatewayAuthContext = createContext<GatewayAuthContextValue | null>(null);

class GatewayHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Gateway request failed: ${status}`);
    this.name = 'GatewayHttpError';
    this.status = status;
  }
}

function sanitizeGatewayUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

const GATEWAY_APP_ROUTE_PATTERNS = [
  /\/api\/v1(?:\/.*)?$/i,
  /\/api\/gateway-proxy(?:\/.*)?$/i,
  /\/sessions(?:\/.*)?$/i,
  /\/dispatches(?:\/.*)?$/i,
  /\/runs(?:\/.*)?$/i,
  /\/projects(?:\/.*)?$/i,
  /\/workspaces(?:\/.*)?$/i,
  /\/settings(?:\/.*)?$/i,
  /\/login$/i,
  /\/pair(?:\/.*)?$/i,
];

function normalizeGatewayUrlCandidate(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return sanitizeGatewayUrl(trimmed);
  }

  let normalizedPath = parsed.pathname.replace(/\/+$/, '');
  for (const pattern of GATEWAY_APP_ROUTE_PATTERNS) {
    if (!pattern.test(normalizedPath)) {
      continue;
    }
    normalizedPath = normalizedPath.replace(pattern, '');
    break;
  }

  parsed.pathname = normalizedPath.length > 0 ? normalizedPath : '/';
  parsed.search = '';
  parsed.hash = '';
  return sanitizeGatewayUrl(parsed.toString());
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
    return normalizeAuth(parsed);
  } catch {
    return null;
  }
}

function authFingerprint(auth: SavedGatewayAuth): string {
  return `${sanitizeGatewayUrl(auth.gatewayUrl)}\n${auth.token}`;
}

function persistAuthError(message?: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (message && message.length > 0) {
    window.sessionStorage.setItem(AUTH_ERROR_STORAGE_KEY, message);
  } else {
    window.sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
  }
}

export function readPersistedAuthError(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = window.sessionStorage.getItem(AUTH_ERROR_STORAGE_KEY);
  return value && value.length > 0 ? value : null;
}

function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof GatewayHttpError) {
    return error.status === 401;
  }
  return error instanceof Error && /\b401\b/.test(error.message);
}

async function validateAuth(input: SavedGatewayAuth): Promise<void> {
  const normalized = normalizeAuth(input);
  const client = new GatewayClient({
    url: toSocketUrl(normalized.gatewayUrl),
    token: normalized.token,
  });
  try {
    await client.connect();
    await client.request({ type: 'agents.list' });
  } finally {
    await client.close();
  }
}

async function fetchAuthorized<T>(gatewayUrl: string, token: string, pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${sanitizeGatewayUrl(normalizeGatewayUrlCandidate(gatewayUrl))}${pathname}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new GatewayHttpError(response.status);
  }

  return (await response.json()) as T;
}

function GatewayBootstrap(props: {
  gatewayUrl: string;
  token: string;
  onAuthFailure(message?: string): void;
  children: React.ReactNode;
}): JSX.Element {
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
        supportsImageInput: typeof record['supportsImageInput'] === 'boolean' ? record['supportsImageInput'] : undefined,
        supportsFileAttachments: typeof record['supportsFileAttachments'] === 'boolean' ? record['supportsFileAttachments'] : undefined,
        approvalModes: Array.isArray(record['approvalModes'])
          ? record['approvalModes'].filter(
              (mode): mode is 'yolo' | 'prompt' | 'deny' => mode === 'yolo' || mode === 'prompt' || mode === 'deny',
            )
          : undefined,
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
        const [agentsResponse, dispatchesResponse, sessionsResponse] = await Promise.allSettled([
          fetchAuthorized<{ agents: unknown[]; agentDescriptors?: unknown[] }>(props.gatewayUrl, props.token, '/api/v1/agents'),
          fetchAuthorized<{ dispatches?: Array<Record<string, unknown>>; runs?: Array<Record<string, unknown>> }>(
            props.gatewayUrl,
            props.token,
            '/api/v1/dispatches',
          ),
          fetchAuthorized<{ sessions: Array<Record<string, unknown>> }>(props.gatewayUrl, props.token, '/api/v1/sessions'),
        ]);

        if (cancelled) {
          return;
        }

        const rejectedResponses = [agentsResponse, dispatchesResponse, sessionsResponse].filter(
          (response): response is PromiseRejectedResult => response.status === 'rejected',
        );
        if (rejectedResponses.some((response) => isUnauthorizedError(response.reason))) {
          props.onAuthFailure('Stored gateway access expired or was rejected. Connect again.');
          return;
        }

        const actions = store.getState().actions;
        if (agentsResponse.status === 'fulfilled') {
          actions.setAgents(normalizeAgents(agentsResponse.value.agentDescriptors ?? agentsResponse.value.agents));
        }

        const dispatches =
          dispatchesResponse.status === 'fulfilled'
            ? dispatchesResponse.value.dispatches ?? dispatchesResponse.value.runs ?? []
            : [];
        for (const run of dispatches) {
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
  const [isReady, setIsReady] = useState(() => auth === null);
  const [validatedFingerprint, setValidatedFingerprint] = useState<string | null>(null);

  const clearAuth = useCallback((message?: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    persistAuthError(message);
    setValidatedFingerprint(null);
    setAuth(null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const normalized = normalizeAuth(auth);
    const serialized = JSON.stringify(normalized);
    if (window.localStorage.getItem(STORAGE_KEY) !== serialized) {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    }
    if (normalized.gatewayUrl !== auth.gatewayUrl || normalized.token !== auth.token) {
      setAuth(normalized);
    }
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      setIsReady(true);
      return;
    }

    const nextFingerprint = authFingerprint(auth);
    if (validatedFingerprint === nextFingerprint) {
      setIsReady(true);
      return;
    }

    let cancelled = false;
    setIsReady(false);
    void validateAuth(auth)
      .then(() => {
        if (cancelled) {
          return;
        }
        persistAuthError();
        setValidatedFingerprint(nextFingerprint);
        setIsReady(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        clearAuth('Stored gateway access expired or was rejected. Connect again.');
      });

    return () => {
      cancelled = true;
    };
  }, [auth, clearAuth, validatedFingerprint]);

  const value = useMemo<GatewayAuthContextValue>(
    () => ({
      auth,
      isAuthenticated: auth !== null && isReady,
      isReady,
      async login(input) {
        const nextAuth = normalizeAuth({
          gatewayUrl: input.gatewayUrl || defaultGatewayUrl(),
          token: input.token,
        });
        await validateAuth(nextAuth);
        persistAuthError();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
        setValidatedFingerprint(authFingerprint(nextAuth));
        setIsReady(true);
        setAuth(nextAuth);
      },
      logout(message?: string) {
        clearAuth(message);
      },
    }),
    [auth, clearAuth, isReady],
  );

  const client = useMemo(() => {
    if (!auth || !isReady) {
      return null;
    }
    const normalized = normalizeAuth(auth);
    return new GatewayClient({
      url: toSocketUrl(normalized.gatewayUrl),
      token: normalized.token,
    });
  }, [auth, isReady]);

  return (
    <GatewayAuthContext.Provider value={value}>
      {client && auth && isReady ? (
        <UiGatewayProvider client={client}>
          <GatewayBootstrap
            gatewayUrl={normalizeGatewayUrlCandidate(auth.gatewayUrl)}
            token={auth.token.trim()}
            onAuthFailure={clearAuth}
          >
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
  const { auth, logout } = useGatewayAuth();
  return useMemo(
    () => async (pathname: string, init?: RequestInit) => {
      if (!auth) {
        throw new Error('Gateway auth is required');
      }
      const normalized = normalizeAuth(auth);
      const response = await fetch(`${sanitizeGatewayUrl(normalized.gatewayUrl)}${pathname}`, {
        ...init,
        headers: {
          authorization: `Bearer ${normalized.token}`,
          ...(init?.headers ?? {}),
        },
      });
      if (response.status === 401) {
        logout('Stored gateway access expired or was rejected. Connect again.');
      }
      return response;
    },
    [auth, logout],
  );
}
