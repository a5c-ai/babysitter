/**
 * Testable claims: stop-hook control across agent products.
 *
 * Verifies that hooks-mux can fire turn.stop hooks and that the
 * deny decision propagates correctly for adapters that support blocking.
 *
 * Tests both interactive (stdin payload) and non-interactive (--event-json) modes.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const HOOKS_MUX_CLI = path.join(ROOT, 'packages', 'hooks-mux', 'cli');

// Adapters and their stop-hook characteristics
const ADAPTERS = [
  { name: 'claude', nativeEvent: 'Stop', supportsBlock: true, interactive: true, nonInteractive: true },
  { name: 'codex', nativeEvent: 'on-stop', supportsBlock: true, interactive: true, nonInteractive: true },
  { name: 'gemini', nativeEvent: 'post-response', supportsBlock: false, interactive: true, nonInteractive: true },
  { name: 'cursor', nativeEvent: 'stop', supportsBlock: true, interactive: true, nonInteractive: false },
  { name: 'copilot', nativeEvent: 'stop', supportsBlock: false, interactive: true, nonInteractive: true },
] as const;

function cliExists(): boolean {
  try {
    const pkg = path.join(HOOKS_MUX_CLI, 'package.json');
    return fs.existsSync(pkg);
  } catch {
    return false;
  }
}

function runHooksMux(args: string[], opts?: { stdin?: string; env?: Record<string, string> }): { exitCode: number; stdout: string; stderr: string } {
  const bin = path.join(HOOKS_MUX_CLI, 'dist', 'index.js');
  const cmd = `node ${bin} ${args.join(' ')}`;
  try {
    const stdout = execSync(cmd, {
      cwd: ROOT,
      timeout: 10_000,
      input: opts?.stdin,
      env: { ...process.env, ...opts?.env, NODE_ENV: 'test' },
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString();
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err: any) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

describe.skipIf(!cliExists())('stop-hook control across agent products', { timeout: 60_000 }, () => {
  beforeAll(() => {
    // Ensure hooks-mux CLI is built
    try {
      execSync('npm run build', { cwd: HOOKS_MUX_CLI, stdio: 'pipe', timeout: 30_000 });
    } catch {
      // May already be built
    }
  });

  for (const adapter of ADAPTERS) {
    describe(`${adapter.name} adapter`, () => {
      const stopPayload = JSON.stringify({
        session_id: `test-stop-${adapter.name}`,
        reason: 'end_turn',
        last_assistant_message: 'Task complete.',
      });

      // Noop handler — just echoes the phase
      const noopHandler = 'node -e "const d=JSON.parse(require(\'fs\').readFileSync(\'/dev/stdin\',\'utf8\'));console.log(JSON.stringify({decision:\'noop\'}))"';
      // Block handler — returns deny
      const blockHandler = 'node -e "const d=JSON.parse(require(\'fs\').readFileSync(\'/dev/stdin\',\'utf8\'));console.log(JSON.stringify({decision:\'deny\',reason:\'blocked by test\'}))"';

      if (adapter.interactive) {
        it(`fires turn.stop via interactive invoke (${adapter.name})`, () => {
          const result = runHooksMux(
            ['invoke', '--adapter', adapter.name, '--event', adapter.nativeEvent, '--handler', noopHandler],
            { stdin: stopPayload },
          );

          // Should succeed and normalize to turn.stop
          expect(result.exitCode).toBe(0);
          if (result.stdout.trim()) {
            const output = JSON.parse(result.stdout.trim().split('\n').pop()!);
            expect(output.decision ?? output.metadata?.decision).toBeDefined();
          }
        });

        if (adapter.supportsBlock) {
          it(`deny decision propagates at turn.stop (${adapter.name})`, () => {
            const result = runHooksMux(
              ['invoke', '--adapter', adapter.name, '--event', adapter.nativeEvent, '--handler', blockHandler],
              { stdin: stopPayload },
            );

            expect(result.exitCode).toBe(0);
            if (result.stdout.trim()) {
              const output = JSON.parse(result.stdout.trim().split('\n').pop()!);
              expect(output.decision).toBe('deny');
            }
          });
        } else {
          it(`deny decision is degraded at turn.stop (${adapter.name})`, () => {
            const result = runHooksMux(
              ['invoke', '--adapter', adapter.name, '--event', adapter.nativeEvent, '--handler', blockHandler],
              { stdin: stopPayload },
            );

            expect(result.exitCode).toBe(0);
            if (result.stdout.trim()) {
              const output = JSON.parse(result.stdout.trim().split('\n').pop()!);
              // Decision should be stripped or degraded since adapter doesn't support blocking
              expect(output.decision).not.toBe('deny');
            }
          });
        }
      }

      if (adapter.nonInteractive) {
        it(`fires turn.stop via non-interactive mode (${adapter.name})`, () => {
          const result = runHooksMux(
            [
              'invoke', '--adapter', adapter.name,
              '--event', adapter.nativeEvent,
              '--handler', noopHandler,
              '--event-json', stopPayload,
            ],
          );

          expect(result.exitCode).toBe(0);
        });
      }
    });
  }
});
