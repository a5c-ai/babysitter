import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HttpServerMock, createScriptableTransportBuilder } from '../../../agent-mux/harness-mock/src/index.js';

import { createProxyConfig } from '../../src/config.js';
import { startProxyServer, type RunningProxyServer } from '../../src/server.js';

describe('transport-mux e2e http roundtrip', () => {
  let upstream: HttpServerMock;
  let server: RunningProxyServer;

  beforeEach(async () => {
    upstream = new HttpServerMock(
      createScriptableTransportBuilder()
        .name('transport-mux-upstream')
        .http({ port: 19085 })
        .onRequest('/v1/chat/completions', {
          status: 200,
          body: {
            id: 'upstream-response',
            object: 'chat.completion',
            choices: [{ message: { role: 'assistant', content: 'Hello from upstream' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          },
        })
        .build(),
      1,
    );
    await upstream.start();
    server = await startProxyServer(
      createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 'test-token',
        apiBase: upstream.serverUrl,
        port: 0,
      }),
    );
  });

  afterEach(async () => {
    await server.stop();
    await upstream.stop();
  });

  it('serves real HTTP requests through a live listener', async () => {
    const response = await fetch(`${server.url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.object).toBe('chat.completion');
    expect(body.choices[0].message.content).toBe('Hello from upstream');
    expect(upstream.requestHistory[0]?.path).toContain('/v1/chat/completions');
  });

  it('streams live HTTP responses without buffering them to completion first', async () => {
    await server.stop();
    await upstream.stop();

    server = await startProxyServer(
      createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 'test-token',
        port: 0,
      }),
      {
        async complete() {
          throw new Error('complete should not be used for stream requests');
        },
        async *stream(request) {
          yield { type: 'text-delta', text: `hello:${request.stream}` };
          await new Promise((resolve) => setTimeout(resolve, 150));
          yield { type: 'done', finishReason: 'stop' };
        },
      },
    );

    const response = await fetch(`${server.url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        stream: true,
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.body).toBeTruthy();

    const reader = response.body!.getReader();
    const firstChunk = await Promise.race([
      reader.read(),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 100)),
    ]);

    expect(firstChunk).not.toBe('timeout');
    if (firstChunk === 'timeout') {
      return;
    }

    expect(firstChunk.done).toBe(false);
    expect(new TextDecoder().decode(firstChunk.value)).toContain('hello:true');

    let tail = '';
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      tail += new TextDecoder().decode(chunk.value);
    }

    expect(tail).toContain('data: [DONE]');
  });

  it('returns the live hono 500 response when the handler throws', async () => {
    await server.stop();
    await upstream.stop();

    server = await startProxyServer(
      createProxyConfig({
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'openai-chat',
        authToken: 'test-token',
        port: 0,
      }),
      {
        async complete() {
          throw new Error('engine exploded');
        },
      },
    );

    const response = await fetch(`${server.url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toMatchObject({
      error: {
        message: 'engine exploded',
      },
    });
  });
});
