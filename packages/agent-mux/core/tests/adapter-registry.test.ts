import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterRegistryImpl } from '../src/index.js';
import type {
  AgentAdapter,
  AgentCapabilities,
  DetectInstallationResult,
  ModelCapabilities,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Mock adapter factory
// ---------------------------------------------------------------------------

function createMockCapabilities(agent: string): AgentCapabilities {
  return {
    agent,
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
    installMethods: [
      { platform: 'all', type: 'npm', command: `npm i -g ${agent}` },
      { platform: 'darwin', type: 'brew', command: `brew install ${agent}` },
    ],
  };
}

function createMockModel(agent: string, modelId: string, alias?: string): ModelCapabilities {
  return {
    agent,
    modelId,
    modelAlias: alias,
    displayName: modelId,
    deprecated: false,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsThinking: false,
    supportsToolCalling: true,
    supportsParallelToolCalls: false,
    supportsToolCallStreaming: false,
    supportsJsonMode: false,
    supportsStructuredOutput: false,
    supportsTextStreaming: true,
    supportsThinkingStreaming: false,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileInput: false,
    cliArgKey: '--model',
    cliArgValue: modelId,
    lastUpdated: '2025-01-01T00:00:00Z',
    source: 'bundled',
  };
}

function createMockAdapter(
  agent: string,
  displayName: string,
  opts?: {
    models?: ModelCapabilities[];
    defaultModelId?: string;
    detectInstallation?: () => Promise<DetectInstallationResult>;
    minVersion?: string;
  },
): AgentAdapter {
  return {
    agent,
    displayName,
    cliCommand: agent,
    minVersion: opts?.minVersion,
    capabilities: createMockCapabilities(agent),
    models: opts?.models ?? [createMockModel(agent, `${agent}-default`)],
    defaultModelId: opts?.defaultModelId,
    configSchema: {},
    buildSpawnArgs: () => ({
      command: agent,
      args: [],
      env: {},
      cwd: '.',
      usePty: false,
    }),
    parseEvent: () => null,
    detectAuth: async () => ({ status: 'unknown' }),
    getAuthGuidance: () => ({ steps: [] }),
    sessionDir: () => '/tmp',
    parseSessionFile: async () => ({
      sessionId: 'test',
      agent,
      turnCount: 0,
      createdAt: '',
      updatedAt: '',
    }),
    listSessionFiles: async () => [],
    readConfig: async () => ({}),
    writeConfig: async () => {},
    detectInstallation: opts?.detectInstallation,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdapterRegistryImpl', () => {
  let registry: AdapterRegistryImpl;

  beforeEach(() => {
    registry = new AdapterRegistryImpl();
  });

  describe('register()', () => {
    it('registers an adapter', () => {
      const adapter = createMockAdapter('test-agent', 'Test Agent');
      registry.register(adapter);

      expect(registry.get('test-agent')).toBe(adapter);
    });

    it('replaces existing plugin adapter silently', () => {
      const adapter1 = createMockAdapter('test-agent', 'Test Agent v1');
      const adapter2 = createMockAdapter('test-agent', 'Test Agent v2');

      registry.register(adapter1);
      registry.register(adapter2);

      expect(registry.get('test-agent')).toBe(adapter2);
    });

    it('validates adapter shape — missing agent', () => {
      const adapter = createMockAdapter('', 'Test Agent');
      expect(() => registry.register(adapter)).toThrow(/Validation failed/);
    });

    it('validates adapter shape — missing displayName', () => {
      const adapter = createMockAdapter('test', '');
      expect(() => registry.register(adapter)).toThrow(/Validation failed/);
    });

    it('validates adapter shape — missing cliCommand', () => {
      const adapter = createMockAdapter('test', 'Test');
      (adapter as any).cliCommand = '';
      expect(() => registry.register(adapter)).toThrow(/Validation failed/);
    });

    it('validates adapter shape — models not array', () => {
      const adapter = createMockAdapter('test', 'Test');
      (adapter as any).models = 'not-an-array';
      expect(() => registry.register(adapter)).toThrow(/Validation failed/);
    });

    it('validates adapter shape — missing buildSpawnArgs', () => {
      const adapter = createMockAdapter('test', 'Test');
      (adapter as any).buildSpawnArgs = null;
      expect(() => registry.register(adapter)).toThrow(/Validation failed/);
    });

    it('validates adapter shape — missing parseEvent', () => {
      const adapter = createMockAdapter('test', 'Test');
      (adapter as any).parseEvent = 'not a function';
      expect(() => registry.register(adapter)).toThrow(/Validation failed/);
    });
  });

  describe('unregister()', () => {
    it('removes a registered adapter', () => {
      registry.register(createMockAdapter('test', 'Test'));
      registry.unregister('test');
      expect(registry.get('test')).toBeUndefined();
    });

    it('throws for unknown agent', () => {
      expect(() => registry.unregister('nonexistent')).toThrow(
        /No adapter registered/,
      );
    });
  });

  describe('get()', () => {
    it('returns undefined for unknown agent', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });

    it('returns the adapter instance', () => {
      const adapter = createMockAdapter('test', 'Test');
      registry.register(adapter);
      expect(registry.get('test')).toBe(adapter);
    });
  });

  describe('list()', () => {
    it('returns empty array when no adapters registered', () => {
      expect(registry.list()).toEqual([]);
    });

    it('returns all registered adapters sorted by agent name', () => {
      registry.register(createMockAdapter('zed', 'Zed'));
      registry.register(createMockAdapter('alpha', 'Alpha'));
      registry.register(createMockAdapter('middle', 'Middle'));

      const list = registry.list();
      expect(list).toHaveLength(3);
      expect(list[0].agent).toBe('alpha');
      expect(list[1].agent).toBe('middle');
      expect(list[2].agent).toBe('zed');
    });

    it('includes correct metadata', () => {
      registry.register(createMockAdapter('test', 'Test Agent'));
      const [info] = registry.list();
      expect(info.agent).toBe('test');
      expect(info.displayName).toBe('Test Agent');
      expect(info.cliCommand).toBe('test');
      expect(info.source).toBe('plugin');
    });

    it('marks built-in adapters correctly', () => {
      registry.registerBuiltIn(createMockAdapter('test', 'Test'));
      const [info] = registry.list();
      expect(info.source).toBe('built-in');
    });
  });

  describe('capabilities()', () => {
    it('returns capabilities for a registered agent', () => {
      registry.register(createMockAdapter('test', 'Test'));
      const caps = registry.capabilities('test');
      expect(caps.agent).toBe('test');
      expect(caps.supportsTextStreaming).toBe(true);
    });

    it('throws for unknown agent', () => {
      expect(() => registry.capabilities('unknown')).toThrow(
        /No adapter registered/,
      );
    });
  });

  describe('installInstructions()', () => {
    it('returns platform-filtered install methods', () => {
      registry.register(createMockAdapter('test', 'Test'));

      const allPlatform = registry.installInstructions('test', 'linux');
      // 'all' platform + no linux-specific one
      expect(allPlatform.length).toBe(1);
      expect(allPlatform[0].type).toBe('npm');

      const darwin = registry.installInstructions('test', 'darwin');
      expect(darwin.length).toBe(2); // 'all' + 'darwin'
    });

    it('throws for unknown agent', () => {
      expect(() => registry.installInstructions('unknown')).toThrow(
        /No adapter registered/,
      );
    });
  });

  describe('detect()', () => {
    it('returns null for unknown agent', async () => {
      const result = await registry.detect('unknown');
      expect(result).toBeNull();
    });

    it('returns InstalledAgentInfo for registered agent', async () => {
      registry.register(createMockAdapter('test', 'Test'));
      const result = await registry.detect('test');
      expect(result).not.toBeNull();
      expect(result!.agent).toBe('test');
      expect(result!.authState).toBe('unknown');
    });

    it('includes installation metadata from detectInstallation()', async () => {
      registry.register(createMockAdapter('test', 'Test', {
        minVersion: '1.2.0',
        detectInstallation: async () => ({
          installed: true,
          path: '/resolved/test',
          version: '1.3.0',
        }),
      }));

      const result = await registry.detect('test');

      expect(result).not.toBeNull();
      expect(result!.installed).toBe(true);
      expect(result!.cliPath).toBe('/resolved/test');
      expect(result!.version).toBe('1.3.0');
      expect(result!.meetsMinVersion).toBe(true);
      expect(result!.minVersion).toBe('1.2.0');
    });

    it('caches results for 30 seconds', async () => {
      let detectCallCount = 0;
      const adapter = createMockAdapter('test', 'Test');
      adapter.detectAuth = async () => {
        detectCallCount++;
        return { status: 'authenticated' };
      };
      registry.register(adapter);

      await registry.detect('test');
      await registry.detect('test');

      // Second call should use cache
      expect(detectCallCount).toBe(1);
    });

    it('invalidates cache on re-registration', async () => {
      let detectCallCount = 0;
      const adapter = createMockAdapter('test', 'Test');
      adapter.detectAuth = async () => {
        detectCallCount++;
        return { status: 'authenticated' };
      };

      registry.register(adapter);
      await registry.detect('test');

      // Re-register clears cache
      registry.register(adapter);
      await registry.detect('test');

      expect(detectCallCount).toBe(2);
    });
  });

  describe('installed()', () => {
    it('returns info for all registered agents', async () => {
      registry.register(createMockAdapter('a', 'A'));
      registry.register(createMockAdapter('b', 'B'));

      const results = await registry.installed();
      expect(results).toHaveLength(2);
    });

    it('returns empty array when no adapters registered', async () => {
      const results = await registry.installed();
      expect(results).toEqual([]);
    });
  });
});
