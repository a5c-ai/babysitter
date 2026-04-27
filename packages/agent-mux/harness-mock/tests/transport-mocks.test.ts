import { once } from 'node:events';
import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import {
  HttpServerMock,
  WebSocketServerMock,
  createScriptableTransportBuilder,
} from '../src/index.js';
import type { HarnessScenario } from '../src/types.js';

async function waitForClose(socket: WebSocket): Promise<number> {
  const [code] = await once(socket, 'close');
  return code as number;
}

describe('transport mocks', () => {
  it('HttpServerMock serves requests and records history', async () => {
    const scenario: HarnessScenario = {
      harness: 'opencode-http',
      executionType: 'http',
      httpServer: {
        port: 19081,
        routes: {
          '/status': {
            status: 200,
            body: { ok: true },
          },
        },
      },
    };

    const mock = new HttpServerMock(scenario, 1);
    await mock.start();
    const response = await fetch(`${mock.serverUrl}/status`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mock.requestHistory).toHaveLength(1);
    await mock.stop();
    const result = await mock.waitForCompletion();
    expect(result.results.type).toBe('http');
  });

  it('WebSocketServerMock binds a real websocket server, replays events, and handles disconnects', async () => {
    const scenario: HarnessScenario = {
      harness: 'codex-websocket',
      executionType: 'websocket',
      websocketServer: {
        port: 0,
        simulateDrops: {
          reconnectDelayMs: 5,
        },
      },
      events: [
        { type: 'text_delta', data: { delta: 'hello' }, delayMs: 1 },
        { type: 'message_stop', data: {}, delayMs: 1 },
      ],
    };

    const mock = new WebSocketServerMock(scenario, 2);
    await mock.start();
    const client = new WebSocket(mock.serverUrl);
    await once(client, 'open');
    expect(mock.isRunning).toBe(true);
    expect(mock.connectionCount).toBe(1);

    const [firstFrame] = await once(client, 'message');
    const firstMessage = JSON.parse(Buffer.isBuffer(firstFrame) ? firstFrame.toString('utf8') : String(firstFrame));
    expect(firstMessage.type).toBe('text_delta');

    const [secondFrame] = await once(client, 'message');
    const secondMessage = JSON.parse(Buffer.isBuffer(secondFrame) ? secondFrame.toString('utf8') : String(secondFrame));
    expect(secondMessage.type).toBe('message_stop');

    client.send(JSON.stringify({ type: 'user_message', text: 'ping' }));
    await new Promise((resolve) => setImmediate(resolve));
    expect(mock.messageHistory.some((entry) => entry.direction === 'inbound')).toBe(true);

    mock.broadcast({ type: 'server_ping' });
    const [broadcastFrame] = await once(client, 'message');
    const broadcastMessage = JSON.parse(Buffer.isBuffer(broadcastFrame) ? broadcastFrame.toString('utf8') : String(broadcastFrame));
    expect(broadcastMessage.type).toBe('server_ping');

    const closePromise = once(client, 'close');
    const connectionId = mock.getConnectionStatus()[0]?.connectionId;
    expect(connectionId).toBeTruthy();
    mock.dropConnection(connectionId!);
    const [closeCode] = await closePromise;
    expect(closeCode).toBe(1011);
    expect(mock.connectionCount).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 10));
    const reconnectClient = new WebSocket(mock.serverUrl);
    await once(reconnectClient, 'open');
    const [replayFrame] = await once(reconnectClient, 'message');
    const replayMessage = JSON.parse(Buffer.isBuffer(replayFrame) ? replayFrame.toString('utf8') : String(replayFrame));
    expect(replayMessage.type).toBe('text_delta');
    reconnectClient.close();

    client.close();
    await mock.stop();
    const result = await mock.waitForCompletion();
    expect(result.results.type).toBe('websocket');
  });

  it('WebSocketServerMock rejects reconnects until the configured delay elapses', async () => {
    const scenario: HarnessScenario = {
      harness: 'codex-websocket',
      executionType: 'websocket',
      websocketServer: {
        port: 0,
        simulateDrops: {
          reconnectDelayMs: 40,
        },
      },
    };

    const mock = new WebSocketServerMock(scenario, 5);
    await mock.start();

    const firstClient = new WebSocket(mock.serverUrl);
    await once(firstClient, 'open');
    const connectionId = mock.getConnectionStatus()[0]?.connectionId;
    expect(connectionId).toBeTruthy();
    mock.dropConnection(connectionId!);
    expect(await waitForClose(firstClient)).toBe(1011);

    const blockedClient = new WebSocket(mock.serverUrl);
    await once(blockedClient, 'open');
    expect(await waitForClose(blockedClient)).toBe(1013);

    await new Promise((resolve) => setTimeout(resolve, 50));
    const recoveredClient = new WebSocket(mock.serverUrl);
    await once(recoveredClient, 'open');
    expect(mock.connectionCount).toBe(1);
    recoveredClient.close();

    await mock.stop();
  });

  it('WebSocketServerMock rejects clients above maxConnections', async () => {
    const scenario: HarnessScenario = {
      harness: 'codex-websocket',
      executionType: 'websocket',
      websocketServer: {
        port: 0,
        maxConnections: 1,
      },
    };

    const mock = new WebSocketServerMock(scenario, 6);
    await mock.start();

    const firstClient = new WebSocket(mock.serverUrl);
    await once(firstClient, 'open');
    expect(mock.connectionCount).toBe(1);

    const secondClient = new WebSocket(mock.serverUrl);
    await once(secondClient, 'open');
    expect(await waitForClose(secondClient)).toBe(1013);
    expect(mock.connectionCount).toBe(1);

    firstClient.close();
    await mock.stop();
  });

  it('scriptable transport builder creates reusable HTTP scenarios', async () => {
    const scenario = createScriptableTransportBuilder()
      .name('transport-script-http')
      .http({ port: 19083, enableCors: true })
      .onRequest('/v1/chat/completions', {
        status: 200,
        body: { object: 'chat.completion', choices: [{ message: { content: 'scripted' } }] },
      })
      .build();

    const mock = new HttpServerMock(scenario, 3);
    await mock.start();
    const response = await fetch(`${mock.serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });

    expect(response.status).toBe(200);
    expect((await response.json()).choices[0].message.content).toBe('scripted');
    expect(mock.requestHistory[0]?.path).toBe('/v1/chat/completions');
    await mock.stop();
  });

  it('scriptable transport builder creates reusable websocket scenarios', async () => {
    const scenario = createScriptableTransportBuilder()
      .name('transport-script-ws')
      .websocket({ port: 0, reconnectDelayMs: 5 })
      .emitEvent('text_delta', { delta: 'hello' }, 1)
      .emitEvent('message_stop', {}, 1)
      .build();

    const mock = new WebSocketServerMock(scenario, 4);
    await mock.start();
    const client = new WebSocket(mock.serverUrl);
    await once(client, 'open');
    const [frame] = await once(client, 'message');
    const message = JSON.parse(Buffer.isBuffer(frame) ? frame.toString('utf8') : String(frame));

    expect(message.type).toBe('text_delta');
    expect(mock.messageHistory.some((entry) => (entry.message as { type?: string })?.type === 'text_delta')).toBe(true);
    client.close();
    await mock.stop();
  });
});
