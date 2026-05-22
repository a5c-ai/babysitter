/**
 * Docker E2E invocation test.
 *
 * Gated by DOCKER_E2E=1. Skipped otherwise so the normal suite stays
 * infra-free. When enabled, this actually shells out to `docker` and
 * verifies that `buildInvocationCommand` produces a command line that
 * runs end-to-end against a real daemon.
 *
 * Uses `alpine:3` + `echo` so it stays tiny (<10MB) and hermetic.
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { buildInvocationCommand } from '../src/spawn-invocation.js';
import type { SpawnArgs } from '../src/index.js';

const ENABLED = process.env['DOCKER_E2E'] === '1';
const d = ENABLED ? describe : describe.skip;

function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number } = {},
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => (stdout += c.toString()));
    child.stderr.on('data', (c) => (stderr += c.toString()));
    const t = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`timeout after ${opts.timeoutMs ?? 60000}ms`));
    }, opts.timeoutMs ?? 60000);
    child.on('close', (code) => {
      clearTimeout(t);
      resolve({ exitCode: code ?? -1, stdout, stderr });
    });
    child.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

d('docker E2E (DOCKER_E2E=1)', () => {
  it('docker daemon is reachable', async () => {
    const r = await run('docker', ['version', '--format', '{{.Server.Version}}']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim().length).toBeGreaterThan(0);
  }, 30000);

  it('buildInvocationCommand(docker) → real docker run produces expected stdout', async () => {
    const spawnArgs: SpawnArgs = {
      command: 'echo',
      args: ['amux-docker-e2e-marker'],
      env: { AMUX_E2E: '1' },
      cwd: process.cwd(),
      usePty: false,
    };
    const built = buildInvocationCommand(
      { mode: 'docker', image: 'alpine:3' },
      spawnArgs,
      'claude',
    );
    expect(built.command).toBe('docker');
    expect(built.args[0]).toBe('run');

    const r = await run(built.command, built.args, { timeoutMs: 120000 });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('amux-docker-e2e-marker');
  }, 180000);
});
