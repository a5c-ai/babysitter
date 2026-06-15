/**
 * KradleControllerClient — browser REST client for the kradle CRD control plane
 * (SPEC-KRADLE-MODEL §3, AC4).
 *
 * Commander stays a static SPA: this client hand-rolls HTTP against the **live,
 * org-scoped** kradle web BFF routes (`packages/kradle/web/app/api/...`) exactly
 * as `RealBackend` mirrors the gateway protocol. It does NOT import
 * `@a5c-ai/kradle-sdk` (AC7) — it mirrors the SDK's surface.
 *
 * Two resource gateways exist; the SPEC distinguishes LIVE from PROPOSED-only.
 * Commander targets the **live org-scoped** routes; the `/api/controller/resources*`
 * alias and the typed `runs/<run>/{resume,fork,continue}` actions are PROPOSED and
 * are surfaced as gated, typed methods that throw `KradleProposedRouteError`
 * rather than inventing a live route (SPEC §3 / AC4).
 *
 * Testing seam (mirrors `RealBackendDeps`, `realBackend.ts:77`): the `fetch` and
 * the `EventSource` factory are INJECTABLE (constructor options; production
 * default = the ambient browser globals) so the unit tests drive a fake `fetch`
 * + fake `EventSource` with no live kradle and no new dependency.
 *
 * Endpoints (org `<org>` from config; base from `kradleApiUrl`):
 *   LIVE — generic CRD gateway (SPEC §3.1):
 *     - GET    /api/controller?org=<org>                          snapshot
 *     - GET    /api/orgs/<org>/resources?kind=<Kind>[&limit&offset] list a kind
 *     - POST   /api/orgs/<org>/resources                          apply (create/update)
 *     - GET    /api/orgs/<org>/resources/<kind>/<name>            read one
 *     - DELETE /api/orgs/<org>/resources/<kind>/<name>           delete one
 *   LIVE — /api/agents/* actions (SPEC §3.2):
 *     - GET/POST/PATCH/DELETE /api/orgs/<org>/agents/definitions[/<name>] persona path
 *     - POST   /api/orgs/<org>/agents/dispatch                    dispatch (by stack)
 *     - POST   /api/orgs/<org>/agents/runs/<name>/cancel          cancel (no body)
 *     - POST   /api/orgs/<org>/agents/approvals/<name>/decide     approval decide
 *     - POST   /api/orgs/<org>/agents/memory/query                memory query
 *   LIVE — watch / SSE (SPEC §3.3):
 *     - GET    /api/orgs/<org>/agents/events/stream  (EventSource) aggregated stream
 *     - GET    /api/watch/orgs/<org>/<plural>        (EventSource) generic CRD watch
 *   PROPOSED — typed, gated, NOT live (SPEC §3.2; throw KradleProposedRouteError):
 *     - POST   /api/orgs/<org>/agents/runs/<name>/{resume,fork,continue}
 *     - GET/POST /api/controller/resources*  (the controller-path alias)
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

/**
 * The dispatch body (SPEC §3.2/§3.4 / AC4). The live route accepts EITHER an
 * `agentStack`/`stackRef` (legacy AgentStack path, Commander's default — it has
 * no persona system) OR an `agentDefinition` (persona identity path). At least
 * one of the three is required (`dispatch/route.js:16`). All three keys are
 * mirrored so the Orders layer can dispatch by stack and a future persona
 * feature can dispatch by definition.
 */
export interface DispatchInput {
  /** Legacy AgentStack name — Commander's default dispatch key (§3.4). */
  agentStack?: string;
  /** Alias the live route also accepts for the AgentStack (`body.stackRef`). */
  stackRef?: string;
  /** Persona identity ref (the `AgentDefinition` path). */
  agentDefinition?: string;
  repository?: string;
  ref?: string;
  taskKind?: string;
  actor?: string;
  meetingRef?: string;
}

