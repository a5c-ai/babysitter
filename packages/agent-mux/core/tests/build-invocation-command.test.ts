/**
 * Tests for buildInvocationCommand — pure transform of SpawnArgs per
 * InvocationMode (local/docker/ssh/k8s).
 */
import { describe, it, expect } from 'vitest';

import { buildInvocationCommand } from '../src/spawn-runner.js';
import type { SpawnArgs } from '../src/adapter.js';

const baseSpawn: SpawnArgs = {
  command: 'claude',
  args: ['--print', 'hello'],
  env: { ANTHROPIC_API_KEY: 'secret', FOO: 'bar' },
  cwd: '/repo/my-project',
  usePty: false,
};

describe('buildInvocationCommand', () => {
  it('local mode returns the spawn args unchanged', () => {
    const out = buildInvocationCommand({ mode: 'local' }, baseSpawn, 'claude');
    expect(out.command).toBe('claude');
    expect(out.args).toEqual(['--print', 'hello']);
    expect(out.env).toEqual({ ANTHROPIC_API_KEY: 'secret', FOO: 'bar' });
    expect(out.cwd).toBe('/repo/my-project');
  });

  it('undefined invocation defaults to local', () => {
    const out = buildInvocationCommand(undefined, baseSpawn, 'claude');
    expect(out.command).toBe('claude');
    expect(out.args).toEqual(['--print', 'hello']);
  });

  it('docker mode wraps the spawn in `docker run --rm -i -v cwd:/workspace -w /workspace ... <image> <cmd> <args>`', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'ghcr.io/anthropics/claude-code:latest' },
      baseSpawn,
      'claude',
    );
    expect(out.command).toBe('docker');
    expect(out.args[0]).toBe('run');
    expect(out.args).toContain('--rm');
    expect(out.args).toContain('-i');
    // Volume mount
    const vIdx = out.args.indexOf('-v');
    expect(vIdx).toBeGreaterThanOrEqual(0);
    expect(out.args[vIdx + 1]).toBe('/repo/my-project:/workspace');
    // Workdir
    const wIdx = out.args.indexOf('-w');
    expect(out.args[wIdx + 1]).toBe('/workspace');
    // Env pass-through
    expect(out.args).toContain('-e');
    expect(out.args).toContain('ANTHROPIC_API_KEY=secret');
    expect(out.args).toContain('FOO=bar');
    // Image then command then args
    const imgIdx = out.args.indexOf('ghcr.io/anthropics/claude-code:latest');
    expect(imgIdx).toBeGreaterThanOrEqual(0);
    expect(out.args.slice(imgIdx + 1)).toEqual(['claude', '--print', 'hello']);
  });

  it('docker mode falls back to catalog image when image not specified', () => {
    const out = buildInvocationCommand({ mode: 'docker' }, baseSpawn, 'claude');
    expect(out.args).toContain('ghcr.io/anthropics/claude-code');
  });

  it('docker mode throws if no image resolvable', () => {
    expect(() =>
      buildInvocationCommand({ mode: 'docker' }, baseSpawn, 'unknown-agent-xyz'),
    ).toThrow(/no image/i);
  });

  it('docker mode honours extra volumes and network', () => {
    const out = buildInvocationCommand(
      { mode: 'docker', image: 'img:1', volumes: ['/a:/b', '/c:/d'], network: 'host' },
      baseSpawn,
      'claude',
    );
    // Both extra volumes appear
    expect(out.args.filter((a) => a === '/a:/b')).toHaveLength(1);
    expect(out.args.filter((a) => a === '/c:/d')).toHaveLength(1);
    const nIdx = out.args.indexOf('--network');
    expect(out.args[nIdx + 1]).toBe('host');
  });

  it('ssh mode transforms to `ssh host -- cd <cwd> && K=V cmd args`', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'deploy@remote.example.com' },
      baseSpawn,
      'claude',
    );
    expect(out.command).toBe('ssh');
    expect(out.args).toContain('deploy@remote.example.com');
    expect(out.args).toContain('--');
    const remote = out.args[out.args.length - 1]!;
    expect(remote).toContain('cd ');
    expect(remote).toContain('/repo/my-project');
    expect(remote).toContain('ANTHROPIC_API_KEY=secret');
    expect(remote).toContain('FOO=bar');
    expect(remote).toContain('claude --print hello');
  });

  it('ssh mode includes port and identity file when provided', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'h', port: 2200, identityFile: '/home/u/.ssh/id_rsa' },
      baseSpawn,
      'claude',
    );
    const pIdx = out.args.indexOf('-p');
    expect(out.args[pIdx + 1]).toBe('2200');
    const iIdx = out.args.indexOf('-i');
    expect(out.args[iIdx + 1]).toBe('/home/u/.ssh/id_rsa');
  });

  it('k8s mode transforms to `kubectl [-n ns] exec -i <pod> -- env K=V cmd args`', () => {
    const prev = process.env['AMUX_K8S_POD'];
    process.env['AMUX_K8S_POD'] = 'claude-pod-1';
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', namespace: 'agents' },
        baseSpawn,
        'claude',
      );
      expect(out.command).toBe('kubectl');
      expect(out.args).toContain('-n');
      expect(out.args).toContain('agents');
      expect(out.args).toContain('exec');
      expect(out.args).toContain('-i');
      expect(out.args).toContain('claude-pod-1');
      expect(out.args).toContain('--');
      // env prefix
      expect(out.args).toContain('env');
      expect(out.args).toContain('ANTHROPIC_API_KEY=secret');
      expect(out.args).toContain('FOO=bar');
      // final cmd + args
      const tail = out.args.slice(-3);
      expect(tail).toEqual(['claude', '--print', 'hello']);
    } finally {
      if (prev === undefined) delete process.env['AMUX_K8S_POD'];
      else process.env['AMUX_K8S_POD'] = prev;
    }
  });

  it('k8s mode falls back to agent name when no AMUX_K8S_POD env set', () => {
    const prev = process.env['AMUX_K8S_POD'];
    delete process.env['AMUX_K8S_POD'];
    try {
      const out = buildInvocationCommand({ mode: 'k8s' }, baseSpawn, 'claude');
      expect(out.args).toContain('claude');
    } finally {
      if (prev !== undefined) process.env['AMUX_K8S_POD'] = prev;
    }
  });

  it('k8s mode includes --context when provided', () => {
    const out = buildInvocationCommand(
      { mode: 'k8s', context: 'prod-cluster' },
      baseSpawn,
      'claude',
    );
    const cIdx = out.args.indexOf('--context');
    expect(out.args[cIdx + 1]).toBe('prod-cluster');
  });

  // ---- SSH signal-propagation wrapper (TBD 2 / spec 11) --------------------
  it('ssh mode includes pseudo-tty flag exactly once for signal propagation', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'h' },
      baseSpawn,
      'claude',
    );
    expect(out.args.filter((a) => a === '-t')).toHaveLength(1);
  });

  it('ssh mode wraps remote command in a PID-forwarding trap', () => {
    const out = buildInvocationCommand(
      { mode: 'ssh', host: 'h' },
      baseSpawn,
      'claude',
    );
    const remote = out.args[out.args.length - 1]!;
    // Wrapper is present exactly once.
    expect(remote.match(/exec \/bin\/sh -c/g) ?? []).toHaveLength(1);
    expect(remote).toMatch(/trap .*kill -TERM \$pid.* TERM INT/);
    expect(remote).toContain('wait $pid');
    expect(remote).toContain('claude --print hello');
  });

  // ---- K8s ephemeral pod lifecycle (TBD 3 / spec 13) -----------------------
  it('k8s ephemeral mode uses `kubectl run --rm -i --restart=Never`', () => {
    const prev = process.env['AMUX_K8S_POD'];
    delete process.env['AMUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', ephemeral: true, namespace: 'agents', image: 'my/img:1' },
        baseSpawn,
        'claude',
      );
      expect(out.command).toBe('kubectl');
      expect(out.args).toContain('run');
      expect(out.args).toContain('--rm');
      expect(out.args).toContain('-i');
      expect(out.args).toContain('--restart=Never');
      expect(out.args).toContain('--image=my/img:1');
      expect(out.args).toContain('-n');
      expect(out.args).toContain('agents');
      // command + its args are tail-positioned after `--`.
      const dashIdx = out.args.lastIndexOf('--');
      expect(out.args.slice(dashIdx + 1)).toEqual(['claude', '--print', 'hello']);
    } finally {
      if (prev !== undefined) process.env['AMUX_K8S_POD'] = prev;
    }
  });

  it('k8s ephemeral mode propagates resources, serviceAccount, and timeout', () => {
    const out = buildInvocationCommand(
      {
        mode: 'k8s',
        ephemeral: true,
        image: 'my/img:1',
        resources: { cpu: '500m', memory: '512Mi' },
        serviceAccount: 'agent-sa',
        podStartupTimeoutMs: 90000,
      },
      baseSpawn,
      'claude',
    );
    expect(out.args).toContain('--limits=cpu=500m,memory=512Mi');
    expect(out.args).toContain('--serviceaccount=agent-sa');
    expect(out.args).toContain('--timeout=90s');
    // Env is forwarded via --env flags.
    expect(out.args).toContain('--env=ANTHROPIC_API_KEY=secret');
    expect(out.args).toContain('--env=FOO=bar');
  });

  it('k8s ephemeral mode attaches a delete-pod cleanup hook', () => {
    const out = buildInvocationCommand(
      { mode: 'k8s', ephemeral: true, image: 'my/img:1', namespace: 'agents' },
      baseSpawn,
      'claude',
    );
    expect(out.cleanup).toBeDefined();
    expect(out.cleanup!.command).toBe('kubectl');
    expect(out.cleanup!.args).toContain('delete');
    expect(out.cleanup!.args).toContain('pod');
    expect(out.cleanup!.args).toContain('--grace-period=0');
    expect(out.cleanup!.args).toContain('-n');
    expect(out.cleanup!.args).toContain('agents');
  });

  it('k8s mode with explicit `pod` uses exec (no cleanup)', () => {
    const prev = process.env['AMUX_K8S_POD'];
    delete process.env['AMUX_K8S_POD'];
    try {
      const out = buildInvocationCommand(
        { mode: 'k8s', pod: 'fixed-pod', ephemeral: false, namespace: 'agents' },
        baseSpawn,
        'claude',
      );
      expect(out.args).toContain('exec');
      expect(out.args).toContain('fixed-pod');
      expect(out.args).not.toContain('run');
      expect(out.cleanup).toBeUndefined();
    } finally {
      if (prev !== undefined) process.env['AMUX_K8S_POD'] = prev;
    }
  });
});
