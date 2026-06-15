import { describe, expect, it } from 'vitest';

import { createTestApp, createTestConfig } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';

describe('anthropic transport', () => {
  it('returns a non-streaming message response', async () => {
    const engine = createMockCompletionEngine();
    const app = createTestApp({}, engine);

    const response = await app.request('/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        model: 'claude',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('message');
    expect(body.content[0].text).toBe('Hello');
    expect(engine.requests[0]?.messages[0]?.content).toBe('hi');
  });

  it('accepts bearer auth', async () => {
    const app = createTestApp({}, createMockCompletionEngine());

    const response = await app.request('/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        model: 'claude',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(response.status).toBe(200);
  });

  it('streams anthropic events when requested', async () => {
    const engine = createMockCompletionEngine({ text: 'Streaming hello' });
    const app = createTestApp({}, engine);

    const response = await app.request('/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        model: 'claude',
        stream: true,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const body = await response.text();
    expect(body).toContain('event: message_start');
    expect(body).toContain('event: content_block_delta');
    expect(body).toContain('Streaming hello');
    expect(body).toContain('event: message_stop');
    expect(engine.requests[0]?.stream).toBe(true);
  });

  it('rejects missing auth', async () => {
    const app = createTestApp({}, createMockCompletionEngine());
    const response = await app.request('/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    expect(response.status).toBe(401);
  });

  it('rejects wrong auth token', async () => {
    const app = createTestApp({}, createMockCompletionEngine());
    const response = await app.request('/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'wrong-token',
      },
      body: JSON.stringify({
        model: 'claude',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    expect(response.status).toBe(401);
  });

  it('keeps health and models endpoints readable without auth', async () => {
    const app = createTestApp();

    const health = await app.request('/health');
    expect(health.status).toBe(200);

    const models = await app.request('/v1/models');
    expect(models.status).toBe(200);
    expect((await models.json()).data[0].id).toBe(createTestConfig().targetModel);
  });
});