export interface DispatchResult {
  run?: KradleResourceItem;
  /** The first `AgentDispatchAttempt`, when the route surfaces it (SPEC §3.2). */
  attempt?: KradleResourceItem;
  /** Optional follow-on links (SPEC §3.2 — `{run, attempt?, links?}`). */
  links?: DispatchLinks;
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
// Generic CRD gateway (SPEC §3.1) — `/api/orgs/<org>/resources*`.
// ---------------------------------------------------------------------------

/**
 * `GET /api/orgs/<org>/resources?kind=<Kind>` result. Without `limit` the route
 * returns the raw controller list (`{ items }`); with `limit` it returns the
 * paginated envelope (`orgs/[org]/resources/route.js:16-34`). Both are modelled.
 */
export interface ResourceListResult<T = KradleResourceItem> {
  items?: T[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
}

/** Optional pagination for `listResources` (SPEC §3.1). */
export interface ResourceListOptions {
  limit?: number;
  offset?: number;
}

/**
 * The full resource body POSTed to apply a kind (SPEC §3.1). The server scopes
 * it (injects `metadata.namespace`, the `kradle.a5c.ai/org` label and
 * `spec.organizationRef`), so the client MUST NOT send those server-forced
 * fields (`orgs/[org]/resources/route.js:46-49`).
 */
export interface ResourceApplyBody {
  apiVersion?: string;
  kind: string;
  metadata: { name: string; labels?: Record<string, string> };
  spec: Record<string, unknown>;
}

/** `POST /api/orgs/<org>/resources` → `{ resource }` (the applied resource). */
export interface ResourceApplyResult {
  resource?: KradleResourceItem;
}

/** The dispatch result also surfaces the first attempt + links (SPEC §3.2). */
export interface DispatchLinks {
  [key: string]: unknown;
}

/** The doc plurals the generic CRD watch accepts (SPEC §3.3). */
export type KradleWatchPlural =
  | 'agentdispatchruns'
  | 'agentdispatchattempts'
  | 'agentsessions'
  | 'agentapprovals'
  | 'kradleworkspaces'
  | 'agenttriggerrules';

/** The reason a run-lifecycle action is gated (SPEC §3.2 — proposed routes). */
export type RunActionReason =
  | 'initial'
  | 'retry'
  | 'resume'
  | 'repair'
  | 'rerun-after-fix'
  | 'continuation';

/** The body of a proposed `resume`/`fork`/`continue` action (SPEC §3.2). */
export interface RunActionInput {
  reason?: RunActionReason;
  message?: string;
  expectedGeneration?: number;
}

/**
 * Thrown by the typed, PROPOSED-only run-lifecycle methods
 * (`resumeRun`/`forkRun`/`continueRun`) and the `/api/controller/resources`
 * alias. The SPEC marks these as not-live (`api-contract-spec.md:152-154`,
 * E-RUNACTIONS); Commander documents the gap rather than inventing a live route.
 * The UI gates the action (disabled with a "kradle-gap" tooltip) so this is
 * never reached at runtime, but the method exists + is typed for the day the
 * route ships.
 */
export class KradleProposedRouteError extends Error {
  readonly action: string;
  constructor(action: string) {
    super(
      `kradle ${action} is a proposed (not-live) route — gated per SPEC §3.2 / E-RUNACTIONS`,
    );
    this.name = 'KradleProposedRouteError';
    this.action = action;
  }
}

// ---------------------------------------------------------------------------
// The client
// ---------------------------------------------------------------------------

export interface KradleControllerClient {
  snapshot(): Promise<KradleControllerSnapshot>;

  // --- generic CRD gateway (LIVE, SPEC §3.1) --------------------------------
  /** `GET /api/orgs/<org>/resources?kind=<Kind>` — list one kind. */
  listResources(kind: string, options?: ResourceListOptions): Promise<ResourceListResult>;
  /** `POST /api/orgs/<org>/resources` — apply (create/update) a full resource. */
  applyResource(body: ResourceApplyBody): Promise<ResourceApplyResult>;
  /** `GET /api/orgs/<org>/resources/<kind>/<name>` — read one. */
  getResource(kind: string, name: string): Promise<ResourceApplyResult>;
  /** `DELETE /api/orgs/<org>/resources/<kind>/<name>` — delete one. */
  deleteResource(kind: string, name: string): Promise<unknown>;

  // --- /api/agents/* persona definitions (LIVE, SPEC §3.2) ------------------
  listDefinitions(): Promise<DefinitionListResult>;
  createDefinition(body: DefinitionWriteBody): Promise<DefinitionResourceResult>;
  getDefinition(name: string): Promise<DefinitionResourceResult>;
  patchDefinition(name: string, body: DefinitionPatchBody): Promise<DefinitionResourceResult>;
  deleteDefinition(name: string): Promise<unknown>;

  // --- /api/agents/* run actions (LIVE, SPEC §3.2) --------------------------
  dispatch(input: DispatchInput): Promise<DispatchResult>;
  cancelRun(name: string): Promise<CancelRunResult>;
  /** Retry = re-dispatch with the run's stack (`run-actions.jsx:187`). LIVE. */
  retryRun(input: DispatchInput): Promise<DispatchResult>;
  queryMemory(spec: AgentMemoryQuerySpec): Promise<GraphQueryResult>;
  decideApproval(name: string, decision: ApprovalDecision, decidedBy?: string): Promise<DecideResult>;

  // --- PROPOSED run-lifecycle actions (NOT live, SPEC §3.2; gated) ----------
  /** PROPOSED — throws `KradleProposedRouteError` until the route ships. */
  resumeRun(name: string, input?: RunActionInput): Promise<DispatchResult>;
  /** PROPOSED — throws `KradleProposedRouteError` until the route ships. */
  forkRun(name: string, input?: RunActionInput): Promise<DispatchResult>;
  /** PROPOSED — throws `KradleProposedRouteError` until the route ships. */
  continueRun(name: string, input?: RunActionInput): Promise<DispatchResult>;

