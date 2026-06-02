import { describe, it, expect } from 'vitest';
import { renderHermesOutput, isFieldSupportedForEvent } from '../renderer';
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

describe('renderHermesOutput', () => {
  it('only emits reason field for onEvent (drops everything else)', () => {
    const result = makeMergedResult({
      decision: 'deny',
      reason: 'blocked by policy',
      systemMessage: 'Use the safe path',
      continueSession: false,
      stopReason: 'iteration limit',
      suppressOutput: true,
    });

    const { output, droppedFields } = renderHermesOutput(result, 'onEvent');
    expect(output).toEqual({ reason: 'blocked by policy' });
    expect(droppedFields).toContain('decision');
    expect(droppedFields).toContain('systemMessage');
    expect(droppedFields).toContain('continueSession');
    expect(droppedFields).toContain('stopReason');
    expect(droppedFields).toContain('suppressOutput');
  });

  describe('onEvent', () => {
    it('includes reason when present', () => {
      const result = makeMergedResult({ reason: 'tool completed successfully' });
      const { output, droppedFields } = renderHermesOutput(result, 'onEvent');
      expect(output['reason']).toBe('tool completed successfully');
      expect(droppedFields).toEqual([]);
    });

    it('drops decision (non-blocking adapter)', () => {
      const result = makeMergedResult({ decision: 'deny', reason: 'test' });
      const { output, droppedFields } = renderHermesOutput(result, 'onEvent');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });

    it('drops suppressOutput (not supported)', () => {
      const result = makeMergedResult({ suppressOutput: true });
      const { output, droppedFields } = renderHermesOutput(result, 'onEvent');
      expect(output['suppressOutput']).toBeUndefined();
      expect(droppedFields).toContain('suppressOutput');
    });

    it('drops systemMessage (not supported)', () => {
      const result = makeMergedResult({ systemMessage: 'hello' });
      const { output, droppedFields } = renderHermesOutput(result, 'onEvent');
      expect(output['systemMessage']).toBeUndefined();
      expect(droppedFields).toContain('systemMessage');
    });
  });

  describe('unknown event', () => {
    it('drops all non-empty fields', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'test',
      });
      const { output, droppedFields } = renderHermesOutput(result, 'UnknownEvent');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toContain('decision');
      expect(droppedFields).toContain('reason');
    });
  });

  describe('empty merged result', () => {
    it('returns empty output for noop result', () => {
      const result = makeMergedResult();
      const { output, droppedFields } = renderHermesOutput(result, 'onEvent');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toEqual([]);
    });
  });
});

describe('isFieldSupportedForEvent', () => {
  it('returns true for reason on onEvent', () => {
    expect(isFieldSupportedForEvent('reason', 'onEvent')).toBe(true);
  });

  it('returns false for decision on onEvent (non-blocking)', () => {
    expect(isFieldSupportedForEvent('decision', 'onEvent')).toBe(false);
  });

  it('returns false for suppressOutput on onEvent', () => {
    expect(isFieldSupportedForEvent('suppressOutput', 'onEvent')).toBe(false);
  });

  it('returns false for systemMessage on onEvent', () => {
    expect(isFieldSupportedForEvent('systemMessage', 'onEvent')).toBe(false);
  });

  it('returns false for unknown events', () => {
    expect(isFieldSupportedForEvent('reason', 'FakeEvent')).toBe(false);
  });
});
