import { describe, it, expect } from 'vitest';
import { CURSOR_PHASE_MAPPINGS, findMapping, getSupportedPhases } from '../mappings';

describe('CURSOR_PHASE_MAPPINGS', () => {
  it('contains the stable minimum phases', () => {
    const phases = CURSOR_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('session.start');
    expect(phases).toContain('turn.stop');
  });

  it('maps sessionStart to session.start as native', () => {
    const m = findMapping('sessionStart');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('session.start');
    expect(m!.supportLevel).toBe('native');
    expect(m!.scope).toBe('session');
  });

  it('maps stop to turn.stop as native with block capability', () => {
    const m = findMapping('stop');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('turn.stop');
    expect(m!.supportLevel).toBe('native');
    expect(m!.blockCapability).toBe(true);
    expect(m!.mutationCapability).toBe(false);
  });

  it('maps sessionEnd as native', () => {
    const m = findMapping('sessionEnd');
    expect(m).toBeDefined();
    expect(m!.supportLevel).toBe('native');
  });

  it('marks preToolUse as native', () => {
    const m = findMapping('preToolUse');
    expect(m).toBeDefined();
    expect(m!.supportLevel).toBe('native');
    expect(m!.blockCapability).toBe(true);
  });

  it('marks postToolUse as native', () => {
    const m = findMapping('postToolUse');
    expect(m).toBeDefined();
    expect(m!.supportLevel).toBe('native');
  });

  it('returns undefined for unknown events', () => {
    expect(findMapping('UnknownEvent')).toBeUndefined();
  });
});

describe('getSupportedPhases', () => {
  it('returns all mapped canonical phases', () => {
    const phases = getSupportedPhases();
    expect(phases).toContain('session.start');
    expect(phases).toContain('session.end');
    expect(phases).toContain('turn.stop');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
  });
});
