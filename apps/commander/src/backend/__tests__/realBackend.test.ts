/**
 * RealBackend WS+REST transport (SPEC-LIVE-BACKEND §2/§3/§6).
 *
 * Driven entirely by a hand-rolled fake `WebSocket` and an injected `fetch` —
 * no real sockets, no network, no new deps (§8 testing seams, AC12). Covers:
 *   AC5  handshake (open → auth → hello → ready; pre-hello close rejects),
 *   AC6  send serialization / onFrame fan-out + unsubscribe / keepalive /
 *        reconnect re-auth + re-subscribe (sinceSeq) + buffer flush,
 *   AC7  board-verb no-ops,
 *   AC8  REST list surface (Bearer auth, untransformed entries, non-2xx reject),
 *   AC9  listTasks() → [],
 *   AC13 disconnect suppresses reconnect + clears timers/buffer, keeps subs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RealBackend, RealBackendRestError } from '../real/realBackend';
import type { WebSocketLike, FetchLike, FetchResponseLike } from '../real/realBackend';
import type { BackendConfig } from '../config';
import type {
  ClientFrame,
  HelloFrame,
  RunEventFrame,
  ServerFrame,
} from '../../contracts/gateway-protocol';

// ---------------------------------------------------------------------------
// Fake WebSocket — records sent frames, lets the test drive server events.
// ---------------------------------------------------------------------------

class FakeWebSocket implements WebSocketLike {
  readonly url: string;
  readyState = 0;
  onopen: ((event: unknown) => void) | null = null;
  onclose: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  readonly sent: string[] = [];
  closed = false;

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
    this.readyState = 3;
  }

  // --- test drivers ---------------------------------------------------------
  emitOpen(): void {
    this.readyState = 1;
    this.onopen?.(undefined);
  }

  emitMessage(frame: unknown): void {
    this.onmessage?.({ data: typeof frame === 'string' ? frame : JSON.stringify(frame) });
  }

  emitRaw(data: unknown): void {
    this.onmessage?.({ data });
  }

  emitClose(): void {
    this.readyState = 3;
    this.onclose?.(undefined);
  }

  emitError(): void {
    this.onerror?.(undefined);
  }

  /** Parsed view of every frame this socket sent. */
  sentFrames(): ClientFrame[] {
    return this.sent.map((s) => JSON.parse(s) as ClientFrame);
  }
}

const HELLO: HelloFrame = {
  type: 'hello',
  protocolVersions: ['1'],
  serverVersion: '1.0.0',
  serverTime: '2026-06-13T00:00:00.000Z',
};

function realConfig(overrides: Partial<BackendConfig> = {}): BackendConfig {
  return {
    mode: 'real',
    seed: 42,
    gatewayUrl: 'wss://gw.example/socket',
    token: 'tok-abc',
    pingIntervalMs: 1000,
    pongTimeoutMs: 500,
    baseDelayMs: 100,
    maxDelayMs: 2000,
    ...overrides,
  };
}

interface Harness {
  backend: RealBackend;
  sockets: FakeWebSocket[];
  latest(): FakeWebSocket;
  fetchCalls: Array<{ url: string; headers?: Record<string, string> }>;
}

function makeHarness(
  config: BackendConfig = realConfig(),
  fetchImpl?: FetchLike,
): Harness {
  const sockets: FakeWebSocket[] = [];
  const fetchCalls: Array<{ url: string; headers?: Record<string, string> }> = [];
  const responder: FetchLike =
    fetchImpl ??
    (() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve(''),
      }));
  const backend = new RealBackend(config, {
    webSocketFactory: (url) => {
      const socket = new FakeWebSocket(url);
      sockets.push(socket);
      return socket;
    },
    fetch: (url, init) => {
      // Single recording point so fetchCalls has exactly one entry per request.
      fetchCalls.push({ url, headers: init?.headers });
      return responder(url, init);
    },
  });
  return {
    backend,
    sockets,
    latest: () => {
      const s = sockets[sockets.length - 1];
      if (s === undefined) throw new Error('no socket created');
      return s;
    },
    fetchCalls,
  };
}

/** Drive a harness from construction to `ready` (open → auth → hello). */
async function connectToReady(h: Harness): Promise<void> {
  const promise = h.backend.connect();
  h.latest().emitOpen();
  h.latest().emitMessage(HELLO);
  await promise;
}

