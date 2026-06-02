import { describe, it, expect } from 'vitest';
import { HERMES_PHASE_MAPPINGS, findMapping } from '../mappings';

describe('HERMES_PHASE_MAPPINGS', () => {
  it('contains the onEvent mapping to tool.after', () => {
    const phases = HERMES_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('tool.after');
  });

  it('maps onEvent to tool.after', () => {
    const m = findMapping('onEvent');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('tool.after');
    expect(m!.scope).toBe('turn');
  });

  it('onEvent has no block capability', () => {
    const m = findMapping('onEvent');
    expect(m).toBeDefined();
    expect(m!.blockCapability).toBe(false);
  });

  it('onEvent has no mutation capability', () => {
    const m = findMapping('onEvent');
    expect(m).toBeDefined();
    expect(m!.mutationCapability).toBe(false);
  });

  it('returns undefined for unknown events', () => {
    expect(findMapping('UnknownEvent')).toBeUndefined();
  });

  it('has no duplicate native hook entries', () => {
    const hooks = HERMES_PHASE_MAPPINGS.map((m) => m.nativeHook);
    expect(new Set(hooks).size).toBe(hooks.length);
  });
});
