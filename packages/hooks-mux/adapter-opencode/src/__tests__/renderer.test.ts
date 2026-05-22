import { describe, it, expect } from 'vitest';
import type { UnifiedHookResult } from '@a5c-ai/hooks-mux-core';
import { renderOpenCodeOutput } from '../renderer';

describe('renderOpenCodeOutput', () => {
  describe('session.created', () => {
    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Babysitter session initialized',
      };
      const output = renderOpenCodeOutput(result, 'session.created');
      expect(output.additionalContext).toBe('Babysitter session initialized');
    });

    it('renders persistEnv', () => {
      const result: UnifiedHookResult = {
        persistEnv: { AGENT_RUN_ID: 'run-123' },
      };
      const output = renderOpenCodeOutput(result, 'session.created');
      expect(output.persistEnv).toEqual({ AGENT_RUN_ID: 'run-123' });
    });

    it('renders empty object for noop result', () => {
      const result: UnifiedHookResult = { decision: 'noop' };
      const output = renderOpenCodeOutput(result, 'session.created');
      expect(output).toEqual({});
    });
  });

  describe('tool.execute.before', () => {
    it('renders deny decision', () => {
      const result: UnifiedHookResult = {
        decision: 'deny',
        reason: 'Dangerous command',
      };
      const output = renderOpenCodeOutput(result, 'tool.execute.before');
      expect(output.decision).toBe('deny');
      expect(output.reason).toBe('Dangerous command');
    });

    it('renders allow decision', () => {
      const result: UnifiedHookResult = { decision: 'allow' };
      const output = renderOpenCodeOutput(result, 'tool.execute.before');
      expect(output.decision).toBe('allow');
    });

    it('renders tool input mutation', () => {
      const result: UnifiedHookResult = {
        toolMutation: {
          mode: 'replace',
          value: { path: 'safe/path.ts', content: 'sanitized' },
        },
      };
      const output = renderOpenCodeOutput(result, 'tool.execute.before');
      expect(output.toolInput).toEqual({ path: 'safe/path.ts', content: 'sanitized' });
    });

    it('does not set decision for noop', () => {
      const result: UnifiedHookResult = { decision: 'noop' };
      const output = renderOpenCodeOutput(result, 'tool.execute.before');
      expect(output.decision).toBeUndefined();
    });

    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Tool pre-check passed',
      };
      const output = renderOpenCodeOutput(result, 'tool.execute.before');
      expect(output.additionalContext).toBe('Tool pre-check passed');
    });

    it('renders persistEnv', () => {
      const result: UnifiedHookResult = {
        persistEnv: { LAST_TOOL: 'write_file' },
      };
      const output = renderOpenCodeOutput(result, 'tool.execute.before');
      expect(output.persistEnv).toEqual({ LAST_TOOL: 'write_file' });
    });
  });

  describe('tool.execute.after', () => {
    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Tool completed successfully',
      };
      const output = renderOpenCodeOutput(result, 'tool.execute.after');
      expect(output.additionalContext).toBe('Tool completed successfully');
    });

    it('renders persistEnv', () => {
      const result: UnifiedHookResult = {
        persistEnv: { TOOL_COUNT: '5' },
      };
      const output = renderOpenCodeOutput(result, 'tool.execute.after');
      expect(output.persistEnv).toEqual({ TOOL_COUNT: '5' });
    });

    it('renders empty object for empty result', () => {
      const output = renderOpenCodeOutput({}, 'tool.execute.after');
      expect(output).toEqual({});
    });
  });

  describe('shell.env', () => {
    it('renders env from persistEnv', () => {
      const result: UnifiedHookResult = {
        persistEnv: {
          AGENT_SESSION_ID: 'session-abc',
          CUSTOM_VAR: 'hello',
        },
      };
      const output = renderOpenCodeOutput(result, 'shell.env');
      expect(output.env).toEqual({
        AGENT_SESSION_ID: 'session-abc',
        CUSTOM_VAR: 'hello',
      });
    });

    it('renders empty object when no persistEnv', () => {
      const output = renderOpenCodeOutput({}, 'shell.env');
      expect(output).toEqual({});
    });

    it('renders empty object for empty persistEnv', () => {
      const result: UnifiedHookResult = {
        persistEnv: {},
      };
      const output = renderOpenCodeOutput(result, 'shell.env');
      expect(output).toEqual({});
    });
  });

  describe('unknown events', () => {
    it('renders generic output with additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Some context',
      };
      const output = renderOpenCodeOutput(result, 'SomeUnknownEvent');
      expect(output.additionalContext).toBe('Some context');
    });

    it('renders empty object for empty result', () => {
      const output = renderOpenCodeOutput({}, 'SomeUnknownEvent');
      expect(output).toEqual({});
    });
  });
});
