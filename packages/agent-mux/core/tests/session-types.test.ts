import { describe, it, expect } from 'vitest';
import type {
  SessionToolCall,
  SessionMessage,
  SessionSummary,
  FullSession,
  Session,
  SessionListOptions,
  SessionQuery,
  CostAggregationOptions,
  CostSummary,
  CostBreakdown,
  SessionDiff,
  DiffOperation,
} from '../src/session-types.js';

/**
 * Type shape tests for session-types.ts.
 *
 * These tests verify that the type definitions accept valid data
 * and that the interfaces have the expected structure at runtime.
 */
describe('Session Types', () => {
  // -- SessionToolCall --------------------------------------------------------

  describe('SessionToolCall', () => {
    it('accepts a minimal tool call', () => {
      const tc: SessionToolCall = {
        toolCallId: 'tc-1',
        toolName: 'read_file',
        input: { path: '/tmp/foo.txt' },
      };
      expect(tc.toolCallId).toBe('tc-1');
      expect(tc.toolName).toBe('read_file');
      expect(tc.input).toEqual({ path: '/tmp/foo.txt' });
    });

    it('accepts optional output and durationMs', () => {
      const tc: SessionToolCall = {
        toolCallId: 'tc-2',
        toolName: 'shell',
        input: { command: 'ls' },
        output: 'file1\nfile2',
        durationMs: 42,
      };
      expect(tc.output).toBe('file1\nfile2');
      expect(tc.durationMs).toBe(42);
    });
  });

  // -- SessionMessage ---------------------------------------------------------

  describe('SessionMessage', () => {
    it('accepts a minimal user message', () => {
      const msg: SessionMessage = {
        role: 'user',
        content: 'Hello',
      };
      expect(msg.role).toBe('user');
      expect(msg.content).toBe('Hello');
    });

    it('accepts all optional fields', () => {
      const msg: SessionMessage = {
        role: 'assistant',
        content: 'Here is the answer',
        timestamp: new Date('2025-06-01T00:00:00Z'),
        toolCalls: [{ toolCallId: 'tc-1', toolName: 'shell', input: {} }],
        tokenUsage: { inputTokens: 100, outputTokens: 50, thinkingTokens: 10, cachedTokens: 20 },
        cost: { totalUsd: 0.01, inputTokens: 100, outputTokens: 50 },
        thinking: 'Let me think about this...',
        model: 'claude-sonnet-4-20250514',
      };
      expect(msg.role).toBe('assistant');
      expect(msg.toolCalls).toHaveLength(1);
      expect(msg.tokenUsage?.thinkingTokens).toBe(10);
      expect(msg.thinking).toBeDefined();
    });

    it('accepts tool role with toolResult', () => {
      const msg: SessionMessage = {
        role: 'tool',
        content: '',
        toolResult: {
          toolCallId: 'tc-1',
          toolName: 'read_file',
          output: 'file contents here',
        },
      };
      expect(msg.toolResult?.toolCallId).toBe('tc-1');
    });

    it('supports all four roles', () => {
      const roles: SessionMessage['role'][] = ['user', 'assistant', 'system', 'tool'];
      for (const role of roles) {
        const msg: SessionMessage = { role, content: '' };
        expect(msg.role).toBe(role);
      }
    });
  });

  // -- SessionSummary ---------------------------------------------------------

  describe('SessionSummary', () => {
    it('has all required fields', () => {
      const summary: SessionSummary = {
        agent: 'claude',
        sessionId: 'sess-abc',
        unifiedId: 'claude:sess-abc',
        title: 'Test Session',
        createdAt: new Date(),
        updatedAt: new Date(),
        turnCount: 5,
        messageCount: 12,
        tags: ['test'],
      };
      expect(summary.agent).toBe('claude');
      expect(summary.unifiedId).toBe('claude:sess-abc');
      expect(summary.tags).toEqual(['test']);
    });

    it('accepts optional fields', () => {
      const summary: SessionSummary = {
        agent: 'codex',
        sessionId: 'sess-xyz',
        unifiedId: 'codex:sess-xyz',
        title: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        turnCount: 0,
        messageCount: 0,
        tags: [],
        model: 'gpt-4',
        cost: { totalUsd: 0.50, inputTokens: 1000, outputTokens: 500 },
        cwd: '/home/user/project',
        forkedFrom: 'sess-parent',
        relevanceScore: 0.85,
      };
      expect(summary.model).toBe('gpt-4');
      expect(summary.relevanceScore).toBe(0.85);
    });
  });

  // -- SessionListOptions -----------------------------------------------------

  describe('SessionListOptions', () => {
    it('accepts all filter/sort options', () => {
      const opts: SessionListOptions = {
        since: new Date('2025-01-01'),
        until: new Date('2025-12-31'),
        model: 'claude-sonnet-4-20250514',
        tags: ['prod'],
        limit: 50,
        sort: 'cost',
        sortDirection: 'asc',
        cwd: '/home/user',
      };
      expect(opts.limit).toBe(50);
      expect(opts.sort).toBe('cost');
    });
  });

  // -- SessionQuery -----------------------------------------------------------

  describe('SessionQuery', () => {
    it('requires text, all else optional', () => {
      const q: SessionQuery = { text: 'refactor' };
      expect(q.text).toBe('refactor');
      expect(q.limit).toBeUndefined();
    });

    it('accepts all optional fields', () => {
      const q: SessionQuery = {
        text: 'search term',
        agent: 'claude',
        since: new Date(),
        until: new Date(),
        model: 'opus',
        tags: ['important'],
        limit: 25,
        sort: 'relevance',
      };
      expect(q.sort).toBe('relevance');
    });
  });

  // -- CostSummary & CostBreakdown -------------------------------------------

  describe('CostSummary', () => {
    it('has all numeric fields', () => {
      const cs: CostSummary = {
        totalUsd: 12.50,
        inputTokens: 50000,
        outputTokens: 25000,
        thinkingTokens: 5000,
        cachedTokens: 10000,
        sessionCount: 10,
        runCount: 15,
      };
      expect(cs.totalUsd).toBe(12.50);
      expect(cs.sessionCount).toBe(10);
    });

    it('accepts optional breakdowns', () => {
      const bd: CostBreakdown = {
        key: 'claude',
        totalUsd: 5.0,
        inputTokens: 20000,
        outputTokens: 10000,
        thinkingTokens: 2000,
        cachedTokens: 5000,
        sessionCount: 3,
      };
      const cs: CostSummary = {
        totalUsd: 5.0,
        inputTokens: 20000,
        outputTokens: 10000,
        thinkingTokens: 2000,
        cachedTokens: 5000,
        sessionCount: 3,
        runCount: 3,
        breakdowns: { claude: bd },
      };
      expect(cs.breakdowns?.['claude']?.key).toBe('claude');
    });
  });

  // -- SessionDiff & DiffOperation --------------------------------------------

  describe('SessionDiff', () => {
    it('has a and b refs, operations, and summary', () => {
      const diff: SessionDiff = {
        a: { agent: 'claude', sessionId: 's1', unifiedId: 'claude:s1' },
        b: { agent: 'claude', sessionId: 's2', unifiedId: 'claude:s2' },
        operations: [],
        summary: { added: 0, removed: 0, modified: 0, unchanged: 0 },
      };
      expect(diff.a.unifiedId).toBe('claude:s1');
      expect(diff.operations).toEqual([]);
    });
  });

  describe('DiffOperation', () => {
    it('accepts all operation types', () => {
      const ops: DiffOperation[] = [
        { type: 'added', indexB: 0, messageB: { role: 'user', content: 'hi' } },
        { type: 'removed', indexA: 0, messageA: { role: 'user', content: 'old' } },
        { type: 'modified', indexA: 0, indexB: 0, messageA: { role: 'user', content: 'a' }, messageB: { role: 'user', content: 'b' } },
        { type: 'unchanged', indexA: 1, indexB: 1, messageA: { role: 'assistant', content: 'x' }, messageB: { role: 'assistant', content: 'x' } },
      ];
      expect(ops).toHaveLength(4);
      expect(ops[0]!.type).toBe('added');
      expect(ops[1]!.type).toBe('removed');
    });
  });
});
