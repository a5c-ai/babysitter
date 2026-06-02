import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionState, ContextFragment } from '../../types/session';
import {
  loadSession,
  saveSession,
  deleteSession,
  updateSession,
  addContextFragment,
  SESSION_SCHEMA_VERSION,
} from '../store';
import { getDefaultSessionDir, getSessionFilePath } from '../paths';
import { acquireLock, releaseLock } from '../lock';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'session-store-test-'));
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    version: 'a5c.hooks.session.v1',
    sessionId: 'test-session-1',
    adapter: 'claude-code',
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:00:00.000Z',
    cwd: '/tmp/test',
    persistedEnv: {},
    contextVars: {},
    contextFragments: [],
    metadata: {},
    ...overrides,
  };
}

describe('session-store', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  // ----------------------------------------------------------------
  // Basic CRUD
  // ----------------------------------------------------------------
  describe('load / save / delete cycle', () => {
    it('returns null for a non-existent session', async () => {
      const result = await loadSession('does-not-exist', tmpDir);
      expect(result).toBeNull();
    });

    it('round-trips a session through save and load', async () => {
      const session = makeSession();
      await saveSession(session, tmpDir);

      const loaded = await loadSession(session.sessionId, tmpDir);
      expect(loaded).toEqual(session);
    });

    it('persists the schema version in the envelope', async () => {
      const session = makeSession();
      await saveSession(session, tmpDir);

      const raw = JSON.parse(
        await fs.promises.readFile(getSessionFilePath(session.sessionId, tmpDir), 'utf-8'),
      );
      expect(raw.schemaVersion).toBe(SESSION_SCHEMA_VERSION);
    });

    it('deletes a session', async () => {
      const session = makeSession();
      await saveSession(session, tmpDir);
      await deleteSession(session.sessionId, tmpDir);

      const loaded = await loadSession(session.sessionId, tmpDir);
      expect(loaded).toBeNull();
    });

    it('deleteSession is idempotent (no error if missing)', async () => {
      await expect(deleteSession('no-such', tmpDir)).resolves.toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // Atomic write
  // ----------------------------------------------------------------
  describe('atomic write', () => {
    it('does not leave a temp file behind on success', async () => {
      const session = makeSession();
      await saveSession(session, tmpDir);

      const files = await fs.promises.readdir(tmpDir);
      const temps = files.filter((f) => f.includes('.tmp-'));
      expect(temps).toHaveLength(0);
    });

    it('final file contains valid JSON', async () => {
      const session = makeSession({ sessionId: 'atomic-check' });
      await saveSession(session, tmpDir);

      const raw = await fs.promises.readFile(
        getSessionFilePath('atomic-check', tmpDir),
        'utf-8',
      );
      expect(() => JSON.parse(raw)).not.toThrow();
    });
  });

  // ----------------------------------------------------------------
  // Corruption recovery
  // ----------------------------------------------------------------
  describe('corruption recovery', () => {
    it('backs up a corrupt file and returns null', async () => {
      const sessionId = 'corrupt-session';
      const filePath = getSessionFilePath(sessionId, tmpDir);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, '<<<NOT JSON>>>', 'utf-8');

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const loaded = await loadSession(sessionId, tmpDir);
      expect(loaded).toBeNull();

      // Verify backup was created
      const files = await fs.promises.readdir(tmpDir);
      const backups = files.filter((f) => f.includes('.corrupt.'));
      expect(backups.length).toBeGreaterThanOrEqual(1);

      warnSpy.mockRestore();
    });
  });

  // ----------------------------------------------------------------
  // Update with locking
  // ----------------------------------------------------------------
  describe('updateSession', () => {
    it('applies an updater function', async () => {
      const session = makeSession({ metadata: { counter: 0 } });
      await saveSession(session, tmpDir);

      await updateSession(
        session.sessionId,
        (s) => ({
          ...s,
          metadata: { ...s.metadata, counter: ((s.metadata.counter as number) ?? 0) + 1 },
        }),
        tmpDir,
      );

      const loaded = await loadSession(session.sessionId, tmpDir);
      expect(loaded?.metadata.counter).toBe(1);
    });

    it('throws when updating a non-existent session', async () => {
      await expect(
        updateSession('nope', (s) => s, tmpDir),
      ).rejects.toThrow(/not found/);
    });
  });

  // ----------------------------------------------------------------
  // Concurrent update locking
  // ----------------------------------------------------------------
  describe('concurrent locking', () => {
    it('serializes concurrent updates', async () => {
      const session = makeSession({ metadata: { counter: 0 } });
      await saveSession(session, tmpDir);

      // Run 10 parallel increments -- without locking we'd lose updates
      const N = 10;
      await Promise.all(
        Array.from({ length: N }, () =>
          updateSession(
            session.sessionId,
            (s) => ({
              ...s,
              metadata: { ...s.metadata, counter: ((s.metadata.counter as number) ?? 0) + 1 },
            }),
            tmpDir,
          ),
        ),
      );

      const loaded = await loadSession(session.sessionId, tmpDir);
      expect(loaded?.metadata.counter).toBe(N);
    });
  });

  // ----------------------------------------------------------------
  // Context fragment accumulation
  // ----------------------------------------------------------------
  describe('addContextFragment', () => {
    it('appends fragments in order', async () => {
      const session = makeSession();
      await saveSession(session, tmpDir);

      const frag1: ContextFragment = {
        fragmentId: 'f1',
        source: 'test',
        createdAt: new Date().toISOString(),
        data: { a: 1 },
      };
      const frag2: ContextFragment = {
        fragmentId: 'f2',
        source: 'test',
        createdAt: new Date().toISOString(),
        data: { b: 2 },
      };

      await addContextFragment(session.sessionId, frag1, tmpDir);
      await addContextFragment(session.sessionId, frag2, tmpDir);

      const loaded = await loadSession(session.sessionId, tmpDir);
      expect(loaded?.contextFragments).toHaveLength(2);
      expect(loaded?.contextFragments[0].fragmentId).toBe('f1');
      expect(loaded?.contextFragments[1].fragmentId).toBe('f2');
    });

    it('updates updatedAt', async () => {
      const session = makeSession({ updatedAt: '2020-01-01T00:00:00.000Z' });
      await saveSession(session, tmpDir);

      await addContextFragment(
        session.sessionId,
        { fragmentId: 'f', source: 'x', createdAt: new Date().toISOString(), data: {} },
        tmpDir,
      );

      const loaded = await loadSession(session.sessionId, tmpDir);
      expect(loaded?.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
    });
  });

  // ----------------------------------------------------------------
  // Path resolution
  // ----------------------------------------------------------------
  describe('paths', () => {
    it('getSessionFilePath returns a .json path', () => {
      const p = getSessionFilePath('abc', '/tmp/sessions');
      expect(p).toBe(path.join('/tmp/sessions', 'abc.json'));
    });

    it('getDefaultSessionDir respects XDG_STATE_HOME', () => {
      const orig = process.env['XDG_STATE_HOME'];
      try {
        process.env['XDG_STATE_HOME'] = '/custom/state';
        const dir = getDefaultSessionDir();
        expect(dir).toBe(path.join('/custom/state', 'a5c-hooks', 'sessions'));
      } finally {
        if (orig === undefined) {
          delete process.env['XDG_STATE_HOME'];
        } else {
          process.env['XDG_STATE_HOME'] = orig;
        }
      }
    });
  });

  // ----------------------------------------------------------------
  // Lock primitives
  // ----------------------------------------------------------------
  describe('acquireLock / releaseLock', () => {
    it('acquire then release succeeds', async () => {
      const target = path.join(tmpDir, 'locktest.json');
      await acquireLock(target);
      await releaseLock(target);
    });

    it('double acquire without release times out quickly', async () => {
      const target = path.join(tmpDir, 'locktest2.json');
      await acquireLock(target);

      await expect(acquireLock(target, 200)).rejects.toThrow(/Failed to acquire lock/);

      await releaseLock(target);
    });
  });
});
