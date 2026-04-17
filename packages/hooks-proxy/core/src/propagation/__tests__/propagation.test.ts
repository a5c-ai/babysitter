import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { materializeExecContext } from '../materialize';
import { generateTempEnvFile } from '../env-file';
import { adaptOutput } from '../adapt-output';
import { propagateEnv } from '../propagation-backends';
import type { SessionStore } from '../types';
import type { SessionState } from '../../types/session';
import type { AdapterCapabilities } from '../../types/adapter';
import type { MergedExecutionResult } from '../../merge-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    version: 'a5c.hooks.session.v1',
    sessionId: 'test-session-001',
    adapter: 'claude',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:01:00.000Z',
    cwd: '/workspace/project',
    persistedEnv: {},
    contextVars: {},
    contextFragments: [],
    metadata: {},
    ...overrides,
  };
}

function createMockSessionStore(session: SessionState | null = null): SessionStore {
  return {
    loadSession: vi.fn().mockResolvedValue(session),
    saveSession: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockCapabilities(overrides: Partial<AdapterCapabilities> = {}): AdapterCapabilities {
  return {
    name: 'claude',
    family: 'shell-hook',
    sessionIdQuality: 'native',
    supportsOrderedFanout: true,
    supportsNativeAdditionalContext: true,
    supportsBlock: true,
    supportsAsk: true,
    supportsToolInputMutation: true,
    supportsToolResultMutation: true,
    supportsPersistedEnv: true,
    envPersistenceMode: 'native_env_file',
    toolInterceptionScope: 'all',
    ...overrides,
  };
}

function createMockMergedResult(overrides: Partial<MergedExecutionResult> = {}): MergedExecutionResult {
  return {
    decision: 'allow',
    reason: '',
    persistEnv: {},
    unsetEnv: [],
    contextVars: {},
    additionalContext: '',
    systemMessage: '',
    toolMutation: undefined,
    continueSession: true,
    suppressOutput: false,
    stopReason: '',
    followUpMessage: '',
    metadata: {},
    diagnostics: {
      handlerCount: 1,
      handlerOrder: [0],
      conflicts: [],
      degradedFields: [],
      handlerTimings: [],
      unsupportedOutputFields: [],
      nativeRenderingLosses: [],
      mergedAt: new Date().toISOString(),
    },
    ...overrides,
  };
}

let tmpDir: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `propagation-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.promises.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {/* ignore */});
});

// ---------------------------------------------------------------------------
// materializeExecContext
// ---------------------------------------------------------------------------

describe('materializeExecContext', () => {
  it('injects all required A5C_ env vars when session has full metadata', async () => {
    const session = createMockSession({
      metadata: {
        turnId: 'turn-42',
        workspaceRoot: '/workspace/root',
      },
      transcriptPath: '/tmp/transcript.jsonl',
    });
    const store = createMockSessionStore(session);

    const result = await materializeExecContext({
      sessionId: 'test-session-001',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['A5C_SESSION_ID']).toBe('test-session-001');
    expect(result.env['A5C_TURN_ID']).toBe('turn-42');
    expect(result.env['A5C_ADAPTER']).toBe('claude');
    expect(result.env['A5C_WORKSPACE_ROOT']).toBe('/workspace/root');
    expect(result.env['A5C_TRANSCRIPT_PATH']).toBe('/tmp/transcript.jsonl');
    expect(result.env['A5C_CONTEXT_FILE']).toBeDefined();
  });

  it('uses cwd as A5C_WORKSPACE_ROOT when workspaceRoot metadata is absent', async () => {
    const session = createMockSession({ cwd: '/fallback/dir' });
    const store = createMockSessionStore(session);

    const result = await materializeExecContext({
      sessionId: 'test-session-001',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['A5C_WORKSPACE_ROOT']).toBe('/fallback/dir');
  });

  it('injects A5C_SESSION_ID even when session is not found', async () => {
    const store = createMockSessionStore(null);

    const result = await materializeExecContext({
      sessionId: 'missing-session',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['A5C_SESSION_ID']).toBe('missing-session');
    expect(result.contextFilePath).toBeUndefined();
  });

  it('filters persisted env keys by allowlist', async () => {
    const session = createMockSession({
      persistedEnv: {
        ALLOWED_KEY: 'yes',
        BLOCKED_KEY: 'no',
        ALSO_ALLOWED: 'yes2',
      },
    });
    const store = createMockSessionStore(session);

    const result = await materializeExecContext({
      sessionId: 'test-session-001',
      sessionStore: store,
      envAllowlist: ['ALLOWED_KEY', 'ALSO_ALLOWED'],
      tempDir: tmpDir,
    });

    expect(result.env['ALLOWED_KEY']).toBe('yes');
    expect(result.env['ALSO_ALLOWED']).toBe('yes2');
    expect(result.env['BLOCKED_KEY']).toBeUndefined();
  });

  it('rehydrates all persisted env keys when no allowlist is provided', async () => {
    const session = createMockSession({
      persistedEnv: {
        CUSTOM_VAR: 'hello',
        OTHER_VAR: 'world',
      },
    });
    const store = createMockSessionStore(session);

    const result = await materializeExecContext({
      sessionId: 'test-session-001',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['CUSTOM_VAR']).toBe('hello');
    expect(result.env['OTHER_VAR']).toBe('world');
  });

  it('skips A5C_ prefixed keys from persisted env', async () => {
    const session = createMockSession({
      persistedEnv: {
        A5C_STALE_VAR: 'should-not-appear',
        NORMAL_VAR: 'should-appear',
      },
    });
    const store = createMockSessionStore(session);

    const result = await materializeExecContext({
      sessionId: 'test-session-001',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['A5C_STALE_VAR']).toBeUndefined();
    expect(result.env['NORMAL_VAR']).toBe('should-appear');
  });

  it('generates context file and temp env file', async () => {
    const session = createMockSession();
    const store = createMockSessionStore(session);

    const result = await materializeExecContext({
      sessionId: 'test-session-001',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.contextFilePath).toBeDefined();
    expect(result.tempEnvFilePath).toBeDefined();

    // Verify context file content
    const contextContent = JSON.parse(
      await fs.promises.readFile(result.contextFilePath!, 'utf-8'),
    );
    expect(contextContent.sessionId).toBe('test-session-001');
    expect(contextContent.adapter).toBe('claude');
  });
});

// ---------------------------------------------------------------------------
// generateTempEnvFile
// ---------------------------------------------------------------------------

describe('generateTempEnvFile', () => {
  it('writes KEY=VALUE export lines', async () => {
    const filePath = await generateTempEnvFile(
      { FOO: 'bar', BAZ: 'qux' },
      tmpDir,
    );

    const content = await fs.promises.readFile(filePath, 'utf-8');
    expect(content).toContain('export FOO="bar"');
    expect(content).toContain('export BAZ="qux"');
    expect(content.endsWith('\n')).toBe(true);
  });

  it('escapes double quotes, backslashes, newlines, dollars, and backticks in values', async () => {
    const filePath = await generateTempEnvFile(
      { TRICKY: 'say "hello" \\ world\n$HOME `cmd`' },
      tmpDir,
    );

    const content = await fs.promises.readFile(filePath, 'utf-8');
    expect(content).toContain('export TRICKY="say \\"hello\\" \\\\ world\\n\\$HOME \\`cmd\\`"');
  });

  it('creates directory if it does not exist', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'deep');
    const filePath = await generateTempEnvFile({ A: '1' }, nestedDir);

    expect(await fs.promises.stat(filePath)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// adaptOutput
// ---------------------------------------------------------------------------

describe('adaptOutput', () => {
  it('includes all base fields from merged result', () => {
    const result = adaptOutput({
      adapter: 'claude',
      mergedResult: createMockMergedResult({
        decision: 'allow',
        reason: 'all good',
        persistEnv: { KEY: 'val' },
        contextVars: { CTX: 'data' },
      }),
      nativeInput: {},
      capabilities: createMockCapabilities(),
    });

    expect(result.output['decision']).toBe('allow');
    expect(result.output['reason']).toBe('all good');
    expect(result.output['persistEnv']).toEqual({ KEY: 'val' });
    expect(result.output['contextVars']).toEqual({ CTX: 'data' });
    expect(result.degradedFields).toHaveLength(0);
  });

  it('strips toolMutation when adapter does not support mutation', () => {
    const result = adaptOutput({
      adapter: 'basic',
      mergedResult: createMockMergedResult({
        toolMutation: { mode: 'replace', value: { a: 1 } },
      }),
      nativeInput: {},
      capabilities: createMockCapabilities({
        supportsToolInputMutation: false,
        supportsToolResultMutation: false,
      }),
    });

    expect(result.output['toolMutation']).toBeUndefined();
    expect(result.degradedFields).toContain('toolMutation');
  });

  it('includes toolMutation when adapter supports mutation', () => {
    const mutation = { mode: 'replace' as const, value: { a: 1 } };
    const result = adaptOutput({
      adapter: 'claude',
      mergedResult: createMockMergedResult({ toolMutation: mutation }),
      nativeInput: {},
      capabilities: createMockCapabilities({ supportsToolInputMutation: true }),
    });

    expect(result.output['toolMutation']).toEqual(mutation);
    expect(result.degradedFields).not.toContain('toolMutation');
  });

  it('tracks degradation when decision is not supported', () => {
    const result = adaptOutput({
      adapter: 'basic',
      mergedResult: createMockMergedResult({ decision: 'deny' }),
      nativeInput: {},
      capabilities: createMockCapabilities({ supportsBlock: false }),
    });

    expect(result.degradedFields).toContain('decision');
    expect(result.output['decision']).toBe('noop');
  });

  it('preserves decision when adapter supports blocking', () => {
    const result = adaptOutput({
      adapter: 'claude',
      mergedResult: createMockMergedResult({ decision: 'deny' }),
      nativeInput: {},
      capabilities: createMockCapabilities({ supportsBlock: true }),
    });

    expect(result.output['decision']).toBe('deny');
    expect(result.degradedFields).not.toContain('decision');
  });

  it('degrades additionalContext when adapter does not support it', () => {
    const result = adaptOutput({
      adapter: 'basic',
      mergedResult: createMockMergedResult({ additionalContext: 'some context' }),
      nativeInput: {},
      capabilities: createMockCapabilities({ supportsNativeAdditionalContext: false }),
    });

    expect(result.output['additionalContext']).toBeUndefined();
    expect(result.degradedFields).toContain('additionalContext');
  });
});

// ---------------------------------------------------------------------------
// propagateEnv backends
// ---------------------------------------------------------------------------

describe('propagateEnv', () => {
  describe('native_env_file (Mode A)', () => {
    it('appends KEY=VALUE lines to the native env file', async () => {
      const envFilePath = path.join(tmpDir, 'harness.env');
      await fs.promises.writeFile(envFilePath, 'EXISTING="value"\n', 'utf-8');

      await propagateEnv('native_env_file', { NEW_KEY: 'new_value' }, {
        nativeEnvFilePath: envFilePath,
      });

      const content = await fs.promises.readFile(envFilePath, 'utf-8');
      expect(content).toContain('EXISTING="value"');
      expect(content).toContain('NEW_KEY="new_value"');
    });

    it('throws when nativeEnvFilePath is not provided', async () => {
      await expect(
        propagateEnv('native_env_file', { KEY: 'val' }, {}),
      ).rejects.toThrow('nativeEnvFilePath');
    });
  });

  describe('runtime_hook (Mode B)', () => {
    it('performs no I/O (env is passed back to runtime)', async () => {
      // Should complete without error and without writing anything
      await propagateEnv('runtime_hook', { KEY: 'val' }, {});
    });
  });

  describe('wrapper_only (Mode C)', () => {
    it('generates a temp env file', async () => {
      const initialFiles = await fs.promises.readdir(tmpDir);

      await propagateEnv('wrapper_only', { WRAP_KEY: 'wrap_val' }, {
        tempDir: tmpDir,
      });

      const afterFiles = await fs.promises.readdir(tmpDir);
      const newFiles = afterFiles.filter((f) => !initialFiles.includes(f));
      expect(newFiles.length).toBe(1);
      expect(newFiles[0]).toMatch(/\.env$/);

      const content = await fs.promises.readFile(
        path.join(tmpDir, newFiles[0]),
        'utf-8',
      );
      expect(content).toContain('WRAP_KEY="wrap_val"');
    });
  });

  describe('none (Mode D)', () => {
    it('persists env to session store persistedEnv', async () => {
      const session = createMockSession({ persistedEnv: {} });
      const store = createMockSessionStore(session);

      await propagateEnv('none', { STORE_KEY: 'store_val' }, {
        sessionId: 'test-session-001',
        sessionStore: store,
      });

      expect(store.saveSession).toHaveBeenCalledTimes(1);
      const savedSession = (store.saveSession as ReturnType<typeof vi.fn>).mock.calls[0][0] as SessionState;
      expect(savedSession.persistedEnv['STORE_KEY']).toBe('store_val');
    });

    it('merges with existing persisted env', async () => {
      const session = createMockSession({
        persistedEnv: { OLD_KEY: 'old_val' },
      });
      const store = createMockSessionStore(session);

      await propagateEnv('none', { NEW_KEY: 'new_val' }, {
        sessionId: 'test-session-001',
        sessionStore: store,
      });

      const savedSession = (store.saveSession as ReturnType<typeof vi.fn>).mock.calls[0][0] as SessionState;
      expect(savedSession.persistedEnv['OLD_KEY']).toBe('old_val');
      expect(savedSession.persistedEnv['NEW_KEY']).toBe('new_val');
    });

    it('does nothing when session store is not provided', async () => {
      // Should complete without error
      await propagateEnv('none', { KEY: 'val' }, {});
    });
  });
});
