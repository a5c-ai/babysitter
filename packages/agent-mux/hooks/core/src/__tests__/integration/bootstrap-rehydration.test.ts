import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveSession, loadSession } from '../../session-store/store';
import type { SessionState } from '../../types/session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap-rehydration-test-'));
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    version: 'a5c.hooks.session.v1',
    sessionId: 'rehydration-test-session',
    adapter: 'claude-code',
    createdAt: '2026-04-17T10:00:00.000Z',
    updatedAt: '2026-04-17T10:00:00.000Z',
    cwd: '/workspace/project',
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

describe('bootstrap-rehydration integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('saves a session and loads it back with sessionId intact', async () => {
    const session = makeSession({ sessionId: 'sess-abc-123' });
    await saveSession(session, tmpDir);

    const loaded = await loadSession('sess-abc-123', tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.sessionId).toBe('sess-abc-123');
    expect(loaded!.version).toBe('a5c.hooks.session.v1');
  });

  it('preserves persistedEnv through save/load cycle', async () => {
    const persistedEnv = {
      HOOKS_PROXY_PERSIST_TOKEN: 'secret-token-value',
      HOOKS_PROXY_PERSIST_WORKSPACE: '/home/user/project',
      CUSTOM_PLUGIN_KEY: 'custom-value',
    };

    const session = makeSession({
      sessionId: 'env-persist-test',
      persistedEnv,
    });
    await saveSession(session, tmpDir);

    const loaded = await loadSession('env-persist-test', tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.persistedEnv).toEqual(persistedEnv);
    expect(loaded!.persistedEnv['HOOKS_PROXY_PERSIST_TOKEN']).toBe('secret-token-value');
    expect(loaded!.persistedEnv['HOOKS_PROXY_PERSIST_WORKSPACE']).toBe('/home/user/project');
    expect(loaded!.persistedEnv['CUSTOM_PLUGIN_KEY']).toBe('custom-value');
  });

  it('preserves contextVars and metadata through save/load cycle', async () => {
    const session = makeSession({
      sessionId: 'full-state-test',
      contextVars: { mode: 'development', theme: 'dark' },
      metadata: { lastTool: 'Bash', invocationCount: 42 },
    });
    await saveSession(session, tmpDir);

    const loaded = await loadSession('full-state-test', tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.contextVars).toEqual({ mode: 'development', theme: 'dark' });
    expect(loaded!.metadata).toEqual({ lastTool: 'Bash', invocationCount: 42 });
  });

  it('preserves adapter field through rehydration', async () => {
    const session = makeSession({
      sessionId: 'adapter-test',
      adapter: 'codex',
    });
    await saveSession(session, tmpDir);

    const loaded = await loadSession('adapter-test', tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.adapter).toBe('codex');
  });

  it('preserves context fragments through rehydration', async () => {
    const session = makeSession({
      sessionId: 'fragments-test',
      contextFragments: [
        {
          fragmentId: 'frag-1',
          source: 'plugin-a',
          createdAt: '2026-04-17T10:00:00.000Z',
          data: { key: 'value' },
        },
      ],
    });
    await saveSession(session, tmpDir);

    const loaded = await loadSession('fragments-test', tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.contextFragments).toHaveLength(1);
    expect(loaded!.contextFragments[0].fragmentId).toBe('frag-1');
    expect(loaded!.contextFragments[0].data).toEqual({ key: 'value' });
  });
});
