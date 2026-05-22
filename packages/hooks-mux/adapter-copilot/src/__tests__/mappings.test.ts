import { describe, it, expect } from 'vitest';
import { COPILOT_PHASE_MAPPINGS, getMappingByNativeHook, getMappingByPhase } from '../mappings';

describe('COPILOT_PHASE_MAPPINGS', () => {
  it('should cover the minimum v1 canonical phases', () => {
    const phases = COPILOT_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('session.start');
    expect(phases).toContain('session.end');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
  });

  it('should have preToolUse as blockable', () => {
    const blockable = COPILOT_PHASE_MAPPINGS.filter((m) => m.blockCapability);
    expect(blockable.length).toBeGreaterThanOrEqual(1);
    expect(blockable.some((m) => m.nativeHook === 'preToolUse')).toBe(true);
  });

  it('should have valid scopes on all mappings', () => {
    for (const mapping of COPILOT_PHASE_MAPPINGS) {
      expect(['session', 'tool', 'turn', 'model']).toContain(mapping.scope);
    }
  });

  it('should have valid support levels on all mappings', () => {
    for (const mapping of COPILOT_PHASE_MAPPINGS) {
      expect(['native', 'lossy', 'emulated', 'unsupported']).toContain(mapping.supportLevel);
    }
  });
});

describe('getMappingByNativeHook', () => {
  it('should find mapping for known native hooks', () => {
    expect(getMappingByNativeHook('sessionStart')?.canonicalPhase).toBe('session.start');
    expect(getMappingByNativeHook('preToolUse')?.canonicalPhase).toBe('tool.before');
    expect(getMappingByNativeHook('postToolUse')?.canonicalPhase).toBe('tool.after');
  });

  it('should return undefined for unknown hooks', () => {
    expect(getMappingByNativeHook('nonExistentHook')).toBeUndefined();
  });
});

describe('getMappingByPhase', () => {
  it('should find mapping for known phases', () => {
    const sessionStart = getMappingByPhase('session.start');
    expect(sessionStart).toBeDefined();
    const toolBefore = getMappingByPhase('tool.before');
    expect(toolBefore).toBeDefined();
  });

  it('should return undefined for unmapped phases', () => {
    expect(getMappingByPhase('nonexistent.phase')).toBeUndefined();
  });
});
