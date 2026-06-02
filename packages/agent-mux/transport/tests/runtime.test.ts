import { describe, expect, it } from 'vitest';

import { HttpServerMock, createScriptableTransportBuilder } from '../../agent-mux/harness-mock/src/index.js';

import { applyTransportMuxToHarnessEnv, startTransportMuxRuntime, type TransportMuxRuntime } from '../src/runtime.js';

describe('transport-mux runtime', () => {
  it('starts a runtime and applies openai harness env from the running listener', async () => {
    const upstream = new HttpServerMock(
      createScriptableTransportBuilder()
        .name('transport-mux-runtime-upstream')
        .http({ port: 19086 })
        .onRequest('/v1/chat/completions', {
          status: 200,
          body: {
            id: 'runtime-response',
            object: 'chat.completion',
            choices: [{ message: { role: 'assistant', content: 'Hello from runtime' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          },
        })
        .build(),
      1,
    );
    await upstream.start();
    const runtime = await startTransportMuxRuntime({
      targetProvider: 'openai',
      targetModel: 'openai/gpt-4o',
      exposedTransport: 'openai-chat',
      apiBase: upstream.serverUrl,
      port: 0,
    });

    const env = runtime.applyHarnessEnv({});

    expect(env['OPENAI_BASE_URL']).toBe(runtime.url);
    expect(env['OPENAI_API_KEY']).toBe(runtime.authToken);
    expect(env['AMUX_PROXY_BASE_URL']).toBe(runtime.url);
    expect(env['AMUX_PROXY_AUTH_TOKEN']).toBe(runtime.authToken);

    const response = await fetch(`${runtime.url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${runtime.authToken}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.choices[0].message.content).toBe('Hello from runtime');

    await runtime.stop();
    await upstream.stop();
  });

  it('maps anthropic transport env consistently', () => {
    const env = applyTransportMuxToHarnessEnv({}, 'anthropic', 'http://127.0.0.1:4317', 'runtime-token');

    expect(env['ANTHROPIC_BASE_URL']).toBe('http://127.0.0.1:4317');
    expect(env['ANTHROPIC_API_KEY']).toBe('runtime-token');
    expect(env['ANTHROPIC_AUTH_TOKEN']).toBe('runtime-token');
  });

  it('maps google transport env for Gemini CLI and Google GenAI SDKs', () => {
    const env = applyTransportMuxToHarnessEnv({}, 'google', 'http://127.0.0.1:4318', 'runtime-token');

    expect(env['CODE_ASSIST_ENDPOINT']).toBe('http://127.0.0.1:4318');
    expect(env['GOOGLE_API_KEY']).toBe('runtime-token');
    expect(env['GEMINI_API_KEY']).toBe('runtime-token');
  });
});
