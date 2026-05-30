import { describe, expect, it } from 'vitest';

import { OpenAiChatCodec } from '../codecs/openai-chat.js';
import { AnthropicCodec } from '../codecs/anthropic.js';
import { GoogleCodec } from '../codecs/google.js';
import { BedrockConverseCodec } from '../codecs/bedrock.js';
import { OpenAiResponsesCodec } from '../codecs/openai-responses.js';
import {
  convertTools,
  getCodec,
  getCodecForDescriptor,
  listRegisteredCodecs,
  normalizeUsage,
  registerCodec,
} from '../codecs/index.js';

import type { CompletionResult } from '../types.js';
import type { TransportCodec } from '../codec.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeResult(overrides: Partial<CompletionResult> = {}): CompletionResult {
  return {
    id: 'res-1',
    model: 'test-model',
    role: 'assistant',
    text: 'Hello world',
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    ...overrides,
  };
}

/* ========================================================================== */
/*  OpenAI Chat Codec                                                         */
/* ========================================================================== */

describe('OpenAiChatCodec', () => {
  const codec = new OpenAiChatCodec();

  describe('decodeRequest', () => {
    it('decodes messages + tools into a CompletionRequest with tools extracted', () => {
      const body = {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'Hi' },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_weather',
              description: 'Get weather',
              parameters: { type: 'object', properties: { city: { type: 'string' } } },
            },
          },
        ],
        tool_choice: 'auto',
        stream: false,
      };

      const req = codec.decodeRequest(body);

      expect(req.model).toBe('gpt-4o');
      expect(req.transport).toBe('openai-chat');
      expect(req.messages).toHaveLength(2);
      expect(req.messages[0]).toEqual({ role: 'system', content: 'You are helpful.' });
      expect(req.messages[1]).toEqual({ role: 'user', content: 'Hi' });
      expect(req.tools).toHaveLength(1);
      expect(req.toolChoice).toBe('auto');
      expect(req.stream).toBe(false);
      expect(req.raw).toBe(body);
    });

    it('defaults model to mock-model when absent', () => {
      const req = codec.decodeRequest({ messages: [] });
      expect(req.model).toBe('mock-model');
    });

    it('handles array content with text parts', () => {
      const req = codec.decodeRequest({
        messages: [
          { role: 'user', content: [{ type: 'text', text: 'part-1' }, { type: 'text', text: 'part-2' }] },
        ],
      });
      expect(req.messages[0].content).toBe('part-1 part-2');
    });
  });

  describe('encodeResult', () => {
    it('produces an OpenAI-shaped response with id, object, model, choices, usage', () => {
      const result = makeResult();
      const encoded = codec.encodeResult(result) as Record<string, unknown>;

      expect(encoded.id).toBe('res-1');
      expect(encoded.object).toBe('chat.completion');
      expect(encoded.model).toBe('test-model');

      const choices = encoded.choices as Array<Record<string, unknown>>;
      expect(choices).toHaveLength(1);
      expect(choices[0].index).toBe(0);
      expect(choices[0].finish_reason).toBe('stop');

      const message = choices[0].message as Record<string, unknown>;
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Hello world');

      const usage = encoded.usage as Record<string, unknown>;
      expect(usage.prompt_tokens).toBe(10);
      expect(usage.completion_tokens).toBe(5);
      expect(usage.total_tokens).toBe(15);
    });
  });

  describe('normalizeTools', () => {
    it('converts OpenAI function-tool wrapper to NormalizedToolDefinition', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'search',
            description: 'Search the web',
            parameters: { type: 'object', properties: { q: { type: 'string' } } },
          },
        },
      ];

      const normalized = codec.normalizeTools!(tools);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].name).toBe('search');
      expect(normalized[0].description).toBe('Search the web');
      expect(normalized[0].parameters).toEqual({
        type: 'object',
        properties: { q: { type: 'string' } },
      });
    });

    it('falls back to direct name-based object when type is not function', () => {
      const tools = [{ name: 'lookup', description: 'Lookup something' }];
      const normalized = codec.normalizeTools!(tools);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].name).toBe('lookup');
    });
  });

  describe('extractCostRecord', () => {
    it('extracts cost record from OpenAI usage', () => {
      const result = makeResult();
      const cost = codec.extractCostRecord!(result);

      expect(cost).toBeDefined();
      expect(cost!.inputTokens).toBe(10);
      expect(cost!.outputTokens).toBe(5);
      expect(cost!.provider).toBe('openai');
      expect(cost!.model).toBe('test-model');
    });

    it('returns undefined when usage is missing', () => {
      const result = makeResult();
      (result as { usage: unknown }).usage = undefined as unknown as CompletionResult['usage'];
      const cost = codec.extractCostRecord!(result);
      expect(cost).toBeUndefined();
    });
  });
});

