import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterRegistryImpl, ModelRegistryImpl } from '../src/index.js';
import type {
  AgentAdapter,
  AgentCapabilities,
  ModelCapabilities,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Mock helpers
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
    installMethods: [],
  };
}

function createModel(
  agent: string,
  modelId: string,
  overrides?: Partial<ModelCapabilities>,
): ModelCapabilities {
  return {
    agent,
    modelId,
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
    ...overrides,
  };
}

function createMockAdapter(
  agent: string,
  models: ModelCapabilities[],
  defaultModelId?: string,
  discoverModels?: () => Promise<ModelCapabilities[]>,
): AgentAdapter {
  return {
    agent,
    displayName: agent,
    cliCommand: agent,
    capabilities: createMockCapabilities(agent),
    models,
    defaultModelId,
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
    discoverModels,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ModelRegistryImpl', () => {
  let adapters: AdapterRegistryImpl;
  let models: ModelRegistryImpl;

  const sonnet = createModel('claude', 'claude-sonnet-4-20250514', {
    modelAlias: 'sonnet',
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
  });

  const opus = createModel('claude', 'claude-opus-4-20250514', {
    modelAlias: 'opus',
    inputPricePerMillion: 15,
    outputPricePerMillion: 75,
  });

  const deprecatedModel = createModel('claude', 'claude-3-opus', {
    deprecated: true,
    deprecatedSince: '2025-01-01',
    successorModelId: 'claude-opus-4-20250514',
  });

  beforeEach(() => {
    adapters = new AdapterRegistryImpl();
    models = new ModelRegistryImpl(adapters);

    adapters.register(
      createMockAdapter(
        'claude',
        [sonnet, opus, deprecatedModel],
        'claude-sonnet-4-20250514',
      ),
    );
  });

  describe('models()', () => {
    it('returns all models for a registered agent', () => {
      const result = models.models('claude');
      expect(result).toHaveLength(3);
    });

    it('returns a copy, not the original array', () => {
      const result = models.models('claude');
      result.pop();
      expect(models.models('claude')).toHaveLength(3);
    });

    it('returns empty array for unknown agent', () => {
      expect(models.models('unknown')).toEqual([]);
    });

    it('applies normalized provider/protocol metadata defaults', () => {
      const result = models.models('claude');
      expect(result[0]?.provider).toBe('anthropic');
      expect(result[0]?.protocol).toBe('messages');
      expect(result[0]?.deployment).toBe('hosted');
    });
  });

  describe('catalog()', () => {
    it('marks the default model entry', () => {
      const result = models.catalog('claude');
      expect(result.find((m) => m.modelId === 'claude-sonnet-4-20250514')?.isDefault).toBe(true);
      expect(result.find((m) => m.modelId === 'claude-opus-4-20250514')?.isDefault).toBe(false);
    });
  });

  describe('model()', () => {
    it('finds model by ID', () => {
      const result = models.model('claude', 'claude-sonnet-4-20250514');
      expect(result).not.toBeNull();
      expect(result!.modelId).toBe('claude-sonnet-4-20250514');
    });

    it('finds model by alias', () => {
      const result = models.model('claude', 'sonnet');
      expect(result).not.toBeNull();
      expect(result!.modelId).toBe('claude-sonnet-4-20250514');
    });

    it('returns null for unknown model', () => {
      expect(models.model('claude', 'nonexistent')).toBeNull();
    });

    it('returns null for unknown agent', () => {
      expect(models.model('unknown', 'whatever')).toBeNull();
    });
  });

  describe('defaultModel()', () => {
    it('returns the default model', () => {
      const result = models.defaultModel('claude');
      expect(result).not.toBeNull();
      expect(result!.modelId).toBe('claude-sonnet-4-20250514');
    });

    it('returns null for agent with no default', () => {
      adapters.register(createMockAdapter('nodefault', [createModel('nodefault', 'model1')]));
      expect(models.defaultModel('nodefault')).toBeNull();
    });

    it('returns null for unknown agent', () => {
      expect(models.defaultModel('unknown')).toBeNull();
    });
  });

  describe('validate()', () => {
    it('returns ok for valid model ID', () => {
      const result = models.validate('claude', 'claude-sonnet-4-20250514');
      expect(result.valid).toBe(true);
      expect(result.status).toBe('ok');
      expect(result.model).toBeDefined();
    });

    it('returns alias status for alias match', () => {
      const result = models.validate('claude', 'sonnet');
      expect(result.valid).toBe(true);
      expect(result.status).toBe('alias');
      expect(result.resolvedModelId).toBe('claude-sonnet-4-20250514');
    });

    it('returns deprecated status for deprecated model', () => {
      const result = models.validate('claude', 'claude-3-opus');
      expect(result.valid).toBe(true);
      expect(result.status).toBe('deprecated');
      expect(result.successorModelId).toBe('claude-opus-4-20250514');
    });

    it('returns unknown with suggestions for unrecognized model', () => {
      const result = models.validate('claude', 'claude-sonnet');
      expect(result.valid).toBe(false);
      expect(result.status).toBe('unknown');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      // Should suggest the sonnet model
      expect(result.suggestions).toContain('claude-sonnet-4-20250514');
    });

    it('returns unknown for completely unrelated model ID', () => {
      const result = models.validate('claude', 'gpt-4');
      expect(result.valid).toBe(false);
      expect(result.status).toBe('unknown');
    });

    it('returns unknown for unregistered agent', () => {
      const result = models.validate('unknown-agent', 'model');
      expect(result.valid).toBe(false);
      expect(result.status).toBe('unknown');
    });
  });

  describe('estimateCost()', () => {
    it('estimates cost based on token counts', () => {
      const cost = models.estimateCost(
        'claude',
        'claude-sonnet-4-20250514',
        1_000_000, // 1M input tokens
        1_000_000, // 1M output tokens
      );
      // 3 + 15 = 18 USD
      expect(cost).toBeCloseTo(18);
    });

    it('handles smaller token counts', () => {
      const cost = models.estimateCost(
        'claude',
        'claude-sonnet-4-20250514',
        1000,  // 1K input tokens
        500,   // 500 output tokens
      );
      // (1000/1M)*3 + (500/1M)*15 = 0.003 + 0.0075 = 0.0105
      expect(cost).toBeCloseTo(0.0105);
    });

    it('returns 0 for unknown model', () => {
      expect(models.estimateCost('claude', 'nonexistent', 1000, 1000)).toBe(0);
    });

    it('returns 0 for unknown agent', () => {
      expect(models.estimateCost('unknown', 'model', 1000, 1000)).toBe(0);
    });

    it('returns 0 when pricing data is unavailable', () => {
      adapters.register(
        createMockAdapter('nopricing', [createModel('nopricing', 'model1')]),
      );
      // Model has no pricing fields set
      expect(models.estimateCost('nopricing', 'model1', 1000, 1000)).toBe(0);
    });
  });

  describe('refresh()', () => {
    it('updates lastUpdated timestamp', async () => {
      const before = models.lastUpdated('claude');
      await models.refresh('claude');
      const after = models.lastUpdated('claude');
      expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('uses adapter discovery when available', async () => {
      adapters.register(
        createMockAdapter(
          'codex',
          [createModel('codex', 'o4-mini')],
          'o4-mini',
          async () => [createModel('codex', 'codex-mini-latest', { source: 'remote' })],
        ),
      );

      await models.refresh('codex');

      const result = models.models('codex');
      expect(result).toHaveLength(1);
      expect(result[0]?.modelId).toBe('codex-mini-latest');
      expect(result[0]?.source).toBe('remote');
      expect(result[0]?.provider).toBe('openai');
      expect(result[0]?.protocol).toBe('responses');
    });
  });

  describe('refreshAll()', () => {
    it('refreshes all agents', async () => {
      adapters.register(createMockAdapter('agent2', [createModel('agent2', 'model2')]));

      await models.refreshAll();

      // Both should have recent lastUpdated
      const t1 = models.lastUpdated('claude');
      const t2 = models.lastUpdated('agent2');
      expect(t1.getTime()).toBeGreaterThan(0);
      expect(t2.getTime()).toBeGreaterThan(0);
    });
  });

  describe('lastUpdated()', () => {
    it('returns epoch 0 for agent that was never refreshed', () => {
      const date = models.lastUpdated('claude');
      expect(date.getTime()).toBe(0);
    });
  });
});
