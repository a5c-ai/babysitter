import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGoogleCompletionEngine } from '../src/commands/launch-completion-engine.js';

describe('launch completion engines', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls Vertex Gemini with project, global location, and API key', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Google reply' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 4, totalTokenCount: 7 },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const engine = createGoogleCompletionEngine({
      apiKey: 'google-key',
      targetModel: 'gemini-3.1-pro-preview',
      provider: 'vertex',
      project: 'google-project',
      location: 'global',
      useVertexAi: true,
    });

    const result = await engine.complete({
      model: 'gemini-3.1-pro-preview',
      transport: 'anthropic',
      messages: [{ role: 'user', content: 'hello' }],
      stream: false,
      raw: {},
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://aiplatform.googleapis.com/v1/projects/google-project/locations/global/publishers/google/models/gemini-3.1-pro-preview:generateContent?key=google-key');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'hello' }] }] }),
    });
    expect(result.text).toBe('Google reply');
    expect(result.usage.totalTokens).toBe(7);
  });
});