describe('RealBackend handshake (AC5)', () => {
  it('connect() opens, sends auth on open, resolves only after hello', async () => {
    const h = makeHarness();
    let resolved = false;
    const promise = h.backend.connect().then(() => {
      resolved = true;
    });

    // Socket created but not yet open: no auth sent, connect() unresolved.
    expect(h.sockets).toHaveLength(1);
    expect(h.latest().sent).toHaveLength(0);

    h.latest().emitOpen();
    // auth sent immediately on open.
    expect(h.latest().sentFrames()[0]).toEqual({ type: 'auth', token: 'tok-abc' });
    await Promise.resolve();
    expect(resolved).toBe(false);

    // hello → ready, connect() resolves.
    h.latest().emitMessage(HELLO);
    await promise;
    expect(resolved).toBe(true);
  });

  it('forwards the hello frame to onFrame subscribers (handshake is observable)', async () => {
    const h = makeHarness();
    const frames: ServerFrame[] = [];
    h.backend.onFrame((f) => frames.push(f));
    await connectToReady(h);
    expect(frames.some((f) => f.type === 'hello')).toBe(true);
  });

  it('rejects connect() when hello lacks protocol v1', async () => {
    const h = makeHarness();
    const promise = h.backend.connect();
    h.latest().emitOpen();
    h.latest().emitMessage({ ...HELLO, protocolVersions: ['2'] });
    await expect(promise).rejects.toThrow(/protocol/i);
  });

  it('rejects connect() on a pre-hello close', async () => {
    const h = makeHarness();
    const promise = h.backend.connect();
    h.latest().emitOpen();
    h.latest().emitClose();
    await expect(promise).rejects.toThrow(/before hello/i);
  });

  it('rejects connect() on a pre-hello error', async () => {
    const h = makeHarness();
    const promise = h.backend.connect();
    h.latest().emitError();
    await expect(promise).rejects.toThrow();
  });

  it('a second connect() while ready resolves without a new socket (idempotent)', async () => {
    const h = makeHarness();
    await connectToReady(h);
    await h.backend.connect();
    expect(h.sockets).toHaveLength(1);
  });
});

describe('RealBackend send + serialization (AC6)', () => {
  it('serializes a ClientFrame to JSON on the socket when ready', async () => {
    const h = makeHarness();
    await connectToReady(h);
    h.latest().sent.length = 0;
    h.backend.send({ type: 'subscribe', runId: 'run-1' });
    expect(h.latest().sent).toEqual([JSON.stringify({ type: 'subscribe', runId: 'run-1' })]);
  });

  it('buffers non-subscription sends issued before ready and flushes them FIFO on ready', async () => {
    const h = makeHarness();
    const promise = h.backend.connect();
    h.latest().emitOpen();
    // Issued during authenticating (pre-ready): must be buffered, not lost.
    h.backend.send({ type: 'session.message', sessionId: 's1', prompt: 'one' });
    h.backend.send({ type: 'session.message', sessionId: 's2', prompt: 'two' });
    // Only auth on the wire so far.
    expect(h.latest().sentFrames().map((f) => f.type)).toEqual(['auth']);

    h.latest().emitMessage(HELLO);
    await promise;
    const prompts = h
      .latest()
      .sentFrames()
      .filter((f): f is Extract<ClientFrame, { type: 'session.message' }> => f.type === 'session.message')
      .map((f) => f.prompt);
    // Flushed in FIFO order after the post-hello step.
    expect(prompts).toEqual(['one', 'two']);
  });

  it('re-subscribes pre-ready subscription frames from the tracked set (not double-sent)', async () => {
    const h = makeHarness();
    const promise = h.backend.connect();
    h.latest().emitOpen();
    // Subscriptions issued pre-ready are tracked, not buffered — replayed once.
    h.backend.send({ type: 'subscribe', runId: 'run-a' });
    h.backend.send({ type: 'subscribe', runId: 'run-b' });
    h.latest().emitMessage(HELLO);
    await promise;
    const subs = h
      .latest()
      .sentFrames()
      .filter((f): f is Extract<ClientFrame, { type: 'subscribe' }> => f.type === 'subscribe');
    // Exactly one subscribe per run (no duplicate from buffer + re-subscribe).
    expect(subs.map((f) => f.runId)).toEqual(['run-a', 'run-b']);
  });
});

