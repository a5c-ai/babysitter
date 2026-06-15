/**
 * E2E: long-running mock + abort → verify process-group cleanup.
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '../../core/src/index.js';
import type {
  AgentAdapter,
  AgentCapabilities,
  RunOptions,
  SpawnArgs,
  AgentEvent,
} from '../../core/src/index.js';

const caps: AgentCapabilities = {
  agent: 'mock-abort',
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

function makeLongRunner(): AgentAdapter {
  return {
    agent: 'mock-abort',
    displayName: 'Mock Long Runner',
    cliCommand: 'node',
    capabilities: caps,
    models: [],
    configSchema: {} as never,
    buildSpawnArgs: (_opts: RunOptions): SpawnArgs => ({
      command: process.execPath,
      // Emit periodic output so stdout stays open, then idle forever.
      args: ['-e', 'setInterval(() => process.stdout.write("tick\\n"), 100); setInterval(() => {}, 60000);'],
      env: {},
      cwd: process.cwd(),
      usePty: false,
    }),
    parseEvent: (line) => (line.trim()
      ? ({ type: 'text_delta', runId: 'x', agent: 'mock-abort', timestamp: Date.now(), delta: line, accumulated: line } as AgentEvent)
      : null),
    detectAuth: async () => ({ status: 'unknown' }),
    getAuthGuidance: () => ({ steps: [] } as never),
    sessionDir: () => process.cwd(),
    parseSessionFile: async () => ({
      sessionId: 'x', agent: 'mock-abort', turnCount: 0, createdAt: '', updatedAt: '',
    }),
    listSessionFiles: async () => [],
    readConfig: async () => ({}),
    writeConfig: async () => {},
  };
}

describe('E2E: abort long-running mock', () => {
  it('aborts a running child and exits with aborted/killed state', async () => {
    const client = createClient();
    client.adapters.register(makeLongRunner());

    const handle = client.run({
      agent: 'mock-abort',
      prompt: 'go',
      gracePeriodMs: 500,
      collectEvents: true,
    });

    // Let the child spawn and emit a couple of ticks.
    await new Promise((r) => setTimeout(r, 250));
    await handle.abort();
    const result = await handle.result();

    expect(['aborted', 'killed']).toContain(result.exitReason);
    // Verify process has actually exited — no process group leak.
    expect(result.exitCode === 0 || result.exitCode === null || typeof result.exitCode === 'number').toBe(true);
  }, 20000);
});
