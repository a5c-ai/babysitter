import * as http from 'node:http';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Hono } from 'hono';

import type {
  CompletionEngine,
  CompletionRequest,
  CompletionResult,
  CompletionStreamEvent,
  CreateTransportMuxAppOptions,
  ProxyConfig,
  RunningProxyServer,
  TokenCountResult,
} from './types.js';

const STREAMING_TRANSPORTS = new Set<ProxyConfig['exposedTransport']>([
  'anthropic',
  'openai-chat',
  'openai-responses',
  'google',
  'passthrough',
]);

interface CompletionExecutionPlan {
  body: Record<string, unknown>;
  request: CompletionRequest;
  streamRequested: boolean;
}

class MetricsTracker {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private totalRequests = 0;
  private totalErrors = 0;
  private readonly startedAt = Date.now();

  record(inputTokens: number, outputTokens: number): void {
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalRequests += 1;
  }

  recordRequest(): void {
    this.totalRequests += 1;
  }

  recordError(): void {
    this.totalErrors += 1;
  }

  toJSON() {
    const uptimeSeconds = Math.max(0, (Date.now() - this.startedAt) / 1000);
    return {
      total_input_tokens: this.totalInputTokens,
      total_output_tokens: this.totalOutputTokens,
      total_requests: this.totalRequests,
      total_errors: this.totalErrors,
      uptime_seconds: Math.round(uptimeSeconds * 10) / 10,
      avg_tokens_per_request: Math.round(
        ((this.totalInputTokens + this.totalOutputTokens) / Math.max(this.totalRequests, 1)) * 10,
      ) / 10,
    };
  }
}

function isAuthorized(req: Request, authToken?: string): boolean {
  if (!authToken) {
    return true;
  }

  const apiKey = req.headers.get('x-api-key');
  if (apiKey === authToken) {
    return true;
  }

  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return false;
  }

  const [scheme, value] = authorization.split(/\s+/, 2);
  return scheme?.toLowerCase() === 'bearer' && value === authToken;
}

function parseMessageContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
          return (part as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function normalizeMessages(raw: unknown): CompletionRequest['messages'] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((entry) => {
    const record = entry as { role?: unknown; content?: unknown; parts?: unknown };
    return {
      role: typeof record.role === 'string' ? record.role : 'user',
      content: parseMessageContent(record.content ?? record.parts),
      rawContent: record.content,
    };
  });
}

function normalizeInput(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }
        if (entry && typeof entry === 'object' && 'text' in entry && typeof (entry as { text?: unknown }).text === 'string') {
          return (entry as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function usageShape(result: CompletionResult) {
  return {
    prompt_tokens: result.usage.promptTokens,
    completion_tokens: result.usage.completionTokens,
    total_tokens: result.usage.totalTokens,
  };
}

async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return {};
    }
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function readStrictJsonBody(req: Request): Promise<Record<string, unknown> | Response> {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return createErrorResponse('Request body must be a JSON object.');
    }
    return body as Record<string, unknown>;
  } catch {
    return createErrorResponse('Request body must be valid JSON.');
  }
}

function isStreamingRequestedByBody(body: Record<string, unknown>): boolean {
  return body.stream === true;
}

function createErrorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function supportsStreaming(transport: ProxyConfig['exposedTransport']): boolean {
  return STREAMING_TRANSPORTS.has(transport);
}

function buildCompletionRequest(
  body: Record<string, unknown>,
  transport: ProxyConfig['exposedTransport'],
  stream: boolean,
  thoughtSignatureStore?: Map<string, string>,
): CompletionRequest {
  const messages =
    transport === 'google' || transport === 'vertex-native'
      ? normalizeMessages(body.contents)
      : transport === 'openai-responses'
        ? [{ role: 'user', content: normalizeInput(body.input) }]
        : transport === 'bedrock-converse'
          ? normalizeMessages(
              Array.isArray(body.messages)
                ? (body.messages as Array<{ role?: string; content?: unknown }>).map((message) => ({
                    role: message.role,
                    content: Array.isArray(message.content) ? message.content : message.content,
                  }))
                : [],
            )
          : normalizeMessages(body.messages);

  return {
    model: typeof body.model === 'string'
      ? body.model
      : typeof body.modelId === 'string'
        ? body.modelId
        : 'mock-model',
    transport,
    messages,
    tools: Array.isArray(body.tools) ? body.tools as unknown[] : undefined,
    toolChoice: body.tool_choice ?? body.toolChoice ?? undefined,
    stream,
    input: transport === 'openai-responses' ? normalizeInput(body.input) : undefined,
    raw: body,
    thoughtSignatureStore,
  };
}

