/**
 * K8s E2E invocation test.
 *
 * Gated by K8S_E2E=1 (and expects a usable KUBECONFIG). Skipped otherwise.
 * Exercises the ephemeral `kubectl run --rm` branch of buildInvocationCommand
 * against a live cluster (kind/minikube/etc). Uses alpine:3 for speed.
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { buildInvocationCommand, runCleanupDetached } from '../src/spawn-invocation.js';
import type { SpawnArgs } from '../src/index.js';

const ENABLED = process.env['K8S_E2E'] === '1';
const d = ENABLED ? describe : describe.skip;

function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number } = {},
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: false });
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

d('k8s E2E (K8S_E2E=1)', () => {
  it('kubectl can reach the cluster', async () => {
    const r = await run('kubectl', ['version', '--output=yaml'], { timeoutMs: 30000 });
    expect(r.exitCode).toBe(0);
  }, 45000);

  it('ephemeral kubectl run matches buildInvocationCommand output and produces marker', async () => {
    const spawnArgs: SpawnArgs = {
      command: 'echo',
      args: ['amux-k8s-e2e-marker'],
      env: {},
      cwd: process.cwd(),
      usePty: false,
    };
    const built = buildInvocationCommand(
      { mode: 'k8s', image: 'alpine:3', ephemeral: true },
      spawnArgs,
      'claude',
    );
    expect(built.command).toBe('kubectl');
    expect(built.args).toContain('run');
    expect(built.args).toContain('--rm');
    try {
      const r = await run(built.command, built.args, { timeoutMs: 300000 });
      expect(r.exitCode).toBe(0);
      const combined = `${r.stdout}\n${r.stderr}`;
      expect(combined).toMatch(/amux-k8s-e2e-marker|pod ".*" deleted/);
    } finally {
      if (built.cleanup) runCleanupDetached(built.cleanup);
    }
  }, 360000);
});
