import { describe, it, expect } from 'vitest';
import { renderCopilotOutput, serializeOutput } from '../renderer';
import type { MergedExecutionResult } from '@a5c-ai/hooks-mux-core';

function makeMergedResult(overrides: Partial<MergedExecutionResult> = {}): MergedExecutionResult {
  return {
    decision: 'noop',
    reason: undefined,
    systemMessage: undefined,
    additionalContext: undefined,
    followUpMessage: undefined,
    continueSession: true,
    stopReason: undefined,
    suppressOutput: false,
    toolMutation: undefined,
    persistEnv: {},
    unsetEnv: [],
    contextVars: {},
    metadata: {},
    diagnostics: {
      handlerCount: 1,
      conflicts: [],
      degradedFields: [],
    },
    ...overrides,
  };
}

describe('renderCopilotOutput', () => {
  describe('preTool events', () => {
    it('should render deny decision for preToolUse', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'Dangerous command detected',
      });

      const output = renderCopilotOutput(result, 'preToolUse');
      expect(output).toEqual({
        permissionDecision: 'deny',
        reason: 'Dangerous command detected',
      });
    });

    it('should not include permissionDecision when decision is allow', () => {
      const result = makeMergedResult({ decision: 'allow' });
      const output = renderCopilotOutput(result, 'preToolUse');
      expect(output).toEqual({});
    });

    it('should not include permissionDecision when decision is noop', () => {
      const result = makeMergedResult({ decision: 'noop' });
      const output = renderCopilotOutput(result, 'preToolUse');
      expect(output).toEqual({});
    });

    it('should omit reason when decision is not deny', () => {
      const result = makeMergedResult({
        decision: 'allow',
        reason: 'Looks safe',
      });
      const output = renderCopilotOutput(result, 'preToolUse');
      expect(output).not.toHaveProperty('reason');
    });
  });

  describe('non-preTool events', () => {
    it('should return noop output for sessionStart', () => {
      const result = makeMergedResult({ decision: 'deny', reason: 'blocked' });
      const output = renderCopilotOutput(result, 'sessionStart');
      expect(output).toEqual({ ok: true });
    });

    it('should return noop output for postToolUse', () => {
      const result = makeMergedResult();
      const output = renderCopilotOutput(result, 'postToolUse');
      expect(output).toEqual({ ok: true });
    });

    it('should return noop output for userPromptSubmitted', () => {
      const result = makeMergedResult();
      const output = renderCopilotOutput(result, 'userPromptSubmitted');
      expect(output).toEqual({ ok: true });
    });

    it('should return noop output for sessionEnd', () => {
      const result = makeMergedResult();
      const output = renderCopilotOutput(result, 'sessionEnd');
      expect(output).toEqual({ ok: true });
    });

    it('should return noop output for error events', () => {
      const result = makeMergedResult();
      const output = renderCopilotOutput(result, 'errorOccurred');
      expect(output).toEqual({ ok: true });
    });
  });
});

describe('serializeOutput', () => {
  it('should serialize to valid JSON', () => {
    const output = { ok: true as const };
    const json = serializeOutput(output);
    expect(JSON.parse(json)).toEqual({ ok: true });
  });

  it('should serialize deny output', () => {
    const output = { permissionDecision: 'deny' as const, reason: 'blocked' };
    const json = serializeOutput(output);
    expect(JSON.parse(json)).toEqual({ permissionDecision: 'deny', reason: 'blocked' });
  });
});