describe('RealBackend onFrame fan-out + unsubscribe (AC6)', () => {
  it('fans out every valid inbound ServerFrame to all subscribers', async () => {
    const h = makeHarness();
    const a: string[] = [];
    const b: string[] = [];
    h.backend.onFrame((f) => a.push(f.type));
    h.backend.onFrame((f) => b.push(f.type));
    await connectToReady(h);
    const evt: RunEventFrame = {
      type: 'run.event',
      runId: 'r1',
      seq: 1,
      source: 'gateway',
      event: {},
    };
    h.latest().emitMessage(evt);
    expect(a).toContain('run.event');
    expect(b).toContain('run.event');
  });

  it('unsubscribe removes exactly one subscriber and is idempotent', async () => {
    const h = makeHarness();
    await connectToReady(h);
    const seen: string[] = [];
    const off = h.backend.onFrame((f) => seen.push(f.type));
    h.backend.onFrame(() => undefined);

    off();
    off(); // idempotent — must not throw, must not remove others

    seen.length = 0;
    h.latest().emitMessage({ type: 'pong' });
    expect(seen).toHaveLength(0); // the off()'d subscriber no longer fires
  });

  it('a throwing subscriber does not abort delivery to the others or kill the socket', async () => {
    const h = makeHarness();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const delivered: string[] = [];
    h.backend.onFrame(() => {
      throw new Error('boom');
    });
    h.backend.onFrame((f) => delivered.push(f.type));
    await connectToReady(h);
    h.latest().emitMessage({ type: 'pong' });
    expect(delivered).toContain('pong');
    consoleSpy.mockRestore();
  });

  it('drops unparseable payloads and unknown frame types without fanning out', async () => {
    const h = makeHarness();
    const seen: string[] = [];
    h.backend.onFrame((f) => seen.push(f.type));
    await connectToReady(h);
    seen.length = 0;
    h.latest().emitMessage('not json {{{');
    h.latest().emitMessage({ type: 'totally-unknown-frame' });
    h.latest().emitMessage({ noTypeField: true });
    expect(seen).toHaveLength(0);
  });

  it('subscribers survive a reconnect (transport-independent identity)', async () => {
    vi.useFakeTimers();
    const h = makeHarness();
    const seen: string[] = [];
    h.backend.onFrame((f) => seen.push(f.type));
    await connectToReady(h);

    // Drop the ready socket → reconnect path.
    h.latest().emitClose();
    vi.advanceTimersByTime(realConfig().maxDelayMs ?? 2000);
    // New socket: complete the handshake again.
    h.latest().emitOpen();
    h.latest().emitMessage(HELLO);

    seen.length = 0;
    h.latest().emitMessage({ type: 'pong' });
    expect(seen).toContain('pong');
    vi.useRealTimers();
  });
});

describe('RealBackend keepalive (AC6)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sends a client ping every pingIntervalMs while ready', async () => {
    const h = makeHarness();
    await connectToReady(h);
    h.latest().sent.length = 0;
    vi.advanceTimersByTime(1000);
    expect(h.latest().sentFrames().map((f) => f.type)).toContain('ping');
  });

  it('a missing pong within pongTimeoutMs triggers reconnect (new socket)', async () => {
    const h = makeHarness();
    await connectToReady(h);
    expect(h.sockets).toHaveLength(1);

    vi.advanceTimersByTime(1000); // fire ping, arm pong watchdog
    vi.advanceTimersByTime(500); // pong window elapses → connection dead
    // Reconnect backoff scheduled; advance past max delay to fire it.
    vi.advanceTimersByTime(2000);
    expect(h.sockets.length).toBeGreaterThanOrEqual(2);
  });

  it('a pong inside the window keeps the connection alive (no reconnect)', async () => {
    const h = makeHarness();
    await connectToReady(h);
    vi.advanceTimersByTime(1000); // ping + arm watchdog
    h.latest().emitMessage({ type: 'pong' }); // answered in time → watchdog cleared
    // Advance only to the end of the (now-cleared) watchdog window: no reconnect.
    vi.advanceTimersByTime(500);
    expect(h.sockets).toHaveLength(1);
  });
});

