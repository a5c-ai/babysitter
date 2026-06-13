/**
 * KradleControllerClient — browser REST client for the kradle CRD control plane
 * (SPEC-KRADLE-CONTROLPLANE §1, AC1–AC9).
 *
 * Commander stays a static SPA: this client hand-rolls HTTP against the kradle
 * **web BFF routes** (`packages/kradle/web/app/api/...`) exactly as `RealBackend`
 * mirrors the gateway protocol. It does NOT import `@a5c-ai/kradle-sdk`.
 *
 * Testing seam (mirrors `RealBackendDeps`, `realBackend.ts:77`): the `fetch` and
 * the `EventSource` factory are INJECTABLE (constructor options; production
 * default = the ambient browser globals) so the unit tests drive a fake `fetch`
 * + fake `EventSource` with no live kradle and no new dependency (§6 invariant 5).
 *
 * Endpoints (org `<org>` from config; base from `kradleApiUrl`):
 *   - GET  /api/controller?org=<org>                               snapshot (§1.2)
 *   - GET  /api/orgs/<org>/agents/definitions[/<name>]            definitions (§1.3)
 *   - POST/PATCH/DELETE the same                                  definitions CRUD
 *   - POST /api/orgs/<org>/agents/dispatch                        dispatch (§1.4)
 *   - POST /api/orgs/<org>/agents/runs/<name>/cancel             cancel (§1.5)
 *   - GET  /api/orgs/<org>/agents/events/stream  (EventSource)    SSE (§1.6)
 *   - POST /api/orgs/<org>/agents/memory/query                    memory (§1.7)
 *   - POST /api/orgs/<org>/agents/approvals/<name>/decide         approvals (§1.8)
 */

import type { GraphQueryResult, AgentMemoryQuerySpec } from '../../contracts/kradle-memory';

// ---------------------------------------------------------------------------
// Config (the kradle subset of BackendConfig — see config.ts §4.1).
// ---------------------------------------------------------------------------

export interface KradleControllerClientConfig {
  /** Base origin of the kradle web app (e.g. `https://kradle.example.com`). Required. */
  kradleApiUrl: string;
  /** Bearer token; sent as `Authorization: Bearer <token>` when present. */
  kradleToken?: string;
  /** Org slug substituted into `/api/orgs/<org>/...`; default `'default'`. */
  kradleOrg?: string;
  /** Default dispatch repository; default `'default'`. (Used by the Orders layer, later phase.) */
  kradleRepo?: string;
}

// ---------------------------------------------------------------------------
// Injected transport contracts (structural; no dep on lib.dom typings so the
// node-env vitest run can pass fakes without `any` — mirrors `realBackend.ts`).
// ---------------------------------------------------------------------------

/** Minimal structural mirror of `fetch`'s init (the part this client uses). */
export interface KradleFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cache?: string;
  credentials?: string;
  signal?: AbortSignalLike;
}

/** Minimal structural mirror of an `AbortSignal` (the part fetch consumes). */
export interface AbortSignalLike {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void): void;
  removeEventListener?(type: 'abort', listener: () => void): void;
}

/** Minimal structural mirror of a `fetch` `Response`. */
export interface KradleFetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

/** Minimal structural mirror of `fetch`. */
export type KradleFetchLike = (
  input: string,
  init?: KradleFetchInit,
) => Promise<KradleFetchResponseLike>;

/** Minimal structural mirror of a browser `EventSource` (the part we use). */
export interface EventSourceLike {
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onopen?: ((event: unknown) => void) | null;
  close(): void;
}

export type EventSourceFactory = (
  url: string,
  init?: { withCredentials?: boolean },
) => EventSourceLike;

