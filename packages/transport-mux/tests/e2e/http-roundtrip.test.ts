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
});