/* ========================================================================== */
/*  Anthropic Codec                                                           */
/* ========================================================================== */

describe('AnthropicCodec', () => {
  const codec = new AnthropicCodec();

  describe('decodeRequest', () => {
    it('decodes Anthropic tool format (input_schema) from body', () => {
      const body = {
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Hello' }],
        tools: [
          {
            name: 'calculator',
            description: 'Do math',
            input_schema: {
              type: 'object',
              properties: { expression: { type: 'string' } },
            },
          },
        ],
        tool_choice: { type: 'auto' },
        stream: true,
      };

      const req = codec.decodeRequest(body);

      expect(req.model).toBe('claude-sonnet-4-20250514');
      expect(req.transport).toBe('anthropic');
      expect(req.messages).toHaveLength(1);
      expect(req.messages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(req.tools).toHaveLength(1);
      expect((req.tools![0] as Record<string, unknown>).input_schema).toBeDefined();
      expect(req.toolChoice).toEqual({ type: 'auto' });
      expect(req.stream).toBe(true);
    });

    it('preserves Anthropic tool content blocks as rawContent', () => {
      const req = codec.decodeRequest({
        messages: [
          {
            role: 'assistant',
            content: [
              { type: 'text', text: 'I will write it.' },
              { type: 'tool_use', id: 'toolu_1', name: 'Write', input: { file_path: '/tmp/odyssey.md' } },
            ],
          },
          {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'toolu_1', content: 'ok' },
            ],
          },
        ],
      });

      expect(req.messages[0]).toMatchObject({
        role: 'assistant',
        content: 'I will write it.',
        rawContent: [
          { type: 'text', text: 'I will write it.' },
          { type: 'tool_use', id: 'toolu_1', name: 'Write', input: { file_path: '/tmp/odyssey.md' } },
        ],
      });
      expect(req.messages[1]).toMatchObject({
        role: 'user',
        content: '',
        rawContent: [
          { type: 'tool_result', tool_use_id: 'toolu_1', content: 'ok' },
        ],
      });
    });
  });

  describe('encodeResult', () => {
    it('encodes tool calls as Anthropic tool_use content blocks', () => {
      const encoded = codec.encodeResult(makeResult({
        text: '',
        finishReason: 'tool_calls',
        toolCalls: [{
          id: 'toolu_write_file',
          name: 'Write',
          arguments: JSON.stringify({ file_path: '/tmp/odyssey.md', content: '# Odyssey' }),
        }],
      })) as Record<string, unknown>;

      expect(encoded.stop_reason).toBe('tool_use');
      expect(encoded.content).toContainEqual({
        type: 'tool_use',
        id: 'toolu_write_file',
        name: 'Write',
        input: { file_path: '/tmp/odyssey.md', content: '# Odyssey' },
      });
    });
  });

  describe('normalizeTools', () => {
    it('converts input_schema to parameters', () => {
      const tools = [
        {
          name: 'fetch_url',
          description: 'Fetch a URL',
          input_schema: {
            type: 'object',
            properties: { url: { type: 'string' } },
          },
        },
      ];

      const normalized = codec.normalizeTools!(tools);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].name).toBe('fetch_url');
      expect(normalized[0].description).toBe('Fetch a URL');
      expect(normalized[0].parameters).toEqual({
        type: 'object',
        properties: { url: { type: 'string' } },
      });
    });
  });

  describe('denormalizeTools', () => {
    it('converts parameters back to input_schema', () => {
      const tools = [
        {
          name: 'write_file',
          description: 'Write a file',
          parameters: {
            type: 'object',
            properties: { path: { type: 'string' }, content: { type: 'string' } },
          },
        },
      ];

      const denormalized = codec.denormalizeTools!(tools) as Array<Record<string, unknown>>;
      expect(denormalized).toHaveLength(1);
      expect(denormalized[0].name).toBe('write_file');
      expect(denormalized[0].description).toBe('Write a file');
      expect(denormalized[0].input_schema).toEqual({
        type: 'object',
        properties: { path: { type: 'string' }, content: { type: 'string' } },
      });
    });

    it('provides default input_schema when parameters is undefined', () => {
      const tools = [{ name: 'no_params' }];
      const denormalized = codec.denormalizeTools!(tools) as Array<Record<string, unknown>>;
      expect(denormalized[0].input_schema).toEqual({ type: 'object', properties: {} });
    });
  });

  describe('extractCostRecord', () => {
    it('extracts cost record with cache tokens from raw costRecord', () => {
      const result = makeResult({
        costRecord: {
          inputTokens: 10,
          outputTokens: 5,
          cacheReadTokens: 100,
          cacheWriteTokens: 50,
        },
      });

      const cost = codec.extractCostRecord!(result);
      expect(cost).toBeDefined();
      expect(cost!.inputTokens).toBe(10);
      expect(cost!.outputTokens).toBe(5);
      expect(cost!.cacheReadTokens).toBe(100);
      expect(cost!.cacheWriteTokens).toBe(50);
      expect(cost!.provider).toBe('anthropic');
      expect(cost!.model).toBe('test-model');
    });

    it('returns cost record without cache tokens when costRecord is absent', () => {
      const result = makeResult();
      const cost = codec.extractCostRecord!(result);
      expect(cost).toBeDefined();
      expect(cost!.cacheReadTokens).toBeUndefined();
      expect(cost!.cacheWriteTokens).toBeUndefined();
    });
  });
});