export interface KradleControllerClientDeps {
  /** REST fetch. Default: the ambient `fetch`. */
  fetch?: KradleFetchLike;
  /** SSE `EventSource` factory. Default: the ambient `EventSource` (if any). */
  eventSourceFactory?: EventSourceFactory;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Per-request abort timeout — matches `KRADLE_CONTROLLER_REQUEST_TIMEOUT_MS`
 *  (`packages/kradle/web/app/.../controller-client.js:7`). §1.9 / AC9. */
export const KRADLE_REQUEST_TIMEOUT_MS = 5000;

/** CSRF double-submit token sent on every mutating request (§1.1 / AC1). */
const CSRF_HEADER = 'X-Kradle-Request';
const CSRF_VALUE = 'commander';

const DEFAULT_ORG = 'default';
const BODY_EXCERPT_MAX = 500;

// ---------------------------------------------------------------------------
// Typed failure (mirrors `RealBackendRestError`, `realBackend.ts:93`). §1.9 / AC9.
// ---------------------------------------------------------------------------

export class KradleControlPlaneError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly bodyExcerpt: string;

  constructor(status: number, endpoint: string, bodyExcerpt: string) {
    super(
      `kradle ${endpoint} failed: HTTP ${status}${bodyExcerpt ? ` — ${bodyExcerpt}` : ''}`,
    );
    this.name = 'KradleControlPlaneError';
    this.status = status;
    this.endpoint = endpoint;
    this.bodyExcerpt = bodyExcerpt;
  }
}

// ---------------------------------------------------------------------------
// Response shapes the client returns (typed; never `any`). The model is a wide
// structural view of the §1.2 controller UI model — the mapper (later phase)
// narrows the inner CRD items.
// ---------------------------------------------------------------------------

export interface KradleResourceItem {
  apiVersion?: string;
  kind?: string;
  metadata: { name: string; namespace?: string; labels?: Record<string, string>; creationTimestamp?: string };
  spec?: Record<string, unknown>;
  status?: Record<string, unknown>;
}

export interface KradleResourceCollection<T = KradleResourceItem> {
  count?: number;
  items?: T[];
  active?: T[];
  pending?: T[];
}

export interface KradleControllerSnapshot {
  product?: string;
  status?: 'ready' | 'degraded' | 'unavailable' | string;
  org?: { slug?: string; namespace?: string; displayName?: string };
  orgs?: Array<{ slug?: string; namespace?: string; displayName?: string }>;
  controller?: {
    connection?: { available?: boolean; context?: string | null; errors?: string[] };
  };
  metrics?: Record<string, number>;
  agents?: {
    org?: string;
    stacks?: KradleResourceCollection;
    runs?: KradleResourceCollection;
    rules?: KradleResourceCollection;
    sessions?: KradleResourceCollection;
    workspaces?: KradleResourceCollection;
    approvals?: KradleResourceCollection;
    adapters?: KradleResourceCollection;
    providers?: KradleResourceCollection;
    projects?: KradleResourceCollection;
    gateway?: unknown;
    transcripts?: KradleResourceCollection;
    memoryRepositories?: KradleResourceCollection;
    memorySnapshots?: KradleResourceCollection;
    memoryImports?: KradleResourceCollection;
  };
  resources?: Array<{
    kind?: string;
    plural?: string;
    count?: number;
    names?: string[];
    items?: KradleResourceItem[];
    phases?: Record<string, number>;
    storage?: string;
  }>;
  views?: unknown;
}

/** `GET .../definitions` returns the controller's list result (`{ items }`). */
export interface DefinitionListResult {
  items?: KradleResourceItem[];
}

/** Create/get/patch return `{ resource }` (the BFF wraps the applied resource). */
export interface DefinitionResourceResult {
  resource?: KradleResourceItem;
}

/** The explicit create/patch body the client sends (§1.3.1 / AC3). */
export interface DefinitionWriteBody {
  metadata: { name: string; labels?: Record<string, string> };
  spec: Record<string, unknown>;
}

/** Partial patch body (§1.3 / AC3). */
export interface DefinitionPatchBody {
  metadata?: { labels?: Record<string, string> };
  spec?: Record<string, unknown>;
}

/** The dispatch body (§1.4 / AC4). */
export interface DispatchInput {
  /** Persona identity ref (preferred). */
  agentDefinition?: string;
  /** Legacy AgentStack ref (fallback). At least one of the two is required. */
  agentStack?: string;
  repository?: string;
  ref?: string;
  taskKind?: string;
  actor?: string;
  meetingRef?: string;
}

