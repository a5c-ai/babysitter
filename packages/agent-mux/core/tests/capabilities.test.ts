import { describe, it, expect } from 'vitest';
import type {
  ThinkingEffortLevel,
  PluginRegistry,
  InstallMethod,
  AuthMethodDescriptor,
  AgentCapabilities,
  ModelCapabilities,
  ModelValidationResult,
} from '../src/index.js';

describe('ThinkingEffortLevel', () => {
  it('accepts all four levels', () => {
    const levels: ThinkingEffortLevel[] = ['low', 'medium', 'high', 'max'];
    expect(levels).toHaveLength(4);
  });
});

describe('PluginRegistry', () => {
  it('has required fields', () => {
    const registry: PluginRegistry = {
      name: 'npm',
      url: 'https://registry.npmjs.org',
      searchable: true,
    };
    expect(registry.name).toBe('npm');
    expect(registry.searchable).toBe(true);
  });
});

describe('InstallMethod', () => {
  it('accepts all platform values', () => {
    const methods: InstallMethod[] = [
      { platform: 'darwin', type: 'brew', command: 'brew install foo' },
      { platform: 'linux', type: 'curl', command: 'curl -fsSL ...' },
      { platform: 'win32', type: 'winget', command: 'winget install foo' },
      { platform: 'all', type: 'npm', command: 'npm i -g foo' },
    ];
    expect(methods).toHaveLength(4);
  });

  it('accepts all type values', () => {
    const types: InstallMethod['type'][] = [
      'npm', 'brew', 'gh-extension', 'curl', 'winget', 'scoop', 'manual', 'pip', 'nix',
    ];
    expect(types).toHaveLength(9);
  });

  it('supports optional fields', () => {
    const method: InstallMethod = {
      platform: 'all',
      type: 'gh-extension',
      command: 'gh extension install foo',
      notes: 'Requires gh CLI',
      prerequisiteCheck: 'gh --version',
    };
    expect(method.notes).toBeDefined();
    expect(method.prerequisiteCheck).toBeDefined();
  });
});

describe('AuthMethod', () => {
  it('has required fields', () => {
    const method: AuthMethodDescriptor = {
      type: 'api-key',
      name: 'API Key',
      description: 'Set ANTHROPIC_API_KEY',
    };
    expect(method.type).toBe('api-key');
  });
});

describe('AgentCapabilities', () => {
  const caps: AgentCapabilities = {
    agent: 'claude',
    canResume: true,
    canFork: true,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsThinkingStreaming: true,
    supportsNativeTools: true,
    supportsMCP: true,
    supportsParallelToolCalls: true,
    requiresToolApproval: true,
    approvalModes: ['yolo', 'prompt', 'deny'],
    runtimeHooks: {
      preToolUse: 'unsupported',
      postToolUse: 'unsupported',
      sessionStart: 'unsupported',
      sessionEnd: 'unsupported',
      stop: 'unsupported',
      userPromptSubmit: 'unsupported',
    },
    supportsThinking: true,
    thinkingEffortLevels: ['low', 'medium', 'high', 'max'],
    supportsThinkingBudgetTokens: true,
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    structuredSessionTransport: 'persistent',
    sessionControlPlane: 'self-managed',
    supportsSkills: true,
    supportsAgentsMd: true,
    skillsFormat: 'file',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 10,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: true,
    supportsImageOutput: false,
    supportsFileAttachments: true,
    supportsPlugins: true,
    pluginFormats: ['npm-package', 'mcp-server'],
    pluginRegistries: [{ name: 'npm', url: 'https://npmjs.org', searchable: true }],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [{ type: 'api_key', name: 'API Key' }],
    authFiles: ['.anthropic/auth.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm i -g @anthropic-ai/claude-code' },
    ],
  };

  it('has all required fields', () => {
    expect(caps.agent).toBe('claude');
    expect(caps.canResume).toBe(true);
    expect(caps.sessionPersistence).toBe('file');
    expect(caps.approvalModes).toContain('yolo');
    expect(caps.thinkingEffortLevels).toHaveLength(4);
    expect(caps.supportedPlatforms).toHaveLength(3);
  });

  it('accepts optional fields', () => {
    expect(caps.maxParallelTasks).toBe(10);
    expect(caps.pluginInstallCmd).toBeUndefined();
  });
});

describe('ModelCapabilities', () => {
  const model: ModelCapabilities = {
    agent: 'claude',
    modelId: 'claude-sonnet-4-20250514',
    modelAlias: 'sonnet',
    displayName: 'Claude Sonnet 4',
    deprecated: false,
    contextWindow: 200000,
    maxOutputTokens: 16384,
    maxThinkingTokens: 128000,
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    thinkingPricePerMillion: 15,
    cachedInputPricePerMillion: 0.3,
    supportsThinking: true,
    thinkingEffortLevels: ['low', 'medium', 'high', 'max'],
    thinkingBudgetRange: [1024, 128000],
    supportsToolCalling: true,
    supportsParallelToolCalls: true,
    supportsToolCallStreaming: true,
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    supportsTextStreaming: true,
    supportsThinkingStreaming: true,
    supportsImageInput: true,
    supportsImageOutput: false,
    supportsFileInput: true,
    cliArgKey: '--model',
    cliArgValue: 'claude-sonnet-4-20250514',
    lastUpdated: '2025-05-14T00:00:00Z',
    source: 'bundled',
  };

  it('has all required fields', () => {
    expect(model.modelId).toBe('claude-sonnet-4-20250514');
    expect(model.contextWindow).toBe(200000);
    expect(model.supportsThinking).toBe(true);
  });

  it('supports deprecated models', () => {
    const deprecated: ModelCapabilities = {
      ...model,
      deprecated: true,
      deprecatedSince: '2025-06-01',
      successorModelId: 'claude-sonnet-5-20260101',
    };
    expect(deprecated.deprecated).toBe(true);
    expect(deprecated.successorModelId).toBeDefined();
  });
});

describe('ModelValidationResult', () => {
  it('represents valid result', () => {
    const result: ModelValidationResult = {
      valid: true,
      status: 'ok',
      message: 'Model is valid',
    };
    expect(result.valid).toBe(true);
    expect(result.status).toBe('ok');
  });

  it('represents unknown result with suggestions', () => {
    const result: ModelValidationResult = {
      valid: false,
      status: 'unknown',
      message: 'Model not found',
      suggestions: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'],
    };
    expect(result.valid).toBe(false);
    expect(result.suggestions).toHaveLength(2);
  });

  it('represents alias result', () => {
    const result: ModelValidationResult = {
      valid: true,
      status: 'alias',
      message: '"sonnet" is an alias for "claude-sonnet-4-20250514"',
      resolvedModelId: 'claude-sonnet-4-20250514',
    };
    expect(result.resolvedModelId).toBe('claude-sonnet-4-20250514');
  });

  it('represents deprecated result', () => {
    const result: ModelValidationResult = {
      valid: true,
      status: 'deprecated',
      message: 'Model is deprecated',
      successorModelId: 'claude-sonnet-5-20260101',
    };
    expect(result.successorModelId).toBeDefined();
  });
});
