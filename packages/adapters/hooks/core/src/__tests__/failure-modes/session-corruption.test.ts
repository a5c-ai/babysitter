import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadSession, saveSession } from '../../session-store/store';
import { getSessionFilePath } from '../../session-store/paths';
import type { SessionState } from '../../types/session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'session-corruption-test-'));
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    version: 'a5c.hooks.session.v1',
    sessionId: 'corruption-test',
    adapter: 'claude-code',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:00:00.000Z',
    persistedEnv: {},
    contextVars: {},
    contextFragments: [],
    metadata: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('session-corruption failure modes', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns null for corrupted JSON file content', async () => {
    const sessionId = 'corrupt-json';
    const filePath = getSessionFilePath(sessionId, tmpDir);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, '{{{invalid json!!!', 'utf-8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const loaded = await loadSession(sessionId, tmpDir);
    expect(loaded).toBeNull();
    warnSpy.mockRestore();
  });

  it('creates backup file for corrupted session', async () => {
    const sessionId = 'corrupt-backup';
    const filePath = getSessionFilePath(sessionId, tmpDir);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, 'NOT VALID JSON AT ALL', 'utf-8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await loadSession(sessionId, tmpDir);
    warnSpy.mockRestore();

    // Check that a .corrupt.* backup file was created
    const files = await fs.promises.readdir(tmpDir);
    const backups = files.filter((f) => f.includes('.corrupt.'));
    expect(backups.length).toBeGreaterThanOrEqual(1);

    // Verify backup content matches original corruption
    const backupContent = await fs.promises.readFile(
      path.join(tmpDir, backups[0]),
      'utf-8',
    );
    expect(backupContent).toBe('NOT VALID JSON AT ALL');
  });

  it('returns null for empty file', async () => {
    const sessionId = 'empty-file';
    const filePath = getSessionFilePath(sessionId, tmpDir);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, '', 'utf-8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const loaded = await loadSession(sessionId, tmpDir);
    expect(loaded).toBeNull();
    warnSpy.mockRestore();
  });

  it('returns null for missing session directory', async () => {
    // tmpDir exists but the session file does not
    const loaded = await loadSession('nonexistent-session', tmpDir);
    expect(loaded).toBeNull();
  });

  it('returns null for session in completely missing directory', async () => {
    const missingDir = path.join(tmpDir, 'does', 'not', 'exist');
    const loaded = await loadSession('any-session', missingDir);
    expect(loaded).toBeNull();
  });

  it('recovers gracefully after corruption: can save a new session', async () => {
    const sessionId = 'recover-after-corrupt';
    const filePath = getSessionFilePath(sessionId, tmpDir);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, 'GARBAGE', 'utf-8');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const corrupted = await loadSession(sessionId, tmpDir);
    expect(corrupted).toBeNull();
    warnSpy.mockRestore();

    // Now save a valid session
    const session = makeSession({ sessionId });
    await saveSession(session, tmpDir);

    // Should load successfully now
    const loaded = await loadSession(sessionId, tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.sessionId).toBe(sessionId);
  });

  it('handles binary/null byte content as corruption', async () => {
    const sessionId = 'binary-content';
    const filePath = getSessionFilePath(sessionId, tmpDir);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, Buffer.from([0x00, 0x01, 0xFF, 0xFE]));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const loaded = await loadSession(sessionId, tmpDir);
    expect(loaded).toBeNull();
    warnSpy.mockRestore();
  });
});
