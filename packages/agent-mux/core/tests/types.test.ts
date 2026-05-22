import { describe, it, expect } from 'vitest';
import type {
  BuiltInAgentName,
  AgentName,
  ErrorCode,
  ValidationFieldError,
  BaseEvent,
  GlobalConfig,
  AuthHintsFile,
  AuthHintEntry,
  RunIndexEntry,
  CostRecord,
  ProfileData,
  PluginFormat,
  RetryPolicy,
  McpServerConfig,
} from '../src/index.js';

describe('BuiltInAgentName', () => {
  it('accepts all 10 built-in agent names', () => {
    const agents: BuiltInAgentName[] = [
      'claude',
      'codex',
      'gemini',
      'copilot',
      'cursor',
      'opencode',
      'pi',
      'omp',
      'openclaw',
      'hermes',
    ];
    expect(agents).toHaveLength(10);
  });
});

describe('AgentName', () => {
  it('accepts built-in names', () => {
    const name: AgentName = 'claude';
    expect(name).toBe('claude');
  });

  it('accepts arbitrary strings for plugin adapters', () => {
    const name: AgentName = 'my-custom-agent';
    expect(name).toBe('my-custom-agent');
  });
});

describe('ErrorCode', () => {
  it('contains all 24 error codes', () => {
    const codes: ErrorCode[] = [
      'CAPABILITY_ERROR',
      'VALIDATION_ERROR',
      'AUTH_ERROR',
      'AGENT_NOT_FOUND',
      'AGENT_NOT_INSTALLED',
      'AGENT_CRASH',
      'SPAWN_ERROR',
      'TIMEOUT',
      'INACTIVITY_TIMEOUT',
      'PARSE_ERROR',
      'CONFIG_ERROR',
      'CONFIG_LOCK_ERROR',
      'SESSION_NOT_FOUND',
      'PROFILE_NOT_FOUND',
      'PLUGIN_ERROR',
      'RATE_LIMITED',
      'CONTEXT_EXCEEDED',
      'ABORTED',
      'RUN_NOT_ACTIVE',
      'STDIN_NOT_AVAILABLE',
      'NO_PENDING_INTERACTION',
      'INVALID_STATE_TRANSITION',
      'PTY_NOT_AVAILABLE',
      'INTERNAL',
    ];
    expect(codes).toHaveLength(24);
  });
});

describe('ValidationFieldError', () => {
  it('holds all required fields', () => {
    const err: ValidationFieldError = {
      field: 'timeout',
      message: 'must be non-negative',
      received: -1,
      expected: '>= 0',
    };
    expect(err.field).toBe('timeout');
    expect(err.message).toBe('must be non-negative');
    expect(err.received).toBe(-1);
    expect(err.expected).toBe('>= 0');
  });
});

describe('BaseEvent', () => {
  it('has required fields', () => {
    const event: BaseEvent = {
      type: 'text_delta',
      runId: '01ABC',
      agent: 'claude',
      timestamp: Date.now(),
    };
    expect(event.type).toBe('text_delta');
    expect(event.agent).toBe('claude');
    expect(typeof event.timestamp).toBe('number');
  });

  it('supports optional raw field', () => {
    const event: BaseEvent = {
      type: 'text_delta',
      runId: '01ABC',
      agent: 'claude',
      timestamp: Date.now(),
      raw: '{"type":"text_delta"}',
    };
    expect(event.raw).toBeDefined();
  });
});

describe('GlobalConfig', () => {
  it('accepts all optional fields', () => {
    const config: GlobalConfig = {
      defaultAgent: 'claude',
      defaultModel: 'sonnet',
      approvalMode: 'yolo',
      timeout: 60000,
      inactivityTimeout: 30000,
      stream: 'auto',
    };
    expect(config.defaultAgent).toBe('claude');
    expect(config.approvalMode).toBe('yolo');
    expect(config.stream).toBe('auto');
  });

  it('accepts empty config', () => {
    const config: GlobalConfig = {};
    expect(config.defaultAgent).toBeUndefined();
  });

  it('accepts retryPolicy field', () => {
    const config: GlobalConfig = {
      retryPolicy: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitterFactor: 0.1,
        retryOn: ['RATE_LIMITED'],
      },
    };
    expect(config.retryPolicy?.maxAttempts).toBe(3);
  });
});

describe('AuthHintsFile', () => {
  it('has version and agents', () => {
    const hints: AuthHintsFile = {
      version: 1,
      agents: {
        claude: {
          status: 'authenticated',
          method: 'oauth',
          identity: 'user@example.com',
          checkedAt: '2024-01-01T00:00:00Z',
        },
      },
    };
    expect(hints.version).toBe(1);
    expect(hints.agents['claude']?.status).toBe('authenticated');
  });
});