/* ========================================================================== */
/*  Google Codec                                                              */
/* ========================================================================== */

describe('GoogleCodec', () => {
  const codec = new GoogleCodec();

  describe('decodeRequest', () => {
    it('decodes Google contents format with role mapping (model -> assistant)', () => {
      const body = {
        model: 'gemini-2.5-pro',
        contents: [
          { role: 'user', parts: [{ text: 'Hello' }] },
          { role: 'model', parts: [{ text: 'Hi there' }] },
        ],
        tools: [
          {
            functionDeclarations: [
              {
                name: 'search',
                description: 'Search the web',
                parameters: { type: 'object', properties: { query: { type: 'string' } } },
              },
            ],
          },
        ],
      };

      const req = codec.decodeRequest(body);

      expect(req.model).toBe('gemini-2.5-pro');
      expect(req.transport).toBe('google');
      expect(req.messages).toHaveLength(2);
      expect(req.messages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(req.messages[1]).toEqual({ role: 'assistant', content: 'Hi there' });
      expect(req.tools).toHaveLength(1);
      expect((req.tools![0] as Record<string, unknown>).name).toBe('search');
      expect(req.stream).toBe(false);
    });

    it('handles missing contents gracefully', () => {
      const req = codec.decodeRequest({ model: 'gemini-2.5-flash' });
      expect(req.messages).toEqual([]);
      expect(req.tools).toBeUndefined();
    });
  });

  describe('normalizeTools', () => {
    it('converts functionDeclarations wrapper to NormalizedToolDefinition[]', () => {
      const tools = [
        {
          functionDeclarations: [
            {
              name: 'get_weather',
              description: 'Get weather',
              parameters: { type: 'object', properties: { city: { type: 'string' } } },
            },
            {
              name: 'get_time',
              description: 'Get current time',
            },
          ],
        },
      ];

      const normalized = codec.normalizeTools!(tools);
      expect(normalized).toHaveLength(2);
      expect(normalized[0].name).toBe('get_weather');
      expect(normalized[0].description).toBe('Get weather');
      expect(normalized[0].parameters).toEqual({
        type: 'object',
        properties: { city: { type: 'string' } },
      });
      expect(normalized[1].name).toBe('get_time');
      expect(normalized[1].parameters).toBeUndefined();
    });

    it('handles direct function declaration objects with name field', () => {
      const tools = [
        { name: 'direct_fn', description: 'Direct function' },
      ];
      const normalized = codec.normalizeTools!(tools);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].name).toBe('direct_fn');
    });
  });

  describe('extractCostRecord', () => {
    it('extracts cost record from Google usage', () => {
      const result = makeResult();
      const cost = codec.extractCostRecord!(result);

      expect(cost).toBeDefined();
      expect(cost!.inputTokens).toBe(10);
      expect(cost!.outputTokens).toBe(5);
      expect(cost!.provider).toBe('google');
      expect(cost!.model).toBe('test-model');
    });
  });
});

/* ========================================================================== */
/*  Codec Registry (getCodec)                                                 */
/* ========================================================================== */

