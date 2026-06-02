import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock stdin reader
vi.mock('../cli/stdin', () => ({
  readStdin: vi.fn(async () => ''),
}));

// Mock the adapter loader before importing anything that uses it
vi.mock('../cli/adapter-loader', () => ({
  loadAdapter: vi.fn(),
  KNOWN_ADAPTERS: ['claude', 'codex', 'copilot'] as const,
}));

// Mock @a5c-ai/agent-mux-hooks-core
vi.mock('@a5c-ai/agent-mux-hooks-core', () => ({
  CANONICAL_PHASES: ['session.start', 'session.stop'],
  LIFECYCLE_SCOPES: ['session', 'turn', 'tool', 'task'],
  normalizeEvent: vi.fn((opts: Record<string, unknown>) => ({
    version: 'a5c.hooks.v1',
    adapter: opts.adapter,
    phase: 'session.start',
    rawEventName: opts.rawEventName ?? 'unknown',
    supportLevel: 'native',
    execution: {
      sessionId: null,
      adapter: opts.adapter,
      nativeEventName: opts.rawEventName ?? 'unknown',
      cwd: '/tmp',
      persistedEnv: {},
      contextVars: {},
      metadata: {},
    },
    payload: {},
    env: { input: {}, persisted: {} },
    raw: opts.stdinPayload,
  })),
  resolveHookPlan: vi.fn(() => []),
  runPlan: vi.fn(async () => [{ decision: 'noop' }]),
  mergeResults: vi.fn((results: Array<{ decision: string }>) => ({
    decision: results[0]?.decision ?? 'noop',
    reason: '',
    persistEnv: {},
    unsetEnv: [],
    contextVars: {},
    additionalContext: '',
    systemMessage: '',
    continueSession: true,
    stopReason: '',
    suppressOutput: false,
    followUpMessage: '',
    metadata: {},
    diagnostics: { conflicts: [], degradedFields: [] },
  })),
  loadSession: vi.fn(async () => null),
  saveSession: vi.fn(async () => undefined),
  deleteSession: vi.fn(async () => undefined),
  adaptOutput: vi.fn(() => ({
    output: {},
    degradedFields: [],
  })),
  propagateEnv: vi.fn(async () => undefined),
  materializeExecContext: vi.fn(async () => ({
    env: { AGENT_SESSION_ID: 'test-session' },
    contextFilePath: undefined,
    tempEnvFilePath: undefined,
  })),
  getDefaultSessionDir: vi.fn(() => '/mock-session-dir'),
  getSessionFilePath: vi.fn((id: string) => `/mock-session-dir/${id}.json`),
}));

import { loadAdapter } from '../cli/adapter-loader';
import {
  normalizeEvent,
  resolveHookPlan,
  runPlan,
  mergeResults,
  loadSession,
  saveSession,
  deleteSession,
  adaptOutput,
  propagateEnv,
  materializeExecContext,
} from '@a5c-ai/agent-mux-hooks-core';

const mockLoadAdapter = vi.mocked(loadAdapter);
const mockNormalizeEvent = vi.mocked(normalizeEvent);
const mockResolveHookPlan = vi.mocked(resolveHookPlan);
const mockRunPlan = vi.mocked(runPlan);
const mockMergeResults = vi.mocked(mergeResults);
const mockLoadSession = vi.mocked(loadSession);
const mockSaveSession = vi.mocked(saveSession);
const mockDeleteSession = vi.mocked(deleteSession);
const mockAdaptOutput = vi.mocked(adaptOutput);
let homeDirBeforeTests: string | undefined;

// Helper: capture stdout
function captureStdout(): { getOutput: () => string; restore: () => void } {
  const original = process.stdout.write;
  let output = '';
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
    return true;
  }) as typeof process.stdout.write;

  return {
    getOutput: () => output,
    restore: () => { process.stdout.write = original; },
  };
}

// Helper: capture stderr
function captureStderr(): { getOutput: () => string; restore: () => void } {
  const original = console.error;
  let output = '';
  console.error = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
  };
  return {
    getOutput: () => output,
    restore: () => { console.error = original; },
  };
}

