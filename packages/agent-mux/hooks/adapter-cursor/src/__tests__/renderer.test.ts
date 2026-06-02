import { describe, it, expect } from 'vitest';
import { renderCursorOutput, isFieldSupportedForEvent } from '../renderer';
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

describe('renderCursorOutput', () => {
  describe('stop', () => {
    it('includes continueSession and stopReason', () => {
      const result = makeMergedResult({
        continueSession: false,
        stopReason: 'iteration limit',
        reason: 'forced stop',
      });
      const { output } = renderCursorOutput(result, 'stop');
      expect(output['continueSession']).toBe(false);
      expect(output['stopReason']).toBe('iteration limit');
      expect(output['reason']).toBe('forced stop');
    });

    it('drops decision on stop', () => {
      const result = makeMergedResult({ decision: 'deny' });
      const { output, droppedFields } = renderCursorOutput(result, 'stop');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });
  });

  describe('sessionStart', () => {
    it('has minimal output (most fields ignored)', () => {
      const result = makeMergedResult({
        decision: 'allow',
        reason: 'session initialized',
      });
      const { output, droppedFields } = renderCursorOutput(result, 'sessionStart');
      expect(output['reason']).toBe('session initialized');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });
  });

  describe('preToolUse', () => {
    it('includes decision and reason', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'dangerous command',
      });
      const { output } = renderCursorOutput(result, 'preToolUse');
      expect(output['decision']).toBe('deny');
      expect(output['reason']).toBe('dangerous command');
    });
  });

  describe('postToolUse', () => {
    it('includes reason only', () => {
      const result = makeMergedResult({ reason: 'observed' });
      const { output } = renderCursorOutput(result, 'postToolUse');
      expect(output['reason']).toBe('observed');
    });

    it('drops decision on postToolUse', () => {
      const result = makeMergedResult({ decision: 'deny' });
      const { output, droppedFields } = renderCursorOutput(result, 'postToolUse');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });
  });

  describe('unknown event', () => {
    it('drops all non-empty fields', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'test',
      });
      const { output, droppedFields } = renderCursorOutput(result, 'UnknownEvent');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toContain('decision');
      expect(droppedFields).toContain('reason');
    });
  });

  describe('empty merged result', () => {
    it('returns empty output for noop result', () => {
      const result = makeMergedResult();
      const { output, droppedFields } = renderCursorOutput(result, 'stop');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toEqual([]);
    });
  });
});

describe('isFieldSupportedForEvent', () => {
  it('returns true for supported fields', () => {
    expect(isFieldSupportedForEvent('decision', 'preToolUse')).toBe(true);
    expect(isFieldSupportedForEvent('continueSession', 'stop')).toBe(true);
    expect(isFieldSupportedForEvent('reason', 'sessionStart')).toBe(true);
  });

  it('returns false for unsupported fields', () => {
    expect(isFieldSupportedForEvent('decision', 'sessionStart')).toBe(false);
    expect(isFieldSupportedForEvent('continueSession', 'preToolUse')).toBe(false);
  });

  it('returns false for unknown events', () => {
    expect(isFieldSupportedForEvent('decision', 'FakeEvent')).toBe(false);
  });
});
