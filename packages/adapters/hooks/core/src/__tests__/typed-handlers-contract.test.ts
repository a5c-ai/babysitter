import http from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UnifiedHookEvent } from '../types/event';
import type { HandlerRef } from '../types/plan';
import { normalizeEvent } from '../normalizer/normalize';
import { runHandler, runPlan } from '../normalizer/runner';
import { sortHandlers } from '../normalizer/plan-resolver';
import { HandlerError, HandlerTimeoutError } from '../normalizer/errors';
import type { PhaseMapping } from '../types/lifecycle';

const CLAUDE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'tool.before', nativeHook: 'PreToolUse', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'tool' },
];

function makeEvent(): UnifiedHookEvent {
  return normalizeEvent({
    adapter: 'claude',
    rawEventName: 'PreToolUse',
    stdinPayload: { tool_name: 'Bash', tool_input: { command: 'ls' } },
    env: { SAFE_TOKEN: 'safe-token', SECRET_TOKEN: 'secret-token' },
    adapterMappings: CLAUDE_MAPPINGS,
  });
}

function typedHandler(handler: Record<string, unknown>): HandlerRef {
  return handler as unknown as HandlerRef;
}

async function withHttpServer(
  responder: (req: http.IncomingMessage, body: string) => { status?: number; body?: string },
): Promise<{ url: string; close: () => Promise<void>; requests: Array<{ headers: http.IncomingHttpHeaders; body: string }> }> {
  const requests: Array<{ headers: http.IncomingHttpHeaders; body: string }> = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      requests.push({ headers: req.headers, body });
      const response = responder(req, body);
      res.statusCode = response.status ?? 200;
      res.setHeader('content-type', 'application/json');
      res.end(response.body ?? '{"decision":"allow","reason":"http-ok"}');
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address == null || typeof address === 'string') {
    throw new Error('Expected TCP server address');
  }

  return {
    url: `http://127.0.0.1:${address.port}/hook`,
    requests,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    }),
  };
}

