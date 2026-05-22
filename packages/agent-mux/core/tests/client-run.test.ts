/**
 * Tests for AgentMuxClient.run() real subprocess spawning.
 *
 * Uses a fake adapter that invokes `node -e "..."` so behavior is
 * deterministic without requiring any real agent CLI.
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '../src/index.js';
import type {
  AgentAdapter,
  AgentCapabilities,
  SpawnArgs,
  RunOptions,
  AgentEvent,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Fake adapter helper
// ---------------------------------------------------------------------------

const caps: AgentCapabilities = {
  agent: 'fake',
  canResume: false,
  canFork: false,
  supportsMultiTurn: false,
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
  structuredSessionTransport: 'none',
  sessionControlPlane: 'self-managed',
  supportsSkills: false,
  supportsAgentsMd: false,
  skillsFormat: null,
  supportsSubagentDispatch: false,
  supportsParallelExecution: false,
  supportsInteractiveMode: false,
  supportsStdinInjection: false,
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

function makeFakeAdapter(spawnImpl: (opts: RunOptions) => SpawnArgs): AgentAdapter {
  return {
    agent: 'fake',
    displayName: 'Fake',
    cliCommand: 'node',
    capabilities: caps,
    models: [],
    configSchema: {},
    buildSpawnArgs: spawnImpl,
    parseEvent: (line) => ({
      type: 'text_delta',
      runId: 'x',
      agent: 'fake',
      timestamp: Date.now(),
      delta: line,
      accumulated: line,
    }) as AgentEvent,
    detectAuth: async () => ({ status: 'unknown' }),
    getAuthGuidance: () => ({ steps: [] }),
    sessionDir: () => process.cwd(),
    parseSessionFile: async () => ({
      sessionId: 'x', agent: 'fake', turnCount: 0, createdAt: '', updatedAt: '',
    }),
    listSessionFiles: async () => [],
    readConfig: async () => ({}),
    writeConfig: async () => {},
  };
}

function nodeArgs(script: string): SpawnArgs {
  return {
    command: process.execPath,
    args: ['-e', script],
    env: {},
    cwd: process.cwd(),
    usePty: false,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AgentMuxClient.run() real spawning', () => {
  it('spawns, streams stdout as events, exits with completed', async () => {
    const client = createClient();
    client.adapters.register(
      makeFakeAdapter(() => nodeArgs('console.log("hello"); console.log("world");')),
    );

    const handle = client.run({ agent: 'fake', prompt: 'go', collectEvents: true });
    const result = await handle.result();

    expect(result.exitReason).toBe('completed');
    expect(result.exitCode).toBe(0);
    const texts = result.events
      .filter((e) => e.type === 'text_delta')
      .map((e: any) => e.delta);
    expect(texts).toContain('hello');
    expect(texts).toContain('world');
  }, 15000);

  it('abort() terminates the child and exits with aborted', async () => {
    const client = createClient();
    client.adapters.register(
      makeFakeAdapter(() => nodeArgs('setInterval(()=>console.log("tick"),100);')),
    );

    const handle = client.run({ agent: 'fake', prompt: 'go', gracePeriodMs: 500 });
    // Give it a moment to spawn then abort.
    await new Promise((r) => setTimeout(r, 200));
    await handle.abort();
    const result = await handle.result();
    expect(['aborted', 'killed']).toContain(result.exitReason);
  }, 15000);

  it('enforces timeout and emits timeout event', async () => {
    const client = createClient();
    client.adapters.register(
      makeFakeAdapter(() => nodeArgs('setInterval(()=>console.log("tick"),100);')),
    );

    const handle = client.run({
      agent: 'fake',
      prompt: 'go',
      timeout: 300,
      gracePeriodMs: 500,
      collectEvents: true,
    });
    const result = await handle.result();
    expect(result.exitReason).toBe('timeout');
    const timeouts = result.events.filter((e) => e.type === 'timeout');
    expect(timeouts.length).toBeGreaterThan(0);
    expect((timeouts[0] as any).kind).toBe('run');
  }, 15000);

  it('enforces inactivityTimeout', async () => {
    const client = createClient();
    client.adapters.register(
      // Print once then idle
      makeFakeAdapter(() => nodeArgs('console.log("hi"); setTimeout(()=>{}, 60000);')),
    );

    const handle = client.run({
      agent: 'fake',
      prompt: 'go',
      inactivityTimeout: 400,
      gracePeriodMs: 500,
      collectEvents: true,
    });
    const result = await handle.result();
    expect(result.exitReason).toBe('inactivity');
    const timeouts = result.events.filter((e) => e.type === 'timeout');
    expect((timeouts[0] as any).kind).toBe('inactivity');
  }, 15000);

  it('ENOENT produces AGENT_NOT_FOUND error event', async () => {
    const client = createClient();
    client.adapters.register(
      makeFakeAdapter(() => ({
        command: 'this-binary-does-not-exist-xyz',
        args: [],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      })),
    );

    const handle = client.run({ agent: 'fake', prompt: 'go', collectEvents: true });
    const result = await handle.result();
    const errors = result.events.filter((e) => e.type === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect((errors[0] as any).code).toBe('AGENT_NOT_FOUND');
    expect(result.exitReason).toBe('crashed');
  }, 15000);

  it('retries on transient failure per retryPolicy', async () => {
    const client = createClient();
    let attempts = 0;
    client.adapters.register(
      makeFakeAdapter(() => {
        attempts += 1;
        // First attempt: exit 1 (AGENT_CRASH — in retryOn).
        // Second attempt: exit 0.
        const script = attempts < 2 ? 'process.exit(1)' : 'console.log("ok")';
        return nodeArgs(script);
      }),
    );

    const handle = client.run({
      agent: 'fake',
      prompt: 'go',
      collectEvents: true,
      retryPolicy: {
        maxAttempts: 3,
        baseDelayMs: 10,
        maxDelayMs: 100,
        jitterFactor: 0,
        retryOn: ['AGENT_CRASH'],
      },
    });
    const result = await handle.result();
    expect(attempts).toBe(2);
    expect(result.exitReason).toBe('completed');
    const retries = result.events.filter((e) => e.type === 'retry');
    expect(retries.length).toBe(1);
  }, 15000);
});
