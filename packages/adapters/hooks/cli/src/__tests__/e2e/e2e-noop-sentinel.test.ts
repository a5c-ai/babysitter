/**
 * Regression: noop-sentinel synthesis is gated on the renderer-LESS path (C4 defect B).
 *
 * `invoke.ts` synthesizes a `decision` field into the native output ONLY when
 * there is no adapter renderer AND the rendered output is empty:
 *
 *   if (!loaded.renderer && Object.keys(adapted.output).length === 0) {
 *     finalOutput.decision = merged.decision;
 *   }
 *
 * The `!loaded.renderer` guard exists because a renderer is authoritative about
 * which native fields are valid. Re-injecting the internal `"noop"` sentinel for
 * a renderer-present adapter (e.g. Codex) produces a `decision:"noop"` that Codex
 * rejects as an invalid enum ("hook returned invalid <event> JSON output"),
 * which broke Codex SessionStart / UserPromptSubmit (their native output is a
 * no-op / empty object).
 *
 * Reverting the guard to `if (Object.keys(adapted.output).length === 0)` makes
 * the renderer-present assertions below FAIL (Codex would emit decision:"noop").
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempSessionRoot,
  runCli,
  writeHandlerScript,
  cleanupLaunchers,
} from './helpers';

describe('noop-sentinel gating (e2e)', { timeout: 30000 }, () => {
  let tmpRoot: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const result = await createTempSessionRoot();
    tmpRoot = result.tmpRoot;
    cleanup = result.cleanup;
  });

  afterEach(async () => {
    await cleanupLaunchers(tmpRoot);
    await cleanup();
  });

  function baseEnv(): Record<string, string> {
    return { XDG_STATE_HOME: tmpRoot };
  }

  function invokeArgs(adapter: string, nativeEventName: string, extra: string[] = []): string[] {
    return ['invoke', '--adapter', adapter, '--native-event', nativeEventName, ...extra];
  }

  it('renderer-present (codex) SessionStart with empty output emits NO decision', async () => {
    const result = await runCli(invokeArgs('codex', 'SessionStart'), {
      stdin: JSON.stringify({ session_id: 'noop-codex-sessionstart' }),
      env: baseEnv(),
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout.trim());
    expect(output).not.toHaveProperty('decision');
    expect(output.decision).not.toBe('noop');
  });

  it('renderer-present (codex) with empty rendered output still emits NO decision', async () => {
    // A handler that returns only continueSession:false yields an empty
    // adapted output, exercising the exact `Object.keys(...).length === 0` path
    // that the `!loaded.renderer` guard protects.
    const handlerCmd = await writeHandlerScript(tmpRoot, 'codex-empty-output', `
      process.stdout.write(JSON.stringify({ continueSession: false }));
    `);

    const result = await runCli(
      invokeArgs('codex', 'PostToolUse', ['--handler', handlerCmd]),
      {
        stdin: JSON.stringify({
          session_id: 'noop-codex-posttool',
          tool_name: 'bash',
          tool_input: { command: 'ls' },
          tool_response: 'ok',
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout.trim());
    expect(output).not.toHaveProperty('decision');
  });

  it('renderer-LESS (copilot) with empty output STILL synthesizes a decision', async () => {
    // copilot exposes no renderForInvoke, so the renderer-less fallback path is
    // authoritative and MUST still synthesize the decision sentinel when the
    // adapted output is empty. This assertion is symmetric: it holds both with
    // and without the fix, proving the guard targets the renderer specifically.
    const handlerCmd = await writeHandlerScript(tmpRoot, 'copilot-empty-output', `
      process.stdout.write(JSON.stringify({ continueSession: false }));
    `);

    const result = await runCli(
      invokeArgs('copilot', 'PostToolUse', ['--handler', handlerCmd]),
      {
        stdin: JSON.stringify({
          session_id: 'noop-copilot-posttool',
          tool_name: 'bash',
          tool_input: { command: 'ls' },
          tool_response: 'ok',
        }),
        env: baseEnv(),
      },
    );

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout.trim());
    expect(output).toHaveProperty('decision');
    expect(output.decision).toBe('noop');
  });
});
