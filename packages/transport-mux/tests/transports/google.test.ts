import { describe, expect, it } from 'vitest';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';

describe('google transport', () => {
  it('returns generateContent response', async () => {
    const app = createTestApp(
      {
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'google',
      },
      createMockCompletionEngine({ text: 'Gemini reply' }),
    );

    const response = await app.request('/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hello' }] }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.candidates[0].content.role).toBe('model');
    expect(body.candidates[0].content.parts[0].text).toBe('Gemini reply');
    expect(body.usageMetadata.totalTokenCount).toBe(15);
  });

  it('streams google responses through the dedicated route', async () => {
    const engine = createMockCompletionEngine({ text: 'Gemini reply' });
    const app = createTestApp(
      {
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'google',
      },
      engine,
    );

    const response = await app.request('/v1beta/models/gemini-pro:streamGenerateContent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hello' }] }],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    const body = await response.text();
    expect(body).toContain('"text":"Gemini reply"');
    expect(engine.requests[0]?.stream).toBe(true);
  });

  it('rejects google stream flags on the buffered generateContent route', async () => {
    const app = createTestApp(
      {
        targetProvider: 'openai',
        targetModel: 'openai/gpt-4o',
        exposedTransport: 'google',
      },
      createMockCompletionEngine({ text: 'Gemini reply' }),
    );

    const response = await app.request('/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        stream: true,
        contents: [{ role: 'user', parts: [{ text: 'hello' }] }],
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: 'Google streaming requires the dedicated :streamGenerateContent route.' },
    });
  });
});
