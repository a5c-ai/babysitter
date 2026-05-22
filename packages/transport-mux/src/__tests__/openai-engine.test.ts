import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOpenAICompletionEngine } from '../engines/openai.js';

const fetchMock = vi.fn();

const originalFetch = globalThis.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
  globalThis.fetch = originalFetch;
});

describe('createOpenAICompletionEngine', () => {
  it('normalizes Anthropic tool schemas before calling OpenAI-compatible chat completions', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      id: 'chatcmpl-test',
      choices: [{ message: { content: 'done' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const engine = createOpenAICompletionEngine({
      apiBase: 'https://example.openai.azure.com',
      apiKey: 'key',
      targetModel: 'gpt-live',
    });

    await engine.complete({
      model: 'claude-sonnet',
      transport: 'anthropic',
      messages: [{ role: 'user', content: 'use a tool' }],
      tools: [
        {
          name: 'write_file',
          description: 'Write a file',
          input_schema: { type: 'object', properties: { path: { type: 'string' } } },
        },
      ],
      toolChoice: { type: 'tool', name: 'write_file' },
      stream: false,
      raw: {},
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.tools).toEqual([
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: 'Write a file',
          parameters: { type: 'object', properties: { path: { type: 'string' } } },
        },
      },
    ]);
    expect(body.tool_choice).toEqual({ type: 'function', function: { name: 'write_file' } });
  });
});
