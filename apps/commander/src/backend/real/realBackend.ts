/**
 * RealBackend — live `CommanderBackend` over gateway protocol v1 (SPEC-LIVE-BACKEND
 * §2/§3/§6). WebSocket transport + REST list surface. The deterministic mock
 * (`../mock/mockBackend.ts`) remains the default boot path; this is the strictly
 * additive real path, selected only by explicit config (§5).
 *
 * Testing seam: the WebSocket factory and `fetch` are INJECTABLE (constructor
 * options; production default = the ambient browser globals) so the unit tests
 * drive a hand-rolled fake socket + stub fetch with no live gateway and no new
 * dependency (§8 testing seams, AC12).
 *
 * Board / release-rail / editor / roster verbs are NOT `ClientFrame`s in protocol
 * v1 (documented gap §6/AC7): RealBackend exposes the same public method names as
 * MockBackend so the boot seam's `views=`/orders plumbing keeps type-checking, but
 * each is a safe no-op returning the type-appropriate empty value with no I/O.
 */

import type {
  AgentSummary,
  ClientFrame,
  ProtocolVersion,
  RunEntry,
  ServerFrame,
  SessionEntry,
  SubscribeFrame,
  UnsubscribeFrame,
  SessionSubscribeFrame,
  SessionUnsubscribeFrame,
} from '../../contracts/gateway-protocol';
import type { CommanderTask } from '../../contracts/kradle-resources';
import type { KradleAgentStackInput } from '../../contracts/kradle-stack';
import type { CommanderBackend } from '../types';
import type { BackendConfig } from '../config';
import type { ColumnId, UpdateTaskPatch, RosterRole } from '../mock/simulation';
import type { TaskKind } from '../mock/scenario';

/** The supported protocol version this client speaks (asserted in `hello`). */
const PROTOCOL_VERSION: ProtocolVersion = '1';

const DEFAULT_PING_INTERVAL_MS = 15_000;
const DEFAULT_PONG_TIMEOUT_MS = 10_000;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 30_000;
const OUTBOUND_BUFFER_CAP = 256;

// ---------------------------------------------------------------------------
// Injected transport contracts (structural; no dep on lib.dom typings so the
// node-env vitest run can pass a fake without `any`).
// ---------------------------------------------------------------------------

/** Minimal structural mirror of a browser `WebSocket` (the part we use). */
export interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  readyState: number;
  onopen: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

/** Minimal structural mirror of `fetch` (the part the REST surface uses). */
export type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> },
) => Promise<FetchResponseLike>;

export interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export interface RealBackendDeps {
  /** WebSocket factory. Default: `(url) => new WebSocket(url)`. */
  webSocketFactory?: WebSocketFactory;
  /** REST fetch. Default: the ambient `fetch`. */
  fetch?: FetchLike;
}

type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'ready'
  | 'reconnecting'
  | 'disconnected';

/** Typed REST failure (status + body excerpt) so callers can narrow (§3). */
export class RealBackendRestError extends Error {
  readonly status: number;

  constructor(resource: string, status: number, bodyExcerpt: string) {
    super(`GET ${resource} failed: HTTP ${status}${bodyExcerpt ? ` — ${bodyExcerpt}` : ''}`);
    this.name = 'RealBackendRestError';
    this.status = status;
  }
}

function defaultWebSocketFactory(url: string): WebSocketLike {
  const ctor = (globalThis as { WebSocket?: new (url: string) => WebSocketLike }).WebSocket;
  if (typeof ctor !== 'function') {
    throw new Error('RealBackend: no ambient WebSocket; inject webSocketFactory');
  }
  return new ctor(url);
}

function defaultFetch(): FetchLike {
  const fn = (globalThis as { fetch?: FetchLike }).fetch;
  if (typeof fn !== 'function') {
    throw new Error('RealBackend: no ambient fetch; inject fetch');
  }
  return fn;
}

