import { describe, it, expect } from 'vitest';
import { GEMINI_PHASE_MAPPINGS, getGeminiPhaseMapping, getSupportedPhases } from '../mappings';

describe('GEMINI_PHASE_MAPPINGS', () => {
  it('maps all expected Gemini native events', () => {
    const nativeHooks = GEMINI_PHASE_MAPPINGS.map((m) => m.nativeHook);
    expect(nativeHooks).toContain('SessionStart');
    expect(nativeHooks).toContain('SessionEnd');
    expect(nativeHooks).toContain('BeforeToolSelection');
    expect(nativeHooks).toContain('BeforeModel');
    expect(nativeHooks).toContain('AfterModel');
    expect(nativeHooks).toContain('BeforeAgent');
    expect(nativeHooks).toContain('AfterAgent');
    expect(nativeHooks).toContain('BeforeTool');
    expect(nativeHooks).toContain('AfterTool');
  });

  it('has mapping entries covering all Gemini native events', () => {
    const EXPECTED_GEMINI_NATIVE_EVENTS = [
      'SessionStart',
      'SessionEnd',
      'UserPromptSubmit',
      'SessionIdle',
      'ShellEnv',
      'PreCompact',
      'BeforeToolSelection',
      'BeforeModel',
      'AfterModel',
      'BeforeAgent',
      'AfterAgent',
      'BeforeTool',
      'AfterTool',
      'UserPromptSubmit',
      'SessionIdle',
      'ShellEnv',
      'PreCompact',
    ] as const;

    // Verify every expected event has a mapping entry
    const nativeHooks = GEMINI_PHASE_MAPPINGS.map((m) => m.nativeHook);
    for (const event of EXPECTED_GEMINI_NATIVE_EVENTS) {
      expect(nativeHooks).toContain(event);
      expect(getGeminiPhaseMapping(event)).toBeDefined();
    }

    // Verify no duplicate nativeHook values
    const uniqueHooks = new Set(nativeHooks);
    expect(uniqueHooks.size).toBe(GEMINI_PHASE_MAPPINGS.length);
  });

  it('maps BeforeToolSelection to planner.before_tool_selection', () => {
    const mapping = getGeminiPhaseMapping('BeforeToolSelection');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('planner.before_tool_selection');
    expect(mapping!.scope).toBe('planner');
    expect(mapping!.mutationCapability).toBe(true);
    expect(mapping!.blockCapability).toBe(true);
  });

  it('maps BeforeModel to model.before_request', () => {
    const mapping = getGeminiPhaseMapping('BeforeModel');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('model.before_request');
    expect(mapping!.scope).toBe('model');
    expect(mapping!.mutationCapability).toBe(true);
  });

  it('maps AfterModel to model.after_response', () => {
    const mapping = getGeminiPhaseMapping('AfterModel');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('model.after_response');
    expect(mapping!.mutationCapability).toBe(false);
  });

  it('maps BeforeAgent to turn.before_agent', () => {
    const mapping = getGeminiPhaseMapping('BeforeAgent');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('turn.before_agent');
    expect(mapping!.scope).toBe('turn');
    expect(mapping!.blockCapability).toBe(true);
  });

  it('maps AfterAgent to turn.after_agent', () => {
    const mapping = getGeminiPhaseMapping('AfterAgent');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('turn.after_agent');
    expect(mapping!.blockCapability).toBe(true);
  });

  it('maps tool execution events', () => {
    const before = getGeminiPhaseMapping('BeforeTool');
    expect(before?.canonicalPhase).toBe('tool.before');
    expect(before?.mutationCapability).toBe(true);

    const after = getGeminiPhaseMapping('AfterTool');
    expect(after?.canonicalPhase).toBe('tool.after');
    expect(after?.mutationCapability).toBe(false);
  });

  it('returns undefined for unknown event name', () => {
    expect(getGeminiPhaseMapping('UnknownEvent')).toBeUndefined();
  });

  it('maps BeforeToolSelection with planner scope', () => {
    const mapping = getGeminiPhaseMapping('BeforeToolSelection');
    expect(mapping).toBeDefined();
    expect(mapping!.scope).toBe('planner');
  });
});

describe('getSupportedPhases', () => {
  it('returns all canonical phases', () => {
    const phases = getSupportedPhases();
    expect(phases).toContain('session.start');
    expect(phases).toContain('session.end');
    expect(phases).toContain('planner.before_tool_selection');
    expect(phases).toContain('model.before_request');
    expect(phases).toContain('model.after_response');
    expect(phases).toContain('turn.before_agent');
    expect(phases).toContain('turn.after_agent');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
  });
});
