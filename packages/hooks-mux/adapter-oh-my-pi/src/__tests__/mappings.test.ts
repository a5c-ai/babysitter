import { describe, it, expect } from 'vitest';
import { OH_MY_PI_PHASE_MAPPINGS, findMapping, getSupportedPhases } from '../mappings';

describe('OH_MY_PI_PHASE_MAPPINGS', () => {
  it('contains session lifecycle phases', () => {
    const phases = OH_MY_PI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('session.start');
    expect(phases).toContain('session.end');
    expect(phases).toContain('session.config_changed');
  });

  it('contains tool lifecycle phases', () => {
    const phases = OH_MY_PI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
  });

  it('contains turn lifecycle phases', () => {
    const phases = OH_MY_PI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('turn.user_prompt_submitted');
    expect(phases).toContain('turn.error');
  });

  it('contains model lifecycle phases', () => {
    const phases = OH_MY_PI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('model.before_request');
  });

  it('maps session_start to session.start as native', () => {
    const m = findMapping('session_start');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('session.start');
    expect(m!.supportLevel).toBe('native');
    expect(m!.scope).toBe('session');
  });

  it('maps session_end to session.end as native', () => {
    const m = findMapping('session_end');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('session.end');
    expect(m!.supportLevel).toBe('native');
  });

  it('maps tool_call with no mutation capability', () => {
    const m = findMapping('tool_call');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('tool.before');
    expect(m!.supportLevel).toBe('native');
    expect(m!.mutationCapability).toBe(false);
  });

  it('maps tool_result as observer-only', () => {
    const m = findMapping('tool_result');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('tool.after');
    expect(m!.supportLevel).toBe('native');
  });

  it('maps prompt to turn.user_prompt_submitted', () => {
    const m = findMapping('prompt');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('turn.user_prompt_submitted');
  });

  it('maps error to turn.error', () => {
    const m = findMapping('error');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('turn.error');
  });

  it('maps before_provider_request to model.before_request', () => {
    const m = findMapping('before_provider_request');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('model.before_request');
  });

  it('maps context to session.config_changed', () => {
    const m = findMapping('context');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('session.config_changed');
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
    expect(phases).toContain('session.config_changed');
    expect(phases).toContain('turn.user_prompt_submitted');
    expect(phases).toContain('turn.error');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
    expect(phases).toContain('model.before_request');
  });

  it('returns correct count of phases', () => {
    expect(getSupportedPhases()).toHaveLength(OH_MY_PI_PHASE_MAPPINGS.length);
  });
});