  // --- watch / SSE (LIVE, SPEC §3.3) ----------------------------------------
  /** The aggregated agent event stream (`…/agents/events/stream`). */
  openEventStream(onFrame: StreamCallback): Unsubscribe;
  /** The generic CRD watch (`/api/watch/orgs/<org>/<plural>`). */
  openResourceWatch(plural: KradleWatchPlural, onFrame: StreamCallback): Unsubscribe;

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

    // --- generic CRD gateway (LIVE, SPEC §3.1) -------------------------------
    listResources(kind: string, options?: ResourceListOptions): Promise<ResourceListResult> {
      const params = new URLSearchParams({ kind });
      if (options?.limit !== undefined) params.set('limit', String(options.limit));
      if (options?.offset !== undefined) params.set('offset', String(options.offset));
      return request<ResourceListResult>(`${resourcesPath()}?${params.toString()}`, 'GET');
    },

    applyResource(body: ResourceApplyBody): Promise<ResourceApplyResult> {
      return request<ResourceApplyResult>(resourcesPath(), 'POST', body);
    },

    getResource(kind: string, name: string): Promise<ResourceApplyResult> {
      return request<ResourceApplyResult>(
        `${resourcesPath()}/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`,
        'GET',
      );
    },

    deleteResource(kind: string, name: string): Promise<unknown> {
      return request<unknown>(
        `${resourcesPath()}/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`,
        'DELETE',
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
      // No body — the route reads none (SPEC §3.2).
      return request<CancelRunResult>(orgPath(`/runs/${encodeURIComponent(name)}/cancel`), 'POST');
    },

    retryRun(input: DispatchInput): Promise<DispatchResult> {
      // Retry = re-dispatch with the run's stack (`run-actions.jsx:187`); the
      // typed `…/runs/<run>/retry` route is proposed-only (SPEC §3.2).
      return request<DispatchResult>(orgPath('/dispatch'), 'POST', input);
    },

    // PROPOSED (not live, SPEC §3.2): gated so the UI can wire the action and
    // surface the kradle gap, without inventing a live route. Async-throwing so
    // the call site's `.catch` (fire-and-forget Orders) handles it uniformly.
    resumeRun(_name: string, _input?: RunActionInput): Promise<DispatchResult> {
      return Promise.reject(new KradleProposedRouteError('runs/<run>/resume'));
    },
    forkRun(_name: string, _input?: RunActionInput): Promise<DispatchResult> {
      return Promise.reject(new KradleProposedRouteError('runs/<run>/fork'));
    },
    continueRun(_name: string, _input?: RunActionInput): Promise<DispatchResult> {
      return Promise.reject(new KradleProposedRouteError('runs/<run>/continue'));
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
      // The aggregated agent event stream (SPEC §3.3). Frames are typed objects;
      // a `type` field is required and `heartbeat` is ignored.
      return openSse(
        `${baseUrl}${orgPath('/events/stream')}?korg=${encodeURIComponent(org)}`,
        onFrame,
        true,
      );
    },

    openResourceWatch(plural: KradleWatchPlural, onFrame: StreamCallback): Unsubscribe {
      // The generic CRD watch (SPEC §3.3): `/api/watch/orgs/<org>/<plural>`.
      // Frames are a `SYNC` object then per-resource line frames (raw JSON that
      // may lack a `type`); forward any object frame, `heartbeat` still ignored.
      return openSse(
        `${baseUrl}/api/watch/orgs/${encodeURIComponent(org)}/${encodeURIComponent(plural)}`,
        onFrame,
        false,
      );
    },
  };

  /**
   * Open one SSE stream against `url`. `requireType` controls the frame policy:
   * the aggregated stream requires a string `type` (dropping untyped frames),
   * the generic CRD watch forwards any parsed object frame. `heartbeat` frames
   * are always dropped. EventSource cannot set an Authorization header — it
   * relies on the same-site session cookie (withCredentials). When no factory is
   * available, degrade to a no-op (the boot layer keeps the board live via
   * interval polling, SPEC §3.3 / AC4).
   */
  function openSse(url: string, onFrame: StreamCallback, requireType: boolean): Unsubscribe {
    if (!eventSourceFactory) {
      return () => {
        /* polling-only fallback; nothing to tear down */
      };
    }
    const source = eventSourceFactory(url, { withCredentials: true });
    source.onmessage = (event: { data: string }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        // Malformed (non-JSON) frame — drop it (forward-compat / AC4).
        return;
      }
      if (typeof parsed !== 'object' || parsed === null) return;
      const type = (parsed as { type?: unknown }).type;
      if (requireType && typeof type !== 'string') return;
      if (type === 'heartbeat') return; // ignored.
      // The frame is at least an object; surface it (typed where present).
      const frame: KradleStreamFrame =
        typeof type === 'string'
          ? (parsed as KradleStreamFrame)
          : { type: 'resource', ...(parsed as Record<string, unknown>) };
      onFrame(frame);
    };
    return () => source.close();
  }

  function orgPath(suffix: string): string {
    return `/api/orgs/${encodeURIComponent(org)}/agents${suffix}`;
  }

  function resourcesPath(): string {
    return `/api/orgs/${encodeURIComponent(org)}/resources`;
  }
}
