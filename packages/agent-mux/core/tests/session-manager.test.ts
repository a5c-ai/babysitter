import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  SessionManagerImpl,
  AdapterRegistryImpl,
  AgentMuxError,
} from '../src/index.js';
import type { AgentAdapter } from '../src/index.js';

/**
 * Creates a minimal mock adapter with configurable session data.
 */
function mockAdapter(
  agent: string,
  sessions: Array<{
    sessionId: string;
    turnCount: number;
    createdAt: string;
    updatedAt: string;
  }> = [],
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
    detectAuth: async () => ({ status: 'unknown' as const }),
    getAuthGuidance: () => ({ steps: [], envVars: [], links: [] }),
    sessionDir: () => '/tmp/sessions',
    parseSessionFile: async (filePath: string) => {
      const session = sessions.find((s) => filePath.includes(s.sessionId));
      if (!session) {
        throw new Error(`Session file not found: ${filePath}`);
      }
      return {
        sessionId: session.sessionId,
        agent,
        turnCount: session.turnCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    },
    listSessionFiles: async () => {
      return sessions.map((s) => `/tmp/sessions/${s.sessionId}.json`);
    },
    readConfig: async () => ({}),
    writeConfig: async () => {},
  } as unknown as AgentAdapter;
}

describe('SessionManagerImpl', () => {
  let registry: AdapterRegistryImpl;
  let manager: SessionManagerImpl;

  beforeEach(() => {
    registry = new AdapterRegistryImpl();
    manager = new SessionManagerImpl(registry);
  });

  // ── resolveUnifiedId ────────────────────────────────────────────────

  describe('resolveUnifiedId()', () => {
    it('returns agent:nativeId format', () => {
      expect(manager.resolveUnifiedId('claude', 'abc123')).toBe('claude:abc123');
    });

    it('handles arbitrary agent names', () => {
      expect(manager.resolveUnifiedId('my-custom-agent', 'sess-42')).toBe(
        'my-custom-agent:sess-42',
      );
    });
  });

  // ── resolveNativeId ─────────────────────────────────────────────────

  describe('resolveNativeId()', () => {
    it('parses a valid unified ID when agent is registered', () => {
      registry.register(mockAdapter('claude'));
      const result = manager.resolveNativeId('claude:abc123');
      expect(result).toEqual({ agent: 'claude', nativeSessionId: 'abc123' });
    });

    it('returns null for string without colon', () => {
      expect(manager.resolveNativeId('nocolon')).toBeNull();
    });

    it('returns null for empty agent part', () => {
      expect(manager.resolveNativeId(':abc123')).toBeNull();
    });

    it('returns null for empty nativeSessionId part', () => {
      expect(manager.resolveNativeId('claude:')).toBeNull();
    });

    it('returns null for unregistered agent', () => {
      const result = manager.resolveNativeId('unknown-agent:abc');
      expect(result).toBeNull();
    });

    it('handles session IDs containing colons', () => {
      registry.register(mockAdapter('claude'));
      const result = manager.resolveNativeId('claude:abc:def:ghi');
      expect(result).toEqual({
        agent: 'claude',
        nativeSessionId: 'abc:def:ghi',
      });
    });
  });

  // ── list() ──────────────────────────────────────────────────────────

  describe('list()', () => {
    it('throws AGENT_NOT_FOUND for unknown agent', async () => {
      await expect(manager.list('nonexistent')).rejects.toThrow(AgentMuxError);
      await expect(manager.list('nonexistent')).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
      });
    });

    it('returns empty array when adapter has no sessions', async () => {
      registry.register(mockAdapter('claude', []));
      const result = await manager.list('claude');
      expect(result).toEqual([]);
    });

    it('returns session summaries from adapter', async () => {
      registry.register(
        mockAdapter('claude', [
          {
            sessionId: 'sess-1',
            turnCount: 5,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T01:00:00Z',
          },
          {
            sessionId: 'sess-2',
            turnCount: 3,
            createdAt: '2025-01-02T00:00:00Z',
            updatedAt: '2025-01-02T01:00:00Z',
          },
        ]),
      );

      const result = await manager.list('claude');
      expect(result).toHaveLength(2);
      expect(result[0]!.sessionId).toBe('sess-2'); // Default desc sort by date
      expect(result[1]!.sessionId).toBe('sess-1');
    });

    it('respects limit option', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 's1', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
          { sessionId: 's2', turnCount: 1, createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T01:00:00Z' },
          { sessionId: 's3', turnCount: 1, createdAt: '2025-01-03T00:00:00Z', updatedAt: '2025-01-03T01:00:00Z' },
        ]),
      );

      const result = await manager.list('claude', { limit: 2 });
      expect(result).toHaveLength(2);
    });

    it('avoids parsing the full session tree for recent date-sorted lists', async () => {
      const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'amux-sessions-'));
      const sessions = Array.from({ length: 20 }, (_, i) => ({
        sessionId: `s${i + 1}`,
        turnCount: i + 1,
        createdAt: `2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        updatedAt: `2025-01-${String(i + 1).padStart(2, '0')}T01:00:00Z`,
      }));
      const sessionFiles: string[] = [];
      for (const session of sessions) {
        const filePath = path.join(tmpDir, `${session.sessionId}.json`);
        await fsp.writeFile(filePath, '{}');
        sessionFiles.push(filePath);
        await new Promise((resolve) => setTimeout(resolve, 2));
      }

      let parseCalls = 0;
      registry.register({
        ...mockAdapter('claude', sessions),
        listSessionFiles: async () => sessionFiles,
        parseSessionFile: async (filePath: string) => {
          parseCalls += 1;
          const session = sessions.find((s) => filePath.includes(s.sessionId));
          if (!session) throw new Error(`Session file not found: ${filePath}`);
          return {
            sessionId: session.sessionId,
            agent: 'claude',
            turnCount: session.turnCount,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          };
        },
      } as unknown as AgentAdapter);

      const result = await manager.list('claude', { limit: 5 });
      expect(result).toHaveLength(5);
      expect(parseCalls).toBeLessThan(sessions.length);
    });

    it('sorts ascending when sortDirection is asc', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 's-old', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
          { sessionId: 's-new', turnCount: 1, createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T01:00:00Z' },
        ]),
      );

      const result = await manager.list('claude', { sortDirection: 'asc' });
      expect(result[0]!.sessionId).toBe('s-old');
      expect(result[1]!.sessionId).toBe('s-new');
    });

    it('filters by since date', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'old', turnCount: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T01:00:00Z' },
          { sessionId: 'new', turnCount: 1, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T01:00:00Z' },
        ]),
      );

      const result = await manager.list('claude', { since: new Date('2025-01-01') });
      expect(result).toHaveLength(1);
      expect(result[0]!.sessionId).toBe('new');
    });

    it('sorts by turns', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 's-few', turnCount: 2, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
          { sessionId: 's-many', turnCount: 10, createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T01:00:00Z' },
        ]),
      );

      const result = await manager.list('claude', { sort: 'turns', sortDirection: 'desc' });
      expect(result[0]!.sessionId).toBe('s-many');
    });

    it('populates unifiedId on summaries', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'abc', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
        ]),
      );

      const result = await manager.list('claude');
      expect(result[0]!.unifiedId).toBe('claude:abc');
    });
  });

  // ── get() ───────────────────────────────────────────────────────────

  describe('get()', () => {
    it('throws AGENT_NOT_FOUND for unknown agent', async () => {
      await expect(manager.get('nonexistent', 'x')).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
      });
    });

    it('throws SESSION_NOT_FOUND when no matching session', async () => {
      registry.register(mockAdapter('claude', []));
      await expect(manager.get('claude', 'doesnt-exist')).rejects.toMatchObject({
        code: 'SESSION_NOT_FOUND',
      });
    });

    it('returns full session with matching ID', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'target', turnCount: 7, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
        ]),
      );

      const session = await manager.get('claude', 'target');
      expect(session.sessionId).toBe('target');
      expect(session.agent).toBe('claude');
      expect(session.turnCount).toBe(7);
      expect(session.unifiedId).toBe('claude:target');
      expect(session.messages).toEqual([]);
    });
  });

  // ── search() ────────────────────────────────────────────────────────

  describe('search()', () => {
    it('returns empty array when no agents are registered', async () => {
      const result = await manager.search({ text: 'hello' });
      expect(result).toEqual([]);
    });

    it('searches across registered agents by session ID match', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'refactor-auth', turnCount: 3, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
          { sessionId: 'fix-bug', turnCount: 1, createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T01:00:00Z' },
        ]),
      );

      const result = await manager.search({ text: 'refactor' });
      expect(result).toHaveLength(1);
      expect(result[0]!.sessionId).toBe('refactor-auth');
    });

    it('respects limit', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'match-1', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
          { sessionId: 'match-2', turnCount: 1, createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T01:00:00Z' },
        ]),
      );

      const result = await manager.search({ text: 'match', limit: 1 });
      expect(result).toHaveLength(1);
    });
  });

  // ── totalCost() ─────────────────────────────────────────────────────

  describe('totalCost()', () => {
    it('returns zero summary when no sessions', async () => {
      registry.register(mockAdapter('claude', []));
      const cost = await manager.totalCost({ agent: 'claude' });
      expect(cost.totalUsd).toBe(0);
      expect(cost.sessionCount).toBe(0);
    });

    it('counts sessions even without cost data', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 's1', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
        ]),
      );
      const cost = await manager.totalCost({ agent: 'claude' });
      expect(cost.sessionCount).toBe(1);
      expect(cost.totalUsd).toBe(0);
    });
  });

  // ── export() ────────────────────────────────────────────────────────

  describe('export()', () => {
    it('exports as JSON', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'exp', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
        ]),
      );

      const json = await manager.export('claude', 'exp', 'json');
      const parsed = JSON.parse(json);
      expect(parsed.sessionId).toBe('exp');
    });

    it('exports as JSONL (empty messages gives empty string)', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'exp', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
        ]),
      );

      const jsonl = await manager.export('claude', 'exp', 'jsonl');
      expect(jsonl).toBe('');
    });

    it('exports as markdown', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'exp', turnCount: 1, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
        ]),
      );

      const md = await manager.export('claude', 'exp', 'markdown');
      expect(md).toContain('# Session: exp');
      expect(md).toContain('**Agent:** claude');
    });

    it('throws SESSION_NOT_FOUND for missing session', async () => {
      registry.register(mockAdapter('claude', []));
      await expect(manager.export('claude', 'none', 'json')).rejects.toMatchObject({
        code: 'SESSION_NOT_FOUND',
      });
    });
  });

  // ── diff() ──────────────────────────────────────────────────────────

  describe('diff()', () => {
    it('returns empty operations for two empty sessions', async () => {
      registry.register(
        mockAdapter('claude', [
          { sessionId: 'a', turnCount: 0, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T01:00:00Z' },
          { sessionId: 'b', turnCount: 0, createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T01:00:00Z' },
        ]),
      );

      const d = await manager.diff(
        { agent: 'claude', sessionId: 'a' },
        { agent: 'claude', sessionId: 'b' },
      );
      expect(d.operations).toEqual([]);
      expect(d.summary.added).toBe(0);
      expect(d.summary.removed).toBe(0);
      expect(d.a.unifiedId).toBe('claude:a');
      expect(d.b.unifiedId).toBe('claude:b');
    });
  });

  // ── public surface ──────────────────────────────────────────────────

  describe('public surface', () => {
    it('does not expose watch()', () => {
      expect('watch' in manager).toBe(false);
      expect((manager as Record<string, unknown>).watch).toBeUndefined();
    });
  });
});
