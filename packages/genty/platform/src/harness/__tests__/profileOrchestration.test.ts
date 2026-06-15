import { describe, it, expect } from 'vitest';
import {
  deriveOrchestrationConfig,
  applyProfileToProcessOptions,
  type ProfileLike,
  type ProcessOptions,
} from '../profileOrchestration';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile(overrides?: Partial<ProfileLike>): ProfileLike {
  return {
    breakpointTolerance: { global: 'low' },
    toolPreferences: {
      editor: 'vscode',
      shell: 'bash',
      packageManagers: ['npm'],
    },
    preferences: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveOrchestrationConfig
// ---------------------------------------------------------------------------

describe('deriveOrchestrationConfig', () => {
  it('maps "minimal" tolerance to "none" density', () => {
    const cfg = deriveOrchestrationConfig(makeProfile({ breakpointTolerance: { global: 'minimal' } }));
    expect(cfg.breakpointDensity).toBe('none');
  });

  it('maps "low" tolerance to "sparse" density', () => {
    const cfg = deriveOrchestrationConfig(makeProfile({ breakpointTolerance: { global: 'low' } }));
    expect(cfg.breakpointDensity).toBe('sparse');
  });

  it('maps "moderate" tolerance to "moderate" density', () => {
    const cfg = deriveOrchestrationConfig(makeProfile({ breakpointTolerance: { global: 'moderate' } }));
    expect(cfg.breakpointDensity).toBe('moderate');
  });

  it('maps "high" tolerance to "frequent" density', () => {
    const cfg = deriveOrchestrationConfig(makeProfile({ breakpointTolerance: { global: 'high' } }));
    expect(cfg.breakpointDensity).toBe('frequent');
  });

  it('maps "maximum" tolerance to "frequent" density', () => {
    const cfg = deriveOrchestrationConfig(makeProfile({ breakpointTolerance: { global: 'maximum' } }));
    expect(cfg.breakpointDensity).toBe('frequent');
  });

  it('defaults to "moderate" when tolerance is absent', () => {
    const cfg = deriveOrchestrationConfig({});
    expect(cfg.breakpointDensity).toBe('moderate');
  });

  it('reads preferredModel from preferences', () => {
    const cfg = deriveOrchestrationConfig(makeProfile({
      preferences: { preferredModel: 'claude-opus-4' },
    }));
    expect(cfg.preferredModel).toBe('claude-opus-4');
  });

  it('returns undefined preferredModel when not set', () => {
    const cfg = deriveOrchestrationConfig(makeProfile());
    expect(cfg.preferredModel).toBeUndefined();
  });

  it('extracts tool preferences', () => {
    const cfg = deriveOrchestrationConfig(makeProfile());
    expect(cfg.toolPreferences.editor).toBe('vscode');
    expect(cfg.toolPreferences.shell).toBe('bash');
    expect(cfg.toolPreferences.packageManagers).toEqual(['npm']);
  });

  it('defaults packageManagers to empty array', () => {
    const cfg = deriveOrchestrationConfig(makeProfile({ toolPreferences: {} }));
    expect(cfg.toolPreferences.packageManagers).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// applyProfileToProcessOptions
// ---------------------------------------------------------------------------

describe('applyProfileToProcessOptions', () => {
  it('fills in missing options from the profile', () => {
    const profile = makeProfile({ breakpointTolerance: { global: 'minimal' } });
    const options: ProcessOptions = {};
    const result = applyProfileToProcessOptions(profile, options);
    expect(result.breakpointDensity).toBe('none');
    expect(result.toolPreferences?.editor).toBe('vscode');
  });

  it('explicit options take precedence over profile', () => {
    const profile = makeProfile({ breakpointTolerance: { global: 'minimal' } });
    const options: ProcessOptions = { breakpointDensity: 'frequent', model: 'gpt-4' };
    const result = applyProfileToProcessOptions(profile, options);
    expect(result.breakpointDensity).toBe('frequent');
    expect(result.model).toBe('gpt-4');
  });

  it('preserves extra keys on options', () => {
    const profile = makeProfile();
    const options: ProcessOptions = { customKey: 'value' };
    const result = applyProfileToProcessOptions(profile, options);
    expect(result.customKey).toBe('value');
  });
});