async function createExecutionPlan(
  req: Request,
  transport: ProxyConfig['exposedTransport'],
  options: { forceStreaming?: boolean; thoughtSignatureStore?: Map<string, string> } = {},
): Promise<CompletionExecutionPlan | Response> {
  const body = await readJsonBody(req.clone());
  const bodyRequestedStream = isStreamingRequestedByBody(body);

  if (transport === 'google' && bodyRequestedStream && !options.forceStreaming) {
    return createErrorResponse(
      'Google streaming requires the dedicated :streamGenerateContent route.',
    );
  }

  const streamRequested = options.forceStreaming === true || bodyRequestedStream;
  return {
    body,
    request: buildCompletionRequest(body, transport, streamRequested, options.thoughtSignatureStore),
    streamRequested,
  };
}

function normalizeProviderId(provider: string): string {
  return provider.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function resolvePassthroughApiBase(config: ProxyConfig, env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (config.apiBase) {
    return config.apiBase;
  }

  const legacyOverride = env.AMUX_PROXY_TARGET_API_BASE?.trim();
  if (legacyOverride) {
    return legacyOverride;
  }

  const provider = normalizeProviderId(config.targetProvider);
  switch (provider) {
    case 'anthropic':
      return 'https://api.anthropic.com';
    case 'openai':
      return 'https://api.openai.com';
    case 'google':
      return 'https://generativelanguage.googleapis.com';
    case 'openrouter':
      return 'https://openrouter.ai/api';
    case 'groq':
      return 'https://api.groq.com/openai';
    case 'fireworks':
    case 'fireworks-ai':
      return 'https://api.fireworks.ai/inference';
    case 'together':
    case 'together-ai':
      return 'https://api.together.xyz';
    case 'deepseek':
      return 'https://api.deepseek.com';
    case 'mistral':
      return 'https://api.mistral.ai';
    case 'cerebras':
      return 'https://api.cerebras.ai';
    case 'sambanova':
      return 'https://api.sambanova.ai';
    case 'nvidia-nim':
      return 'https://integrate.api.nvidia.com';
    case 'perplexity':
      return 'https://api.perplexity.ai';
    case 'cohere':
      return 'https://api.cohere.com';
    case 'ollama':
      return 'http://localhost:11434';
    case 'local':
      return 'http://localhost:8080';
    case 'lmstudio':
      return 'http://localhost:1234';
    case 'vllm':
      return 'http://localhost:8000';
    default:
      return undefined;
  }
}

function injectPassthroughProviderAuth(
  config: ProxyConfig,
  headers: Headers,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const provider = normalizeProviderId(config.targetProvider);

  switch (provider) {
    case 'anthropic': {
      const apiKey = env.ANTHROPIC_API_KEY?.trim();
      if (apiKey) {
        headers.set('x-api-key', apiKey);
        headers.set('anthropic-version', '2023-06-01');
      }
      return;
    }
    case 'google': {
      const apiKey = env.GOOGLE_API_KEY?.trim() || env.GEMINI_API_KEY?.trim();
      if (apiKey) {
        headers.set('x-goog-api-key', apiKey);
      }
      return;
    }
    case 'openai':
    case 'openrouter':
    case 'groq':
    case 'fireworks':
    case 'fireworks-ai':
    case 'together':
    case 'together-ai':
    case 'deepseek':
    case 'mistral':
    case 'cerebras':
    case 'sambanova':
    case 'nvidia-nim':
    case 'perplexity':
    case 'cohere':
    case 'custom': {
      const envKeysByProvider: Record<string, string[]> = {
        openai: ['OPENAI_API_KEY'],
        openrouter: ['OPENROUTER_API_KEY', 'OPENAI_API_KEY'],
        groq: ['GROQ_API_KEY', 'OPENAI_API_KEY'],
        fireworks: ['FIREWORKS_API_KEY', 'OPENAI_API_KEY'],
        'fireworks-ai': ['FIREWORKS_API_KEY', 'OPENAI_API_KEY'],
        together: ['TOGETHER_API_KEY', 'OPENAI_API_KEY'],
        'together-ai': ['TOGETHER_API_KEY', 'OPENAI_API_KEY'],
        deepseek: ['DEEPSEEK_API_KEY', 'OPENAI_API_KEY'],
        mistral: ['MISTRAL_API_KEY', 'OPENAI_API_KEY'],
        cerebras: ['CEREBRAS_API_KEY', 'OPENAI_API_KEY'],
        sambanova: ['SAMBANOVA_API_KEY', 'OPENAI_API_KEY'],
        'nvidia-nim': ['NVIDIA_API_KEY', 'OPENAI_API_KEY'],
        perplexity: ['PERPLEXITY_API_KEY', 'OPENAI_API_KEY'],
        cohere: ['COHERE_API_KEY', 'OPENAI_API_KEY'],
        custom: ['OPENAI_API_KEY'],
      };
      const apiKey = envKeysByProvider[provider]
        ?.map((envKey) => env[envKey]?.trim())
        .find(Boolean);
      if (apiKey) {
        headers.set('authorization', `Bearer ${apiKey}`);
      }
      return;
    }
  }
}

async function proxyUpstream(req: Request, config: ProxyConfig, forwardedPath?: string): Promise<Response> {
  const apiBase = resolvePassthroughApiBase(config);
  if (!apiBase) {
    return new Response(JSON.stringify({ error: 'No completion engine or apiBase configured.' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    });
  }

  const requestUrl = new URL(req.url);
  const upstreamUrl = new URL(forwardedPath ?? requestUrl.pathname, apiBase);
  upstreamUrl.search = requestUrl.search;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('x-api-key');
  headers.delete('authorization');

  injectPassthroughProviderAuth(config, headers);

  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  return fetch(upstreamUrl, init);
}

function encodeSseChunk(prefix: string, payload: unknown): string {
  return `${prefix}${JSON.stringify(payload)}\n\n`;
}

function anthropicStreamResponse(
  stream: AsyncIterable<CompletionStreamEvent>,
  config: ProxyConfig,
): Response {
  const encoder = new TextEncoder();
  const messageId = `msg_${randomUUID()}`;

  return new Response(
    new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            encodeSseChunk(
              'event: message_start\ndata: ',
              {
                type: 'message_start',
                message: {
                  id: messageId,
                  type: 'message',
                  role: 'assistant',
                  content: [],
                  model: config.targetModel,
                },
              },
            ),
          ),
        );
        controller.enqueue(
          encoder.encode(
            encodeSseChunk(
              'event: content_block_start\ndata: ',
              {
                type: 'content_block_start',
                index: 0,
                content_block: { type: 'text', text: '' },
              },
            ),
          ),
        );

        let contentIndex = 0;
        let hasToolUse = false;

        for await (const event of stream) {
          if (event.type === 'text-delta' && event.text) {
            controller.enqueue(
              encoder.encode(
                encodeSseChunk(
                  'event: content_block_delta\ndata: ',
                  {
                    type: 'content_block_delta',
                    index: contentIndex,
                    delta: { type: 'text_delta', text: event.text },
                  },
                ),
              ),
            );
          } else if (event.type === 'tool-call') {
            // Close text block before first tool_use
            if (!hasToolUse) {
              controller.enqueue(encoder.encode(
                encodeSseChunk('event: content_block_stop\ndata: ', { type: 'content_block_stop', index: contentIndex }),
              ));
              contentIndex++;
              hasToolUse = true;
            }
            // Anthropic streaming format: content_block_start with empty input,
            // then input_json_delta with the full JSON, then content_block_stop.
            const toolUseBlock: Record<string, unknown> = { type: 'tool_use', id: event.id, name: event.name, input: {} };
            if (event.metadata) Object.assign(toolUseBlock, event.metadata);
            controller.enqueue(encoder.encode(
              encodeSseChunk('event: content_block_start\ndata: ', {
                type: 'content_block_start',
                index: contentIndex,
                content_block: toolUseBlock,
              }),
            ));
            controller.enqueue(encoder.encode(
              encodeSseChunk('event: content_block_delta\ndata: ', {
                type: 'content_block_delta',
                index: contentIndex,
                delta: { type: 'input_json_delta', partial_json: event.arguments },
              }),
            ));
            controller.enqueue(encoder.encode(
              encodeSseChunk('event: content_block_stop\ndata: ', { type: 'content_block_stop', index: contentIndex }),
            ));
            contentIndex++;
          }
        }

        if (!hasToolUse) {
          controller.enqueue(
            encoder.encode(
              encodeSseChunk(
                'event: content_block_stop\ndata: ',
                { type: 'content_block_stop', index: contentIndex },
              ),
            ),
          );
        }
        controller.enqueue(
          encoder.encode(
            encodeSseChunk('event: message_delta\ndata: ', {
              type: 'message_delta',
              delta: { stop_reason: hasToolUse ? 'tool_use' : 'end_turn' },
            }),
          ),
        );
        controller.enqueue(
          encoder.encode(
            encodeSseChunk('event: message_stop\ndata: ', { type: 'message_stop' }),
          ),
        );
        controller.close();
      },
    }),
    { headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } },
  );
}

