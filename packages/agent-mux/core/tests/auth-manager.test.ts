import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AuthManagerImpl,
  AdapterRegistryImpl,
  AgentMuxError,
} from '../src/index.js';
import type { AgentAdapter } from '../src/index.js';

/**
 * Creates a minimal mock adapter with configurable auth behavior.
 */
function mockAdapter(
  agent: string,
  authState: { status: string; method?: string; identity?: string; expiresAt?: string } = {
    status: 'unknown',
  },
): AgentAdapter {
  return {
    agent,
    displayName: agent,
    cliCommand: agent,
    capabilities: {
      agent,
      displayName: agent,
      streaming: true,
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
      sessionPersistence: false,
      canResume: false,
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
    buildSpawnArgs: () => ({
      command: agent,
      args: [],
      env: {},
      cwd: '.',
      usePty: false,
    }),
    parseEvent: () => null,
    detectAuth: async () => ({
      status: authState.status as 'authenticated' | 'unauthenticated' | 'expired' | 'unknown',
      method: authState.method,
      identity: authState.identity,
      expiresAt: authState.expiresAt,
    }),
    getAuthGuidance: () => ({
      steps: ['Run the login command'],
      envVars: ['API_KEY'],
      links: ['https://docs.example.com/auth'],
    }),
    sessionDir: () => '/tmp/sessions',
    parseSessionFile: async () => ({
      sessionId: 'x',
      agent,
      turnCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    listSessionFiles: async () => [],
    readConfig: async () => ({}),
    writeConfig: async () => {},
  } as unknown as AgentAdapter;
}

describe('AuthManagerImpl', () => {
  let registry: AdapterRegistryImpl;
  let manager: AuthManagerImpl;

  beforeEach(() => {
    registry = new AdapterRegistryImpl();
    manager = new AuthManagerImpl(registry);
  });

  // ── check() ─────────────────────────────────────────────────────────

  describe('check()', () => {
    it('throws AGENT_NOT_FOUND for unknown agent', async () => {
      await expect(manager.check('nonexistent')).rejects.toThrow(AgentMuxError);
      await expect(manager.check('nonexistent')).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
      });
    });

    it('returns auth state from adapter with status unknown', async () => {
      registry.register(mockAdapter('claude'));
      const state = await manager.check('claude');
      expect(state.agent).toBe('claude');
      expect(state.status).toBe('unknown');
      expect(state.checkedAt).toBeInstanceOf(Date);
    });

    it('returns authenticated state with identity', async () => {
      registry.register(
        mockAdapter('claude', {
          status: 'authenticated',
          method: 'api_key',
          identity: 'sk-ant-...abc',
        }),
      );

      const state = await manager.check('claude');
      expect(state.status).toBe('authenticated');
      expect(state.method).toBe('api_key');
      expect(state.identity).toBe('sk-ant-...abc');
    });

    it('returns expired state with expiresAt', async () => {
      const expiry = '2025-01-01T00:00:00Z';
      registry.register(
        mockAdapter('claude', {
          status: 'expired',
          expiresAt: expiry,
        }),
      );

      const state = await manager.check('claude');
      expect(state.status).toBe('expired');
      expect(state.expiresAt).toBeInstanceOf(Date);
      expect(state.expiresAt!.getTime()).toBe(new Date(expiry).getTime());
    });

    it('returns unauthenticated status', async () => {
      registry.register(
        mockAdapter('claude', { status: 'unauthenticated' }),
      );

      const state = await manager.check('claude');
      expect(state.status).toBe('unauthenticated');
      expect(state.method).toBeUndefined();
      expect(state.identity).toBeUndefined();
    });

    it('checkedAt is close to current time', async () => {
      registry.register(mockAdapter('claude'));
      const before = Date.now();
      const state = await manager.check('claude');
      const after = Date.now();
      expect(state.checkedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(state.checkedAt.getTime()).toBeLessThanOrEqual(after);
    });
  });

  // ── checkAll() ──────────────────────────────────────────────────────

  describe('checkAll()', () => {
    it('returns empty record when no agents registered', async () => {
      const result = await manager.checkAll();
      expect(result).toEqual({});
    });

    it('returns auth state for all registered agents', async () => {
      registry.register(
        mockAdapter('claude', { status: 'authenticated', method: 'api_key' }),
      );
      registry.register(
        mockAdapter('codex', { status: 'unauthenticated' }),
      );

      const result = await manager.checkAll();
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['claude']!.status).toBe('authenticated');
      expect(result['codex']!.status).toBe('unauthenticated');
    });

    it('returns unknown status when adapter detection fails', async () => {
      const failAdapter = mockAdapter('claude');
      (failAdapter as any).detectAuth = async () => {
        throw new Error('Detection failed');
      };
      registry.register(failAdapter);

      const result = await manager.checkAll();
      expect(result['claude']!.status).toBe('unknown');
      expect(result['claude']!.details).toBe('Auth detection failed');
    });

    it('runs checks in parallel', async () => {
      const delays: number[] = [];
      const start = Date.now();

      const slowAdapter1 = mockAdapter('claude');
      (slowAdapter1 as any).detectAuth = async () => {
        await new Promise((r) => setTimeout(r, 50));
        delays.push(Date.now() - start);
        return { status: 'authenticated' as const };
      };

      const slowAdapter2 = mockAdapter('codex');
      (slowAdapter2 as any).detectAuth = async () => {
        await new Promise((r) => setTimeout(r, 50));
        delays.push(Date.now() - start);
        return { status: 'authenticated' as const };
      };

      registry.register(slowAdapter1);
      registry.register(slowAdapter2);

      await manager.checkAll();
      // Both should complete at roughly the same time (parallel)
      expect(delays).toHaveLength(2);
      // The second delay should be close to the first, not 2x
      expect(Math.abs(delays[0]! - delays[1]!)).toBeLessThan(40);
    });
  });

  // ── getSetupGuidance() ──────────────────────────────────────────────

  describe('getSetupGuidance()', () => {
    it('throws AGENT_NOT_FOUND for unknown agent', () => {
      expect(() => manager.getSetupGuidance('nonexistent')).toThrow(AgentMuxError);
      expect(() => manager.getSetupGuidance('nonexistent')).toThrow(/Unknown agent/);
    });

    it('returns guidance from adapter', () => {
      registry.register(mockAdapter('claude'));
      const guidance = manager.getSetupGuidance('claude');
      expect(guidance).toBeDefined();
      expect(guidance.steps).toBeDefined();
      expect(Array.isArray(guidance.steps)).toBe(true);
    });

    it('is synchronous (no promise)', () => {
      registry.register(mockAdapter('claude'));
      const result = manager.getSetupGuidance('claude');
      // Should not be a promise
      expect(result).not.toBeInstanceOf(Promise);
    });
  });
});
