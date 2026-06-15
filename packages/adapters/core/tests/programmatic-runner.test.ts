import { describe, expect, it, vi } from 'vitest';

import { createClient } from '../src/index.js';
import type {
  AgentCapabilities,
  AgentEvent,
  ProgrammaticAdapter,
  ProgrammaticRun,
} from '../src/index.js';

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
    return await new Promise<IteratorResult<T>>((resolve) => this.waiters.push(resolve));
  }

  async return(): Promise<IteratorResult<T>> {
    this.end();
    return { value: undefined as T, done: true };
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

async function waitUntil(predicate: () => boolean, timeoutMs: number = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const caps: AgentCapabilities = {
  agent: 'fake',
  canResume: true,
  canFork: false,
  supportsMultiTurn: true,
  sessionPersistence: 'none',
  supportsTextStreaming: true,
  supportsToolCallStreaming: false,
  supportsThinkingStreaming: false,
  supportsNativeTools: false,
  supportsMCP: false,
  supportsParallelToolCalls: false,
  requiresToolApproval: false,
  approvalModes: ['prompt'],
  runtimeHooks: {
    preToolUse: 'unsupported',
    postToolUse: 'unsupported',
    sessionStart: 'unsupported',
    sessionEnd: 'unsupported',
    stop: 'unsupported',
    userPromptSubmit: 'unsupported',
  },
  supportsThinking: false,
  thinkingEffortLevels: [],
  supportsThinkingBudgetTokens: false,
  supportsJsonMode: false,
  supportsStructuredOutput: false,
  structuredSessionTransport: 'persistent',
  sessionControlPlane: 'self-managed',
  supportsSkills: false,
  supportsAgentsMd: false,
  skillsFormat: null,
  supportsSubagentDispatch: false,
  supportsParallelExecution: false,
  supportsInteractiveMode: true,
  supportsStdinInjection: true,
  supportsImageInput: false,
  supportsImageOutput: false,
  supportsFileAttachments: false,
  supportsPlugins: false,
  pluginFormats: [],
  pluginRegistries: [],
  supportedPlatforms: ['darwin', 'linux', 'win32'],
  requiresGitRepo: false,
  requiresPty: false,
  authMethods: [],
  authFiles: [],
  installMethods: [],
};

describe('programmatic runner interactive plumbing', () => {
  it('binds send() and interaction responses for programmatic adapters', async () => {
    const sends: string[] = [];
    const responses: Array<{ id: string; type: string }> = [];
    let latestRun: ProgrammaticRun | undefined;

    const adapter: ProgrammaticAdapter = {
      agent: 'fake',
      displayName: 'Fake Programmatic',
      adapterType: 'programmatic',
      cliCommand: '[programmatic]',
      capabilities: caps,
      models: [],
      configSchema: { agent: 'fake', version: 1, fields: [] },
      buildSpawnArgs: () => {
        throw new Error('not used');
      },
      parseEvent: () => {
        throw new Error('not used');
      },
      detectAuth: async () => ({ status: 'authenticated', method: 'api_key', identity: 'fake' }),
      getAuthGuidance: () => ({ agent: 'fake', providerName: 'Fake', steps: [] }),
      sessionDir: () => process.cwd(),
      parseSessionFile: async () => ({
        sessionId: 'sess-1',
        agent: 'fake',
        createdAt: new Date(),
        lastUpdated: new Date(),
        events: [],
        messageCount: 0,
      }),
      listSessionFiles: async () => [],
      readConfig: async () => ({ agent: 'fake', source: 'global' }),
      writeConfig: async () => {},
      execute: () => {
        const queue = new AsyncQueue<AgentEvent>();
        queue.push({
          type: 'session_start',
          runId: 'run-1',
          agent: 'fake',
          timestamp: Date.now(),
          sessionId: 'sess-1',
          resumed: false,
        });
        queue.push({
          type: 'approval_request',
          runId: 'run-1',
          agent: 'fake',
          timestamp: Date.now(),
          interactionId: 'approval-1',
          action: 'Allow write',
          detail: 'Write file',
          riskLevel: 'medium',
        });

        latestRun = Object.assign(queue, {
          send: vi.fn(async (text: string) => {
            sends.push(text);
          }),
          respond: vi.fn(async (id: string, response: { type: string }) => {
            responses.push({ id, type: response.type });
          }),
          close: vi.fn(async () => {
            queue.end();
          }),
        } satisfies Partial<ProgrammaticRun>);

        return latestRun;
      },
    };

    const client = createClient();
    client.adapters.register(adapter as any);

    const handle = client.run({ agent: 'fake', prompt: 'hello' });
    await waitUntil(() => latestRun != null);

    await handle.send('second turn');
    expect(sends).toEqual(['second turn']);

    await waitUntil(() => handle.interaction.pending.length === 1);
    await handle.approve('ok');
    expect(responses).toEqual([{ id: 'approval-1', type: 'approve' }]);

    await handle.abort();
    const result = await handle.result();

    expect(result.exitReason).toBe('aborted');
  });
});
