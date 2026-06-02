import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  SESSION_PID_MARKER_ENV_VAR,
  isSessionPidMarkerEnabled,
  findHarnessAncestorPid,
  writeSessionMarker,
  readSessionMarker,
  cleanupSessionMarker,
  getSessionMarkerPath,
  __setAncestorResolverForTests,
  __resetCacheForTests,
} from '../markers';

describe('isSessionPidMarkerEnabled', () => {
  const original = process.env[SESSION_PID_MARKER_ENV_VAR];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[SESSION_PID_MARKER_ENV_VAR];
    } else {
      process.env[SESSION_PID_MARKER_ENV_VAR] = original;
    }
  });

  it('returns false when env var is not set', () => {
    delete process.env[SESSION_PID_MARKER_ENV_VAR];
    expect(isSessionPidMarkerEnabled()).toBe(false);
  });

  it('returns false when env var is empty string', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = '';
    expect(isSessionPidMarkerEnabled()).toBe(false);
  });

  it('returns true when env var is "1"', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = '1';
    expect(isSessionPidMarkerEnabled()).toBe(true);
  });

  it('returns true when env var is "true"', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = 'true';
    expect(isSessionPidMarkerEnabled()).toBe(true);
  });

  it('returns true when env var is "TRUE" (case insensitive)', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = 'TRUE';
    expect(isSessionPidMarkerEnabled()).toBe(true);
  });

  it('returns false when env var is "0"', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = '0';
    expect(isSessionPidMarkerEnabled()).toBe(false);
  });

  it('returns false when env var is "false"', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = 'false';
    expect(isSessionPidMarkerEnabled()).toBe(false);
  });
});

describe('findHarnessAncestorPid', () => {
  const original = process.env[SESSION_PID_MARKER_ENV_VAR];

  beforeEach(() => {
    __resetCacheForTests();
  });

  afterEach(() => {
    __resetCacheForTests();
    if (original === undefined) {
      delete process.env[SESSION_PID_MARKER_ENV_VAR];
    } else {
      process.env[SESSION_PID_MARKER_ENV_VAR] = original;
    }
  });

  it('returns null when PID markers are disabled', () => {
    delete process.env[SESSION_PID_MARKER_ENV_VAR];
    expect(findHarnessAncestorPid(['claude'])).toBeNull();
  });

  it('uses override when set', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = '1';
    __setAncestorResolverForTests(() => ({ pid: 12345, name: 'claude' }));
    const result = findHarnessAncestorPid(['claude']);
    expect(result).toEqual({ pid: 12345, name: 'claude' });
  });

  it('returns null from override when no match', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = '1';
    __setAncestorResolverForTests(() => null);
    const result = findHarnessAncestorPid(['claude']);
    expect(result).toBeNull();
  });
});

describe('getSessionMarkerPath', () => {
  it('produces correct path format', () => {
    const p = getSessionMarkerPath('claude-code', 1234);
    const expectedDir = path.join(os.homedir(), '.a5c');
    expect(p).toBe(path.join(expectedDir, 'current-session-claude-code-pid-1234'));
  });

  it('sanitizes harness slug', () => {
    const p = getSessionMarkerPath('Some Weird Name!', 42);
    expect(p).toContain('current-session-some-weird-name-pid-42');
  });

  it('uses "harness" for empty slug', () => {
    const p = getSessionMarkerPath('!!!', 42);
    expect(p).toContain('current-session-harness-pid-42');
  });
});

describe('write/read/cleanup session marker (integration)', () => {
  const original = process.env[SESSION_PID_MARKER_ENV_VAR];
  let tmpDir: string;

  beforeEach(() => {
    __resetCacheForTests();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markers-test-'));
  });

  afterEach(() => {
    __resetCacheForTests();
    if (original === undefined) {
      delete process.env[SESSION_PID_MARKER_ENV_VAR];
    } else {
      process.env[SESSION_PID_MARKER_ENV_VAR] = original;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writeSessionMarker is no-op when disabled', () => {
    delete process.env[SESSION_PID_MARKER_ENV_VAR];
    // Should not throw
    writeSessionMarker('claude', 'sess-1');
  });

  it('readSessionMarker returns null when disabled', () => {
    delete process.env[SESSION_PID_MARKER_ENV_VAR];
    expect(readSessionMarker('claude')).toBeNull();
  });

  it('cleanupSessionMarker is no-op when disabled', () => {
    delete process.env[SESSION_PID_MARKER_ENV_VAR];
    // Should not throw
    cleanupSessionMarker('claude');
  });

  it('writeSessionMarker is no-op when no ancestor found', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = '1';
    __setAncestorResolverForTests(() => null);
    // Should not throw
    writeSessionMarker('claude', 'sess-1');
  });

  it('readSessionMarker returns null when no ancestor found', () => {
    process.env[SESSION_PID_MARKER_ENV_VAR] = '1';
    __setAncestorResolverForTests(() => null);
    expect(readSessionMarker('claude')).toBeNull();
  });
});