function openAiChatStreamResponse(
  stream: AsyncIterable<CompletionStreamEvent>,
  config: ProxyConfig,
): Response {
  const encoder = new TextEncoder();
  const responseId = `chatcmpl_${randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);

  return new Response(
    new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            encodeSseChunk('data: ', {
              id: responseId,
              object: 'chat.completion.chunk',
              created,
              model: config.targetModel,
              choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
            }),
          ),
        );

        let finishReason: string | null = 'stop';
        for await (const event of stream) {
          if (event.type === 'text-delta' && event.text) {
            controller.enqueue(
              encoder.encode(
                encodeSseChunk('data: ', {
                  id: responseId,
                  object: 'chat.completion.chunk',
                  created,
                  model: config.targetModel,
                  choices: [{ index: 0, delta: { content: event.text }, finish_reason: null }],
                }),
              ),
            );
            continue;
          }

          if (event.type === 'done' && event.finishReason) {
            finishReason = event.finishReason;
          }
        }

        controller.enqueue(
          encoder.encode(
            encodeSseChunk('data: ', {
              id: responseId,
              object: 'chat.completion.chunk',
              created,
              model: config.targetModel,
              choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
            }),
          ),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    }),
    { headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } },
  );
}

function openAiResponsesStreamResponse(
  stream: AsyncIterable<CompletionStreamEvent>,
  _config: ProxyConfig,
): Response {
  const encoder = new TextEncoder();
  const responseId = `resp_${randomUUID()}`;

  return new Response(
    new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            encodeSseChunk('event: response.created\ndata: ', {
              type: 'response.created',
              response: { id: responseId, status: 'in_progress' },
            }),
          ),
        );
        controller.enqueue(
          encoder.encode(
            encodeSseChunk('event: response.output_item.added\ndata: ', {
              type: 'response.output_item.added',
              output_index: 0,
              item: { type: 'message', role: 'assistant' },
            }),
          ),
        );
        controller.enqueue(
          encoder.encode(
            encodeSseChunk('event: response.content_part.added\ndata: ', {
              type: 'response.content_part.added',
              output_index: 0,
              content_index: 0,
              part: { type: 'output_text', text: '' },
            }),
          ),
        );

        for await (const event of stream) {
          if (event.type === 'text-delta' && event.text) {
            controller.enqueue(
              encoder.encode(
                encodeSseChunk('event: response.output_text.delta\ndata: ', {
                  type: 'response.output_text.delta',
                  output_index: 0,
                  content_index: 0,
                  delta: event.text,
                }),
              ),
            );
          }
        }

        controller.enqueue(
          encoder.encode(
            encodeSseChunk('event: response.output_text.done\ndata: ', {
              type: 'response.output_text.done',
              output_index: 0,
              content_index: 0,
            }),
          ),
        );
        controller.enqueue(
          encoder.encode(
            encodeSseChunk('event: response.completed\ndata: ', {
              type: 'response.completed',
              response: { id: responseId, status: 'completed' },
            }),
          ),
        );
        controller.close();
      },
    }),
    { headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } },
  );
}

function googleStreamResponse(stream: AsyncIterable<CompletionStreamEvent>): Response {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type !== 'text-delta' || !event.text) {
            continue;
          }

          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({
                candidates: [{ content: { parts: [{ text: event.text }], role: 'model' } }],
              })}\n`,
            ),
          );
        }
        controller.close();
      },
    }),
    { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-cache' } },
  );
}

