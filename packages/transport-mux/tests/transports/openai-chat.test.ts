import { describe, expect, it } from 'vitest';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';

describe('openai chat transport', () => {
  it('returns chat completions', async () => {
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-chat',
      },
      createMockCompletionEngine({ text: 'Test reply' }),
    );

    const response = await app.request('/v1/chat/completions', {
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
    expect(body.id).toBeDefined();
    expect(body.object).toBe('chat.completion');
    expect(body.choices[0].message.content).toBe('Test reply');
  });

  it('rejects missing auth', async () => {
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-chat',
      },
      createMockCompletionEngine(),
    );

    const response = await app.request('/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });

    expect(response.status).toBe(401);
  });

  it('streams openai chat chunks when requested', async () => {
    const engine = createMockCompletionEngine({ text: 'Chunked reply' });
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-chat',
      },
      engine,
    );

    const response = await app.request('/v1/chat/completions', {
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
    const body = await response.text();
    expect(body).toContain('"object":"chat.completion.chunk"');
    expect(body).toContain('"content":"Chunked reply"');
    expect(body).toContain('data: [DONE]');
    expect(engine.requests[0]?.stream).toBe(true);
  });

  it('rejects stream requests when proxy streaming is disabled', async () => {
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-chat',
        stream: false,
      },
      createMockCompletionEngine({ text: 'Test reply' }),
    );

    const response = await app.request('/v1/chat/completions', {
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: 'Streaming was requested but is disabled by proxy configuration.' },
    });
  });

  it('returns 501 when the configured completion engine cannot stream', async () => {
    const app = createTestApp(
      {
        targetProvider: 'anthropic',
        targetModel: 'anthropic/claude',
        exposedTransport: 'openai-chat',
      },
      {
        async complete(request) {
          return {
            id: 'non-streaming-engine',
            model: request.model,
            role: 'assistant',
            text: 'buffered only',
            finishReason: 'stop',
            usage: {
              promptTokens: 10,
              completionTokens: 5,
              totalTokens: 15,
            },
          };
        },
      },
    );

    const response = await app.request('/v1/chat/completions', {
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

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: {
        message: 'Streaming was requested for openai-chat, but the configured completion engine cannot stream.',
      },
    });
  });
});
