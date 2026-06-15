import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WebSocketSession,
  type WebSocketLike,
  type WebSocketFactory,
  type WsMessage,
} from '../websocketSession';

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

function createMockWs(): WebSocketLike {
  return {
    readyState: 0, // CONNECTING
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null,
  };
}

describe('WebSocketSession', () => {
  let mockWs: WebSocketLike;
  let factory: WebSocketFactory;
  let session: WebSocketSession;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWs = createMockWs();
    factory = vi.fn(() => mockWs);
    session = new WebSocketSession(
      { url: 'ws://localhost:9999', reconnectIntervalMs: 100, maxReconnects: 3 },
      factory,
    );
  });

  // -----------------------------------------------------------------------
  // connect / isConnected
  // -----------------------------------------------------------------------

  it('is not connected before calling connect()', () => {
    expect(session.isConnected()).toBe(false);
  });

  it('creates a WebSocket via factory on connect()', () => {
    session.connect();
    expect(factory).toHaveBeenCalledWith('ws://localhost:9999', undefined);
  });

  it('is connected after onopen fires', () => {
    session.connect();
    mockWs.readyState = 1; // OPEN
    mockWs.onopen!(null);
    expect(session.isConnected()).toBe(true);
  });

  // -----------------------------------------------------------------------
  // send
  // -----------------------------------------------------------------------

  it('sends a JSON-serialized message', () => {
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);

    const msg: WsMessage = { type: 'prompt', payload: 'hello', timestamp: 1 };
    session.send(msg);
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(msg));
  });

  it('throws when sending while disconnected', () => {
    expect(() =>
      session.send({ type: 'prompt', payload: 'x', timestamp: 1 }),
    ).toThrow('not connected');
  });

  // -----------------------------------------------------------------------
  // onMessage
  // -----------------------------------------------------------------------

  it('delivers parsed messages to listeners', () => {
    const received: WsMessage[] = [];
    session.onMessage((m) => received.push(m));
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);

    const msg: WsMessage = { type: 'response', payload: { ok: true }, timestamp: 2 };
    mockWs.onmessage!({ data: JSON.stringify(msg) });
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('response');
  });

  it('ignores unparseable messages', () => {
    const received: WsMessage[] = [];
    session.onMessage((m) => received.push(m));
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);

    mockWs.onmessage!({ data: 'not-json{{{' });
    expect(received).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // disconnect
  // -----------------------------------------------------------------------

  it('closes the WebSocket on disconnect', () => {
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);

    session.disconnect();
    expect(mockWs.close).toHaveBeenCalled();
    expect(session.isConnected()).toBe(false);
  });

  // -----------------------------------------------------------------------
  // auto-reconnect
  // -----------------------------------------------------------------------

  it('schedules reconnect on unintentional close', () => {
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);

    // Simulate unexpected close
    mockWs.onclose!(null);

    // Create a new mock for the reconnection
    const newMockWs = createMockWs();
    (factory as ReturnType<typeof vi.fn>).mockReturnValue(newMockWs);

    // First reconnect at 100ms (100 * 2^0)
    vi.advanceTimersByTime(100);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff for reconnects', () => {
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);

    // Close 1
    mockWs.onclose!(null);
    const ws2 = createMockWs();
    (factory as ReturnType<typeof vi.fn>).mockReturnValue(ws2);
    vi.advanceTimersByTime(100); // 100 * 2^0
    expect(factory).toHaveBeenCalledTimes(2);

    // Close 2
    ws2.onclose!(null);
    const ws3 = createMockWs();
    (factory as ReturnType<typeof vi.fn>).mockReturnValue(ws3);
    vi.advanceTimersByTime(200); // 100 * 2^1
    expect(factory).toHaveBeenCalledTimes(3);
  });

  it('stops reconnecting after maxReconnects', () => {
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);

    // Exhaust all reconnects
    for (let i = 0; i < 3; i++) {
      const current = (factory as ReturnType<typeof vi.fn>).mock.results.at(-1)!.value as WebSocketLike;
      current.onclose!(null);
      const next = createMockWs();
      (factory as ReturnType<typeof vi.fn>).mockReturnValue(next);
      vi.advanceTimersByTime(100 * Math.pow(2, i));
    }
    // 1 initial + 3 reconnects
    expect(factory).toHaveBeenCalledTimes(4);

    // 4th close should NOT trigger another reconnect
    const last = (factory as ReturnType<typeof vi.fn>).mock.results.at(-1)!.value as WebSocketLike;
    last.onclose!(null);
    vi.advanceTimersByTime(10_000);
    expect(factory).toHaveBeenCalledTimes(4);
  });

  it('does not reconnect after intentional disconnect', () => {
    session.connect();
    mockWs.readyState = 1;
    mockWs.onopen!(null);
    session.disconnect();
    // onclose fires after close()
    mockWs.onclose!(null);

    vi.advanceTimersByTime(10_000);
    expect(factory).toHaveBeenCalledTimes(1); // only the initial
  });

  // -----------------------------------------------------------------------
  // auth token
  // -----------------------------------------------------------------------

  it('passes auth token as subprotocol', () => {
    const authed = new WebSocketSession(
      { url: 'ws://localhost:9999', authToken: 'secret123' },
      factory,
    );
    authed.connect();
    expect(factory).toHaveBeenCalledWith('ws://localhost:9999', ['auth-secret123']);
  });
});