function renderStreamResponse(
  transport: ProxyConfig['exposedTransport'],
  stream: AsyncIterable<CompletionStreamEvent>,
  config: ProxyConfig,
): Response {
  switch (transport) {
    case 'anthropic':
      return anthropicStreamResponse(stream, config);
    case 'openai-chat':
      return openAiChatStreamResponse(stream, config);
    case 'openai-responses':
      return openAiResponsesStreamResponse(stream, config);
    case 'google':
      return googleStreamResponse(stream);
    default:
      return createErrorResponse(`Streaming is not supported for ${transport}.`);
  }
}

function trackCompletionStream(
  stream: AsyncIterable<CompletionStreamEvent>,
  metrics: MetricsTracker,
): AsyncIterable<CompletionStreamEvent> {
  return {
    async *[Symbol.asyncIterator]() {
      let recorded = false;

      try {
        for await (const event of stream) {
          if (event.type === 'done') {
            if (event.usage) {
              metrics.record(event.usage.promptTokens, event.usage.completionTokens);
            } else {
              metrics.recordRequest();
            }
            recorded = true;
          }

          yield event;
        }

        if (!recorded) {
          metrics.recordRequest();
        }
      } catch (error) {
        metrics.recordError();
        throw error;
      }
    },
  };
}

function trackCompletionOutcome<T extends CompletionResult | Response>(
  result: T,
  metrics: MetricsTracker,
  options: { countSuccessResponse?: boolean } = {},
): T {
  if (result instanceof Response) {
    if (result.status >= 400) {
      metrics.recordError();
    } else if (options.countSuccessResponse) {
      metrics.recordRequest();
    }
    return result;
  }

  metrics.record(result.usage.promptTokens, result.usage.completionTokens);
  return result;
}