describe('typed HandlerRef contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps omitted type as legacy command and supports explicit command/shell types', async () => {
    const event = makeEvent();
    const command = 'node -e "console.log(JSON.stringify({decision:\'allow\',reason:\'command-ok\'}))"';

    const legacy = await runHandler(event, { source: command, handler: 'legacy' });
    const explicit = await runHandler(event, typedHandler({ type: 'command', source: command, handler: 'explicit' }));
    const shellAlias = await runHandler(event, typedHandler({ type: 'shell', source: command, handler: 'shell-alias' }));

    expect(legacy).toMatchObject({ decision: 'allow', reason: 'command-ok' });
    expect(explicit).toMatchObject({ decision: 'allow', reason: 'command-ok' });
    expect(shellAlias).toMatchObject({ decision: 'allow', reason: 'command-ok' });
  });

  it('sorts mixed typed handlers by priority and stable target label', () => {
    const sorted = sortHandlers([
      typedHandler({ type: 'http', url: 'https://hooks.example/b', priority: 10 }),
      typedHandler({ type: 'prompt', prompt: 'check this', priority: 10 }),
      { source: 'cmd-z', handler: 'shell', priority: 10 },
      typedHandler({ type: 'shell', source: 'cmd-a', handler: 'shell-alias', priority: 10 }),
      typedHandler({ type: 'mcp_tool', server: 'srv', tool: 'lookup', priority: 1 }),
    ]);

    expect(sorted.map((handler) => {
      if ('type' in handler && handler.type === 'mcp_tool') return 'mcp_tool:srv:lookup';
      if ('type' in handler && handler.type === 'http') return 'http:https://hooks.example/b';
      if ('type' in handler && handler.type === 'prompt') return 'prompt:check this';
      return `command:${handler.source}`;
    })).toEqual([
      'mcp_tool:srv:lookup',
      'command:cmd-a',
      'command:cmd-z',
      'http:https://hooks.example/b',
      'prompt:check this',
    ]);
  });

  it('runs http handlers with explicit allowed env interpolation and event JSON body', async () => {
    const server = await withHttpServer((_req, body) => {
      const parsed = JSON.parse(body) as { event: UnifiedHookEvent };
      return { body: JSON.stringify({ decision: 'allow', reason: parsed.event.phase }) };
    });

    try {
      process.env['SAFE_TOKEN'] = 'safe-token';
      process.env['SECRET_TOKEN'] = 'secret-token';
      const result = await runHandler(
        makeEvent(),
        typedHandler({
          type: 'http',
          url: server.url,
          allowPrivateNetwork: true,
          headers: {
            authorization: 'Bearer $SAFE_TOKEN',
            'x-secret': '$SECRET_TOKEN',
          },
          allowedEnvVars: ['SAFE_TOKEN'],
        }),
      );

      expect(result).toMatchObject({ decision: 'allow', reason: 'tool.before' });
      expect(server.requests).toHaveLength(1);
      expect(server.requests[0].headers.authorization).toBe('Bearer safe-token');
      expect(server.requests[0].headers['x-secret']).toBe('');
      expect(server.requests[0].body).not.toContain('secret-token');
    } finally {
      delete process.env['SAFE_TOKEN'];
      delete process.env['SECRET_TOKEN'];
      await server.close();
    }
  });

  it('rejects unsafe http URLs through the normal fail-open/fail-closed policy', async () => {
    const plan = [{
      id: 'http-localhost',
      pluginId: 'plugin',
      phase: 'tool.before',
      priority: 1,
      handler: typedHandler({ type: 'http', url: 'http://localhost:1234/hook' }),
    }];

    const failOpen = await runPlan(makeEvent(), plan, { defaultPolicy: 'fail-open' });
    expect(failOpen[0].metadata?.errorCode).toBe('HTTP_URL_ERROR');

    await expect(runPlan(makeEvent(), plan, { defaultPolicy: 'fail-closed' })).rejects.toThrow(HandlerError);
  });

  it('rejects unsupported http methods from runtime config', async () => {
    const plan = [{
      id: 'http-get',
      pluginId: 'plugin',
      phase: 'tool.before',
      priority: 1,
      handler: typedHandler({ type: 'http', url: 'https://hooks.example/hook', method: 'GET' }),
    }];

    const failOpen = await runPlan(makeEvent(), plan, { defaultPolicy: 'fail-open' });
    expect(failOpen[0].metadata?.errorCode).toBe('HTTP_METHOD_ERROR');

    await expect(runPlan(makeEvent(), plan, { defaultPolicy: 'fail-closed' })).rejects.toThrow(HandlerError);
  });

  it('enforces http handler timeout with HandlerTimeoutError', async () => {
    const server = await withHttpServer(() => ({ body: '{"decision":"allow"}' }));
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', () => new Promise(() => undefined));

    try {
      await expect(
        runHandler(makeEvent(), typedHandler({ type: 'http', url: server.url, allowPrivateNetwork: true }), 25),
      ).rejects.toThrow(HandlerTimeoutError);
    } finally {
      vi.stubGlobal('fetch', originalFetch);
      await server.close();
    }
  });

  it('dispatches mcp_tool through the injected executor seam', async () => {
    const mcpTool = vi.fn(async () => ({ decision: 'allow', reason: 'mcp-ok' }));

    const result = await runHandler(
      makeEvent(),
      typedHandler({ type: 'mcp_tool', server: 'filesystem', tool: 'stat', args: { path: 'README.md' } }),
      undefined,
      undefined,
      { executors: { mcpTool } },
    );

    expect(mcpTool).toHaveBeenCalledWith(
      expect.objectContaining({ server: 'filesystem', tool: 'stat', args: { path: 'README.md' } }),
      expect.objectContaining({ event: expect.objectContaining({ phase: 'tool.before' }) }),
    );
    expect(result).toMatchObject({ decision: 'allow', reason: 'mcp-ok' });
  });

  it('dispatches prompt and agent handlers through bounded executor seams', async () => {
    const prompt = vi.fn(async () => '{"decision":"ask","reason":"prompt-ok"}');
    const agent = vi.fn(async () => ({ decision: 'allow', reason: 'agent-ok' }));

    const promptResult = await runHandler(
      makeEvent(),
      typedHandler({ type: 'prompt', prompt: 'Evaluate this hook', maxDepth: 1 }),
      undefined,
      undefined,
      { executors: { prompt }, currentDepth: 0 },
    );
    const agentResult = await runHandler(
      makeEvent(),
      typedHandler({ type: 'agent', prompt: 'Evaluate this hook', agent: 'reviewer', maxTurns: 2, maxDepth: 1 }),
      undefined,
      undefined,
      { executors: { agent }, currentDepth: 0 },
    );

    expect(promptResult).toMatchObject({ decision: 'ask', reason: 'prompt-ok' });
    expect(agentResult).toMatchObject({ decision: 'allow', reason: 'agent-ok' });
    expect(agent).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'Evaluate this hook', agent: 'reviewer', maxTurns: 2 }),
      expect.objectContaining({ event: expect.objectContaining({ phase: 'tool.before' }) }),
    );
  });

  it('rejects recursive prompt and agent handlers before calling executors', async () => {
    const prompt = vi.fn();
    const agent = vi.fn();

    await expect(runHandler(
      makeEvent(),
      typedHandler({ type: 'prompt', prompt: 'loop', maxDepth: 1 }),
      undefined,
      undefined,
      { executors: { prompt }, currentDepth: 1 },
    )).rejects.toThrow(HandlerError);
    await expect(runHandler(
      makeEvent(),
      typedHandler({ type: 'agent', prompt: 'loop', maxDepth: 1 }),
      undefined,
      undefined,
      { executors: { agent }, currentDepth: 1 },
    )).rejects.toThrow(HandlerError);

    expect(prompt).not.toHaveBeenCalled();
    expect(agent).not.toHaveBeenCalled();
  });

  it('reports unsupported handler types through runner error policy', async () => {
    const plan = [{
      id: 'bad',
      pluginId: 'plugin',
      phase: 'tool.before',
      priority: 1,
      handler: typedHandler({ type: 'websocket', url: 'ws://example.test' }),
    }];

    const failOpen = await runPlan(makeEvent(), plan, { defaultPolicy: 'fail-open' });
    expect(failOpen[0].metadata?.errorCode).toBe('UNSUPPORTED_HANDLER_TYPE');

    await expect(runPlan(makeEvent(), plan, { defaultPolicy: 'fail-closed' })).rejects.toThrow(HandlerError);
  });
});
