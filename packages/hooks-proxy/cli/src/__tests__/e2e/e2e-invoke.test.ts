/**
 * E2E integration tests for the `invoke` command.
 *
 * These tests exercise the full CLI pipeline with real child processes,
 * real adapter resolution, real session store, and real handler subprocesses.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempSessionRoot,
  runCli,
  readSessionFile,
  writeHandlerScript,
} from './helpers';

describe('invoke — full CLI pipeline (e2e)', { timeout: 30000 }, () => {
  let tmpRoot: string;
  let sessionDir: string;
  let cleanup: () => Promise<void>;
  let envFilePath: string;

  beforeEach(async () => {
    const result = await createTempSessionRoot();
    tmpRoot = result.tmpRoot;
    sessionDir = result.sessionDir;
    cleanup = result.cleanup;
    // Create a temp file for CLAUDE_ENV_FILE
    envFilePath = path.join(tmpRoot, 'claude-env.txt');
    await fs.promises.writeFile(envFilePath, '', 'utf-8');
  });

  afterEach(async () => {
    await cleanup();
  });

  function baseEnv(): Record<string, string> {
    return {
      XDG_STATE_HOME: tmpRoot,
      CLAUDE_ENV_FILE: envFilePath,
    };
  }

  it('session-start bootstrap-only creates session file', async () => {
    const sessionId = 'e2e-bootstrap-sess-1';
    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      event_name: 'SessionStart',
      source: 'startup',
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--bootstrap-only',
        '--json',
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.status).toBe('bootstrapped');
    expect(output.sessionId).toBe(sessionId);

    // Verify session file was created on disk
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();

    const session = sessionData!['session'] as Record<string, unknown>;
    expect(session['sessionId']).toBe(sessionId);
    expect(session['adapter']).toBe('claude');
  });

  it('session-start with handler that adds persistEnv', async () => {
    const sessionId = 'e2e-handler-env-sess';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'persist-env-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'allow',
        persistEnv: { MY_CUSTOM_VAR: 'hello_world' }
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      event_name: 'SessionStart',
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    // Output should contain the persistEnv
    const output = JSON.parse(result.stdout.trim());
    expect(output.persistEnv).toBeDefined();
    expect(output.persistEnv.MY_CUSTOM_VAR).toBe('hello_world');

    // Verify CLAUDE_ENV_FILE was written to
    const envFileContent = await fs.promises.readFile(envFilePath, 'utf-8');
    expect(envFileContent).toContain('MY_CUSTOM_VAR');
    expect(envFileContent).toContain('hello_world');

    // Verify session was updated with persistedEnv
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    const persistedEnv = session['persistedEnv'] as Record<string, string>;
    expect(persistedEnv['MY_CUSTOM_VAR']).toBe('hello_world');
  });

  it('tool.before deny decision from handler', async () => {
    const sessionId = 'e2e-deny-sess';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'deny-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'deny',
        reason: 'blocked by policy'
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'rm -rf /' },
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'PreToolUse',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.decision).toBe('deny');
    expect(output.reason).toContain('blocked by policy');
  });

  it('multiple handlers fan-out merges env from both', async () => {
    const sessionId = 'e2e-fanout-sess';

    const handler1 = await writeHandlerScript(tmpRoot, 'handler1', `
      process.stdout.write(JSON.stringify({
        decision: 'allow',
        persistEnv: { HANDLER1_VAR: 'value1' }
      }));
    `);
    const handler2 = await writeHandlerScript(tmpRoot, 'handler2', `
      process.stdout.write(JSON.stringify({
        decision: 'allow',
        persistEnv: { HANDLER2_VAR: 'value2' }
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      event_name: 'SessionStart',
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--handler', handler1,
        '--handler', handler2,
        '--session-id', sessionId,
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.persistEnv).toBeDefined();
    expect(output.persistEnv.HANDLER1_VAR).toBe('value1');
    expect(output.persistEnv.HANDLER2_VAR).toBe('value2');

    // Verify session was updated with both env vars
    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    const persistedEnv = session['persistedEnv'] as Record<string, string>;
    expect(persistedEnv['HANDLER1_VAR']).toBe('value1');
    expect(persistedEnv['HANDLER2_VAR']).toBe('value2');
  });

  it('handler receives execution context env vars', async () => {
    const sessionId = 'e2e-exec-ctx-sess';

    // Handler that echoes execution-context env vars back
    const handlerCmd = await writeHandlerScript(tmpRoot, 'ctx-echo-handler', `
      const result = {
        decision: 'noop',
        metadata: {
          AGENT_SESSION_ID: process.env.AGENT_SESSION_ID || '',
          AGENT_ADAPTER: process.env.AGENT_ADAPTER || ''
        }
      };
      process.stdout.write(JSON.stringify(result));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      event_name: 'SessionStart',
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.metadata).toBeDefined();
    expect(output.metadata.AGENT_SESSION_ID).toBe(sessionId);
    expect(output.metadata.AGENT_ADAPTER).toBe('claude');
  });

  it('invoke with no handlers produces noop output', async () => {
    const stdinPayload = JSON.stringify({
      event_name: 'SessionStart',
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const output = JSON.parse(result.stdout.trim());
    expect(output.decision).toBe('noop');
  });

  it('invoke with explicit session-id flag overrides stdin session_id', async () => {
    const explicitId = 'e2e-explicit-id';
    const stdinPayload = JSON.stringify({
      session_id: 'stdin-id-should-be-ignored',
      event_name: 'SessionStart',
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--bootstrap-only',
        '--session-id', explicitId,
        '--json',
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout.trim());
    expect(output.sessionId).toBe(explicitId);

    // Verify the session file was saved with the explicit ID
    const sessionData = await readSessionFile(sessionDir, explicitId);
    expect(sessionData).not.toBeNull();
  });

  it('handler that crashes is handled by fail-open policy', async () => {
    const handlerCmd = await writeHandlerScript(tmpRoot, 'crash-handler', `
      process.exit(1);
    `);

    const stdinPayload = JSON.stringify({
      event_name: 'SessionStart',
    });

    // session.start phase defaults to fail-open, so this should not crash the CLI
    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--handler', handlerCmd,
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout.trim());
    // Should have a noop result since handler failed
    expect(output.decision).toBe('noop');
  });

  it('handler with contextVars updates session contextVars', async () => {
    const sessionId = 'e2e-ctxvars-sess';
    const handlerCmd = await writeHandlerScript(tmpRoot, 'ctxvars-handler', `
      process.stdout.write(JSON.stringify({
        decision: 'noop',
        contextVars: { myKey: 'myValue', anotherKey: 'anotherValue' }
      }));
    `);

    const stdinPayload = JSON.stringify({
      session_id: sessionId,
      event_name: 'SessionStart',
    });

    const result = await runCli(
      [
        'invoke',
        '--adapter', 'claude',
        '--handler', handlerCmd,
        '--session-id', sessionId,
      ],
      {
        stdin: stdinPayload,
        env: {
          ...baseEnv(),
          HOOKS_PROXY_EVENT_NAME: 'SessionStart',
        },
      },
    );

    expect(result.exitCode).toBe(0);

    const sessionData = await readSessionFile(sessionDir, sessionId);
    expect(sessionData).not.toBeNull();
    const session = sessionData!['session'] as Record<string, unknown>;
    const contextVars = session['contextVars'] as Record<string, string>;
    expect(contextVars['myKey']).toBe('myValue');
    expect(contextVars['anotherKey']).toBe('anotherValue');
  });
});
