import * as http from 'node:http';

import { Hono } from 'hono';

import type {
  CompletionEngine,
  CompletionRequest,
  CompletionResult,
  CreateTransportMuxAppOptions,
  ProxyConfig,
  RunningProxyServer,
} from './types.js';

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
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return {};
    }
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function buildCompletionRequest(req: Request, transport: ProxyConfig['exposedTransport']): Promise<CompletionRequest> {
  const body = await readJsonBody(req);
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
    input: transport === 'openai-responses' ? normalizeInput(body.input) : undefined,
    raw: body,
  };
}

async function proxyUpstream(req: Request, config: ProxyConfig, forwardedPath?: string): Promise<Response> {
  if (!config.apiBase) {
    return new Response(JSON.stringify({ error: 'No completion engine or apiBase configured.' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    });
  }

  const upstreamUrl = new URL(forwardedPath ?? new URL(req.url).pathname, config.apiBase);
  if (!forwardedPath) {
    upstreamUrl.search = new URL(req.url).search;
  }

  const headers = new Headers(req.headers);
  headers.delete('host');

  const init: RequestInit = {
    method: req.method,
    headers,
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  return fetch(upstreamUrl, init);
}

async function resolveCompletion(req: Request, config: ProxyConfig, completionEngine?: CompletionEngine): Promise<CompletionResult | Response> {
  if (!completionEngine) {
    return proxyUpstream(req, config);
  }

  const completionRequest = await buildCompletionRequest(req, config.exposedTransport);
  completionRequest.model = config.targetModel;
  return completionEngine.complete(completionRequest);
}

function anthropicResponse(result: CompletionResult, config: ProxyConfig) {
  return {
    id: result.id,
    type: 'message',
    role: 'assistant',
    model: config.targetModel,
    stop_reason: result.finishReason,
    content: [{ type: 'text', text: result.text }],
    usage: {
      input_tokens: result.usage.promptTokens,
      output_tokens: result.usage.completionTokens,
    },
  };
}

function openAiChatResponse(result: CompletionResult, config: ProxyConfig) {
  return {
    id: result.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: config.targetModel,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: result.text },
        finish_reason: result.finishReason,
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

function countTokensPayload(body: Record<string, unknown>) {
  const text = JSON.stringify(body);
  const totalTokens = Math.max(1, Math.ceil(text.length / 4));
  return {
    input_tokens: totalTokens,
    total_tokens: totalTokens,
  };
}

export function createTransportMuxApp({ config, completionEngine }: CreateTransportMuxAppOptions) {
  const app = new Hono();

  app.use('*', async (c, next) => {
    if (c.req.path === '/health' || c.req.path === '/v1/models') {
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

  app.post('/v1/count_tokens', async (c) => {
    const body = await readJsonBody(c.req.raw);
    return c.json(countTokensPayload(body));
  });

  app.post('/v1/messages', async (c) => {
    const result = await resolveCompletion(c.req.raw, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }
    return c.json(anthropicResponse(result, config));
  });

  app.post('/v1/chat/completions', async (c) => {
    const result = await resolveCompletion(c.req.raw, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }
    return c.json(openAiChatResponse(result, config));
  });

  app.post('/v1/responses', async (c) => {
    const result = await resolveCompletion(c.req.raw, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }
    return c.json(openAiResponsesResponse(result, config));
  });

  app.post('/v1beta/models/*', async (c) => {
    const result = await resolveCompletion(c.req.raw, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }
    return c.json(googleResponse(result));
  });

  app.post('/v1/projects/*', async (c) => {
    const result = await resolveCompletion(c.req.raw, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }
    return c.json(googleResponse(result));
  });

  app.post('/converse', async (c) => {
    const result = await resolveCompletion(c.req.raw, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }
    return c.json(bedrockResponse(result));
  });

  app.post('/models/chat/completions', async (c) => {
    const result = await resolveCompletion(c.req.raw, config, completionEngine);
    if (result instanceof Response) {
      return result;
    }
    return c.json(openAiChatResponse(result, config));
  });

  app.all('/passthrough/*', async (c) => {
    const forwardedPath = c.req.path.replace(/^\/passthrough/, '') || '/';
    return proxyUpstream(c.req.raw, config, forwardedPath);
  });

  return app;
}

async function nodeRequestBody(req: http.IncomingMessage): Promise<Uint8Array | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
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

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

export async function startProxyServer(
  config: ProxyConfig,
  completionEngine?: CompletionEngine,
): Promise<RunningProxyServer> {
  const app = createTransportMuxApp({ config, completionEngine });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${config.host}:${config.port}`);
      const body = await nodeRequestBody(req);
      const request = new Request(url, {
        method: req.method,
        headers: new Headers(req.headers as Record<string, string>),
        body: body == null ? undefined : Buffer.from(body),
      });
      const response = await app.fetch(request);
      await writeNodeResponse(res, response);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
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