// Helper: capture console.log
function captureConsoleLog(): { getOutput: () => string; restore: () => void } {
  const original = console.log;
  let output = '';
  console.log = (...args: unknown[]) => {
    output += args.join(' ') + '\n';
  };
  return {
    getOutput: () => output,
    restore: () => { console.log = original; },
  };
}

function setupDefaultAdapterMock() {
  mockLoadAdapter.mockReturnValue({
    capabilities: {
      name: 'claude',
      family: 'shell-hook',
      sessionIdQuality: 'native',
      supportsOrderedFanout: true,
      supportsNativeAdditionalContext: true,
      supportsBlock: true,
      supportsAsk: true,
      supportsToolInputMutation: false,
      supportsToolResultMutation: false,
      supportsPersistedEnv: true,
      envPersistenceMode: 'native_env_file',
      toolInterceptionScope: 'all',
    },
    phaseMappings: [],
    module: {},
  });
}

describe('CLI Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultAdapterMock();
    process.exitCode = undefined;
    homeDirBeforeTests = process.env.HOME;
  });

  afterEach(() => {
    if (homeDirBeforeTests === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = homeDirBeforeTests;
    }
    delete process.env.A5C_LOGGING_HOOKS_LEVEL;
  });

  describe('invoke', () => {
    it('should call normalizeEvent and produce output', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();

      try {
        // Simulate the handler being called directly
        await (invokeCommand.handler as Function)({
          adapter: 'claude',
          'bootstrap-only': false,
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(mockNormalizeEvent).toHaveBeenCalledWith(
          expect.objectContaining({ adapter: 'claude' }),
        );
        expect(mockAdaptOutput).toHaveBeenCalled();

        const output = stdout.getOutput();
        const parsed = JSON.parse(output);
        expect(parsed).toEqual({
          decision: 'noop',
          metadata: {
            AGENT_ADAPTER: 'claude',
          },
        });
      } finally {
        stdout.restore();
      }
    });

    it('writes default info logs to ~/.a5c/logs/hooks/hooks-mux.log', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();
      const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-mux-home-'));
      process.env.HOME = tmpHome;

      try {
        await (invokeCommand.handler as Function)({
          adapter: 'claude',
          'bootstrap-only': false,
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const logPath = path.join(tmpHome, '.a5c', 'logs', 'hooks', 'hooks-mux.log');
        const contents = fs.readFileSync(logPath, 'utf8');
        expect(contents).toContain('"command":"invoke"');
        expect(contents).toContain('"msg":"invoke started"');
        expect(contents).toContain('"msg":"invoke completed"');
        expect(contents).not.toContain('"level":"debug"');
      } finally {
        stdout.restore();
        fs.rmSync(tmpHome, { recursive: true, force: true });
      }
    });

    it('writes debug logs when A5C_LOGGING_HOOKS_LEVEL=debug', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();
      const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-mux-home-debug-'));
      process.env.HOME = tmpHome;
      process.env.A5C_LOGGING_HOOKS_LEVEL = 'debug';

      try {
        await (invokeCommand.handler as Function)({
          adapter: 'claude',
          'bootstrap-only': false,
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const logPath = path.join(tmpHome, '.a5c', 'logs', 'hooks', 'hooks-mux.log');
        const contents = fs.readFileSync(logPath, 'utf8');
        expect(contents).toContain('"level":"debug"');
        expect(contents).toContain('"msg":"stdin parsed"');
        expect(contents).toContain('"msg":"plan executed"');
      } finally {
        stdout.restore();
        fs.rmSync(tmpHome, { recursive: true, force: true });
      }
    });

    it('should handle bootstrap-only mode', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();
      process.env.CLAUDE_ENV_FILE = '/tmp/claude-env-file';

      try {
        await (invokeCommand.handler as Function)({
          adapter: 'claude',
          'bootstrap-only': true,
          'session-id': 'test-sess',
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output);
        expect(parsed.status).toBe('bootstrapped');
        expect(parsed.sessionId).toBe('test-sess');
        expect(mockSaveSession).toHaveBeenCalled();
        expect(propagateEnv).toHaveBeenCalledWith(
          'native_env_file',
          { AGENT_SESSION_ID: 'test-sess' },
          { nativeEnvFilePath: '/tmp/claude-env-file' },
        );
      } finally {
        delete process.env.CLAUDE_ENV_FILE;
        stdout.restore();
      }
    });

    it('should resolve plan and run handlers when plan has entries', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();

      mockResolveHookPlan.mockReturnValue([{
        id: 'test-1',
        pluginId: 'test-plugin',
        phase: 'session.start',
        priority: 1000,
        handler: { source: 'test.js', handler: 'handler' },
      }]);

      try {
        await (invokeCommand.handler as Function)({
          adapter: 'claude',
          handler: ['test.js:handler'],
          'bootstrap-only': false,
          json: false,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(mockRunPlan).toHaveBeenCalled();
        expect(mockMergeResults).toHaveBeenCalled();
      } finally {
        stdout.restore();
      }
    });

    it('preserves Windows drive-letter handler paths without splitting on the drive separator', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();

      try {
        await (invokeCommand.handler as Function)({
          adapter: 'claude',
          handler: ['C:\\Users\\tmusk\\.claude\\plugins\\handler.js'],
          'bootstrap-only': false,
          json: false,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(mockResolveHookPlan).toHaveBeenCalledWith({
          phase: 'session.start',
          handlers: [
            {
              source: 'C:\\Users\\tmusk\\.claude\\plugins\\handler.js',
              handler: 'handler',
            },
          ],
        });
      } finally {
        stdout.restore();
      }
    });

    it('supports explicit export names on Windows handler paths', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();

      try {
        await (invokeCommand.handler as Function)(({
          adapter: 'claude',
          handler: ['\\\\?\\C:\\Users\\tmusk\\.claude\\plugins\\handler.js:runHook'],
          'bootstrap-only': false,
          json: false,
          _: [],
          $0: 'agent-mux-hooks',
        }));

        expect(mockResolveHookPlan).toHaveBeenCalledWith({
          phase: 'session.start',
          handlers: [
            {
              source: '\\\\?\\C:\\Users\\tmusk\\.claude\\plugins\\handler.js',
              handler: 'runHook',
            },
          ],
        });
      } finally {
        stdout.restore();
      }
    });

    it('forwards hook runtime config to explicit handlers and runPlan', async () => {
      const { invokeCommand } = await import('../cli/commands/invoke');
      const stdout = captureStdout();
      const planEntry = {
        id: 'explicit-0',
        pluginId: 'command:handler.js',
        phase: 'session.start',
        priority: 1000,
        handler: { source: 'handler.js', handler: 'runHook', shell: '/bin/bash' },
      };

      mockResolveHookPlan.mockReturnValue([planEntry]);

      try {
        await (invokeCommand.handler as Function)({
          adapter: 'claude',
          handler: ['handler.js:runHook'],
          shell: '/bin/bash',
          'disable-all-hooks': true,
          'handler-timeout-ms': 1234,
          'bootstrap-only': false,
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(mockResolveHookPlan).toHaveBeenCalledWith({
          phase: 'session.start',
          handlers: [
            {
              source: 'handler.js',
              handler: 'runHook',
              shell: '/bin/bash',
            },
          ],
        });
        expect(mockRunPlan).toHaveBeenCalledWith(
          expect.any(Object),
          [planEntry],
          expect.objectContaining({
            capabilities: expect.objectContaining({ name: 'claude' }),
            disableAllHooks: true,
            handlerTimeoutMs: 1234,
          }),
        );
      } finally {
        stdout.restore();
      }
    });
  });

  describe('bootstrap', () => {
    it('should create and persist a new session', async () => {
      const { bootstrapCommand } = await import('../cli/commands/bootstrap');
      const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      try {
        await (bootstrapCommand.handler as Function)({
          adapter: 'claude',
          'session-id': 'boot-123',
          json: false,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(mockSaveSession).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionId: 'boot-123',
            adapter: 'claude',
          }),
        );

        expect(stderrWrite).toHaveBeenCalledWith(expect.stringContaining('boot-123'));
      } finally {
        stderrWrite.mockRestore();
      }
    });

    it('should output JSON when --json flag is set', async () => {
      const { bootstrapCommand } = await import('../cli/commands/bootstrap');
      const stdout = captureStdout();

      try {
        await (bootstrapCommand.handler as Function)({
          adapter: 'claude',
          'session-id': 'boot-456',
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output);
        expect(parsed.status).toBe('bootstrapped');
        expect(parsed.sessionId).toBe('boot-456');
        expect(parsed.adapter).toBe('claude');
      } finally {
        stdout.restore();
      }
    });

    it('should propagate Claude bootstrap env when native env file is available', async () => {
      const { bootstrapCommand } = await import('../cli/commands/bootstrap');
      const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      process.env.CLAUDE_ENV_FILE = '/tmp/claude-bootstrap-env';

      try {
        await (bootstrapCommand.handler as Function)({
          adapter: 'claude',
          'session-id': 'boot-claude-env',
          json: false,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(mockSaveSession).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionId: 'boot-claude-env',
            persistedEnv: expect.objectContaining({
              AGENT_SESSION_ID: 'boot-claude-env',
            }),
          }),
        );
        expect(propagateEnv).toHaveBeenCalledWith(
          'native_env_file',
          { AGENT_SESSION_ID: 'boot-claude-env' },
          { nativeEnvFilePath: '/tmp/claude-bootstrap-env' },
        );
        expect(stderrWrite).toHaveBeenCalled();
      } finally {
        delete process.env.CLAUDE_ENV_FILE;
        stderrWrite.mockRestore();
      }
    });
  });

  describe('show-session', () => {
    it('should display session state when found', async () => {
      const { showSessionCommand } = await import('../cli/commands/show-session');
      const stdout = captureStdout();

      mockLoadSession.mockResolvedValue({
        version: 'a5c.hooks.session.v1',
        sessionId: 'sess-789',
        adapter: 'claude',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T01:00:00Z',
        cwd: '/home/user',
        persistedEnv: { FOO: 'bar' },
        contextVars: { x: 'y' },
        contextFragments: [],
        metadata: {},
      });

      try {
        await (showSessionCommand.handler as Function)({
          'session-id': 'sess-789',
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output);
        expect(parsed.sessionId).toBe('sess-789');
        expect(parsed.adapter).toBe('claude');
        expect(parsed.persistedEnv.FOO).toBe('bar');
      } finally {
        stdout.restore();
      }
    });

    it('should report error when session not found', async () => {
      const { showSessionCommand } = await import('../cli/commands/show-session');
      const stderr = captureStderr();

      mockLoadSession.mockResolvedValue(null);

      try {
        await (showSessionCommand.handler as Function)({
          'session-id': 'nonexistent',
          json: false,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(process.exitCode).toBe(1);
        expect(stderr.getOutput()).toContain('not found');
      } finally {
        stderr.restore();
        process.exitCode = undefined;
      }
    });

    it('should output JSON error when session not found with --json', async () => {
      const { showSessionCommand } = await import('../cli/commands/show-session');
      const stdout = captureStdout();

      mockLoadSession.mockResolvedValue(null);

      try {
        await (showSessionCommand.handler as Function)({
          'session-id': 'nonexistent',
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output);
        expect(parsed.error).toBe('Session not found');
        expect(process.exitCode).toBe(1);
      } finally {
        stdout.restore();
        process.exitCode = undefined;
      }
    });
  });

  describe('clear-session', () => {
    it('should delete the session and confirm', async () => {
      const { clearSessionCommand } = await import('../cli/commands/clear-session');
      const log = captureConsoleLog();

      try {
        await (clearSessionCommand.handler as Function)({
          'session-id': 'sess-to-delete',
          json: false,
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(mockDeleteSession).toHaveBeenCalledWith('sess-to-delete');
        expect(log.getOutput()).toContain('sess-to-delete');
      } finally {
        log.restore();
      }
    });

    it('should output JSON confirmation', async () => {
      const { clearSessionCommand } = await import('../cli/commands/clear-session');
      const stdout = captureStdout();

      try {
        await (clearSessionCommand.handler as Function)({
          'session-id': 'sess-del-2',
          json: true,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output);
        expect(parsed.status).toBe('deleted');
        expect(parsed.sessionId).toBe('sess-del-2');
      } finally {
        stdout.restore();
      }
    });
  });

  describe('doctor', () => {
    it('should report adapter capabilities when available', async () => {
      const { doctorCommand } = await import('../cli/commands/doctor');
      const stdout = captureStdout();

      try {
        await (doctorCommand.handler as Function)({
          adapter: 'claude',
          json: true,
          'session-dir': '/nonexistent-session-dir-for-test',
          'stale-threshold': 24,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output) as { adapters: Array<{ name: string; available: boolean }> };
        expect(parsed.adapters).toHaveLength(1);
        expect(parsed.adapters[0].name).toBe('claude');
        expect(parsed.adapters[0].available).toBe(true);
      } finally {
        stdout.restore();
      }
    });

    it('should report adapter as unavailable on load error', async () => {
      const { doctorCommand } = await import('../cli/commands/doctor');
      const stdout = captureStdout();

      mockLoadAdapter.mockImplementation(() => {
        throw new Error('Module not found');
      });

      try {
        await (doctorCommand.handler as Function)({
          adapter: 'nonexistent',
          json: true,
          'session-dir': '/nonexistent-session-dir-for-test',
          'stale-threshold': 24,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output) as { adapters: Array<{ name: string; available: boolean; error?: string }> };
        expect(parsed.adapters[0].available).toBe(false);
        expect(parsed.adapters[0].error).toContain('Module not found');
      } finally {
        stdout.restore();
      }
    });

    it('should warn about capability gaps', async () => {
      const { doctorCommand } = await import('../cli/commands/doctor');
      const stdout = captureStdout();

      mockLoadAdapter.mockReturnValue({
        capabilities: {
          name: 'limited',
          family: 'shell-hook',
          sessionIdQuality: 'synthetic',
          supportsOrderedFanout: false,
          supportsNativeAdditionalContext: false,
          supportsBlock: false,
          supportsAsk: false,
          supportsToolInputMutation: false,
          supportsToolResultMutation: false,
          supportsPersistedEnv: false,
          envPersistenceMode: 'none',
          toolInterceptionScope: 'none',
        },
        phaseMappings: [],
        module: {},
      });

      try {
        await (doctorCommand.handler as Function)({
          adapter: 'limited',
          json: true,
          'session-dir': '/nonexistent-session-dir-for-test',
          'stale-threshold': 24,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output) as { adapters: Array<{ warnings: string[] }> };
        expect(parsed.adapters[0].warnings.length).toBeGreaterThan(0);
        // Should warn about blocking, env persistence, session ID, tool scope, and no mappings
        expect(parsed.adapters[0].warnings.some((w: string) => w.includes('blocking'))).toBe(true);
        expect(parsed.adapters[0].warnings.some((w: string) => w.includes('persistence'))).toBe(true);
      } finally {
        stdout.restore();
      }
    });

    it('should include session health in report', async () => {
      const { doctorCommand } = await import('../cli/commands/doctor');
      const stdout = captureStdout();

      try {
        await (doctorCommand.handler as Function)({
          adapter: 'claude',
          json: true,
          'session-dir': '/nonexistent-session-dir-for-test',
          'stale-threshold': 24,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output) as { sessionHealth: { dirExists: boolean; sessionDir: string } };
        expect(parsed.sessionHealth).toBeDefined();
        expect(parsed.sessionHealth.dirExists).toBe(false);
        expect(parsed.sessionHealth.sessionDir).toBe('/nonexistent-session-dir-for-test');
      } finally {
        stdout.restore();
      }
    });

    it('should detect stale sessions', async () => {
      const { doctorCommand } = await import('../cli/commands/doctor');
      const stdout = captureStdout();

      // Create a temp session dir with a stale session
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hooks-doctor-'));

      const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
      const sessionData = {
        schemaVersion: 'a5c.hooks.session.v1',
        session: {
          version: 'a5c.hooks.session.v1',
          sessionId: 'stale-sess',
          adapter: 'claude',
          createdAt: staleDate,
          updatedAt: staleDate,
          persistedEnv: {},
          contextVars: {},
          contextFragments: [],
          metadata: {},
        },
      };
      await fs.promises.writeFile(
        path.join(tmpDir, 'stale-sess.json'),
        JSON.stringify(sessionData),
        'utf-8',
      );

      try {
        await (doctorCommand.handler as Function)({
          adapter: 'claude',
          json: true,
          'session-dir': tmpDir,
          'stale-threshold': 24,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output) as {
          sessionHealth: { staleSessions: Array<{ sessionId: string; ageHours: number }> };
        };
        expect(parsed.sessionHealth.staleSessions).toHaveLength(1);
        expect(parsed.sessionHealth.staleSessions[0].sessionId).toBe('stale-sess');
        expect(parsed.sessionHealth.staleSessions[0].ageHours).toBeGreaterThan(24);
      } finally {
        stdout.restore();
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should detect corrupt sessions', async () => {
      const { doctorCommand } = await import('../cli/commands/doctor');
      const stdout = captureStdout();

      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hooks-doctor-corrupt-'));

      await fs.promises.writeFile(
        path.join(tmpDir, 'bad-session.json'),
        'not valid json {{{',
        'utf-8',
      );

      try {
        await (doctorCommand.handler as Function)({
          adapter: 'claude',
          json: true,
          'session-dir': tmpDir,
          'stale-threshold': 24,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output) as {
          sessionHealth: { corruptSessions: string[] };
        };
        expect(parsed.sessionHealth.corruptSessions).toContain('bad-session.json');
      } finally {
        stdout.restore();
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should include capability profile for available adapters', async () => {
      const { doctorCommand } = await import('../cli/commands/doctor');
      const stdout = captureStdout();

      mockLoadAdapter.mockReturnValue({
        capabilities: {
          name: 'claude',
          family: 'shell-hook',
          sessionIdQuality: 'native',
          supportsOrderedFanout: true,
          supportsNativeAdditionalContext: true,
          supportsBlock: true,
          supportsAsk: true,
          supportsToolInputMutation: false,
          supportsToolResultMutation: false,
          supportsPersistedEnv: true,
          envPersistenceMode: 'native_env_file',
          toolInterceptionScope: 'all',
        },
        phaseMappings: [
          {
            canonicalPhase: 'session.start',
            nativeHook: 'SessionStart',
            supportLevel: 'native',
            blockCapability: false,
            mutationCapability: false,
            scope: 'session',
          },
          {
            canonicalPhase: 'tool.before',
            nativeHook: 'PreToolUse',
            supportLevel: 'native',
            blockCapability: true,
            mutationCapability: false,
            scope: 'tool',
          },
        ],
        module: {},
      });

      try {
        await (doctorCommand.handler as Function)({
          adapter: 'claude',
          json: true,
          'session-dir': '/nonexistent-session-dir-for-test',
          'stale-threshold': 24,
          _: [],
          $0: 'agent-mux-hooks',
        });

        const output = stdout.getOutput();
        const parsed = JSON.parse(output) as {
          adapters: Array<{
            capabilityProfile: {
              supportedPhases: string[];
              unsupportedPhases: string[];
              blockablePhases: string[];
            };
            phaseMappings: Array<{ canonicalPhase: string; nativeHook: string }>;
          }>;
        };
        const profile = parsed.adapters[0].capabilityProfile;
        expect(profile.supportedPhases).toContain('session.start');
        expect(profile.supportedPhases).toContain('tool.before');
        expect(profile.blockablePhases).toContain('tool.before');
        expect(profile.unsupportedPhases.length).toBeGreaterThan(0);
        expect(parsed.adapters[0].phaseMappings).toHaveLength(2);
      } finally {
        stdout.restore();
      }
    });
  });

  describe('exec', () => {
    it('should report error when no command is specified', async () => {
      const { execCommand } = await import('../cli/commands/exec');
      const stderr = captureStderr();

      try {
        await (execCommand.handler as Function)({
          'session-id': 'test-sess',
          '--': [],
          _: [],
          $0: 'agent-mux-hooks',
        });

        expect(process.exitCode).toBe(1);
        expect(stderr.getOutput()).toContain('No command specified');
      } finally {
        stderr.restore();
        process.exitCode = undefined;
      }
    });
  });

  describe('adapter-loader', () => {
    it('KNOWN_ADAPTERS should contain expected adapters', async () => {
      // Use the unmocked version for this
      const { KNOWN_ADAPTERS } = vi.mocked(await import('../cli/adapter-loader'));
      expect(KNOWN_ADAPTERS).toContain('claude');
      expect(KNOWN_ADAPTERS).toContain('codex');
      expect(KNOWN_ADAPTERS).toContain('copilot');
    });
  });

  describe('main', () => {
    it('should export the main function', async () => {
      const { main } = await import('../cli/main');
      expect(typeof main).toBe('function');
    });
  });
});
