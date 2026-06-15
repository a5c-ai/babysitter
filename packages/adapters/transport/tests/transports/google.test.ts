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
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const body = await response.text();
    expect(body).toContain('"text":"Gemini reply"');
    expect(engine.requests[0]?.stream).toBe(true);
  });

  it('preserves Google parametersJsonSchema and streams functionCall args', async () => {
    const engine = {
      requests: [] as unknown[],
      async complete() {
        throw new Error('complete should not be used for stream requests');
      },
      async *stream(request: unknown) {
        this.requests.push(request);
        yield {
          type: 'tool-call' as const,
          id: 'call_write',
          name: 'write_file',
          arguments: JSON.stringify({ file_path: '/tmp/out.txt', content: 'hello' }),
        };
        yield {
          type: 'done' as const,
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        };
      },
    };
    const app = createTestApp(
      {
        targetProvider: 'openai',
        targetModel: 'openai/gpt-5.4-mini',
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
        contents: [{ role: 'user', parts: [{ text: 'write a file' }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: 'write_file',
                description: 'Write a file',
                parametersJsonSchema: {
                  type: 'object',
                  required: ['file_path', 'content'],
                  properties: {
                    file_path: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
            ],
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"functionCall"');
    expect(body).toContain('"file_path":"/tmp/out.txt"');
    expect(body).toContain('"content":"hello"');

    const request = engine.requests[0] as { tools?: Array<{ parameters?: Record<string, unknown> }> };
    expect(request.tools?.[0]?.parameters).toEqual({
      type: 'object',
      required: ['file_path', 'content'],
      properties: {
        file_path: { type: 'string' },
        content: { type: 'string' },
      },
    });
  });

  it('streams an empty functionCall args object when tool-call arguments are malformed JSON', async () => {
    const engine = {
      requests: [] as unknown[],
      async complete() {
        throw new Error('complete should not be used for stream requests');
      },
      async *stream(request: unknown) {
        this.requests.push(request);
        yield {
          type: 'tool-call' as const,
          id: 'call_bad',
          name: 'write_file',
          arguments: '{"file_path":',
        };
        yield {
          type: 'done' as const,
          finishReason: 'stop',
          usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
        };
      },
    };
    const app = createTestApp(
      {
        targetProvider: 'openai',
        targetModel: 'openai/gpt-5.4-mini',
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
        contents: [{ role: 'user', parts: [{ text: 'write a file' }] }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"functionCall":{"name":"write_file","args":{}}');
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
