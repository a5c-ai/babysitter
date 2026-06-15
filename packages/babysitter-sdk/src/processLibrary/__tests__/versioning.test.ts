import { describe, it, expect } from 'vitest';
import {
  parseProcessVersion,
  formatProcessVersion,
  isCompatible,
  compareVersions,
  migrateProcess,
  diffProcessVersions,
  type ProcessVersion,
} from '../versioning';

// ---------------------------------------------------------------------------
// parseProcessVersion
// ---------------------------------------------------------------------------

describe('parseProcessVersion', () => {
  it('parses a standard version string', () => {
    expect(parseProcessVersion('1.2.3')).toEqual({
      major: 1, minor: 2, patch: 3, hash: undefined,
    });
  });

  it('strips leading v prefix', () => {
    expect(parseProcessVersion('v2.0.1')).toEqual({
      major: 2, minor: 0, patch: 1, hash: undefined,
    });
  });

  it('captures hash suffix', () => {
    const v = parseProcessVersion('3.1.0-abc123');
    expect(v).toBeDefined();
    expect(v!.hash).toBe('abc123');
  });

  it('returns undefined for malformed input', () => {
    expect(parseProcessVersion('not-a-version')).toBeUndefined();
    expect(parseProcessVersion('1.2')).toBeUndefined();
    expect(parseProcessVersion('')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// formatProcessVersion
// ---------------------------------------------------------------------------

describe('formatProcessVersion', () => {
  it('formats a version without hash', () => {
    expect(formatProcessVersion({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
  });

  it('formats a version with hash', () => {
    expect(formatProcessVersion({ major: 1, minor: 0, patch: 0, hash: 'abc' })).toBe('1.0.0-abc');
  });
});

// ---------------------------------------------------------------------------
// isCompatible
// ---------------------------------------------------------------------------

describe('isCompatible', () => {
  const v = (major: number, minor: number, patch: number): ProcessVersion => ({
    major, minor, patch,
  });

  it('returns true for same version', () => {
    expect(isCompatible(v(1, 2, 3), v(1, 2, 3))).toBe(true);
  });

  it('returns true when current is newer patch', () => {
    expect(isCompatible(v(1, 2, 5), v(1, 2, 3))).toBe(true);
  });

  it('returns true when current is newer minor', () => {
    expect(isCompatible(v(1, 3, 0), v(1, 2, 3))).toBe(true);
  });

  it('returns false for different major', () => {
    expect(isCompatible(v(2, 0, 0), v(1, 9, 9))).toBe(false);
  });

  it('returns false when current is older minor', () => {
    expect(isCompatible(v(1, 1, 0), v(1, 2, 0))).toBe(false);
  });

  it('returns false when current is older patch', () => {
    expect(isCompatible(v(1, 2, 1), v(1, 2, 3))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// compareVersions
// ---------------------------------------------------------------------------

describe('compareVersions', () => {
  const v = (major: number, minor: number, patch: number): ProcessVersion => ({
    major, minor, patch,
  });

  it('returns 0 for equal versions', () => {
    expect(compareVersions(v(1, 2, 3), v(1, 2, 3))).toBe(0);
  });

  it('returns -1 when first is smaller', () => {
    expect(compareVersions(v(1, 0, 0), v(2, 0, 0))).toBe(-1);
    expect(compareVersions(v(1, 1, 0), v(1, 2, 0))).toBe(-1);
    expect(compareVersions(v(1, 2, 1), v(1, 2, 3))).toBe(-1);
  });

  it('returns 1 when first is larger', () => {
    expect(compareVersions(v(3, 0, 0), v(2, 0, 0))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// migrateProcess
// ---------------------------------------------------------------------------

describe('migrateProcess', () => {
  it('returns migrated definition with new version stamp', () => {
    const oldDef = { name: 'my-process', tasks: [] };
    const from: ProcessVersion = { major: 1, minor: 0, patch: 0 };
    const to: ProcessVersion = { major: 2, minor: 0, patch: 0 };

    const result = migrateProcess(oldDef, from, to);
    expect(result.definition['version']).toBe('2.0.0');
    expect(result.definition['name']).toBe('my-process');
    expect(result.appliedMigrations).toHaveLength(1);
    expect(result.appliedMigrations[0]).toContain('1.0.0 -> 2.0.0');
  });

  it('does not mutate original definition', () => {
    const oldDef = { name: 'original' };
    const from: ProcessVersion = { major: 1, minor: 0, patch: 0 };
    const to: ProcessVersion = { major: 1, minor: 1, patch: 0 };

    migrateProcess(oldDef, from, to);
    expect(oldDef).not.toHaveProperty('version');
  });
});

// ---------------------------------------------------------------------------
// diffProcessVersions
// ---------------------------------------------------------------------------

describe('diffProcessVersions', () => {
  const v = (major: number, minor: number, patch: number, hash?: string): ProcessVersion => ({
    major, minor, patch, hash,
  });

  it('returns empty array for identical versions', () => {
    expect(diffProcessVersions(v(1, 2, 3), v(1, 2, 3))).toEqual([]);
  });

  it('detects major version change', () => {
    const changes = diffProcessVersions(v(1, 0, 0), v(2, 0, 0));
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('major');
    expect(changes[0].description).toContain('breaking change');
  });

  it('detects minor version change', () => {
    const changes = diffProcessVersions(v(1, 0, 0), v(1, 3, 0));
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('minor');
    expect(changes[0].description).toContain('new features');
  });

  it('detects patch version change', () => {
    const changes = diffProcessVersions(v(1, 0, 0), v(1, 0, 5));
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe('patch');
    expect(changes[0].description).toContain('bug fixes');
  });

  it('detects hash added', () => {
    const changes = diffProcessVersions(v(1, 0, 0), v(1, 0, 0, 'abc'));
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('added');
  });

  it('detects hash removed', () => {
    const changes = diffProcessVersions(v(1, 0, 0, 'abc'), v(1, 0, 0));
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('removed');
  });

  it('detects multiple changes', () => {
    const changes = diffProcessVersions(v(1, 2, 3), v(2, 3, 4));
    expect(changes).toHaveLength(3);
  });
});
