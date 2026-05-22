/**
 * E2E integration tests for the `exec` command.
 *
 * Tests context rehydration: saving a session with persisted env,
 * then running `exec --session-id <id> -- <command>` to verify
 * the env vars are injected into the child process.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempSessionRoot,
  runCli,
  writeSessionFile,
} from './helpers';

describe('exec — context rehydration (e2e)', { timeout: 30000 }, () => {
  let tmpRoot: string;
  let sessionDir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const result = await createTempSessionRoot();
    tmpRoot = result.tmpRoot;
    sessionDir = result.sessionDir;
    cleanup = result.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  function baseEnv(): Record<string, string> {
    return {
      XDG_STATE_HOME: tmpRoot,
    };
  }

  it('exec rehydrates AGENT_SESSION_ID into child process', async () => {
    const sessionId = 'e2e-exec-rehydrate-1';

    // Pre-save a session with some persisted env
    await writeSessionFile(sessionDir, sessionId, {
      version: 'a5c.hooks.session.v1',
      sessionId,
      adapter: 'claude',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      persistedEnv: {
        CUSTOM_VAR: 'custom_value',
      },
      contextVars: {},
      contextFragments: [],
      metadata: {},
    });

    const result = await runCli(
      [
        'exec',
        '--session-id', sessionId,
        '--',
        'node', '-e', 'console.log(JSON.stringify({sid:process.env.AGENT_SESSION_ID,custom:process.env.CUSTOM_VAR,adapter:process.env.AGENT_ADAPTER}))',
      ],
      {
        env: baseEnv(),
      },
    );

    // Debug: capture stderr if test fails
    expect(result.exitCode, `exec failed with stderr: ${result.stderr}`).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.sid).toBe(sessionId);
    expect(output.custom).toBe('custom_value');
    expect(output.adapter).toBe('claude');
  });

  it('exec with missing session still injects AGENT_SESSION_ID', async () => {
    const sessionId = 'nonexistent-session-id';

    const result = await runCli(
      [
        'exec',
        '--session-id', sessionId,
        '--',
        'node', '-e', 'console.log(process.env.AGENT_SESSION_ID || "not-set")',
      ],
      {
        env: baseEnv(),
      },
    );

    // materializeExecContext injects AGENT_SESSION_ID even when no session
    // file exists on disk. The fallback in exec.ts ensures this works.
    expect(result.exitCode, `exec failed with stderr: ${result.stderr}`).toBe(0);
    expect(result.stdout.trim()).toBe(sessionId);
  });

  it('exec with no command after -- reports error', async () => {
    const result = await runCli(
      [
        'exec',
        '--session-id', 'some-session',
        '--',
      ],
      {
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No command specified');
  });

  it('exec rehydrates cwd as AGENT_WORKSPACE_ROOT', async () => {
    const sessionId = 'e2e-exec-cwd';

    await writeSessionFile(sessionDir, sessionId, {
      version: 'a5c.hooks.session.v1',
      sessionId,
      adapter: 'claude',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cwd: '/some/project/dir',
      persistedEnv: {},
      contextVars: {},
      contextFragments: [],
      metadata: {},
    });

    const result = await runCli(
      [
        'exec',
        '--session-id', sessionId,
        '--',
        'node', '-e', 'console.log(process.env.AGENT_WORKSPACE_ROOT)',
      ],
      {
        env: baseEnv(),
      },
    );

    expect(result.exitCode, `exec failed with stderr: ${result.stderr}`).toBe(0);
    expect(result.stdout.trim()).toBe('/some/project/dir');
  });
});