async function resolveCompletion(
  req: Request,
  config: ProxyConfig,
  completionEngine: CompletionEngine | undefined,
  plan: CompletionExecutionPlan,
  metrics: MetricsTracker,
  options: { forceStreaming?: boolean } = {},
): Promise<CompletionResult | Response> {
  if (plan.streamRequested) {
    if (!config.stream) {
      return createErrorResponse('Streaming was requested but is disabled by proxy configuration.');
    }
    if (!supportsStreaming(config.exposedTransport)) {
      return createErrorResponse(`Streaming is not supported for ${config.exposedTransport}.`);
    }
    if (!completionEngine) {
      return proxyUpstream(req, config, options.forceStreaming ? new URL(req.url).pathname : undefined);
    }
    if (!completionEngine.stream) {
      return createErrorResponse(
        `Streaming was requested for ${config.exposedTransport}, but the configured completion engine cannot stream.`,
        501,
      );
    }

    return renderStreamResponse(
      config.exposedTransport,
      trackCompletionStream(completionEngine.stream(plan.request), metrics),
      config,
    );
  }

  if (!completionEngine) {
    return proxyUpstream(req, config);
  }

  plan.request.model = config.targetModel;
  return completionEngine.complete(plan.request);
}

function anthropicResponse(result: CompletionResult, config: ProxyConfig) {
  const content: Array<Record<string, unknown>> = [];
  if (result.text) {
    content.push({ type: 'text', text: result.text });
  }
  if (result.toolCalls) {
    for (const tc of result.toolCalls) {
      let input: unknown;
      try { input = JSON.parse(tc.arguments); } catch { input = {}; }
      const block: Record<string, unknown> = { type: 'tool_use', id: tc.id, name: tc.name, input };
      if (tc.metadata) Object.assign(block, tc.metadata);
      content.push(block);
    }
  }
  if (content.length === 0) {
    content.push({ type: 'text', text: '' });
  }
  return {
    id: result.id,
    type: 'message',
    role: 'assistant',
    model: config.targetModel,
    stop_reason: result.toolCalls?.length ? 'tool_use' : result.finishReason,
    content,
    usage: {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
    },
  };
}

