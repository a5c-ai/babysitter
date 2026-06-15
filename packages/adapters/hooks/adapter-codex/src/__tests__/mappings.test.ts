import { describe, it, expect } from 'vitest';
import { CODEX_PHASE_MAPPINGS, findMapping } from '../mappings';

describe('CODEX_PHASE_MAPPINGS', () => {
  it('contains at least the v1 minimum phases', () => {
    const phases = CODEX_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
    expect(phases).toContain('session.start');
    expect(phases).toContain('turn.user_prompt_submitted');
    expect(phases).toContain('turn.stop');
    expect(phases).toContain('tool.before');
    expect(phases).toContain('tool.after');
  });

  it('maps SessionStart to session.start as native', () => {
    const m = findMapping('SessionStart');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('session.start');
    expect(m!.supportLevel).toBe('native');
    expect(m!.scope).toBe('session');
  });

  it('maps UserPromptSubmit with block capability', () => {
    const m = findMapping('UserPromptSubmit');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('turn.user_prompt_submitted');
    expect(m!.blockCapability).toBe(true);
    expect(m!.mutationCapability).toBe(false);
  });

  it('maps Stop to turn.stop', () => {
    const m = findMapping('Stop');
    expect(m).toBeDefined();
    expect(m!.canonicalPhase).toBe('turn.stop');
  });

  it('marks PreToolUse as lossy (bash-only)', () => {
    const m = findMapping('PreToolUse');
    expect(m).toBeDefined();
    expect(m!.supportLevel).toBe('lossy');
  });

  it('marks PostToolUse as lossy (bash-only)', () => {
    const m = findMapping('PostToolUse');
    expect(m).toBeDefined();
    expect(m!.supportLevel).toBe('lossy');
  });

  it('marks session.end as lossy', () => {
    const m = findMapping('SessionEnd');
    expect(m).toBeDefined();
    expect(m!.supportLevel).toBe('lossy');
  });

  it('returns undefined for unknown events', () => {
    expect(findMapping('UnknownEvent')).toBeUndefined();
  });
});