describe('getCodec', () => {
  it('returns correct codec for openai-chat', () => {
    const codec = getCodec('openai-chat');
    expect(codec).toBeDefined();
    expect(codec!.transportId).toBe('openai-chat');
  });

  it('returns correct codec for anthropic', () => {
    const codec = getCodec('anthropic');
    expect(codec).toBeDefined();
    expect(codec!.transportId).toBe('anthropic');
  });

  it('returns correct codec for google', () => {
    const codec = getCodec('google');
    expect(codec).toBeDefined();
    expect(codec!.transportId).toBe('google');
  });

  it('returns correct codec for openai-responses', () => {
    const codec = getCodec('openai-responses');
    expect(codec).toBeDefined();
    expect(codec!.transportId).toBe('openai-responses');
  });

  it('returns correct codec for bedrock-converse and bedrock alias', () => {
    expect(getCodec('bedrock-converse')?.transportId).toBe('bedrock-converse');
    expect(getCodec('bedrock')?.transportId).toBe('bedrock-converse');
  });

  it('resolves codecs from atlas TransportDescriptor-like objects', () => {
    const codec = getCodecForDescriptor({
      transportId: 'transport-runtime:openai-responses',
      codecCapabilities: {
        supportsTools: true,
        supportsStreaming: true,
        supportsTokenCounting: false,
        costTracking: true,
        toolSchemaFormat: 'openai',
      },
    });

    expect(codec?.transportId).toBe('openai-responses');
  });

  it('registers plugin codecs with deterministic aliases', () => {
    const codec: TransportCodec = {
      transportId: 'plugin-custom',
      capabilities: {
        supportsTools: false,
        supportsStreaming: false,
        supportsTokenCounting: false,
        costTracking: false,
        toolSchemaFormat: 'none',
      },
      decodeRequest(body) {
        return {
          model: 'plugin-model',
          transport: 'plugin-custom',
          messages: [],
          stream: false,
          raw: body,
        };
      },
      encodeResult(result) {
        return result;
      },
      encodeStreamChunk(event) {
        return JSON.stringify(event);
      },
    };

    const registeredIds = registerCodec(codec, {
      aliases: ['transport-runtime:plugin-custom', 'plugin-custom-completions'],
    });

    expect(registeredIds).toEqual([
      'plugin-custom',
      'transport-runtime:plugin-custom',
      'plugin-custom-completions',
    ]);
    expect(getCodec('plugin-custom')).toBe(codec);
    expect(getCodec('transport-runtime:plugin-custom')).toBe(codec);
    expect(getCodec('plugin-custom-completions')).toBe(codec);
    expect(listRegisteredCodecs()).toContain(codec);
  });

  it('rejects duplicate plugin codec registrations unless explicitly overridden', () => {
    const first: TransportCodec = {
      transportId: 'plugin-duplicate',
      capabilities: {
        supportsTools: false,
        supportsStreaming: false,
        supportsTokenCounting: false,
        costTracking: false,
        toolSchemaFormat: 'none',
      },
      decodeRequest(body) {
        return {
          model: 'first',
          transport: 'plugin-duplicate',
          messages: [],
          stream: false,
          raw: body,
        };
      },
      encodeResult(result) {
        return result;
      },
      encodeStreamChunk(event) {
        return JSON.stringify(event);
      },
    };
    const second: TransportCodec = {
      transportId: 'plugin-duplicate',
      capabilities: {
        supportsTools: false,
        supportsStreaming: false,
        supportsTokenCounting: false,
        costTracking: false,
        toolSchemaFormat: 'none',
      },
      decodeRequest(body) {
        return {
          model: 'replacement',
          transport: 'plugin-duplicate',
          messages: [],
          stream: false,
          raw: body,
        };
      },
      encodeResult(result) {
        return result;
      },
      encodeStreamChunk(event) {
        return JSON.stringify(event);
      },
    };

    registerCodec(first);
    expect(() => registerCodec(second)).toThrow(/already registered/);
    registerCodec(second, { override: true });
    expect(getCodec('plugin-duplicate')).toBe(second);
  });

  it('returns undefined for unknown transport', () => {
    const codec = getCodec('unknown-transport');
    expect(codec).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const codec = getCodec('');
    expect(codec).toBeUndefined();
  });
});