function openAiChatResponse(result: CompletionResult, config: ProxyConfig) {
  const message: Record<string, unknown> = { role: 'assistant', content: result.text || null };
  if (result.toolCalls?.length) {
    message.tool_calls = result.toolCalls.map(tc => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: tc.arguments },
    }));
  }
  return {
    id: result.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: config.targetModel,
    choices: [
      {
        index: 0,
        message,
        finish_reason: result.toolCalls?.length ? 'tool_calls' : result.finishReason,
      },
    ],
    usage: usageShape(result),
  };
}

function openAiResponsesResponse(result: CompletionResult, config: ProxyConfig) {
  return {
    id: result.id,
    object: 'response',
    status: 'completed',
    model: config.targetModel,
    output: [
      {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: result.text }],
      },
    ],
    usage: usageShape(result),
  };
}

function googleResponse(result: CompletionResult) {
  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [{ text: result.text }],
        },
        finishReason: 'STOP',
      },
    ],
    usageMetadata: {
      promptTokenCount: result.usage.promptTokens,
      candidatesTokenCount: result.usage.completionTokens,
      totalTokenCount: result.usage.totalTokens,
    },
  };
}

function bedrockResponse(result: CompletionResult) {
  return {
    output: {
      message: {
        role: 'assistant',
        content: [{ text: result.text }],
      },
    },
    stopReason: 'end_turn',
    usage: {
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
  };
}

async function resolveTokenCount(
  body: Record<string, unknown>,
  config: ProxyConfig,
  completionEngine: CompletionEngine | undefined,
): Promise<TokenCountResult | Response> {
  if (!completionEngine?.countTokens) {
    return createErrorResponse(
      `Token counting is not supported for provider ${config.targetProvider}.`,
      501,
    );
  }

  const request = buildCompletionRequest(body, config.exposedTransport, false);
  request.model = config.targetModel;

  try {
    return await completionEngine.countTokens(request);
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : String(error));
  }
}