export interface DispatchResult {
  run?: KradleResourceItem;
  error?: boolean;
  message?: string;
}

export interface CancelRunResult {
  error?: boolean;
  run?: KradleResourceItem;
}

export interface DecideResult {
  resource?: KradleResourceItem;
}

export type ApprovalDecision = 'approve' | 'deny';

/** An SSE frame as forwarded to the subscriber (parsed; `heartbeat` filtered out). */
export interface KradleStreamFrame {
  type: string;
  [key: string]: unknown;
}

export type StreamCallback = (frame: KradleStreamFrame) => void;
export type Unsubscribe = () => void;

// ---------------------------------------------------------------------------
// The client
// ---------------------------------------------------------------------------

export interface KradleControllerClient {
  snapshot(): Promise<KradleControllerSnapshot>;
  listDefinitions(): Promise<DefinitionListResult>;
  createDefinition(body: DefinitionWriteBody): Promise<DefinitionResourceResult>;
  getDefinition(name: string): Promise<DefinitionResourceResult>;
  patchDefinition(name: string, body: DefinitionPatchBody): Promise<DefinitionResourceResult>;
  deleteDefinition(name: string): Promise<unknown>;
  dispatch(input: DispatchInput): Promise<DispatchResult>;
  cancelRun(name: string): Promise<CancelRunResult>;
  queryMemory(spec: AgentMemoryQuerySpec): Promise<GraphQueryResult>;
  decideApproval(name: string, decision: ApprovalDecision, decidedBy?: string): Promise<DecideResult>;
  openEventStream(onFrame: StreamCallback): Unsubscribe;
  /** The resolved org slug (read-only; the Orders layer resolves approval names against it). */
  readonly org: string;
}

function resolveAmbientFetch(): KradleFetchLike {
  const fn = (globalThis as { fetch?: KradleFetchLike }).fetch;
  if (typeof fn !== 'function') {
    throw new Error('KradleControllerClient: no ambient fetch; inject deps.fetch');
  }
  return fn;
}

