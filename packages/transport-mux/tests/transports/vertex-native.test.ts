import { describe, expect, it } from 'vitest';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';

describe('vertex native transport', () => {
  it('returns generateContent response', async () => {
    const app = createTestApp(
      {
        targetProvider: 'vertex',
        targetModel: 'vertex/claude-sonnet-4@20250514',
        exposedTransport: 'vertex-native',
      },
      createMockCompletionEngine({ text: 'Hello' }),
    );

    const response = await app.request('/v1/projects/p/locations/l/publishers/pub/models/m:generateContent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.candidates[0].content.parts[0].text).toBe('Hello');
    expect(body.candidates[0].finishReason).toBe('STOP');
  });

  it('rejects unsupported streaming requests explicitly', async () => {
    const app = createTestApp(
      {
        targetProvider: 'vertex',
        targetModel: 'vertex/claude-sonnet-4@20250514',
        exposedTransport: 'vertex-native',
      },
      createMockCompletionEngine({ text: 'Hello' }),
    );

    const response = await app.request('/v1/projects/p/locations/l/publishers/pub/models/m:generateContent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        stream: true,
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: 'Streaming is not supported for vertex-native.' },
    });
  });
});