export function createTransportMuxApp({ config, completionEngine }: CreateTransportMuxAppOptions) {
  const app = new Hono();
  const metrics = new MetricsTracker();
  const thoughtSignatureStore = new Map<string, string>();

  app.onError((error, c) => {
    metrics.recordError();
    return c.json({ error: { message: error instanceof Error ? error.message : String(error) } }, 500);
  });

  app.use('*', async (c, next) => {
    if (
      c.req.path === '/health'
      || c.req.path === '/v1/models'
      || c.req.path === '/metrics'
      || c.req.path === '/cache/stats'
    ) {
      await next();
      return;
    }

    if (!isAuthorized(c.req.raw, config.authToken)) {
      return c.json({ error: { message: 'Unauthorized' } }, 401);
    }

    await next();
  });

  app.get('/health', (c) => c.json({ ok: true, transport: config.exposedTransport }));

  app.get('/v1/models', (c) =>
    c.json({
      object: 'list',
      data: [{ id: config.targetModel, object: 'model', owned_by: config.targetProvider }],
    }),
  );

  app.get('/metrics', (c) => c.json(metrics.toJSON()));

  app.get('/cache/stats', (c) => c.json({ enabled: false }));

  app.post('/v1/count_tokens', async (c) => {
    const body = await readStrictJsonBody(c.req.raw);
    if (body instanceof Response) {
      return body;
    }

    const result = await resolveTokenCount(body, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }

    return c.json(result);
  });

  app.post('/v1/messages', async (c) => {
    const plan = await createExecutionPlan(c.req.raw, 'anthropic', { thoughtSignatureStore });
    if (plan instanceof Response) {
      return plan;
    }
    plan.request.model = config.targetModel;
    const result = trackCompletionOutcome(
      await resolveCompletion(c.req.raw, config, completionEngine, plan, metrics),
      metrics,
      { countSuccessResponse: !plan.streamRequested || !completionEngine },
    );
    if (result instanceof Response) {
      return result;
    }
    return c.json(anthropicResponse(result, config));
  });

  app.post('/v1/chat/completions', async (c) => {
    const plan = await createExecutionPlan(c.req.raw, 'openai-chat');
    if (plan instanceof Response) {
      return plan;
    }
    plan.request.model = config.targetModel;
    const result = trackCompletionOutcome(
      await resolveCompletion(c.req.raw, config, completionEngine, plan, metrics),
      metrics,
      { countSuccessResponse: !plan.streamRequested || !completionEngine },
    );
    if (result instanceof Response) {
      return result;
    }
    return c.json(openAiChatResponse(result, config));
  });

  app.post('/v1/responses', async (c) => {
    const plan = await createExecutionPlan(c.req.raw, 'openai-responses');
    if (plan instanceof Response) {
      return plan;
    }
    plan.request.model = config.targetModel;
    const result = trackCompletionOutcome(
      await resolveCompletion(c.req.raw, config, completionEngine, plan, metrics),
      metrics,
      { countSuccessResponse: !plan.streamRequested || !completionEngine },
    );
    if (result instanceof Response) {
      return result;
    }
    return c.json(openAiResponsesResponse(result, config));
  });

  app.post('/v1beta/models/*', async (c) => {
    const forceStreaming = c.req.path.endsWith(':streamGenerateContent');
    const plan = await createExecutionPlan(c.req.raw, 'google', { forceStreaming });
    if (plan instanceof Response) {
      return plan;
    }
    plan.request.model = config.targetModel;
    const result = trackCompletionOutcome(
      await resolveCompletion(c.req.raw, config, completionEngine, plan, metrics, { forceStreaming }),
      metrics,
      { countSuccessResponse: !plan.streamRequested || !completionEngine },
    );
    if (result instanceof Response) {
      return result;
    }
    return c.json(googleResponse(result));
  });

  app.post('/v1/projects/*', async (c) => {
    const plan = await createExecutionPlan(c.req.raw, 'vertex-native');
    if (plan instanceof Response) {
      return plan;
    }
    plan.request.model = config.targetModel;
    const result = trackCompletionOutcome(
      await resolveCompletion(c.req.raw, config, completionEngine, plan, metrics),
      metrics,
      { countSuccessResponse: !plan.streamRequested || !completionEngine },
    );
    if (result instanceof Response) {
      return result;
    }
    return c.json(googleResponse(result));
  });

  app.post('/converse', async (c) => {
    const plan = await createExecutionPlan(c.req.raw, 'bedrock-converse');
    if (plan instanceof Response) {
      return plan;
    }
    plan.request.model = config.targetModel;
    const result = trackCompletionOutcome(
      await resolveCompletion(c.req.raw, config, completionEngine, plan, metrics),
      metrics,
      { countSuccessResponse: !plan.streamRequested || !completionEngine },
    );
    if (result instanceof Response) {
      return result;
    }
    return c.json(bedrockResponse(result));
  });

  app.post('/models/chat/completions', async (c) => {
    const plan = await createExecutionPlan(c.req.raw, 'azure-foundry');
    if (plan instanceof Response) {
      return plan;
    }
    plan.request.model = config.targetModel;
    const result = trackCompletionOutcome(
      await resolveCompletion(c.req.raw, config, completionEngine, plan, metrics),
      metrics,
      { countSuccessResponse: !plan.streamRequested || !completionEngine },
    );
    if (result instanceof Response) {
      return result;
    }
    return c.json(openAiChatResponse(result, config));
  });

  app.all('/passthrough/*', async (c) => {
    const forwardedPath = c.req.path.replace(/^\/passthrough/, '') || '/';
    return trackCompletionOutcome(await proxyUpstream(c.req.raw, config, forwardedPath), metrics, {
      countSuccessResponse: true,
    });
  });

  return app;
}

async function nodeRequestBody(req: http.IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }
    if (chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
      continue;
    }
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    }
  }
  return Buffer.concat(chunks);
}

async function writeNodeResponse(res: http.ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  try {
    await pipeline(
      Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
      res,
    );
  } catch (err: unknown) {
    if (!res.writableEnded) {
      res.end();
    }
  }
}

export async function startProxyServer(
  config: ProxyConfig,
  completionEngine?: CompletionEngine,
): Promise<RunningProxyServer> {
  const app = createTransportMuxApp({ config, completionEngine });

  const server = http.createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', `http://${config.host}:${config.port}`);
      const body = await nodeRequestBody(req);
      const request = new Request(url, {
        method: req.method,
        headers: new Headers(req.headers as Record<string, string>),
        body: body == null ? undefined : new Blob([new Uint8Array(body)]),
      });
      const response = await app.fetch(request);
      await writeNodeResponse(res, response);
    })().catch((error: unknown) => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve bound proxy server address.');
  }

  return {
    url: `http://${config.host}:${address.port}`,
    port: address.port,
    async stop() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}
