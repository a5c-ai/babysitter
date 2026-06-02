import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UnifiedHookResult } from '@a5c-ai/agent-mux-hooks-core';
import { renderGeminiOutput, emitOutput, logToStderr } from '../renderer';

describe('renderGeminiOutput', () => {
  describe('BeforeToolSelection', () => {
    it('renders selectedTools from toolMutation', () => {
      const result: UnifiedHookResult = {
        toolMutation: {
          mode: 'replace',
          value: ['read_file', 'search'],
        },
      };
      const output = renderGeminiOutput(result, 'BeforeToolSelection');
      expect(output.selectedTools).toEqual(['read_file', 'search']);
    });

    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Only use safe tools',
      };
      const output = renderGeminiOutput(result, 'BeforeToolSelection');
      expect(output.additionalContext).toBe('Only use safe tools');
    });

    it('renders empty object for noop result', () => {
      const result: UnifiedHookResult = { decision: 'noop' };
      const output = renderGeminiOutput(result, 'BeforeToolSelection');
      expect(output).toEqual({});
    });

    it('preserves union-style aggregation format with selectedTools array', () => {
      // Gemini's BeforeToolSelection uses union-style aggregation:
      // multiple hooks return tool subsets that are unioned by the CLI.
      // The renderer must output { selectedTools: [...] } so the CLI
      // can union them across hook responses.
      const result: UnifiedHookResult = {
        toolMutation: {
          mode: 'replace',
          value: ['read_file', 'search', 'list_dir'],
        },
        additionalContext: 'Restricting to read-only tools',
      };
      const output = renderGeminiOutput(result, 'BeforeToolSelection');

      // Must have selectedTools as a top-level array (the union element)
      expect(output).toHaveProperty('selectedTools');
      expect(Array.isArray(output.selectedTools)).toBe(true);
      expect(output.selectedTools).toEqual(['read_file', 'search', 'list_dir']);

      // additionalContext is preserved alongside selectedTools
      expect(output.additionalContext).toBe('Restricting to read-only tools');

      // No other unexpected keys (decision, block, toolInput, etc.)
      const keys = Object.keys(output);
      expect(keys).toEqual(expect.arrayContaining(['selectedTools', 'additionalContext']));
      expect(keys).toHaveLength(2);
    });

    it('does not emit selectedTools when toolMutation value is not an array', () => {
      // If toolMutation.value is an object (not an array), it should not
      // appear as selectedTools — that format is for BeforeTool, not
      // BeforeToolSelection.
      const result: UnifiedHookResult = {
        toolMutation: {
          mode: 'replace',
          value: { path: 'foo.ts' },
        },
      };
      const output = renderGeminiOutput(result, 'BeforeToolSelection');
      expect(output.selectedTools).toBeUndefined();
    });
  });

  describe('BeforeModel', () => {
    it('renders systemMessage', () => {
      const result: UnifiedHookResult = {
        systemMessage: 'You are a careful code reviewer.',
      };
      const output = renderGeminiOutput(result, 'BeforeModel');
      expect(output.systemMessage).toBe('You are a careful code reviewer.');
    });

    it('renders block=true for deny decision', () => {
      const result: UnifiedHookResult = {
        decision: 'deny',
        reason: 'Rate limit exceeded',
      };
      const output = renderGeminiOutput(result, 'BeforeModel');
      expect(output.block).toBe(true);
      expect(output.reason).toBe('Rate limit exceeded');
    });

    it('does not set block for allow decision', () => {
      const result: UnifiedHookResult = { decision: 'allow' };
      const output = renderGeminiOutput(result, 'BeforeModel');
      expect(output.block).toBeUndefined();
    });
  });

  describe('AfterModel', () => {
    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Model returned tool calls',
      };
      const output = renderGeminiOutput(result, 'AfterModel');
      expect(output.additionalContext).toBe('Model returned tool calls');
    });
  });

  describe('BeforeAgent', () => {
    it('renders block for deny', () => {
      const result: UnifiedHookResult = {
        decision: 'deny',
        reason: 'Unsafe operation detected',
      };
      const output = renderGeminiOutput(result, 'BeforeAgent');
      expect(output.block).toBe(true);
      expect(output.reason).toBe('Unsafe operation detected');
    });

    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Focus on tests first',
      };
      const output = renderGeminiOutput(result, 'BeforeAgent');
      expect(output.additionalContext).toBe('Focus on tests first');
    });
  });

  describe('AfterAgent', () => {
    it('renders continueSession with followUpMessage', () => {
      const result: UnifiedHookResult = {
        continueSession: true,
        followUpMessage: 'Now run the tests',
      };
      const output = renderGeminiOutput(result, 'AfterAgent');
      expect(output.continueSession).toBe(true);
      expect(output.followUpMessage).toBe('Now run the tests');
    });

    it('renders stopReason as reason', () => {
      const result: UnifiedHookResult = {
        stopReason: 'All tasks complete',
      };
      const output = renderGeminiOutput(result, 'AfterAgent');
      expect(output.reason).toBe('All tasks complete');
    });

    it('falls back to reason when stopReason is absent', () => {
      const result: UnifiedHookResult = {
        reason: 'Done',
      };
      const output = renderGeminiOutput(result, 'AfterAgent');
      expect(output.reason).toBe('Done');
    });
  });

  describe('BeforeTool', () => {
    it('renders deny decision', () => {
      const result: UnifiedHookResult = {
        decision: 'deny',
        reason: 'Dangerous command',
      };
      const output = renderGeminiOutput(result, 'BeforeTool');
      expect(output.decision).toBe('deny');
      expect(output.reason).toBe('Dangerous command');
    });

    it('renders allow decision', () => {
      const result: UnifiedHookResult = { decision: 'allow' };
      const output = renderGeminiOutput(result, 'BeforeTool');
      expect(output.decision).toBe('allow');
    });

    it('renders tool input mutation', () => {
      const result: UnifiedHookResult = {
        toolMutation: {
          mode: 'replace',
          value: { path: 'safe/path.ts', content: 'sanitized' },
        },
      };
      const output = renderGeminiOutput(result, 'BeforeTool');
      expect(output.toolInput).toEqual({ path: 'safe/path.ts', content: 'sanitized' });
    });

    it('does not set decision for noop', () => {
      const result: UnifiedHookResult = { decision: 'noop' };
      const output = renderGeminiOutput(result, 'BeforeTool');
      expect(output.decision).toBeUndefined();
    });
  });

  describe('AfterTool', () => {
    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Tool completed successfully',
      };
      const output = renderGeminiOutput(result, 'AfterTool');
      expect(output.additionalContext).toBe('Tool completed successfully');
    });
  });

  describe('SessionStart', () => {
    it('renders additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Babysitter session initialized',
      };
      const output = renderGeminiOutput(result, 'SessionStart');
      expect(output.additionalContext).toBe('Babysitter session initialized');
    });
  });

  describe('unknown events', () => {
    it('renders generic output with additionalContext', () => {
      const result: UnifiedHookResult = {
        additionalContext: 'Some context',
      };
      const output = renderGeminiOutput(result, 'SomeUnknownEvent');
      expect(output.additionalContext).toBe('Some context');
    });

    it('renders empty object for empty result', () => {
      const output = renderGeminiOutput({}, 'SomeUnknownEvent');
      expect(output).toEqual({});
    });
  });
});

describe('stderr/stdout conventions', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  describe('logToStderr', () => {
    it('writes to stderr, not stdout', () => {
      logToStderr('diagnostic message');

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('diagnostic message\n');
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('emitOutput', () => {
    it('writes valid JSON to stdout', () => {
      const output = { selectedTools: ['read_file'], additionalContext: 'test' };
      emitOutput(output);

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const written = stdoutSpy.mock.calls[0][0] as string;
      // Must be parseable JSON
      const parsed = JSON.parse(written.trim());
      expect(parsed).toEqual(output);
    });

    it('writes log to stderr and JSON to stdout when log is provided', () => {
      const output = { decision: 'allow' };
      emitOutput(output, 'hook executed successfully');

      // stderr gets the log
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('hook executed successfully\n');

      // stdout gets valid JSON
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const written = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(written.trim());
      expect(parsed).toEqual(output);
    });

    it('does not write to stderr when log is not provided', () => {
      emitOutput({ additionalContext: 'test' });
      expect(stderrSpy).not.toHaveBeenCalled();
    });
  });
});
