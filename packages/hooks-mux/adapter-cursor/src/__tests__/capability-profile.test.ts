import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActiveProfile,
  setActiveProfile,
  resetProfile,
  isEventReliable,
  isEventKnown,
  getEventDiagnostics,
  DEFAULT_PROFILE,
  CLI_PERMISSIVE_PROFILE,
} from '../capability-profile';

beforeEach(() => {
  resetProfile();
});

describe('DEFAULT_PROFILE', () => {
  it('is named default', () => {
    expect(DEFAULT_PROFILE.name).toBe('default');
  });

  it('has unknown mode', () => {
    expect(DEFAULT_PROFILE.mode).toBe('unknown');
  });

  it('lists all hook events as reliable', () => {
    expect(DEFAULT_PROFILE.reliableEvents).toContain('sessionStart');
    expect(DEFAULT_PROFILE.reliableEvents).toContain('sessionEnd');
    expect(DEFAULT_PROFILE.reliableEvents).toContain('stop');
    expect(DEFAULT_PROFILE.reliableEvents).toContain('preToolUse');
    expect(DEFAULT_PROFILE.reliableEvents).toContain('postToolUse');
  });

  it('has no unreliable events', () => {
    expect(DEFAULT_PROFILE.unreliableEvents).toHaveLength(0);
  });

  it('has tool hooks enabled', () => {
    expect(DEFAULT_PROFILE.toolHooksAvailable).toBe(true);
  });
});

describe('CLI_PERMISSIVE_PROFILE', () => {
  it('is named cli-permissive', () => {
    expect(CLI_PERMISSIVE_PROFILE.name).toBe('cli-permissive');
  });

  it('has cli mode', () => {
    expect(CLI_PERMISSIVE_PROFILE.mode).toBe('cli');
  });

  it('has tool hooks available', () => {
    expect(CLI_PERMISSIVE_PROFILE.toolHooksAvailable).toBe(true);
  });
});

describe('getActiveProfile / setActiveProfile / resetProfile', () => {
  it('defaults to DEFAULT_PROFILE', () => {
    const profile = getActiveProfile();
    expect(profile.name).toBe('default');
  });

  it('allows overriding the active profile', () => {
    setActiveProfile(CLI_PERMISSIVE_PROFILE);
    expect(getActiveProfile().name).toBe('cli-permissive');
  });

  it('resets to default', () => {
    setActiveProfile(CLI_PERMISSIVE_PROFILE);
    resetProfile();
    expect(getActiveProfile().name).toBe('default');
  });

  it('makes a copy when setting (does not share reference)', () => {
    const custom = { ...CLI_PERMISSIVE_PROFILE, name: 'custom' };
    setActiveProfile(custom);
    custom.name = 'mutated';
    expect(getActiveProfile().name).toBe('custom');
  });
});

describe('isEventReliable', () => {
  it('returns true for all documented events', () => {
    expect(isEventReliable('sessionStart')).toBe(true);
    expect(isEventReliable('sessionEnd')).toBe(true);
    expect(isEventReliable('stop')).toBe(true);
    expect(isEventReliable('preToolUse')).toBe(true);
    expect(isEventReliable('postToolUse')).toBe(true);
  });

  it('returns false for unknown events', () => {
    expect(isEventReliable('SomeFutureEvent')).toBe(false);
  });
});

describe('isEventKnown', () => {
  it('returns true for all documented events', () => {
    expect(isEventKnown('sessionStart')).toBe(true);
    expect(isEventKnown('preToolUse')).toBe(true);
    expect(isEventKnown('postToolUse')).toBe(true);
  });

  it('returns false for completely unknown events', () => {
    expect(isEventKnown('SomeFutureEvent')).toBe(false);
  });
});

describe('getEventDiagnostics', () => {
  it('returns no warnings for reliable events (except mode)', () => {
    const diag = getEventDiagnostics('sessionStart');
    expect(diag.isReliable).toBe(true);
    expect(diag.isKnown).toBe(true);
    // mode=unknown warning should still be present
    expect(diag.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('mode (IDE vs CLI) is unknown'),
      ]),
    );
  });

  it('returns no unreliable warning for preToolUse', () => {
    const diag = getEventDiagnostics('preToolUse');
    expect(diag.isReliable).toBe(true);
    expect(diag.isKnown).toBe(true);
    // Only mode-unknown warning expected
    const unreliableWarnings = diag.warnings.filter((w) => w.includes('unreliable'));
    expect(unreliableWarnings).toHaveLength(0);
  });

  it('warns about completely unknown events', () => {
    const diag = getEventDiagnostics('SomeFutureEvent');
    expect(diag.isReliable).toBe(false);
    expect(diag.isKnown).toBe(false);
    expect(diag.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('not recognized'),
      ]),
    );
  });

  it('includes profile name and mode', () => {
    const diag = getEventDiagnostics('sessionStart');
    expect(diag.profileName).toBe('default');
    expect(diag.mode).toBe('unknown');
  });

  it('reflects overridden profile', () => {
    setActiveProfile(CLI_PERMISSIVE_PROFILE);
    const diag = getEventDiagnostics('sessionStart');
    expect(diag.profileName).toBe('cli-permissive');
    expect(diag.mode).toBe('cli');
    // No mode-unknown warning when mode is known
    const modeWarnings = diag.warnings.filter((w) => w.includes('mode (IDE vs CLI)'));
    expect(modeWarnings).toHaveLength(0);
  });
});
