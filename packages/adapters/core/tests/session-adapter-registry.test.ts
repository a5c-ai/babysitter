import { describe, expect, it, vi } from 'vitest';
import type { AgentAdapter, Session } from '../src/index.js';
import {
  SessionAdapterRegistry,
  createLegacySessionAdapter,
  createSessionAdapterRegistry,
} from '../src/session-adapter-registry.js';

function legacyAdapter(agent: string): AgentAdapter {
  return {
    agent,
    displayName: agent,
    cliCommand: agent,
    capabilities: {
      agent,
      displayName: agent,
      streaming: false,
      thinking: false,
      thinkingEffort: false,
      thinkingEffortLevels: [],
      thinkingBudget: false,
      maxTurns: false,
      systemPrompt: false,
      systemPromptMode: [],
      temperature: false,
      temperatureRange: undefined,
      topP: false,
      topK: false,
      maxOutputTokens: false,
      outputFormats: ['text'],
      attachments: false,
      imageAttachments: false,
      sessionPersistence: true,
      canResume: true,
      canFork: false,
      supportsMCP: false,
      approvalModes: ['prompt'],
      interactiveInput: false,
      agentDocs: false,
      outputChannel: 'stdout',
      authMethods: [],
      authFiles: [],
      pluginFormats: [],
      pluginRegistry: undefined,
      installMethods: [],
    },
    models: [],
    configSchema: { version: 1, fields: [] },
    buildSpawnArgs: () => ({ command: agent, args: [], env: {}, cwd: '.', usePty: false }),
    parseEvent: () => null,
    detectAuth: async () => ({ status: 'unknown' }),
    getAuthGuidance: () => ({ steps: [], envVars: [], links: [] }),
    sessionDir: vi.fn(() => `/tmp/${agent}/sessions`),
    listSessionFiles: vi.fn(async () => [`/tmp/${agent}/sessions/native:one.jsonl`]),
    parseSessionFile: vi.fn(async (): Promise<Session> => ({
      agent,
      sessionId: 'native:one',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:05:05.000Z',
      turnCount: 1,
      messages: [{ role: 'user', content: 'hello' }],
    })),
    readConfig: async () => ({}),
    writeConfig: async () => {},
  } as unknown as AgentAdapter;
}

describe('SessionAdapterRegistry', () => {
  it('registers persistent session adapters by agent and plugin target alias', () => {
    const registry = new SessionAdapterRegistry();
    const adapter = createLegacySessionAdapter(legacyAdapter('codex'), {
      pluginTargetId: 'plugin-generated-target',
      adapterName: 'codex',
      sessionDirStrategy: '$PLUGIN_ROOT/.sessions',
    });

    registry.register(adapter, ['plugin-generated-target']);

    expect(registry.get('codex')).toBe(adapter);
    expect(registry.get('plugin-generated-target')).toBe(adapter);
    expect(registry.list().map((entry) => entry.agent)).toEqual(['codex']);
  });

  it('preserves native IDs separately from deterministic unified IDs', () => {
    const registry = new SessionAdapterRegistry();
    registry.register(createLegacySessionAdapter(legacyAdapter('claude')));

    expect(registry.resolveUnifiedId('claude', 'native:one')).toBe('claude:native:one');
    expect(registry.resolveNativeId('claude:native:one')).toEqual({
      agent: 'claude',
      nativeSessionId: 'native:one',
    });
    expect(registry.resolveNativeId('unknown:native:one')).toBeNull();
  });

  it('legacy adapter wrapper delegates session directory, listing, and parsing', async () => {
    const legacy = legacyAdapter('gemini');
    const adapter = createLegacySessionAdapter(legacy);

    expect(adapter.sessionDir()).toBe('/tmp/gemini/sessions');
    await expect(adapter.listSessionFiles()).resolves.toEqual(['/tmp/gemini/sessions/native:one.jsonl']);
    await expect(adapter.parseSessionFile('/tmp/gemini/sessions/native:one.jsonl')).resolves.toMatchObject({
      agent: 'gemini',
      sessionId: 'native:one',
    });
    expect(legacy.sessionDir).toHaveBeenCalled();
    expect(legacy.listSessionFiles).toHaveBeenCalled();
    expect(legacy.parseSessionFile).toHaveBeenCalled();
  });

  it('builds registry aliases and metadata from Atlas plugin target descriptors', () => {
    const legacy = legacyAdapter('claude');
    const adapterRegistry = {
      list: () => [{
        agent: 'claude',
        displayName: 'Claude',
        cliCommand: 'claude',
        source: 'built-in',
      }],
      get: (agent: string) => agent === 'claude' ? legacy : undefined,
    };

    const registry = createSessionAdapterRegistry(adapterRegistry as never);
    const adapter = registry.get('claude-code');

    expect(adapter).toBe(registry.get('claude'));
    expect(adapter?.metadata).toMatchObject({
      adapterName: 'claude',
      pluginTargetId: 'claude-code',
      sessionPersistence: 'file',
    });
  });
});
