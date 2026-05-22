import { createStore, type StoreApi } from 'zustand/vanilla';

import type { GatewayClient } from '../client/GatewayClient.js';

export interface ConnectionSlice {
  status: 'disconnected' | 'connecting' | 'connected';
  error: string | null;
}

export interface AgentRecord {
  agent: string;
  displayName?: string;
  adapterType?: string;
  structuredSessionTransport?: 'none' | 'restart-per-turn' | 'persistent';
  sessionControlPlane?: 'self-managed' | 'external-host' | 'mcp-mediated';
  supportsInteractiveMode?: boolean;
  canResume?: boolean;
  supportsImageInput?: boolean;
  supportsFileAttachments?: boolean;
  approvalModes?: Array<'yolo' | 'prompt' | 'deny'>;
  [key: string]: unknown;
}

export interface RunRecord {
  runId: string;
  status?: string;
  agent?: string;
  [key: string]: unknown;
}

export interface SessionRecord {
  sessionId: string;
  [key: string]: unknown;
}

export interface EventBuffer {
  seqs: number[];
  sources: string[];
  events: Record<string, unknown>[];
}

export interface HookRequestRecord {
  hookRequestId: string;
  runId: string;
  hookKind: string;
  payload: Record<string, unknown>;
  deadlineTs: number;
}

export interface GatewayStoreState {
  client: GatewayClient;
  connection: ConnectionSlice;
  agents: {
    items: string[];
    byId: Record<string, AgentRecord>;
  };
  sessions: {
    byId: Record<string, SessionRecord>;
  };
  runs: {
    byId: Record<string, RunRecord>;
  };
  events: {
    byRunId: Record<string, EventBuffer>;
  };
  hooks: {
    byRunId: Record<string, HookRequestRecord[]>;
  };
  actions: {
    setConnection(status: ConnectionSlice['status'], error?: string | null): void;
    setAgents(items: AgentRecord[]): void;
    mergeSession(sessionId: string, patch: Record<string, unknown>): void;
    mergeRun(runId: string, patch: Record<string, unknown>): void;
    mergeRunEvent(runId: string, seq: number, source: string, event: Record<string, unknown>): void;
    addHookRequest(request: HookRequestRecord): void;
    resolveHookRequest(runId: string, hookRequestId: string): void;
  };
}

function emptyBuffer(): EventBuffer {
  return {
    seqs: [],
    sources: [],
    events: [],
  };
}

function insertBySeq(buffer: EventBuffer, seq: number, source: string, event: Record<string, unknown>): EventBuffer {
  let low = 0;
  let high = buffer.seqs.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const existing = buffer.seqs[mid]!;
    if (existing === seq) return buffer;
    if (existing < seq) low = mid + 1;
    else high = mid;
  }

  return {
    seqs: [...buffer.seqs.slice(0, low), seq, ...buffer.seqs.slice(low)],
    sources: [...buffer.sources.slice(0, low), source, ...buffer.sources.slice(low)],
    events: [...buffer.events.slice(0, low), event, ...buffer.events.slice(low)],
  };
}

export type GatewayStore = StoreApi<GatewayStoreState>;

export function createGatewayStore(client: GatewayClient): GatewayStore {
  return createStore<GatewayStoreState>((set, get) => ({
    client,
    connection: {
      status: 'disconnected',
      error: null,
    },
    agents: {
      items: [],
      byId: {},
    },
    sessions: {
      byId: {},
    },
    runs: {
      byId: {},
    },
    events: {
      byRunId: {},
    },
    hooks: {
      byRunId: {},
    },
    actions: {
      setConnection(status, error = null) {
        set((state) => ({
          ...state,
          connection: {
            status,
            error,
          },
        }));
      },
      setAgents(items) {
        set((state) => ({
          ...state,
          agents: {
            items: items.map((item) => item.agent),
            byId: Object.fromEntries(items.map((item) => [item.agent, item])),
          },
        }));
      },
      mergeSession(sessionId, patch) {
        set((state) => ({
          ...state,
          sessions: {
            byId: {
              ...state.sessions.byId,
              [sessionId]: {
                ...(state.sessions.byId[sessionId] ?? {}),
                sessionId,
                ...patch,
              },
            },
          },
        }));
      },
      mergeRun(runId, patch) {
        set((state) => ({
          ...state,
          runs: {
            byId: {
              ...state.runs.byId,
              [runId]: {
                ...(state.runs.byId[runId] ?? {}),
                runId,
                ...patch,
              },
            },
          },
        }));
      },
      mergeRunEvent(runId, seq, source, event) {
        set((state) => {
          const current = state.events.byRunId[runId] ?? emptyBuffer();
          const next = insertBySeq(current, seq, source, event);
          if (next === current) return state;
          return {
            ...state,
            events: {
              byRunId: {
                ...state.events.byRunId,
                [runId]: next,
              },
            },
          };
        });
      },
      addHookRequest(request) {
        set((state) => ({
          ...state,
          hooks: {
            byRunId: {
              ...state.hooks.byRunId,
              [request.runId]: [
                ...(state.hooks.byRunId[request.runId] ?? []).filter((item) => item.hookRequestId !== request.hookRequestId),
                request,
              ],
            },
          },
        }));
      },
      resolveHookRequest(runId, hookRequestId) {
        set((state) => ({
          ...state,
          hooks: {
            byRunId: {
              ...state.hooks.byRunId,
              [runId]: (state.hooks.byRunId[runId] ?? []).filter((item) => item.hookRequestId !== hookRequestId),
            },
          },
        }));
      },
    },
  }));
}
