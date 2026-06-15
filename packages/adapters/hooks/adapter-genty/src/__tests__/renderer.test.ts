import { describe, it, expect } from 'vitest';
import { renderGentyOutput, isFieldSupportedForEvent } from '../renderer';
import { createDiagnostics } from '@a5c-ai/hooks-adapter-core';
import type { MergedExecutionResult } from '@a5c-ai/hooks-adapter-core';

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

describe('renderGentyOutput', () => {
  it('only emits reason field for SessionStart (drops everything else)', () => {
    const result = makeMergedResult({
      decision: 'deny',
      reason: 'blocked by policy',
      systemMessage: 'Use the safe path',
      continueSession: false,
      stopReason: 'iteration limit',
      suppressOutput: true,
    });

    const { output, droppedFields } = renderGentyOutput(result, 'SessionStart');
    expect(output).toEqual({ reason: 'blocked by policy' });
    expect(droppedFields).toContain('decision');
    expect(droppedFields).toContain('systemMessage');
    expect(droppedFields).toContain('continueSession');
    expect(droppedFields).toContain('stopReason');
    expect(droppedFields).toContain('suppressOutput');
  });

  describe('SessionStart', () => {
    it('includes reason when present', () => {
      const result = makeMergedResult({ reason: 'session initialized' });
      const { output, droppedFields } = renderGentyOutput(result, 'SessionStart');
      expect(output['reason']).toBe('session initialized');
      expect(droppedFields).toEqual([]);
    });

    it('drops decision (no native hook system)', () => {
      const result = makeMergedResult({ decision: 'deny', reason: 'test' });
      const { output, droppedFields } = renderGentyOutput(result, 'SessionStart');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });
  });

  describe('Stop', () => {
    it('includes reason when present', () => {
      const result = makeMergedResult({ reason: 'run completed' });
      const { output, droppedFields } = renderGentyOutput(result, 'Stop');
      expect(output['reason']).toBe('run completed');
      expect(droppedFields).toEqual([]);
    });
  });

  describe('unknown event', () => {
    it('drops all non-empty fields', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'test',
      });
      const { output, droppedFields } = renderGentyOutput(result, 'UnknownEvent');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toContain('decision');
      expect(droppedFields).toContain('reason');
    });
  });

  describe('empty merged result', () => {
    it('returns empty output for noop result', () => {
      const result = makeMergedResult();
      const { output, droppedFields } = renderGentyOutput(result, 'SessionStart');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toEqual([]);
    });
  });
});

describe('isFieldSupportedForEvent', () => {
  it('returns true for reason on SessionStart', () => {
    expect(isFieldSupportedForEvent('reason', 'SessionStart')).toBe(true);
  });

  it('returns true for reason on Stop', () => {
    expect(isFieldSupportedForEvent('reason', 'Stop')).toBe(true);
  });

  it('returns false for decision on SessionStart (no native hooks)', () => {
    expect(isFieldSupportedForEvent('decision', 'SessionStart')).toBe(false);
  });

  it('returns false for suppressOutput on Stop', () => {
    expect(isFieldSupportedForEvent('suppressOutput', 'Stop')).toBe(false);
  });

  it('returns false for unknown events', () => {
    expect(isFieldSupportedForEvent('reason', 'FakeEvent')).toBe(false);
  });
});
