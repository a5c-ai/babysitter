import { describe, it, expect } from 'vitest';
import {
  OPENCODE_PHASE_MAPPINGS,
  getOpenCodePhaseMapping,
  getSupportedPhases,
} from '../mappings';

describe('OPENCODE_PHASE_MAPPINGS', () => {
  it('maps all expected OpenCode native events', () => {
    const nativeHooks = OPENCODE_PHASE_MAPPINGS.map((m) => m.nativeHook);
    expect(nativeHooks).toContain('session.created');
    expect(nativeHooks).toContain('tool.execute.before');
    expect(nativeHooks).toContain('tool.execute.after');
  });

  it('maps session.created to session.start', () => {
    const mapping = getOpenCodePhaseMapping('session.created');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('session.start');
    expect(mapping!.scope).toBe('session');
    expect(mapping!.blockCapability).toBe(false);
    expect(mapping!.mutationCapability).toBe(false);
  });

  it('maps tool.execute.before to tool.before', () => {
    const mapping = getOpenCodePhaseMapping('tool.execute.before');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('tool.before');
    expect(mapping!.scope).toBe('tool');
    expect(mapping!.blockCapability).toBe(true);
    expect(mapping!.mutationCapability).toBe(true);
  });

  it('maps tool.execute.after to tool.after', () => {
    const mapping = getOpenCodePhaseMapping('tool.execute.after');
    expect(mapping).toBeDefined();
    expect(mapping!.canonicalPhase).toBe('tool.after');
    expect(mapping!.scope).toBe('tool');
    expect(mapping!.blockCapability).toBe(false);
    expect(mapping!.mutationCapability).toBe(false);
  });

  it('returns undefined for unknown event name', () => {
    expect(getOpenCodePhaseMapping('UnknownEvent')).toBeUndefined();
  });

  it('does not include shell.env in standard phase mappings', () => {
    const nativeHooks = OPENCODE_PHASE_MAPPINGS.map((m) => m.nativeHook);
    expect(nativeHooks).not.toContain('shell.env');
  });
});

describe('getSupportedPhases', () => {
  it('returns all canonical phases', () => {
    const phases = getSupportedPhases();
    expect(phases).toContain('session.start');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
  });

  it('returns at least the core phases', () => {
    const phases = getSupportedPhases();
    expect(phases.length).toBeGreaterThanOrEqual(3);
  });
});
