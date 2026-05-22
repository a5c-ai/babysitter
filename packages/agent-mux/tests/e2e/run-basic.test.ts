/**
 * E2E: end-to-end `run` against a scripted mock harness.
 *
 * Exercises the full client.run() → spawn → parseEvent → stream pipeline
 * using a real node subprocess as the agent. The mock adapter shape is
 * equivalent to harness-mock's MockHarnessProcess — deterministic output.
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '../../core/src/index.js';
import type {
  AgentAdapter,
  AgentCapabilities,
  SpawnArgs,
  RunOptions,
  AgentEvent,
} from '../../core/src/index.js';

const caps: AgentCapabilities = {
  agent: 'mock-e2e',
  canResume: false, canFork: false, supportsMultiTurn: false,
  sessionPersistence: 'none',
  supportsTextStreaming: true, supportsToolCallStreaming: false, supportsThinkingStreaming: false,
  supportsNativeTools: false, supportsMCP: false, supportsParallelToolCalls: false,
  requiresToolApproval: false, approvalModes: ['prompt'],
  supportsThinking: false, thinkingEffortLevels: [], supportsThinkingBudgetTokens: false,
  supportsJsonMode: false, supportsStructuredOutput: false,
  supportsSkills: false, supportsAgentsMd: false, skillsFormat: null,
  supportsSubagentDispatch: false, supportsParallelExecution: false,
  supportsInteractiveMode: false, supportsStdinInjection: false,
  supportsImageInput: false, supportsImageOutput: false, supportsFileAttachments: false,
  supportsPlugins: false, pluginFormats: [], pluginRegistries: [],
  supportedPlatforms: ['darwin', 'linux', 'win32'],
  requiresGitRepo: false, requiresPty: false,
  authMethods: [], authFiles: [], installMethods: [],
};

function makeMockAdapter(buildSpawnArgs: (opts: RunOptions) => SpawnArgs): AgentAdapter {
  return {
    agent: 'mock-e2e',
    displayName: 'Mock E2E',
    cliCommand: 'node',
    capabilities: caps,
    models: [],
    configSchema: {} as never,
    buildSpawnArgs,
    parseEvent: (line) => {
      if (!line.trim()) return null;
      return {
        type: 'text_delta',
        runId: 'x',
        agent: 'mock-e2e',
        timestamp: Date.now(),
        delta: line,
        accumulated: line,
      } as AgentEvent;
    },
    detectAuth: async () => ({ status: 'unknown' }),
    getAuthGuidance: () => ({ steps: [] } as never),
    sessionDir: () => process.cwd(),
    parseSessionFile: async () => ({
      sessionId: 'x', agent: 'mock-e2e', turnCount: 0, createdAt: '', updatedAt: '',
    }),
    listSessionFiles: async () => [],
    readConfig: async () => ({}),
    writeConfig: async () => {},
  };
}

describe('E2E: run against mock harness', () => {
  it('streams expected stdout as text_delta events and exits 0', async () => {
    const client = createClient();
    client.adapters.register(
      makeMockAdapter(() => ({
        command: process.execPath,
        args: ['-e', 'console.log("EXPECTED-OUTPUT-LINE-1"); console.log("LINE-2");'],
        env: {},
        cwd: process.cwd(),
        usePty: false,
      })),
    );

    const handle = client.run({ agent: 'mock-e2e', prompt: 'do it', collectEvents: true });
    const result = await handle.result();
    expect(result.exitCode).toBe(0);
    expect(result.exitReason).toBe('completed');
    const texts = result.events
      .filter((e) => e.type === 'text_delta')
      .map((e) => (e as Record<string, unknown>)['delta']);
    expect(texts).toContain('EXPECTED-OUTPUT-LINE-1');
    expect(texts).toContain('LINE-2');
  }, 15000);
});
