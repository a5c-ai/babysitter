import { describe, it, expect } from 'vitest';
import { renderCodexOutput, isFieldSupportedForEvent } from '../renderer';
import { createDiagnostics } from '@a5c-ai/agent-mux-hooks-core';
import type { MergedExecutionResult } from '@a5c-ai/agent-mux-hooks-core';

function makeMergedResult(overrides: Partial<MergedExecutionResult> = {}): MergedExecutionResult {
  return {
    decision: 'noop',
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
    diagnostics: createDiagnostics(0),
    ...overrides,
  };
}

describe('renderCodexOutput', () => {
  it('matches the native field matrix for each supported Codex event', () => {
    const result = makeMergedResult({
      decision: 'deny',
      reason: 'blocked by policy',
      systemMessage: 'Use the safe path',
      continueSession: false,
      stopReason: 'iteration limit',
      suppressOutput: true,
    });

    expect({
      SessionStart: renderCodexOutput(result, 'SessionStart'),
      SessionEnd: renderCodexOutput(result, 'SessionEnd'),
      UserPromptSubmit: renderCodexOutput(result, 'UserPromptSubmit'),
      Stop: renderCodexOutput(result, 'Stop'),
      PreToolUse: renderCodexOutput(result, 'PreToolUse'),
      PostToolUse: renderCodexOutput(result, 'PostToolUse'),
    }).toMatchInlineSnapshot(`
      {
        "PostToolUse": {
          "droppedFields": [
            "decision",
            "systemMessage",
            "continueSession",
            "stopReason",
          ],
          "output": {
            "reason": "blocked by policy",
            "suppressOutput": true,
          },
        },
        "PreToolUse": {
          "droppedFields": [
            "systemMessage",
            "continueSession",
            "stopReason",
            "suppressOutput",
          ],
          "output": {
            "decision": "deny",
            "reason": "blocked by policy",
          },
        },
        "SessionEnd": {
          "droppedFields": [
            "decision",
            "systemMessage",
            "continueSession",
            "stopReason",
            "suppressOutput",
          ],
          "output": {
            "reason": "blocked by policy",
          },
        },
        "SessionStart": {
          "droppedFields": [
            "decision",
            "systemMessage",
            "continueSession",
            "stopReason",
            "suppressOutput",
          ],
          "output": {
            "reason": "blocked by policy",
          },
        },
        "Stop": {
          "droppedFields": [
            "decision",
            "systemMessage",
            "suppressOutput",
          ],
          "output": {
            "continueSession": false,
            "reason": "blocked by policy",
            "stopReason": "iteration limit",
          },
        },
        "UserPromptSubmit": {
          "droppedFields": [
            "continueSession",
            "stopReason",
            "suppressOutput",
          ],
          "output": {
            "decision": "deny",
            "reason": "blocked by policy",
            "systemMessage": "Use the safe path",
          },
        },
      }
    `);
  });

  describe('UserPromptSubmit', () => {
    it('includes decision and reason', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'blocked by policy',
      });
      const { output, droppedFields } = renderCodexOutput(result, 'UserPromptSubmit');
      expect(output['decision']).toBe('deny');
      expect(output['reason']).toBe('blocked by policy');
      expect(droppedFields).toEqual([]);
    });

    it('includes systemMessage', () => {
      const result = makeMergedResult({ systemMessage: 'Be careful' });
      const { output } = renderCodexOutput(result, 'UserPromptSubmit');
      expect(output['systemMessage']).toBe('Be careful');
    });

    it('drops unsupported fields', () => {
      const result = makeMergedResult({
        decision: 'allow',
        suppressOutput: true,
        continueSession: false,
      });
      const { output, droppedFields } = renderCodexOutput(result, 'UserPromptSubmit');
      expect(output['suppressOutput']).toBeUndefined();
      expect(output['continueSession']).toBeUndefined();
      expect(droppedFields).toContain('suppressOutput');
      expect(droppedFields).toContain('continueSession');
    });
  });

  describe('Stop', () => {
    it('includes continueSession and stopReason', () => {
      const result = makeMergedResult({
        continueSession: false,
        stopReason: 'iteration limit',
        reason: 'forced stop',
      });
      const { output } = renderCodexOutput(result, 'Stop');
      expect(output['continueSession']).toBe(false);
      expect(output['stopReason']).toBe('iteration limit');
      expect(output['reason']).toBe('forced stop');
    });

    it('drops decision on Stop', () => {
      const result = makeMergedResult({ decision: 'deny' });
      const { output, droppedFields } = renderCodexOutput(result, 'Stop');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });
  });

  describe('PreToolUse', () => {
    it('includes decision and reason', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'dangerous command',
      });
      const { output } = renderCodexOutput(result, 'PreToolUse');
      expect(output['decision']).toBe('deny');
      expect(output['reason']).toBe('dangerous command');
    });
  });

  describe('PostToolUse', () => {
    it('includes suppressOutput', () => {
      const result = makeMergedResult({ suppressOutput: true });
      const { output } = renderCodexOutput(result, 'PostToolUse');
      expect(output['suppressOutput']).toBe(true);
    });
  });

  describe('SessionStart', () => {
    it('has minimal output (most fields ignored)', () => {
      const result = makeMergedResult({
        decision: 'allow',
        reason: 'session initialized',
        systemMessage: 'Welcome',
      });
      const { output, droppedFields } = renderCodexOutput(result, 'SessionStart');
      expect(output['reason']).toBe('session initialized');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
      expect(droppedFields).toContain('systemMessage');
    });
  });

  describe('SessionEnd', () => {
    it('has minimal output (same fail-open shape as SessionStart)', () => {
      const result = makeMergedResult({
        decision: 'allow',
        reason: 'session completed',
        systemMessage: 'Goodbye',
      });
      const { output, droppedFields } = renderCodexOutput(result, 'SessionEnd');
      expect(output['reason']).toBe('session completed');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
      expect(droppedFields).toContain('systemMessage');
    });
  });

  describe('unknown event', () => {
    it('drops all non-empty fields', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'test',
      });
      const { output, droppedFields } = renderCodexOutput(result, 'UnknownEvent');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toContain('decision');
      expect(droppedFields).toContain('reason');
    });
  });

  describe('empty merged result', () => {
    it('returns empty output for noop result', () => {
      const result = makeMergedResult();
      const { output, droppedFields } = renderCodexOutput(result, 'UserPromptSubmit');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toEqual([]);
    });
  });
});

describe('isFieldSupportedForEvent', () => {
  it('returns true for supported fields', () => {
    expect(isFieldSupportedForEvent('decision', 'UserPromptSubmit')).toBe(true);
    expect(isFieldSupportedForEvent('continueSession', 'Stop')).toBe(true);
    expect(isFieldSupportedForEvent('reason', 'SessionEnd')).toBe(true);
  });

  it('returns false for unsupported fields', () => {
    expect(isFieldSupportedForEvent('suppressOutput', 'UserPromptSubmit')).toBe(false);
    expect(isFieldSupportedForEvent('decision', 'SessionStart')).toBe(false);
  });

  it('returns false for unknown events', () => {
    expect(isFieldSupportedForEvent('decision', 'FakeEvent')).toBe(false);
  });
});
