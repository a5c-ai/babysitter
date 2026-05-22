import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';

class AsyncQueue<T> implements AsyncIterableIterator<T> {
  private readonly values: T[] = [];
  private readonly waiters: Array<(value: IteratorResult<T>) => void> = [];
  private closed = false;

  push(value: T): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ value, done: false });
      return;
    }
    this.values.push(value);
  }

  end(): void {
    this.closed = true;
    for (const waiter of this.waiters.splice(0)) {
      waiter({ value: undefined as T, done: true });
    }
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.values.length > 0) {
      return { value: this.values.shift()!, done: false };
    }
    if (this.closed) {
      return { value: undefined as T, done: true };
    }
    return await new Promise<IteratorResult<T>>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  async return(): Promise<IteratorResult<T>> {
    this.end();
    return { value: undefined as T, done: true };
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

class MockQuery extends AsyncQueue<any> {
  interrupt = vi.fn(async () => {});
  close = vi.fn(() => this.end());
}

const queryMock = vi.fn();

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: queryMock,
}));

const { ClaudeAgentSdkAdapter } = await import('../src/claude-agent-sdk-adapter.js');

async function waitUntil(predicate: () => boolean, timeoutMs: number = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('ClaudeAgentSdkAdapter', () => {
  let adapter: InstanceType<typeof ClaudeAgentSdkAdapter>;
  let originalEnv: NodeJS.ProcessEnv;
  let lastPrompt: string | AsyncIterable<any> | undefined;
  let lastOptions: Record<string, any> | undefined;
  let lastQuery: MockQuery | undefined;

  beforeEach(() => {
    adapter = new ClaudeAgentSdkAdapter();
    originalEnv = { ...process.env };
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test1234';
    queryMock.mockReset();
    lastPrompt = undefined;
    lastOptions = undefined;
    lastQuery = undefined;
    queryMock.mockImplementation(({ prompt, options }) => {
      lastPrompt = prompt;
      lastOptions = options;
      const query = new MockQuery();
      lastQuery = query;
      return query;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('advertises a real persistent SDK transport', async () => {
    expect(adapter.adapterType).toBe('programmatic');
    expect(adapter.agent).toBe('claude-agent-sdk');
    expect(adapter.capabilities.structuredSessionTransport).toBe('persistent');
    expect(adapter.capabilities.supportsInteractiveMode).toBe(true);
    expect(adapter.capabilities.supportsStdinInjection).toBe(true);
    expect(adapter.capabilities.supportsMCP).toBe(true);
    expect(adapter.capabilities.installMethods[0]?.command).toBe('npm install -g @anthropic-ai/claude-agent-sdk');

    const install = await adapter.detectInstallation();
    expect(typeof install.installed).toBe('boolean');
    if (install.installed) {
      expect(install.version).toBeTruthy();
      expect(install.path).toBeTruthy();
    }
  });

  it('uses Claude project sessions and settings paths', () => {
    expect(adapter.sessionDir()).toBe(path.join(os.homedir(), '.claude', 'projects'));
    expect(adapter.configSchema.configFilePaths?.[0]).toContain(path.join('.claude', 'settings.json'));
    expect(adapter.configSchema.supportsProjectConfig).toBe(true);
  });

  it('maps a real SDK message stream into agent-mux events', async () => {
    const run = adapter.execute({
      agent: 'claude-agent-sdk',
      prompt: 'say hello',
      nonInteractive: true,
    });

    await waitUntil(() => lastQuery != null);

    queueMicrotask(() => {
      lastQuery!.push({
        type: 'system',
        subtype: 'init',
        session_id: 'sess-1',
        uuid: 'u1',
      });
      lastQuery!.push({
        type: 'system',
        subtype: 'session_state_changed',
        state: 'running',
        session_id: 'sess-1',
        uuid: 'u2',
      });
      lastQuery!.push({
        type: 'stream_event',
        session_id: 'sess-1',
        uuid: 'u3',
        parent_tool_use_id: null,
        event: {
          type: 'message_start',
        },
      });
      lastQuery!.push({
        type: 'stream_event',
        session_id: 'sess-1',
        uuid: 'u4',
        parent_tool_use_id: null,
        event: {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'thinking' },
        },
      });
      lastQuery!.push({
        type: 'stream_event',
        session_id: 'sess-1',
        uuid: 'u5',
        parent_tool_use_id: null,
        event: {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'thinking_delta', thinking: 'thinking...' },
        },
      });
      lastQuery!.push({
        type: 'stream_event',
        session_id: 'sess-1',
        uuid: 'u6',
        parent_tool_use_id: null,
        event: {
          type: 'content_block_start',
          index: 1,
          content_block: {
            type: 'tool_use',
            id: 'tool-1',
            name: 'Read',
            input: { path: 'README.md' },
          },
        },
      });
      lastQuery!.push({
        type: 'stream_event',
        session_id: 'sess-1',
        uuid: 'u7',
        parent_tool_use_id: null,
        event: {
          type: 'content_block_delta',
          index: 1,
          delta: { type: 'input_json_delta', partial_json: '{"path":"README.md"}' },
        },
      });
      lastQuery!.push({
        type: 'stream_event',
        session_id: 'sess-1',
        uuid: 'u8',
        parent_tool_use_id: null,
        event: {
          type: 'content_block_stop',
          index: 1,
        },
      });
      lastQuery!.push({
        type: 'user',
        session_id: 'sess-1',
        uuid: 'u9',
        parent_tool_use_id: 'tool-1',
        tool_use_result: { ok: true },
        message: { role: 'user', content: 'tool result' },
      });
      lastQuery!.push({
        type: 'stream_event',
        session_id: 'sess-1',
        uuid: 'u10',
        parent_tool_use_id: null,
        event: {
          type: 'content_block_delta',
          index: 2,
          delta: { type: 'text_delta', text: 'Hello.' },
        },
      });
      lastQuery!.push({
        type: 'result',
        subtype: 'success',
        is_error: false,
        result: 'Hello.',
        duration_ms: 1,
        duration_api_ms: 1,
        num_turns: 1,
        stop_reason: null,
        total_cost_usd: 0.001,
        usage: { input_tokens: 10, output_tokens: 5 },
        modelUsage: {},
        permission_denials: [],
        session_id: 'sess-1',
        uuid: 'u11',
      });
      lastQuery!.push({
        type: 'system',
        subtype: 'session_state_changed',
        state: 'idle',
        session_id: 'sess-1',
        uuid: 'u12',
      });
      lastQuery!.end();
    });

    const events = [];
    const iterator = run[Symbol.asyncIterator]();
    while (events.length < 20) {
      const next = await iterator.next();
      if (next.done) {
        break;
      }
      events.push(next.value);
      if ((next.value as any).type === 'turn_end') {
        await run.close?.();
        break;
      }
    }

    expect(lastOptions?.model).toBe('claude-sonnet-4-20250514');
    expect(lastOptions?.includePartialMessages).toBe(true);
    expect(lastOptions?.settingSources).toEqual(['user', 'project', 'local']);
    expect(lastPrompt).toBeTruthy();

    expect(events.some((event: any) => event.type === 'session_start' && event.sessionId === 'sess-1')).toBe(true);
    expect(events.some((event: any) => event.type === 'turn_start')).toBe(true);
    expect(events.some((event: any) => event.type === 'thinking_delta' && event.delta === 'thinking...')).toBe(true);
    expect(events.some((event: any) => event.type === 'tool_call_start' && event.toolName === 'Read')).toBe(true);
    expect(events.some((event: any) => event.type === 'tool_call_ready' && event.toolCallId === 'tool-1')).toBe(true);
    expect(events.some((event: any) => event.type === 'tool_result' && event.toolCallId === 'tool-1')).toBe(true);
    expect(events.some((event: any) => event.type === 'text_delta' && event.delta === 'Hello.')).toBe(true);
    expect(events.some((event: any) => event.type === 'cost' && event.cost.totalUsd === 0.001)).toBe(true);
    expect(events.some((event: any) => event.type === 'message_stop' && event.text === 'Hello.')).toBe(true);
    expect(events.some((event: any) => event.type === 'turn_end')).toBe(true);
  });

  it('round-trips live permission callbacks through run.respond()', async () => {
    const run = adapter.execute({
      agent: 'claude-agent-sdk',
      prompt: 'use bash',
    });

    await waitUntil(() => Boolean(lastOptions?.canUseTool));

    const iterator = run[Symbol.asyncIterator]();
    const permissionPromise = lastOptions!.canUseTool(
      'Bash',
      { command: 'pwd' },
      {
        signal: new AbortController().signal,
        toolUseID: 'tool-live',
        title: 'Allow Bash',
        description: 'Claude wants to run pwd',
      },
    );

    const pending = await iterator.next();
    expect(pending.done).toBe(false);
    expect((pending.value as any).type).toBe('approval_request');

    await run.respond!(
      (pending.value as any).interactionId,
      { type: 'approve' },
    );

    await expect(permissionPromise).resolves.toEqual({ behavior: 'allow' });
    await run.close?.();
  });
});