function resolveAmbientEventSourceFactory(): EventSourceFactory | null {
  const ctor = (
    globalThis as {
      EventSource?: new (url: string, init?: { withCredentials?: boolean }) => EventSourceLike;
    }
  ).EventSource;
  if (typeof ctor !== 'function') return null;
  return (url, init) => new ctor(url, init);
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function createKradleControllerClient(
  config: KradleControllerClientConfig,
  deps: KradleControllerClientDeps = {},
): KradleControllerClient {
  const baseUrl = stripTrailingSlash((config.kradleApiUrl ?? '').trim());
  if (!baseUrl) {
    throw new Error('KradleControllerClient: kradleApiUrl is required');
  }
  const org = (config.kradleOrg ?? '').trim() || DEFAULT_ORG;
  const token = config.kradleToken?.trim() || undefined;
  const fetchImpl = deps.fetch ?? resolveAmbientFetch();
  const eventSourceFactory = deps.eventSourceFactory ?? resolveAmbientEventSourceFactory();

  function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  /**
   * One request with the §1.1 header policy + §1.9 abort timeout. GETs add
   * `cache:'no-store'`; mutating methods add `Content-Type: application/json`
   * + the CSRF header. `credentials:'include'` is always set. Non-2xx → throw
   * a typed `KradleControlPlaneError`.
   */
  async function request<T>(
    endpoint: string,
    method: string,
    body?: unknown,
  ): Promise<T> {
    const upper = method.toUpperCase();
    const isMutating = upper !== 'GET' && upper !== 'HEAD' && upper !== 'OPTIONS';
    const headers = authHeaders();
    const init: KradleFetchInit = {
      method: upper,
      headers,
      credentials: 'include',
    };
    if (isMutating) {
      headers['Content-Type'] = 'application/json';
      headers[CSRF_HEADER] = CSRF_VALUE;
      if (body !== undefined) init.body = JSON.stringify(body);
    } else {
      init.cache = 'no-store';
    }

    const controller = new AbortController();
    init.signal = controller.signal as unknown as AbortSignalLike;
    const timer = setTimeout(() => controller.abort(), KRADLE_REQUEST_TIMEOUT_MS);

    let response: KradleFetchResponseLike;
    try {
      response = await fetchImpl(`${baseUrl}${endpoint}`, init);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let excerpt = '';
      try {
        excerpt = (await response.text()).slice(0, BODY_EXCERPT_MAX);
      } catch {
        excerpt = '';
      }
      throw new KradleControlPlaneError(response.status, endpoint, excerpt);
    }
    return (await response.json()) as T;
  }

  return {
    org,

    snapshot(): Promise<KradleControllerSnapshot> {
      return request<KradleControllerSnapshot>(
        `/api/controller?org=${encodeURIComponent(org)}`,
        'GET',
      );
    },

    listDefinitions(): Promise<DefinitionListResult> {
      return request<DefinitionListResult>(orgPath('/definitions'), 'GET');
    },

    createDefinition(body: DefinitionWriteBody): Promise<DefinitionResourceResult> {
      return request<DefinitionResourceResult>(orgPath('/definitions'), 'POST', body);
    },

    getDefinition(name: string): Promise<DefinitionResourceResult> {
      return request<DefinitionResourceResult>(
        orgPath(`/definitions/${encodeURIComponent(name)}`),
        'GET',
      );
    },

    patchDefinition(name: string, body: DefinitionPatchBody): Promise<DefinitionResourceResult> {
      return request<DefinitionResourceResult>(
        orgPath(`/definitions/${encodeURIComponent(name)}`),
        'PATCH',
        body,
      );
    },

    deleteDefinition(name: string): Promise<unknown> {
      return request<unknown>(orgPath(`/definitions/${encodeURIComponent(name)}`), 'DELETE');
    },

    dispatch(input: DispatchInput): Promise<DispatchResult> {
      return request<DispatchResult>(orgPath('/dispatch'), 'POST', input);
    },

    cancelRun(name: string): Promise<CancelRunResult> {
      // No body — the route reads none (§1.5).
      return request<CancelRunResult>(orgPath(`/runs/${encodeURIComponent(name)}/cancel`), 'POST');
    },

    queryMemory(spec: AgentMemoryQuerySpec): Promise<GraphQueryResult> {
      return request<GraphQueryResult>(orgPath('/memory/query'), 'POST', spec);
    },

    decideApproval(
      name: string,
      decision: ApprovalDecision,
      decidedBy?: string,
    ): Promise<DecideResult> {
      const body = decidedBy ? { decision, decidedBy } : { decision };
      return request<DecideResult>(
        orgPath(`/approvals/${encodeURIComponent(name)}/decide`),
        'POST',
        body,
      );
    },

    openEventStream(onFrame: StreamCallback): Unsubscribe {
      // EventSource cannot set an Authorization header (§1.6) — it relies on the
      // same-site session cookie (withCredentials). When no factory is available
      // (no cookie/ambient EventSource), degrade to a no-op: the boot layer keeps
      // the board live via interval polling (§6.3 / AC6).
      if (!eventSourceFactory) {
        return () => {
          /* polling-only fallback; nothing to tear down */
        };
      }
      const streamUrl = `${baseUrl}${orgPath('/events/stream')}?korg=${encodeURIComponent(org)}`;
      const source = eventSourceFactory(streamUrl, { withCredentials: true });
      source.onmessage = (event: { data: string }) => {
        let frame: KradleStreamFrame;
        try {
          const parsed: unknown = JSON.parse(event.data);
          if (typeof parsed !== 'object' || parsed === null) return;
          const type = (parsed as { type?: unknown }).type;
          if (typeof type !== 'string') return;
          frame = parsed as KradleStreamFrame;
        } catch {
          // Malformed (non-JSON) frame — drop it (§1.6 forward-compat / AC6).
          return;
        }
        if (frame.type === 'heartbeat') return; // ignored (§1.6).
        onFrame(frame);
      };
      return () => source.close();
    },
  };

  function orgPath(suffix: string): string {
    return `/api/orgs/${encodeURIComponent(org)}/agents${suffix}`;
  }
}