describe('RealBackend reconnect with backoff (AC6)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('re-auths and re-subscribes active runs with the highest seen sinceSeq', async () => {
    const h = makeHarness();
    await connectToReady(h);

    // Subscribe a run, then observe events that advance the seq high-water mark.
    h.backend.send({ type: 'subscribe', runId: 'run-X' });
    h.latest().emitMessage({
      type: 'run.event',
      runId: 'run-X',
      seq: 7,
      source: 'gateway',
      event: {},
    } satisfies RunEventFrame);
    h.latest().emitMessage({
      type: 'run.event',
      runId: 'run-X',
      seq: 12,
      source: 'gateway',
      event: {},
    } satisfies RunEventFrame);

    // Drop ready socket → reconnect.
    h.latest().emitClose();
    vi.advanceTimersByTime(2000);
    const reconnected = h.latest();
    reconnected.emitOpen();
    reconnected.emitMessage(HELLO);

    const frames = reconnected.sentFrames();
    // Re-auth implicit in the handshake.
    expect(frames[0]).toEqual({ type: 'auth', token: 'tok-abc' });
    // Re-subscribe with sinceSeq = highest observed (12).
    expect(frames).toContainEqual({ type: 'subscribe', runId: 'run-X', sinceSeq: 12 });
  });

  it('re-subscribes active session subscriptions on reconnect', async () => {
    const h = makeHarness();
    await connectToReady(h);
    h.backend.send({ type: 'session.subscribe', sessionId: 'sess-1' });

    h.latest().emitClose();
    vi.advanceTimersByTime(2000);
    const reconnected = h.latest();
    reconnected.emitOpen();
    reconnected.emitMessage(HELLO);

    expect(reconnected.sentFrames()).toContainEqual({
      type: 'session.subscribe',
      sessionId: 'sess-1',
    });
  });

  it('an unsubscribe before a drop is NOT replayed on reconnect', async () => {
    const h = makeHarness();
    await connectToReady(h);
    h.backend.send({ type: 'subscribe', runId: 'run-Y' });
    h.backend.send({ type: 'unsubscribe', runId: 'run-Y' });

    h.latest().emitClose();
    vi.advanceTimersByTime(2000);
    const reconnected = h.latest();
    reconnected.emitOpen();
    reconnected.emitMessage(HELLO);

    const subscribed = reconnected
      .sentFrames()
      .filter((f) => f.type === 'subscribe');
    expect(subscribed).toHaveLength(0);
  });

  it('flushes buffered outbound sends after the reconnect re-subscribe step', async () => {
    const h = makeHarness();
    await connectToReady(h);
    h.latest().emitClose();
    // While reconnecting (not ready), a UI send must buffer.
    h.backend.send({ type: 'session.message', sessionId: 's', prompt: 'hi' });
    vi.advanceTimersByTime(2000);
    const reconnected = h.latest();
    reconnected.emitOpen();
    reconnected.emitMessage(HELLO);
    expect(reconnected.sentFrames()).toContainEqual({
      type: 'session.message',
      sessionId: 's',
      prompt: 'hi',
    });
  });

  it('stops reconnecting after maxReconnectAttempts', async () => {
    const h = makeHarness(realConfig({ maxReconnectAttempts: 1 }));
    await connectToReady(h);

    // First drop → attempt 1 scheduled.
    h.latest().emitClose();
    vi.advanceTimersByTime(2000);
    expect(h.sockets).toHaveLength(2);
    // That reconnect attempt also fails pre-hello → no further attempts (cap=1).
    h.latest().emitClose();
    vi.advanceTimersByTime(2000);
    expect(h.sockets).toHaveLength(2);
  });
});

describe('RealBackend disconnect (AC13)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is synchronous, closes the socket, and suppresses reconnect', async () => {
    const h = makeHarness();
    await connectToReady(h);
    const socket = h.latest();

    h.backend.disconnect();
    expect(socket.closed).toBe(true);

    // No reconnect after a deliberate disconnect, even if the close fires.
    socket.emitClose();
    vi.advanceTimersByTime(5000);
    expect(h.sockets).toHaveLength(1);
  });

  it('keeps onFrame subscribers registered so a later connect() resumes delivery', async () => {
    const h = makeHarness();
    const seen: string[] = [];
    h.backend.onFrame((f) => seen.push(f.type));
    await connectToReady(h);
    h.backend.disconnect();

    // Reconnect deliberately.
    const promise = h.backend.connect();
    h.latest().emitOpen();
    h.latest().emitMessage(HELLO);
    await promise;

    seen.length = 0;
    h.latest().emitMessage({ type: 'pong' });
    expect(seen).toContain('pong'); // subscriber survived the disconnect
  });

  it('clears the outbound buffer (a pre-disconnect buffered send is not flushed later)', async () => {
    const h = makeHarness();
    const promise = h.backend.connect();
    h.latest().emitOpen();
    h.backend.send({ type: 'subscribe', runId: 'doomed' });
    h.latest().emitMessage(HELLO);
    await promise;
    // Subscribed once on first ready.
    expect(h.latest().sentFrames().filter((f) => f.type === 'subscribe')).toHaveLength(1);

    h.backend.disconnect();

    // Reconnect: the buffer + tracked subs were cleared, so no replay.
    const p2 = h.backend.connect();
    h.latest().emitOpen();
    h.latest().emitMessage(HELLO);
    await p2;
    expect(h.latest().sentFrames().filter((f) => f.type === 'subscribe')).toHaveLength(0);
  });
});

