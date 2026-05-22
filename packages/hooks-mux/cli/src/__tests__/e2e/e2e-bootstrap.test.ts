/**
 * E2E integration tests for the `bootstrap` command.
 *
 * Tests dedicated session bootstrap without handler execution,
 * and verifies session continuity between bootstrap and invoke.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempSessionRoot,
  runCli,
  readSessionFile,
  writeHandlerScript,
  cleanupLaunchers,
} from './helpers';

describe('bootstrap — session initialization (e2e)', { timeout: 30000 }, () => {
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
    await cleanupLaunchers(tmpRoot);
    await cleanup();
  });

  function baseEnv(): Record<string, string> {
    return {
      XDG_STATE_HOME: tmpRoot,
    };
  }

  it('bootstrap --adapter claude creates session file with JSON output', async () => {
    const sessionId = 'e2e-boot-native-stdin-1';
    const envFilePath = path.join(tmpRoot, 'bootstrap-claude-env.txt');
    await fs.promises.writeFile(envFilePath, '', 'utf-8');
    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      source: 'startup',
      cwd: '/workspace/bootstrap-native',
    });

    const result = await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
        '--json',
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          CLAUDE_ENV_FILE: envFilePath,
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.status).toBe('bootstrapped');
    expect(output.sessionId).toBe(sessionId);
    expect(output.adapter).toBe('claude');

    // Verify session file on disk
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    expect(session['sessionId']).toBe(sessionId);
    expect(session['adapter']).toBe('claude');
    expect(session['version']).toBe('a5c.hooks.session.v1');
    expect(session['cwd']).toBe('/workspace/bootstrap-native');
    expect(session['persistedEnv']).toEqual(expect.objectContaining({
      AGENT_SESSION_ID: sessionId,
    }));

    const envFileContent = await fs.promises.readFile(envFilePath, 'utf-8');
    expect(envFileContent).toContain(`export AGENT_SESSION_ID="${sessionId}"`);
  });

  it('bootstrap without --json outputs human-readable message', async () => {
    const sessionId = 'e2e-boot-human';
    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      source: 'startup',
    });

    const result = await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
      ],
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
    expect(result.stderr).toContain(sessionId);
    expect(result.stderr).toContain('claude');
  });

  it('bootstrap falls back to a synthetic session ID only when no native Claude payload or explicit override is available', async () => {
    const result = await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
        '--json',
      ],
      {
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.status).toBe('bootstrapped');
    // Session ID should be auto-generated as bootstrap-<timestamp>
    expect(output.sessionId).toMatch(/^bootstrap-\d+$/);
  });

  it('bootstrap then invoke maintains session continuity', async () => {
    const sessionId = 'e2e-boot-then-invoke';
    const envFilePath = path.join(tmpRoot, 'env-file.txt');
    await fs.promises.writeFile(envFilePath, '', 'utf-8');
    const bootstrapPayload = JSON.stringify({
      session_id: sessionId,
      source: 'startup',
    });

    // Step 1: Bootstrap creates the session
    const bootstrapResult = await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
        '--json',
      ],
      {
        stdin: bootstrapPayload,
        env: baseEnv(),
      },
    );

    expect(bootstrapResult.exitCode).toBe(0);
    expect(JSON.parse(bootstrapResult.stdout.trim()).sessionId).toBe(sessionId);

    // Step 2: Invoke with a handler that adds env to the existing session
    const handlerCmd = await writeHandlerScript(tmpRoot, 'add-env-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'noop',
        persistEnv: { ADDED_BY_INVOKE: 'yes' }
      }));
    `);
    const stdinPayload = JSON.stringify({
      session_id: sessionId,
    });

    const invokeResult = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--native-event', 'SessionStart',
        '--handler', handlerCmd,
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          CLAUDE_ENV_FILE: envFilePath,
        },
      },
    );

    expect(invokeResult.exitCode).toBe(0);

    // Step 3: Verify the session was updated (not recreated)
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    expect(session['sessionId']).toBe(sessionId);
    expect(session['adapter']).toBe('claude');

    const persistedEnv = session['persistedEnv'] as Record<string, string>;
    expect(persistedEnv['ADDED_BY_INVOKE']).toBe('yes');
  });

  it('bootstrap with AGENT_SESSION_ID env var uses it as session ID', async () => {
    const sessionId = 'e2e-boot-from-env';

    const result = await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
        '--json',
      ],
      {
        env: {
          ...baseEnv(),
          AGENT_SESSION_ID: sessionId,
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.sessionId).toBe(sessionId);

    // Verify session file
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
  });

  it('bootstrap is idempotent — re-bootstrapping loads existing session', async () => {
    const sessionId = 'e2e-boot-idempotent';
    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      source: 'startup',
    });

    // First bootstrap
    await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
        '--json',
      ],
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    // Read the session to get createdAt
    const firstSession = await readSessionFile(sessionDir, sessionId);
    const firstCreatedAt = (firstSession!['session'] as Record<string, unknown>)['createdAt'];

    // Second bootstrap — should load existing, not overwrite
    const result = await runCli(
      [
        'bootstrap',
        '--adapter', 'claude',
        '--json',
      ],
      {
        stdin: stdinPayload,
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);

    const secondSession = await readSessionFile(sessionDir, sessionId);
    const secondCreatedAt = (secondSession!['session'] as Record<string, unknown>)['createdAt'];
    expect(secondCreatedAt).toBe(firstCreatedAt);
  });
});
