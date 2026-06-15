import { describe, it, expect } from 'vitest';
import { compareProfiles, PROBE_CONFIGS } from '../src/probe.js';
import type { HarnessBehaviorProfile } from '../src/types.js';

function makeProfile(overrides?: Partial<HarnessBehaviorProfile>): HarnessBehaviorProfile {
  return {
    harness: 'claude-code',
    executionType: 'subprocess',
    version: '1.0.0',
    capturedAt: '2026-01-01T00:00:00Z',
    startupTimeMs: 500,
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'newline-delimited'],
    supportsStdin: true,
    stdinSignals: ['(y/N)'],
    fileOperationPatterns: [],
    exitCodes: { version: 0, success: 0 },
    environmentVariables: [],
    cliPatterns: { command: 'claude', args: '-p hello' },
    availability: 'local-manual',
    probeNotes: [],
    ...overrides,
  };
}

describe('compareProfiles', () => {
  it('returns empty diffs for identical profiles', () => {
    const p = makeProfile();
    expect(compareProfiles(p, p)).toEqual([]);
  });

  it('detects version change as info', () => {
    const base = makeProfile({ version: '1.0.0' });
    const curr = makeProfile({ version: '2.0.0' });
    const diffs = compareProfiles(base, curr);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]!.field).toBe('version');
    expect(diffs[0]!.severity).toBe('info');
  });

  it('detects output format change as breaking', () => {
    const base = makeProfile({ outputFormat: 'jsonl' });
    const curr = makeProfile({ outputFormat: 'text' });
    const diffs = compareProfiles(base, curr);
    expect(diffs.some((d) => d.field === 'outputFormat' && d.severity === 'breaking')).toBe(true);
  });

  it('detects stdin support change as breaking', () => {
    const base = makeProfile({ supportsStdin: true });
    const curr = makeProfile({ supportsStdin: false });
    const diffs = compareProfiles(base, curr);
    expect(diffs.some((d) => d.field === 'supportsStdin' && d.severity === 'breaking')).toBe(true);
  });

  it('detects exit code change as warning', () => {
    const base = makeProfile({ exitCodes: { success: 0 } });
    const curr = makeProfile({ exitCodes: { success: 1 } });
    const diffs = compareProfiles(base, curr);
    expect(diffs.some((d) => d.field.startsWith('exitCodes') && d.severity === 'warning')).toBe(true);
  });

  it('detects startup time regression as warning', () => {
    const base = makeProfile({ startupTimeMs: 500 });
    const curr = makeProfile({ startupTimeMs: 1500 });
    const diffs = compareProfiles(base, curr);
    expect(diffs.some((d) => d.field === 'startupTimeMs' && d.severity === 'warning')).toBe(true);
  });

  it('ignores minor startup time changes', () => {
    const base = makeProfile({ startupTimeMs: 500 });
    const curr = makeProfile({ startupTimeMs: 800 });
    const diffs = compareProfiles(base, curr);
    expect(diffs.some((d) => d.field === 'startupTimeMs')).toBe(false);
  });

  it('detects output trait and stdin signal drift as warnings', () => {
    const base = makeProfile({
      outputFormatTraits: ['jsonl', 'session-envelopes'],
      stdinSignals: ['(y/N)'],
    });
    const curr = makeProfile({
      outputFormatTraits: ['jsonl', 'plain-text'],
      stdinSignals: ['approval required'],
    });
    const diffs = compareProfiles(base, curr);
    expect(diffs.some((d) => d.field === 'outputFormatTraits' && d.severity === 'warning')).toBe(true);
    expect(diffs.some((d) => d.field === 'stdinSignals' && d.severity === 'warning')).toBe(true);
  });
});

describe('PROBE_CONFIGS', () => {
  it('covers the built-in harness and transport matrix', () => {
    expect(Object.keys(PROBE_CONFIGS).length).toBeGreaterThanOrEqual(18);
    expect(PROBE_CONFIGS['claude-code']?.command).toBe('claude');
    expect(PROBE_CONFIGS['codex']?.command).toBe('codex');
    expect(PROBE_CONFIGS['pi']?.command).toBe('pi');
    expect(PROBE_CONFIGS['claude-agent-sdk']?.executionType).toBe('sdk');
    expect(PROBE_CONFIGS['codex-sdk']?.availability).toBe('offline-only');
    expect(PROBE_CONFIGS['pi-sdk']?.availability).toBe('offline-only');
    expect(PROBE_CONFIGS['codex-websocket']?.executionType).toBe('websocket');
    expect(PROBE_CONFIGS['opencode-http']?.executionType).toBe('http');
  });
});