describe('RealBackend REST list surface (AC8 + AC9)', () => {
  it('listAgents GETs /api/v1/agents with Bearer auth and returns entries untransformed', async () => {
    const agents = [{ agent: 'claude-code', displayName: 'Claude Code' }];
    const h = makeHarness(realConfig(), () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(agents),
        text: () => Promise.resolve(''),
      }),
    );
    const result = await h.backend.listAgents();
    expect(result).toEqual(agents);
    const call = h.fetchCalls[h.fetchCalls.length - 1];
    expect(call.url).toBe('https://gw.example/api/v1/agents');
    expect(call.headers?.Authorization).toBe('Bearer tok-abc');
  });

  it('derives the REST origin by swapping wss→https and replacing the path', async () => {
    const h = makeHarness();
    await h.backend.listRuns();
    expect(h.fetchCalls[h.fetchCalls.length - 1].url).toBe('https://gw.example/api/v1/runs');
  });

  it('listSessionEntries GETs /api/v1/sessions', async () => {
    const h = makeHarness();
    await h.backend.listSessionEntries();
    expect(h.fetchCalls[h.fetchCalls.length - 1].url).toBe('https://gw.example/api/v1/sessions');
  });

  it('a ws:// gateway derives an http:// REST origin', async () => {
    const h = makeHarness(realConfig({ gatewayUrl: 'ws://localhost:9000/socket' }));
    await h.backend.listAgents();
    expect(h.fetchCalls[h.fetchCalls.length - 1].url).toBe('http://localhost:9000/api/v1/agents');
  });

  it('a non-2xx response rejects with a typed RealBackendRestError (transport unharmed)', async () => {
    const failing: FetchLike = () =>
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve('gateway down'),
      } satisfies FetchResponseLike);
    const h = makeHarness(realConfig(), failing);
    await expect(h.backend.listRuns()).rejects.toBeInstanceOf(RealBackendRestError);
    await expect(h.backend.listRuns()).rejects.toThrow(/503/);
  });

  it('AC9: listTasks() resolves to [] (v1 gap — no AgentDispatchRun endpoint)', async () => {
    const h = makeHarness();
    await expect(h.backend.listTasks()).resolves.toEqual([]);
  });
});

describe('RealBackend board-verb no-ops (AC7)', () => {
  it('board / editor / roster verbs are safe no-ops returning the empty value, no I/O', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const h = makeHarness();
    // boolean verbs → false
    expect(h.backend.moveCard('t', 'do')).toBe(false);
    expect(h.backend.setYolo('t', true)).toBe(false);
    expect(h.backend.revertCard('t')).toBe(false);
    expect(h.backend.rollbackCard('t')).toBe(false);
    expect(h.backend.updateTask('t', {})).toBe(false);
    expect(h.backend.writeFile('t', 'p', 'c')).toBe(false);
    expect(h.backend.setSpeed(2)).toBe(false);
    expect(h.backend.deleteRosterAgent('a')).toBe(false);
    expect(h.backend.assignTaskAgent('t', 'worker', 'a')).toBe(false);
    expect(h.backend.assignTaskHuman('t', true)).toBe(false);
    // string|null verbs → null
    expect(h.backend.createTask({ taskKind: 'implement' })).toBeNull();
    expect(h.backend.release()).toBeNull();
    expect(h.backend.createRosterAgent({ stackRef: 's', role: 'worker' })).toBeNull();
    // number|null verb → null
    expect(h.backend.updateProcessTemplate('implement', ['plan'])).toBeNull();
    // No socket was ever opened (no network I/O).
    expect(h.sockets).toHaveLength(0);
    expect(h.fetchCalls).toHaveLength(0);
    warnSpy.mockRestore();
  });
});