describe('OpenAiResponsesCodec', () => {
  const codec = new OpenAiResponsesCodec();

  it('round-trips input text, tools, result usage, and SSE chunks', () => {
    const request = codec.decodeRequest({
      model: 'gpt-4.1',
      input: [
        { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hello' }] },
      ],
      tools: [
        {
          type: 'function',
          name: 'lookup',
          description: 'Lookup data',
          parameters: { type: 'object', properties: { id: { type: 'string' } } },
        },
      ],
      stream: true,
    });

    expect(request.input).toBe('hello');
    expect(request.messages).toEqual([{ role: 'user', content: 'hello' }]);
    expect(codec.normalizeTools!(request.tools!)[0]).toMatchObject({ name: 'lookup' });

    const encoded = codec.encodeResult(makeResult()) as Record<string, unknown>;
    expect(encoded.object).toBe('response');
    expect((encoded.usage as Record<string, unknown>).input_tokens).toBe(10);
    expect((encoded.usage as Record<string, unknown>).output_tokens).toBe(5);

    expect(codec.encodeStreamChunk({ type: 'text-delta', text: 'hi' })).toContain('response.output_text.delta');
    expect(codec.encodeStreamChunk({ type: 'done', finishReason: 'stop' })).toContain('response.completed');
  });

  it('preserves Responses function call and output items for cross-provider tool loops', () => {
    const request = codec.decodeRequest({
      model: 'gpt-5-codex',
      input: [
        {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: 'write the odyssey artifact' }],
        },
        {
          type: 'function_call',
          call_id: 'toolu_write_file',
          name: 'Write',
          arguments: JSON.stringify({ file_path: '/tmp/odyssey.md', content: '# Odyssey' }),
        },
        {
          type: 'function_call_output',
          call_id: 'toolu_write_file',
          output: 'created',
        },
      ],
    });

    expect(request.messages).toEqual([
      {
        role: 'user',
        content: 'write the odyssey artifact',
      },
      {
        role: 'assistant',
        content: '',
        rawContent: [{
          type: 'tool_use',
          id: 'toolu_write_file',
          name: 'Write',
          input: { file_path: '/tmp/odyssey.md', content: '# Odyssey' },
        }],
      },
      {
        role: 'tool',
        content: 'created',
        rawContent: [{
          type: 'tool_result',
          tool_use_id: 'toolu_write_file',
          content: 'created',
        }],
      },
    ]);
    expect(request.input).toBe('write the odyssey artifact');
  });
});

describe('BedrockConverseCodec', () => {
  const codec = new BedrockConverseCodec();

  it('round-trips Bedrock Converse messages, result usage, and NDJSON chunks', () => {
    const request = codec.decodeRequest({
      modelId: 'anthropic.claude-sonnet',
      messages: [{ role: 'user', content: [{ text: 'hello' }] }],
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: 'lookup',
              description: 'Lookup data',
              inputSchema: { json: { type: 'object', properties: { id: { type: 'string' } } } },
            },
          },
        ],
      },
    });

    expect(request.model).toBe('anthropic.claude-sonnet');
    expect(request.messages).toEqual([{ role: 'user', content: 'hello' }]);
    expect(codec.normalizeTools!(request.tools!)[0]).toMatchObject({ name: 'lookup' });

    const encoded = codec.encodeResult(makeResult()) as Record<string, unknown>;
    expect((encoded.usage as Record<string, unknown>).inputTokens).toBe(10);
    expect((encoded.usage as Record<string, unknown>).outputTokens).toBe(5);

    expect(codec.encodeStreamChunk({ type: 'text-delta', text: 'hi' })).toContain('contentBlockDelta');
    expect(codec.encodeStreamChunk({ type: 'done', finishReason: 'stop' })).toContain('messageStop');
  });
});

describe('tool schema translation and usage normalization', () => {
  it('converts OpenAI tools to Anthropic and Google schema shapes', () => {
    const openAiTools = [
      {
        type: 'function',
        function: {
          name: 'search',
          description: 'Search',
          parameters: { type: 'object', properties: { q: { type: 'string' } } },
        },
      },
    ];

    expect(convertTools(openAiTools, 'openai', 'anthropic')).toEqual([
      {
        name: 'search',
        description: 'Search',
        input_schema: { type: 'object', properties: { q: { type: 'string' } } },
      },
    ]);

    expect(convertTools(openAiTools, 'openai', 'google')).toEqual([
      {
        functionDeclarations: [
          {
            name: 'search',
            description: 'Search',
            parameters: { type: 'object', properties: { q: { type: 'string' } } },
          },
        ],
      },
    ]);
  });

  it('normalizes OpenAI, Anthropic, Google, and Bedrock usage fields', () => {
    expect(normalizeUsage({ prompt_tokens: 7, completion_tokens: 3 })).toEqual({
      promptTokens: 7,
      completionTokens: 3,
      totalTokens: 10,
    });
    expect(normalizeUsage({ input_tokens: 11, output_tokens: 5 })).toEqual({
      promptTokens: 11,
      completionTokens: 5,
      totalTokens: 16,
    });
    expect(normalizeUsage({ promptTokenCount: 13, candidatesTokenCount: 8 })).toEqual({
      promptTokens: 13,
      completionTokens: 8,
      totalTokens: 21,
    });
    expect(normalizeUsage({ inputTokens: 17, outputTokens: 9 })).toEqual({
      promptTokens: 17,
      completionTokens: 9,
      totalTokens: 26,
    });
  });
});
