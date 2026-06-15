import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GatewayClient } from '../src/client/GatewayClient.js';

interface FakeSocket {
  sent: string[];
  open?: () => void;
  message?: (data: string) => void;
  closeHandler?: () => void;
}

function createFakeSocketFactory() {
  const sockets: FakeSocket[] = [];
  return {
    sockets,
    createSocket() {
      const socket: FakeSocket = { sent: [] };
      sockets.push(socket);
      return {
        send(data: string) {
          socket.sent.push(data);
        },
        close() {
          socket.closeHandler?.();
        },
        onOpen(handler: () => void) {
          socket.open = handler;
        },
        onMessage(handler: (data: string) => void) {
          socket.message = handler;
        },
        onClose(handler: () => void) {
          socket.closeHandler = handler;
        },
        onError() {},
      };
    },
  };
}

describe('GatewayClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('correlates concurrent requests by id', async () => {
    const factory = createFakeSocketFactory();
    const client = new GatewayClient({
      url: 'ws://example.test',
      token: 'secret',
      createSocket: factory.createSocket,
    });

    const connectPromise = client.connect();
    factory.sockets[0]!.open?.();
    factory.sockets[0]!.message?.(JSON.stringify({ type: 'hello', protocolVersions: ['1'], serverVersion: 'test', serverTime: new Date().toISOString() }));
    await connectPromise;

    const first = client.request({ type: 'first' });
    const second = client.request({ type: 'second' });
    const sent = factory.sockets[0]!.sent.slice(1).map((entry) => JSON.parse(entry) as Record<string, unknown>);

    factory.sockets[0]!.message?.(JSON.stringify({ id: sent[1]!.id, ok: 'second' }));
    factory.sockets[0]!.message?.(JSON.stringify({ id: sent[0]!.id, ok: 'first' }));

    await expect(first).resolves.toMatchObject({ ok: 'first' });
    await expect(second).resolves.toMatchObject({ ok: 'second' });
  });

  it('replays run subscriptions with latest sinceSeq after reconnect', async () => {
    const factory = createFakeSocketFactory();
    const client = new GatewayClient({
      url: 'ws://example.test',
      token: 'secret',
      createSocket: factory.createSocket,
    });

    const connectPromise = client.connect();
    factory.sockets[0]!.open?.();
    factory.sockets[0]!.message?.(JSON.stringify({ type: 'hello', protocolVersions: ['1'], serverVersion: 'test', serverTime: new Date().toISOString() }));
    await connectPromise;

    client.subscribeRun('run-1');
    factory.sockets[0]!.message?.(JSON.stringify({
      type: 'run.event',
      runId: 'run-1',
      seq: 5,
      source: 'agent',
      event: { type: 'text_delta', delta: 'x' },
    }));
    factory.sockets[0]!.closeHandler?.();
    vi.runOnlyPendingTimers();
    factory.sockets[1]!.open?.();
    factory.sockets[1]!.message?.(JSON.stringify({ type: 'hello', protocolVersions: ['1'], serverVersion: 'test', serverTime: new Date().toISOString() }));
    await vi.runAllTimersAsync();

    const replay = factory.sockets[1]!.sent.map((entry) => JSON.parse(entry) as Record<string, unknown>);
    expect(replay.some((frame) => frame.type === 'subscribe' && frame.runId === 'run-1' && frame.sinceSeq === 5)).toBe(true);
  });

  it('keeps multiple run subscribers attached to the same dispatch', async () => {
    const factory = createFakeSocketFactory();
    const client = new GatewayClient({
      url: 'ws://example.test',
      token: 'secret',
      createSocket: factory.createSocket,
    });

    const connectPromise = client.connect();
    factory.sockets[0]!.open?.();
    factory.sockets[0]!.message?.(
      JSON.stringify({ type: 'hello', protocolVersions: ['1'], serverVersion: 'test', serverTime: new Date().toISOString() }),
    );
    await connectPromise;

    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = client.subscribeRun('run-1', first);
    client.subscribeRun('run-1', second);

    const subscribeFrames = factory.sockets[0]!.sent
      .map((entry) => JSON.parse(entry) as Record<string, unknown>)
      .filter((frame) => frame.type === 'subscribe' && frame.runId === 'run-1');
    expect(subscribeFrames).toHaveLength(1);

    factory.sockets[0]!.message?.(
      JSON.stringify({
        type: 'run.event',
        runId: 'run-1',
        seq: 3,
        source: 'agent',
        event: { type: 'text_delta', delta: 'shared' },
      }),
    );
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    factory.sockets[0]!.message?.(
      JSON.stringify({
        type: 'run.event',
        runId: 'run-1',
        seq: 4,
        source: 'agent',
        event: { type: 'text_delta', delta: 'remaining' },
      }),
    );
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);

    const unsubscribeFrames = factory.sockets[0]!.sent
      .map((entry) => JSON.parse(entry) as Record<string, unknown>)
      .filter((frame) => frame.type === 'unsubscribe' && frame.runId === 'run-1');
    expect(unsubscribeFrames).toHaveLength(0);
  });

  it('waits for hello before resolving connect', async () => {
    const factory = createFakeSocketFactory();
    const client = new GatewayClient({
      url: 'ws://example.test',
      token: 'secret',
      createSocket: factory.createSocket,
    });

    let connected = false;
    const connectPromise = client.connect().then(() => {
      connected = true;
    });

    factory.sockets[0]!.open?.();
    await Promise.resolve();
    expect(connected).toBe(false);

    factory.sockets[0]!.message?.(JSON.stringify({ type: 'hello', protocolVersions: ['1'], serverVersion: 'test', serverTime: new Date().toISOString() }));
    await connectPromise;
    expect(connected).toBe(true);
  });

  it('queues subscriptions until hello completes the handshake', async () => {
    const factory = createFakeSocketFactory();
    const client = new GatewayClient({
      url: 'ws://example.test',
      token: 'secret',
      createSocket: factory.createSocket,
    });

    const connectPromise = client.connect();
    factory.sockets[0]!.open?.();
    client.subscribeRun('run-42');

    expect(factory.sockets[0]!.sent.map((entry) => JSON.parse(entry) as Record<string, unknown>)).toEqual([
      { type: 'auth', token: 'secret' },
    ]);

    factory.sockets[0]!.message?.(JSON.stringify({ type: 'hello', protocolVersions: ['1'], serverVersion: 'test', serverTime: new Date().toISOString() }));
    await connectPromise;

    expect(factory.sockets[0]!.sent.map((entry) => JSON.parse(entry) as Record<string, unknown>)).toEqual([
      { type: 'auth', token: 'secret' },
      { type: 'subscribe', runId: 'run-42', sinceSeq: 0 },
    ]);
  });

  it('sends session.start and session.message through the convenience helpers', async () => {
    const factory = createFakeSocketFactory();
    const client = new GatewayClient({
      url: 'ws://example.test',
      token: 'secret',
      createSocket: factory.createSocket,
    });

    const connectPromise = client.connect();
    factory.sockets[0]!.open?.();
    factory.sockets[0]!.message?.(JSON.stringify({ type: 'hello', protocolVersions: ['1'], serverVersion: 'test', serverTime: new Date().toISOString() }));
    await connectPromise;

    const startPromise = client.startSession({ agent: 'claude', prompt: 'hello' });
    const startFrame = JSON.parse(factory.sockets[0]!.sent.at(-1)!) as Record<string, unknown>;
    factory.sockets[0]!.message?.(JSON.stringify({ id: startFrame.id, run: { runId: 'run-1' } }));
    await expect(startPromise).resolves.toMatchObject({ run: { runId: 'run-1' } });

    const messagePromise = client.sendSessionMessage({ sessionId: 'session-1', prompt: 'continue' });
    const messageFrame = JSON.parse(factory.sockets[0]!.sent.at(-1)!) as Record<string, unknown>;
    expect(messageFrame).toMatchObject({
      type: 'session.message',
      sessionId: 'session-1',
      prompt: 'continue',
    });
    factory.sockets[0]!.message?.(JSON.stringify({ id: messageFrame.id, ok: true }));
    await expect(messagePromise).resolves.toMatchObject({ ok: true });
  });
});