describe('AuthHintEntry', () => {
  it('supports all status values', () => {
    const statuses: AuthHintEntry['status'][] = [
      'authenticated',
      'unauthenticated',
      'expired',
      'unknown',
    ];
    expect(statuses).toHaveLength(4);
  });

  it('has required checkedAt and optional fields', () => {
    const entry: AuthHintEntry = {
      status: 'unknown',
      checkedAt: '2024-01-01T00:00:00Z',
    };
    expect(entry.method).toBeUndefined();
    expect(entry.identity).toBeUndefined();
    expect(entry.expiresAt).toBeUndefined();
  });
});

describe('RunIndexEntry', () => {
  it('has all required fields', () => {
    const entry: RunIndexEntry = {
      v: 1,
      runId: '01ABCDEF0123456789ABCDEF',
      agent: 'codex',
      timestamp: '2024-01-01T00:00:00Z',
      tags: ['test'],
    };
    expect(entry.v).toBe(1);
    expect(entry.agent).toBe('codex');
    expect(entry.tags).toEqual(['test']);
  });

  it('supports optional model, sessionId, and cost', () => {
    const entry: RunIndexEntry = {
      v: 1,
      runId: '01ABCDEF0123456789ABCDEF',
      agent: 'claude',
      model: 'sonnet',
      sessionId: 'sess-123',
      timestamp: '2024-01-01T00:00:00Z',
      cost: {
        totalUsd: 0.05,
        inputTokens: 1000,
        outputTokens: 500,
        thinkingTokens: 200,
        cachedTokens: 100,
      },
      tags: [],
    };
    expect(entry.model).toBe('sonnet');
    expect(entry.cost?.totalUsd).toBe(0.05);
    expect(entry.cost?.thinkingTokens).toBe(200);
    expect(entry.cost?.cachedTokens).toBe(100);
  });
});

describe('CostRecord', () => {
  it('has required and optional fields', () => {
    const cost: CostRecord = {
      totalUsd: 0.01,
      inputTokens: 500,
      outputTokens: 200,
    };
    expect(cost.totalUsd).toBe(0.01);
    expect(cost.thinkingTokens).toBeUndefined();
    expect(cost.cachedTokens).toBeUndefined();
  });
});

describe('ProfileData', () => {
  it('allows all fields to be optional', () => {
    const profile: ProfileData = {};
    expect(profile.agent).toBeUndefined();
  });

  it('accepts all profile fields', () => {
    const profile: ProfileData = {
      agent: 'gemini',
      model: 'gemini-pro',
      approvalMode: 'deny',
      timeout: 30000,
      inactivityTimeout: 10000,
      maxTurns: 5,
      thinkingEffort: 'high',
      thinkingBudgetTokens: 2048,
      thinkingOverride: { customKey: true },
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 4096,
      maxOutputTokens: 2048,
      stream: true,
      outputFormat: 'json',
      systemPrompt: 'You are a helpful assistant.',
      systemPromptMode: 'prepend',
      skills: ['skill1'],
      tags: ['tag1'],
    };
    expect(profile.agent).toBe('gemini');
    expect(profile.thinkingEffort).toBe('high');
    expect(profile.systemPrompt).toBeDefined();
    expect(profile.systemPromptMode).toBe('prepend');
  });

  it('accepts retryPolicy and mcpServers fields', () => {
    const profile: ProfileData = {
      retryPolicy: {
        maxAttempts: 5,
        baseDelayMs: 2000,
        maxDelayMs: 60000,
        jitterFactor: 0.2,
        retryOn: ['TIMEOUT'],
      },
      mcpServers: [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['server.js'],
        },
      ],
    };
    expect(profile.retryPolicy?.maxAttempts).toBe(5);
    expect(profile.mcpServers).toHaveLength(1);
  });
});

describe('PluginFormat', () => {
  it('includes all 6 formats', () => {
    const formats: PluginFormat[] = [
      'npm-package',
      'skill-file',
      'skill-directory',
      'extension-ts',
      'channel-plugin',
      'mcp-server',
    ];
    expect(formats).toHaveLength(6);
  });
});

describe('RetryPolicy', () => {
  it('holds all fields when fully specified', () => {
    const policy: RetryPolicy = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitterFactor: 0.1,
      retryOn: ['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT'],
    };
    expect(policy.maxAttempts).toBe(3);
    expect(policy.retryOn).toHaveLength(3);
  });

  it('allows all fields to be omitted (all optional with defaults)', () => {
    const empty: RetryPolicy = {};
    expect(empty.maxAttempts).toBeUndefined();
    expect(empty.baseDelayMs).toBeUndefined();
    expect(empty.maxDelayMs).toBeUndefined();
    expect(empty.jitterFactor).toBeUndefined();
    expect(empty.retryOn).toBeUndefined();
  });

  it('allows partial specification', () => {
    const partial: RetryPolicy = { maxAttempts: 5 };
    expect(partial.maxAttempts).toBe(5);
    expect(partial.baseDelayMs).toBeUndefined();
  });
});
