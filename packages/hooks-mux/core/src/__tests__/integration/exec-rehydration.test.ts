import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveSession } from '../../session-store/store';
import { materializeExecContext } from '../../propagation/materialize';
import { loadSession } from '../../session-store/store';
import type { SessionState } from '../../types/session';
import type { SessionStore } from '../../propagation/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'exec-rehydration-test-'));
}

function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    version: 'a5c.hooks.session.v1',
    sessionId: 'exec-rehydration-session',
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

function createSessionStore(sessionDir: string): SessionStore {
  return {
    loadSession: (sessionId: string) => loadSession(sessionId, sessionDir),
    saveSession: (session: SessionState) => saveSession(session, sessionDir),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('exec-rehydration integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('materializes AGENT_SESSION_ID from session', async () => {
    const session = makeSession({ sessionId: 'sess-42' });
    await saveSession(session, tmpDir);

    const store = createSessionStore(tmpDir);
    const result = await materializeExecContext({
      sessionId: 'sess-42',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['AGENT_SESSION_ID']).toBe('sess-42');
  });

  it('materializes AGENT_ADAPTER from session', async () => {
    const session = makeSession({
      sessionId: 'adapter-sess',
      adapter: 'codex',
    });
    await saveSession(session, tmpDir);

    const store = createSessionStore(tmpDir);
    const result = await materializeExecContext({
      sessionId: 'adapter-sess',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['AGENT_ADAPTER']).toBe('codex');
  });

  it('rehydrates persisted env vars (non-AGENT_ prefixed) into materialized env', async () => {
    const session = makeSession({
      sessionId: 'persist-env-sess',
      persistedEnv: {
        MY_PLUGIN_TOKEN: 'abc-123',
        HOOKS_PROXY_PERSIST_FOO: 'bar',
        AGENT_SHOULD_SKIP: 'this-is-skipped',
      },
    });
    await saveSession(session, tmpDir);

    const store = createSessionStore(tmpDir);
    const result = await materializeExecContext({
      sessionId: 'persist-env-sess',
      sessionStore: store,
      tempDir: tmpDir,
    });

    // Non-AGENT_ keys should be rehydrated
    expect(result.env['MY_PLUGIN_TOKEN']).toBe('abc-123');
    expect(result.env['HOOKS_PROXY_PERSIST_FOO']).toBe('bar');

    // AGENT_ prefixed keys from persistedEnv should be skipped (injected explicitly)
    expect(result.env['AGENT_SHOULD_SKIP']).toBeUndefined();

    // Standard AGENT_ keys should still be present
    expect(result.env['AGENT_SESSION_ID']).toBe('persist-env-sess');
  });

  it('respects envAllowlist when rehydrating persisted env', async () => {
    const session = makeSession({
      sessionId: 'allowlist-sess',
      persistedEnv: {
        ALLOWED_KEY: 'yes',
        BLOCKED_KEY: 'no',
      },
    });
    await saveSession(session, tmpDir);

    const store = createSessionStore(tmpDir);
    const result = await materializeExecContext({
      sessionId: 'allowlist-sess',
      sessionStore: store,
      envAllowlist: ['ALLOWED_KEY'],
      tempDir: tmpDir,
    });

    expect(result.env['ALLOWED_KEY']).toBe('yes');
    expect(result.env['BLOCKED_KEY']).toBeUndefined();
  });

  it('materializes workspace root from session cwd', async () => {
    const session = makeSession({
      sessionId: 'workspace-sess',
      cwd: '/home/user/project',
    });
    await saveSession(session, tmpDir);

    const store = createSessionStore(tmpDir);
    const result = await materializeExecContext({
      sessionId: 'workspace-sess',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['AGENT_WORKSPACE_ROOT']).toBe('/home/user/project');
  });

  it('generates temp env file path', async () => {
    const session = makeSession({ sessionId: 'tempfile-sess' });
    await saveSession(session, tmpDir);

    const store = createSessionStore(tmpDir);
    const result = await materializeExecContext({
      sessionId: 'tempfile-sess',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.tempEnvFilePath).toBeDefined();
    // The file should exist on disk
    const stat = await fs.promises.stat(result.tempEnvFilePath!);
    expect(stat.isFile()).toBe(true);

    // And contain valid export lines
    const content = await fs.promises.readFile(result.tempEnvFilePath!, 'utf-8');
    expect(content).toContain('AGENT_SESSION_ID=');
  });

  it('returns empty env (only session ID) when session is missing', async () => {
    const store = createSessionStore(tmpDir);
    const result = await materializeExecContext({
      sessionId: 'nonexistent',
      sessionStore: store,
      tempDir: tmpDir,
    });

    expect(result.env['AGENT_SESSION_ID']).toBe('nonexistent');
    // No other AGENT_ keys since session does not exist
    expect(result.env['AGENT_ADAPTER']).toBeUndefined();
  });
});
