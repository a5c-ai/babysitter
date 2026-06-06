import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  checkForUpdate,
  shouldAutoUpdate,
  type PluginVersion,
} from '../versioning';

// ---------------------------------------------------------------------------
// parseVersion
// ---------------------------------------------------------------------------

describe('parseVersion', () => {
  it('parses a standard semver string', () => {
    expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('strips leading v prefix', () => {
    expect(parseVersion('v2.0.1')).toEqual({ major: 2, minor: 0, patch: 1 });
  });

  it('captures preRelease tag', () => {
    const v = parseVersion('3.1.0-beta.1');
    expect(v).toBeDefined();
    expect(v!.preRelease).toBe('beta.1');
  });

  it('returns undefined for malformed input', () => {
    expect(parseVersion('not-a-version')).toBeUndefined();
    expect(parseVersion('1.2')).toBeUndefined();
    expect(parseVersion('')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// shouldAutoUpdate
// ---------------------------------------------------------------------------

describe('shouldAutoUpdate', () => {
  const v = (major: number, minor: number, patch: number): PluginVersion => ({
    major,
    minor,
    patch,
  });

  it('returns auto for patch-level bump', () => {
    expect(shouldAutoUpdate(v(1, 0, 0), v(1, 0, 5))).toBe('auto');
  });

  it('returns prompt for minor-level bump', () => {
    expect(shouldAutoUpdate(v(1, 0, 0), v(1, 3, 0))).toBe('prompt');
  });

  it('returns block for major-level bump', () => {
    expect(shouldAutoUpdate(v(1, 0, 0), v(2, 0, 0))).toBe('block');
  });

  it('returns block when major jumps even with patch change', () => {
    expect(shouldAutoUpdate(v(1, 5, 9), v(3, 0, 0))).toBe('block');
  });
});

// ---------------------------------------------------------------------------
// checkForUpdate
// ---------------------------------------------------------------------------

describe('checkForUpdate', () => {
  it('reports no update when already at latest', () => {
    const result = checkForUpdate('2.0.0', '2.0.0');
    expect(result.available).toBe(false);
    expect(result.action).toBe('auto');
  });

  it('reports no update when current is ahead', () => {
    const result = checkForUpdate('3.0.0', '2.9.9');
    expect(result.available).toBe(false);
  });

  it('reports auto for patch update', () => {
    const result = checkForUpdate('1.0.0', '1.0.4');
    expect(result.available).toBe(true);
    expect(result.action).toBe('auto');
    expect(result.reason).toContain('Patch');
  });

  it('reports prompt for minor update', () => {
    const result = checkForUpdate('1.0.0', '1.2.0');
    expect(result.available).toBe(true);
    expect(result.action).toBe('prompt');
    expect(result.reason).toContain('Minor');
  });

  it('reports block for major update', () => {
    const result = checkForUpdate('1.5.3', '2.0.0');
    expect(result.available).toBe(true);
    expect(result.action).toBe('block');
    expect(result.reason).toContain('Major');
  });

  it('handles unparseable versions gracefully', () => {
    const result = checkForUpdate('bad', '1.0.0');
    expect(result.available).toBe(false);
    expect(result.action).toBe('block');
    expect(result.reason).toContain('parse');
  });
});
