import { describe, it, expect } from 'vitest';
import { renderOhMyPiOutput, isFieldSupportedForEvent } from '../renderer';
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

describe('renderOhMyPiOutput', () => {
  describe('session_start', () => {
    it('includes reason and additionalContext', () => {
      const result = makeMergedResult({
        reason: 'session initialized',
        additionalContext: 'project context loaded',
      });
      const { output } = renderOhMyPiOutput(result, 'session_start');
      expect(output['reason']).toBe('session initialized');
      expect(output['additionalContext']).toBe('project context loaded');
    });

    it('drops decision on session_start', () => {
      const result = makeMergedResult({ decision: 'allow' });
      const { output, droppedFields } = renderOhMyPiOutput(result, 'session_start');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });
  });

  describe('session_end', () => {
    it('includes reason only', () => {
      const result = makeMergedResult({ reason: 'session closed' });
      const { output } = renderOhMyPiOutput(result, 'session_end');
      expect(output['reason']).toBe('session closed');
    });
  });

  describe('tool_call', () => {
    it('includes reason only (no mutation support)', () => {
      const result = makeMergedResult({ reason: 'tool observed' });
      const { output } = renderOhMyPiOutput(result, 'tool_call');
      expect(output['reason']).toBe('tool observed');
    });

    it('drops decision on tool_call', () => {
      const result = makeMergedResult({ decision: 'deny' });
      const { output, droppedFields } = renderOhMyPiOutput(result, 'tool_call');
      expect(output['decision']).toBeUndefined();
      expect(droppedFields).toContain('decision');
    });
  });

  describe('before_provider_request', () => {
    it('includes reason, additionalContext, and systemMessage', () => {
      const result = makeMergedResult({
        reason: 'injecting context',
        additionalContext: 'extra info',
        systemMessage: 'system prompt addition',
      });
      const { output } = renderOhMyPiOutput(result, 'before_provider_request');
      expect(output['reason']).toBe('injecting context');
      expect(output['additionalContext']).toBe('extra info');
      expect(output['systemMessage']).toBe('system prompt addition');
    });
  });

  describe('prompt', () => {
    it('includes reason and additionalContext', () => {
      const result = makeMergedResult({
        reason: 'prompt intercepted',
        additionalContext: 'added context',
      });
      const { output } = renderOhMyPiOutput(result, 'prompt');
      expect(output['reason']).toBe('prompt intercepted');
      expect(output['additionalContext']).toBe('added context');
    });
  });

  describe('unknown event', () => {
    it('drops all non-empty fields', () => {
      const result = makeMergedResult({
        decision: 'deny',
        reason: 'test',
      });
      const { output, droppedFields } = renderOhMyPiOutput(result, 'UnknownEvent');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toContain('decision');
      expect(droppedFields).toContain('reason');
    });
  });

  describe('empty merged result', () => {
    it('returns empty output for noop result', () => {
      const result = makeMergedResult();
      const { output, droppedFields } = renderOhMyPiOutput(result, 'session_start');
      expect(Object.keys(output)).toHaveLength(0);
      expect(droppedFields).toEqual([]);
    });
  });
});

describe('isFieldSupportedForEvent', () => {
  it('returns true for supported fields', () => {
    expect(isFieldSupportedForEvent('reason', 'session_start')).toBe(true);
    expect(isFieldSupportedForEvent('additionalContext', 'session_start')).toBe(true);
    expect(isFieldSupportedForEvent('systemMessage', 'before_provider_request')).toBe(true);
  });

  it('returns false for unsupported fields', () => {
    expect(isFieldSupportedForEvent('decision', 'session_start')).toBe(false);
    expect(isFieldSupportedForEvent('continueSession', 'tool_call')).toBe(false);
    expect(isFieldSupportedForEvent('systemMessage', 'tool_call')).toBe(false);
  });

  it('returns false for unknown events', () => {
    expect(isFieldSupportedForEvent('reason', 'FakeEvent')).toBe(false);
  });
});