/** Swap a ws/wss gateway URL to its http/https REST origin (§3). */
function deriveRestBaseUrl(gatewayUrl: string): string {
  const url = new URL(gatewayUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : url.protocol === 'ws:' ? 'http:' : url.protocol;
  url.pathname = '';
  url.search = '';
  url.hash = '';
  // `origin` is the scheme+host (no trailing slash) — exactly the REST base.
  return url.origin;
}

/** Narrow an unknown parsed payload to a `ServerFrame` by its string `type`. */
const SERVER_FRAME_TYPES = new Set<string>([
  'hello',
  'error',
  'pong',
  'run.event',
  'hook.request',
  'hook.resolved',
  'pairing.consumed',
]);

function asServerFrame(value: unknown): ServerFrame | null {
  if (typeof value !== 'object' || value === null) return null;
  const type = (value as { type?: unknown }).type;
  if (typeof type !== 'string' || !SERVER_FRAME_TYPES.has(type)) return null;
  return value as ServerFrame;
}

export class RealBackend implements CommanderBackend {
  private readonly config: BackendConfig;
  private readonly gatewayUrl: string;
  private readonly token: string;
  private readonly restBaseUrl: string;
  private readonly webSocketFactory: WebSocketFactory;
  private readonly fetchImpl: FetchLike;

  private readonly pingIntervalMs: number;
  private readonly pongTimeoutMs: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly maxReconnectAttempts: number | undefined;

  private state: ConnectionState = 'idle';
  private socket: WebSocketLike | null = null;
  private readonly subscribers = new Set<(frame: ServerFrame) => void>();

  /** Active run subscriptions → highest observed seq (for `sinceSeq` replay). */
  private readonly runSubscriptions = new Map<string, number>();
  /** Active session subscriptions. */
  private readonly sessionSubscriptions = new Set<string>();
  /** FIFO of frames queued while not `ready` (bounded, drop-oldest). */
  private outboundBuffer: ClientFrame[] = [];

  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;

  /** Resolve/reject of the in-flight `connect()` promise (handshake gate). */
  private pendingConnect: { resolve: () => void; reject: (err: Error) => void } | null = null;
  private readonly warnedVerbs = new Set<string>();

  constructor(config: BackendConfig, deps: RealBackendDeps = {}) {
    if (config.gatewayUrl === undefined || config.token === undefined) {
      throw new Error('RealBackend requires a resolved real config (gatewayUrl + token)');
    }
    this.config = config;
    this.gatewayUrl = config.gatewayUrl;
    this.token = config.token;
    this.restBaseUrl = deriveRestBaseUrl(config.gatewayUrl);
    this.webSocketFactory = deps.webSocketFactory ?? defaultWebSocketFactory;
    this.fetchImpl = deps.fetch ?? defaultFetch();

    this.pingIntervalMs = config.pingIntervalMs ?? DEFAULT_PING_INTERVAL_MS;
    this.pongTimeoutMs = config.pongTimeoutMs ?? DEFAULT_PONG_TIMEOUT_MS;
    this.baseDelayMs = config.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.maxDelayMs = config.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    this.maxReconnectAttempts = config.maxReconnectAttempts;
  }

  // --- connection lifecycle (§2.2) ------------------------------------------

  connect(): Promise<void> {
    // Idempotent: a second connect() while connected/connecting resolves
    // without opening a new socket (mirror the mock's `if (connected) return`).
    if (this.state === 'ready') return Promise.resolve();
    if (this.state === 'connecting' || this.state === 'authenticating') {
      return new Promise<void>((resolve, reject) => {
        const prior = this.pendingConnect;
        this.pendingConnect = {
          resolve: () => {
            prior?.resolve();
            resolve();
          },
          reject: (err) => {
            prior?.reject(err);
            reject(err);
          },
        };
      });
    }

    return new Promise<void>((resolve, reject) => {
      this.pendingConnect = { resolve, reject };
      this.openSocket();
    });
  }

  private openSocket(): void {
    this.state = 'connecting';
    let socket: WebSocketLike;
    try {
      socket = this.webSocketFactory(this.gatewayUrl);
    } catch (error) {
      this.failConnect(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    this.socket = socket;

    socket.onopen = (): void => {
      // Send auth immediately over the raw socket; enter `authenticating`.
      this.state = 'authenticating';
      this.writeToSocket({ type: 'auth', token: this.token });
    };
    socket.onmessage = (event): void => {
      this.handleRawMessage(event.data);
    };
    socket.onerror = (): void => {
      this.handleSocketDown();
    };
    socket.onclose = (): void => {
      this.handleSocketDown();
    };
  }

  private handleRawMessage(raw: unknown): void {
    let parsed: unknown;
    try {
      if (typeof raw !== 'string') {
        // Some sockets deliver non-string payloads; only strings are valid here.
        parsed = JSON.parse(String(raw));
      } else {
        parsed = JSON.parse(raw);
      }
    } catch {
      // Unparseable: drop, do not fan out, keep the socket open (§2.4).
      return;
    }
    const frame = asServerFrame(parsed);
    if (frame === null) return; // unknown discriminant → forward-compat drop (§2.4)

    // Handshake gating: the first `hello` transitions us to `ready` (§2.2).
    if (frame.type === 'hello' && this.state === 'authenticating') {
      if (!frame.protocolVersions.includes(PROTOCOL_VERSION)) {
        const err = new Error(
          `gateway does not support protocol v${PROTOCOL_VERSION} (got ${frame.protocolVersions.join(',')})`,
        );
        this.teardownSocket();
        this.failConnect(err);
        return;
      }
      this.becomeReady();
      // hello is still fanned out below (the handshake is observable, §2.2).
    }

    // Keepalive watchdog consumes pong (also fanned out, harmless §2.7).
    if (frame.type === 'pong') {
      this.clearPongTimer();
    }

    // Track per-run sinceSeq from inbound run.event frames (§2.8).
    if (frame.type === 'run.event') {
      const prev = this.runSubscriptions.get(frame.runId);
      if (prev !== undefined && frame.seq > prev) {
        this.runSubscriptions.set(frame.runId, frame.seq);
      }
    }

    this.fanOut(frame);
  }

  private becomeReady(): void {
    this.state = 'ready';
    this.reconnectAttempt = 0;
    this.startKeepalive();
    // Re-subscribe active runs/sessions (empty on first connect; matters on
    // reconnect §2.7/§2.8), then flush the outbound buffer (§2.5).
    this.resubscribeAll();
    this.flushOutbound();
    const pending = this.pendingConnect;
    this.pendingConnect = null;
    pending?.resolve();
  }

  private resubscribeAll(): void {
    for (const [runId, sinceSeq] of this.runSubscriptions) {
      // Replay only the gap: send the highest seq observed for this run. When
      // nothing has been observed yet (-1 sentinel) omit sinceSeq → full replay.
      const frame: SubscribeFrame =
        sinceSeq >= 0 ? { type: 'subscribe', runId, sinceSeq } : { type: 'subscribe', runId };
      this.writeToSocket(frame);
    }
    for (const sessionId of this.sessionSubscriptions) {
      const frame: SessionSubscribeFrame = { type: 'session.subscribe', sessionId };
      this.writeToSocket(frame);
    }
  }

  /** Socket went down (close/error/pong-timeout). Reconnect unless disconnected. */
  private handleSocketDown(): void {
    if (this.state === 'disconnected') return;

    // Pre-hello failure: reject the in-flight connect() loudly (§2.2 step 4).
    if (this.state === 'connecting' || this.state === 'authenticating') {
      this.teardownSocket();
      this.failConnect(new Error('gateway socket closed before hello'));
      return;
    }

    // A `ready` socket dropped unexpectedly → enter backoff reconnect (§2.8).
    if (this.state === 'ready' || this.state === 'reconnecting') {
      this.teardownSocket();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.state = 'reconnecting';
    if (
      this.maxReconnectAttempts !== undefined &&
      this.reconnectAttempt >= this.maxReconnectAttempts
    ) {
      this.state = 'disconnected';
      return;
    }
    const exp = Math.min(this.baseDelayMs * 2 ** this.reconnectAttempt, this.maxDelayMs);
    // Full jitter (allowed in the real path — determinism applies to the mock
    // only, AC2/AC6). `Math.random` is acceptable here.
    const delay = Math.random() * exp;
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.state !== 'reconnecting') return;
      this.openSocket();
    }, delay);
  }

  private failConnect(err: Error): void {
    this.state = 'disconnected';
    const pending = this.pendingConnect;
    this.pendingConnect = null;
    pending?.reject(err);
  }

  // --- send + outbound buffering (§2.3/§2.5) ---------------------------------

  send(frame: ClientFrame): void {
    // Bookkeeping: track subscription intent so reconnect can replay it. The
    // frame is still forwarded unchanged — this is the ONLY frame-specific
    // logic in send() (§2.8).
    const isSubscriptionFrame = this.trackSubscription(frame);

    if (this.state === 'ready') {
      this.writeToSocket(frame);
      return;
    }
    // Not ready. Subscription frames are replayed from the tracked set by the
    // post-hello re-subscribe step (§2.7), so buffering them too would
    // double-send on the next ready — track only, do not buffer. All OTHER
    // frames go into the bounded FIFO for flush on next ready (§2.5).
    if (isSubscriptionFrame) return;
    this.outboundBuffer.push(frame);
    if (this.outboundBuffer.length > OUTBOUND_BUFFER_CAP) {
      this.outboundBuffer.shift();
    }
  }

  /** Returns true iff the frame is a (run/session) subscription-class frame. */
  private trackSubscription(frame: ClientFrame): boolean {
    switch (frame.type) {
      case 'subscribe': {
        const f = frame as SubscribeFrame;
        if (!this.runSubscriptions.has(f.runId)) {
          this.runSubscriptions.set(f.runId, f.sinceSeq ?? -1);
        }
        return true;
      }
      case 'unsubscribe': {
        const f = frame as UnsubscribeFrame;
        this.runSubscriptions.delete(f.runId);
        return true;
      }
      case 'session.subscribe': {
        const f = frame as SessionSubscribeFrame;
        this.sessionSubscriptions.add(f.sessionId);
        return true;
      }
      case 'session.unsubscribe': {
        const f = frame as SessionUnsubscribeFrame;
        this.sessionSubscriptions.delete(f.sessionId);
        return true;
      }
      default:
        return false;
    }
  }

  private flushOutbound(): void {
    if (this.outboundBuffer.length === 0) return;
    const queued = this.outboundBuffer;
    this.outboundBuffer = [];
    for (const frame of queued) {
      this.writeToSocket(frame);
    }
  }

  /** Serialize + write to the socket. Never throws to the caller (§2.4). */
  private writeToSocket(frame: ClientFrame): void {
    const socket = this.socket;
    if (socket === null) return;
    try {
      socket.send(JSON.stringify(frame));
    } catch {
      // A dead socket should not throw out of send(); the watchdog/close path
      // will drive reconnect.
    }
  }

  // --- onFrame fan-out + unsubscribe (§2.6) ----------------------------------

  onFrame(cb: (frame: ServerFrame) => void): () => void {
    this.subscribers.add(cb);
    let active = true;
    return () => {
      if (!active) return; // idempotent unsubscribe
      active = false;
      this.subscribers.delete(cb);
    };
  }

  private fanOut(frame: ServerFrame): void {
    // Iterate a snapshot so a subscriber unsubscribing mid-delivery is safe; a
    // throwing subscriber must not abort delivery to the others (§2.6).
    for (const cb of [...this.subscribers]) {
      try {
        cb(frame);
      } catch (error) {
        // eslint-disable-next-line no-console -- never let a subscriber kill the socket
        console.error('RealBackend: onFrame subscriber threw', error);
      }
    }
  }

  // --- keepalive (§2.7) ------------------------------------------------------

  private startKeepalive(): void {
    this.clearKeepalive();
    this.pingTimer = setInterval(() => {
      if (this.state !== 'ready') return;
      this.writeToSocket({ type: 'ping' });
      this.armPongTimeout();
    }, this.pingIntervalMs);
  }

  private armPongTimeout(): void {
    if (this.pongTimer !== null) return; // one outstanding watchdog at a time
    this.pongTimer = setTimeout(() => {
      this.pongTimer = null;
      // No pong within the window → treat the connection as dead (§2.7).
      this.handleSocketDown();
    }, this.pongTimeoutMs);
  }

  private clearPongTimer(): void {
    if (this.pongTimer !== null) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private clearKeepalive(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.clearPongTimer();
  }

  // --- teardown / disconnect (§2.9/AC13) -------------------------------------

  /** Close + detach the current socket without changing connection intent. */
  private teardownSocket(): void {
    this.clearKeepalive();
    const socket = this.socket;
    this.socket = null;
    if (socket !== null) {
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      try {
        socket.close();
      } catch {
        // guard against double-close throwing
      }
    }
  }

  disconnect(): void {
    // Deliberate disconnect suppresses reconnect (no backoff) — set state first.
    this.state = 'disconnected';
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
    this.outboundBuffer = [];
    this.runSubscriptions.clear();
    this.sessionSubscriptions.clear();
    this.teardownSocket();
    // Leave `onFrame` subscribers registered (mirror the mock: disconnect only
    // stops the sim; a later connect() resumes delivery, §2.9/AC13).
    if (this.pendingConnect !== null) {
      const pending = this.pendingConnect;
      this.pendingConnect = null;
      pending.reject(new Error('disconnected before connect resolved'));
    }
  }

  // --- REST list surface (§3) ------------------------------------------------

  private async getJson<T>(resource: string): Promise<T> {
    const response = await this.fetchImpl(`${this.restBaseUrl}/api/v1/${resource}`, {
      headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
    });
    if (!response.ok) {
      let excerpt = '';
      try {
        excerpt = (await response.text()).slice(0, 200);
      } catch {
        excerpt = '';
      }
      throw new RealBackendRestError(`/api/v1/${resource}`, response.status, excerpt);
    }
    return (await response.json()) as T;
  }

  listAgents(): Promise<AgentSummary[]> {
    return this.getJson<AgentSummary[]>('agents');
  }

  listSessionEntries(): Promise<SessionEntry[]> {
    return this.getJson<SessionEntry[]>('sessions');
  }

  listRuns(): Promise<RunEntry[]> {
    return this.getJson<RunEntry[]>('runs');
  }

  /**
   * v1 gap (§3.1/AC9): the gateway exposes no AgentDispatchRun list endpoint.
   * Resolve to `[]` until `GET /api/v1/tasks` (or the upstream route) lands.
   */
  listTasks(): Promise<CommanderTask[]> {
    return Promise.resolve([]);
  }

  // --- board-mutation verbs: documented v1 no-ops (§6/AC7) -------------------
  //
  // Not `CommanderBackend` methods and not `ClientFrame`s in protocol v1. They
  // exist only to keep the boot seam's `views=`/orders plumbing type-checking
  // (§7). Each is a safe no-op with NO network I/O, returning the
  // type-appropriate "did nothing" value.

  private noopVerb(name: string): void {
    if (this.warnedVerbs.has(name)) return;
    this.warnedVerbs.add(name);
    // eslint-disable-next-line no-console -- one-time v1-gap notice (real mode)
    console.warn(`RealBackend: '${name}' is a v1-protocol gap (no-op in real mode)`);
  }

  moveCard(_taskId: string, _column: ColumnId): boolean {
    this.noopVerb('moveCard');
    return false;
  }

  setYolo(_taskId: string, _on: boolean): boolean {
    this.noopVerb('setYolo');
    return false;
  }

  createTask(_input: {
    taskKind: TaskKind;
    title?: string;
    parentId?: string;
    workspaceId?: string;
  }): string | null {
    this.noopVerb('createTask');
    return null;
  }

  revertCard(_taskId: string): boolean {
    this.noopVerb('revertCard');
    return false;
  }

  release(): string | null {
    this.noopVerb('release');
    return null;
  }

  rollbackCard(_taskId: string): boolean {
    this.noopVerb('rollbackCard');
    return false;
  }

  updateTask(_taskId: string, _patch: UpdateTaskPatch): boolean {
    this.noopVerb('updateTask');
    return false;
  }

  upsertStack(_stack: KradleAgentStackInput): string | null {
    this.noopVerb('upsertStack');
    return null;
  }

  updateProcessTemplate(_kind: TaskKind, _phases: string[]): number | null {
    this.noopVerb('updateProcessTemplate');
    return null;
  }

  writeFile(_taskId: string, _path: string, _content: string): boolean {
    this.noopVerb('writeFile');
    return false;
  }

  setSpeed(_speed: number): boolean {
    this.noopVerb('setSpeed');
    return false;
  }

  createRosterAgent(_input: { stackRef: string; role: RosterRole; name?: string }): string | null {
    this.noopVerb('createRosterAgent');
    return null;
  }

  deleteRosterAgent(_agentId: string): boolean {
    this.noopVerb('deleteRosterAgent');
    return false;
  }

  assignTaskAgent(_taskId: string, _role: RosterRole, _agentId: string | null): boolean {
    this.noopVerb('assignTaskAgent');
    return false;
  }

  assignTaskHuman(_taskId: string, _assign: boolean): boolean {
    this.noopVerb('assignTaskHuman');
    return false;
  }

  /**
   * List-view methods the mock exposes off `.sim` (`listStacks`, `listSessions`,
   * `getWorkspaceTree`, …) likewise have no v1 gateway source. In real mode the
   * boot seam supplies them via the dedicated `SimViews` stub in
   * `realViewsStub` (`./realBoot`) — empty/null until those surfaces exist (§6).
   */

  /** Read-only: the resolved config (test/diagnostic introspection). */
  getConfig(): BackendConfig {
    return this.config;
  }
}
