import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';
import { createProxyConfig } from '../../src/config.js';
import { startProxyServer } from '../../src/server.js';

describe('openai responses transport', () => {
  it('returns responses output text', async () => {
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-responses',
      },
      createMockCompletionEngine({ text: 'Proxy response' }),
    );

    const response = await app.request('/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: 'tell me something',
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.object).toBe('response');
    expect(body.status).toBe('completed');
    expect(body.output[0].content[0].text).toBe('Proxy response');
  });

  it('streams responses events when requested', async () => {
    const engine = createMockCompletionEngine({ text: 'Proxy response' });
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-responses',
      },
      engine,
    );

    const response = await app.request('/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        stream: true,
        input: 'tell me something',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const body = await response.text();
    expect(body).toContain('event: response.created');
    expect(body).toContain('event: response.output_text.delta');
    expect(body).toContain('Proxy response');
    expect(body).toContain('event: response.completed');
    expect(body).toContain('data: [DONE]');
    expect(engine.requests[0]?.stream).toBe(true);
  });

  it('accepts Codex Responses WebSocket create events', async () => {
    const engine = createMockCompletionEngine({ text: 'Proxy websocket response' });
    const server = await startProxyServer(
      createProxyConfig({
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-responses',
        authToken: 'test-token',
        port: 0,
      }),
      engine,
    );

    try {
      const wsUrl = `${server.url.replace(/^http:/, 'ws:')}/v1/responses`;
      const events: Array<Record<string, unknown>> = [];
      const ws = new WebSocket(wsUrl, { headers: { authorization: 'Bearer test-token' } });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for websocket response')), 3000);
        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'response.create',
            model: 'gpt-4o',
            stream: true,
            input: 'tell me something',
          }));
        });
        ws.on('message', (data) => {
          const event = JSON.parse(data.toString()) as Record<string, unknown>;
          events.push(event);
          if (event.type === 'response.completed') {
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        });
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      expect(events.map((event) => event.type)).toContain('response.output_text.delta');
      expect(JSON.stringify(events)).toContain('Proxy websocket response');
      expect(engine.requests[0]?.transport).toBe('openai-responses');
      expect(engine.requests[0]?.stream).toBe(true);
    } finally {
      await server.stop();
    }
  });
});
