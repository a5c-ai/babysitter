import { describe, it, expect } from 'vitest';

import { createClient } from '@a5c-ai/agent-mux-core';
import { parseArgs } from '../../src/parse-args.js';
import { remoteCommand, REMOTE_FLAGS, type RemoteSpawner } from '../../src/commands/remote.js';
import { ExitCode } from '../../src/exit-codes.js';

interface Call { cmd: string; args: string[] }

function makeSpawner(responses: Array<{ code: number; stdout?: string; stderr?: string }>): { spawner: RemoteSpawner; calls: Call[] } {
  const calls: Call[] = [];
  let i = 0;
  const spawner: RemoteSpawner = async (cmd, args) => {
    calls.push({ cmd, args });
    const r = responses[i] ?? { code: 0 };
    i += 1;
    return { code: r.code, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  };
  return { spawner, calls };
}

describe('amux remote install/update', () => {
  it('runs all four steps via ssh when amux missing on remote', async () => {
    const client = createClient();
    const args = parseArgs(
      ['remote', 'install', 'user@host', '--mode', 'ssh'],
      REMOTE_FLAGS,
    );
    // probe fails → install npm → install harness → verify
    const { spawner, calls } = makeSpawner([
      { code: 127 }, // probe: amux missing
      { code: 0 },   // npm install amux
      { code: 0 },   // amux install claude
      { code: 0, stdout: '{"ok":true}' }, // detect --all
    ]);
    const code = await remoteCommand(client, args, { spawner });
    expect(code).toBe(ExitCode.SUCCESS);
    expect(calls.length).toBe(4);
    // All calls go through ssh
    for (const c of calls) expect(c.cmd).toBe('ssh');
    // The npm install step must reference @a5c-ai/agent-mux-cli on the remote
    const npmStep = calls[1]!;
    const remote = npmStep.args[npmStep.args.length - 1] as string;
    expect(remote).toContain('npm');
    expect(remote).toContain('@a5c-ai/agent-mux-cli');
    // Harness install
    const harnessStep = calls[2]!;
    const harnessRemote = harnessStep.args[harnessStep.args.length - 1] as string;
    expect(harnessRemote).toContain('amux');
    expect(harnessRemote).toContain('install');
    expect(harnessRemote).toContain('claude');
  });

  it('skips npm install when probe succeeds (amux already present)', async () => {
    const client = createClient();
    const args = parseArgs(
      ['remote', 'install', 'host1', '--harness', 'codex'],
      REMOTE_FLAGS,
    );
    const { spawner, calls } = makeSpawner([
      { code: 0, stdout: '1.2.3' }, // probe OK
      { code: 0 },                  // amux install codex
      { code: 0, stdout: '{}' },    // verify
    ]);
    const code = await remoteCommand(client, args, { spawner });
    expect(code).toBe(ExitCode.SUCCESS);
    expect(calls.length).toBe(3);
    const harnessStep = calls[1]!;
    const remote = harnessStep.args[harnessStep.args.length - 1] as string;
    expect(remote).toContain('codex');
  });

  it('uses docker transport when --mode=docker --image=...', async () => {
    const client = createClient();
    const args = parseArgs(
      ['remote', 'install', '--mode', 'docker', '--image', 'ghcr.io/a5c-ai/amux:latest'],
      REMOTE_FLAGS,
    );
    const { spawner, calls } = makeSpawner([
      { code: 0, stdout: '1.0.0' }, // probe
      { code: 0 },                   // install harness
      { code: 0, stdout: '{}' },     // verify
    ]);
    const code = await remoteCommand(client, args, { spawner });
    expect(code).toBe(ExitCode.SUCCESS);
    for (const c of calls) expect(c.cmd).toBe('docker');
    // Docker args begin with run --rm -i
    expect(calls[0]!.args.slice(0, 3)).toEqual(['run', '--rm', '-i']);
    expect(calls[0]!.args).toContain('ghcr.io/a5c-ai/amux:latest');
  });

  it('dry-run does not invoke the spawner at all', async () => {
    const client = createClient();
    const args = parseArgs(
      ['remote', 'install', 'user@host', '--mode', 'ssh', '--dry-run'],
      REMOTE_FLAGS,
    );
    const { spawner, calls } = makeSpawner([]);
    const code = await remoteCommand(client, args, { spawner });
    expect(code).toBe(ExitCode.SUCCESS);
    // Zero real invocations
    expect(calls.length).toBe(0);
  });

  it('rejects ssh mode without a host', async () => {
    const client = createClient();
    const args = parseArgs(['remote', 'install', '--mode', 'ssh'], REMOTE_FLAGS);
    const { spawner } = makeSpawner([]);
    const code = await remoteCommand(client, args, { spawner });
    expect(code).toBe(ExitCode.USAGE_ERROR);
  });
});
