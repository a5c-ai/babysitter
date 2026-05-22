/**
 * `amux remote install <host>` / `amux remote update <host>`.
 *
 * Self-install pipeline — uses `buildInvocationCommand()` to build each step
 * so the transport (ssh/docker/k8s) is selectable via `--mode` and works
 * uniformly across environments.
 *
 * Steps:
 *   1. Probe:    `amux --version`            — check if amux is on the remote.
 *   2. Install:  `npm install -g @a5c-ai/agent-mux-cli` if missing (or --force).
 *   3. Harness:  `amux install <harness>`    — deploy the desired harness.
 *   4. Verify:   `amux detect --all --json`  — confirm the harness is active.
 */

import { spawn } from 'node:child_process';

import type {
  AgentMuxClient,
  InvocationMode,
  SpawnArgs,
} from '@a5c-ai/agent-mux-core';
import { buildInvocationCommand } from '@a5c-ai/agent-mux-core';

import type { ParsedArgs, FlagDef } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printJsonOk, printJsonError, printError } from '../output.js';

export const REMOTE_FLAGS: Record<string, FlagDef> = {
  'mode': { type: 'string' },          // ssh | docker | k8s | local
  'harness': { type: 'string' },       // agent to install (default: claude)
  'image': { type: 'string' },         // docker image
  'identity-file': { type: 'string' }, // ssh key
  'port': { type: 'number' },          // ssh port
  'namespace': { type: 'string' },     // k8s namespace
  'context': { type: 'string' },       // k8s context
  'force': { type: 'boolean' },
  'dry-run': { type: 'boolean' },
};

/** Minimal spawner used by the remote command. Injectable for tests. */
export type RemoteSpawner = (
  command: string,
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

const defaultSpawner: RemoteSpawner = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (c: string) => { stdout += c; });
    child.stderr?.on('data', (c: string) => { stderr += c; });
    child.on('error', (err) => reject(err));
    child.on('exit', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });

export interface RemoteCommandDeps {
  spawner?: RemoteSpawner;
}

/** Build a SpawnArgs shell for a given amux (or npm) command. */
function makeSpawnArgs(command: string, args: string[], cwd: string): SpawnArgs {
  return { command, args, env: {}, cwd, usePty: false };
}

/**
 * Resolve the InvocationMode for a given CLI invocation of `amux remote`.
 * The first positional after the subcommand is typically the host (for ssh)
 * or is ignored for docker/k8s/local (which read image/namespace from flags).
 */
function buildMode(
  modeFlag: string,
  host: string | undefined,
  args: ParsedArgs,
): InvocationMode {
  switch (modeFlag) {
    case 'local':
      return { mode: 'local' };
    case 'docker': {
      const image = flagStr(args.flags, 'image');
      if (!image) throw new Error('--mode=docker requires --image=<image>');
      return { mode: 'docker', image };
    }
    case 'k8s': {
      const ns = flagStr(args.flags, 'namespace');
      const ctx = flagStr(args.flags, 'context');
      const m: InvocationMode = {
        mode: 'k8s',
        ...(ns !== undefined ? { namespace: ns } : {}),
        ...(ctx !== undefined ? { context: ctx } : {}),
      };
      return m;
    }
    case 'ssh':
    default: {
      if (!host) throw new Error('ssh mode requires a <host> positional argument');
      const port = flagStr(args.flags, 'port');
      const id = flagStr(args.flags, 'identity-file');
      const m: InvocationMode = {
        mode: 'ssh',
        host,
        ...(port !== undefined ? { port: Number(port) } : {}),
        ...(id !== undefined ? { identityFile: id } : {}),
      };
      return m;
    }
  }
}

/**
 * `amux remote install <host> [--mode ssh|docker|k8s|local] [--harness <agent>]`
 * `amux remote update <host> ...`
 */
export async function remoteCommand(
  _client: AgentMuxClient,
  args: ParsedArgs,
  deps: RemoteCommandDeps = {},
): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const spawner = deps.spawner ?? defaultSpawner;

  const sub = args.subcommand ?? args.positionals[0];
  if (sub !== 'install' && sub !== 'update') {
    const msg = 'Usage: amux remote install <host> [--mode ssh|docker|k8s] [--harness <agent>]';
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  // Positional order: `remote install <host>` — when parser assigned `sub` as
  // subcommand the host is positionals[0]; when it put `install` in positionals[0]
  // the host is positionals[1].
  const host =
    args.subcommand === sub ? args.positionals[0] : args.positionals[1];

  const modeFlag = flagStr(args.flags, 'mode') ?? 'ssh';
  const harness = flagStr(args.flags, 'harness') ?? 'claude';
  const force = flagBool(args.flags, 'force') === true;
  const dryRun = flagBool(args.flags, 'dry-run') === true;

  let invocation: InvocationMode;
  try {
    invocation = buildMode(modeFlag, host, args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  const cwd = process.cwd();
  const steps: Array<{ step: string; command: string; args: string[]; result?: { code: number; stdout: string; stderr: string } }> = [];

  const runStep = async (step: string, cmd: string, cmdArgs: string[]): Promise<{ code: number; stdout: string; stderr: string }> => {
    const spawnArgs = makeSpawnArgs(cmd, cmdArgs, cwd);
    const inv = buildInvocationCommand(invocation, spawnArgs, 'agent-mux-remote');
    const entry: { step: string; command: string; args: string[]; result?: { code: number; stdout: string; stderr: string } } = { step, command: inv.command, args: inv.args };
    steps.push(entry);
    if (dryRun) {
      entry.result = { code: 0, stdout: '', stderr: '' };
      if (!jsonMode) process.stdout.write(`[dry-run] ${inv.command} ${inv.args.join(' ')}\n`);
      return entry.result;
    }
    if (!jsonMode) process.stdout.write(`=> ${step}: ${inv.command} ${inv.args.slice(0, 6).join(' ')}${inv.args.length > 6 ? ' ...' : ''}\n`);
    const r = await spawner(inv.command, inv.args);
    entry.result = r;
    return r;
  };

  // Step 1: probe amux
  const probe = await runStep('probe', 'amux', ['--version']);
  const needsInstall = sub === 'update' || probe.code !== 0 || force;

  // Step 2: install amux itself if missing (or forced / update)
  if (needsInstall) {
    const npmVerb = sub === 'update' ? 'update' : 'install';
    const npm = await runStep('amux-self', 'npm', [npmVerb, '-g', '@a5c-ai/agent-mux-cli']);
    if (!dryRun && npm.code !== 0) {
      const msg = `npm ${npmVerb} failed on remote (code ${npm.code})`;
      if (jsonMode) printJsonError('INTERNAL', msg);
      else printError(msg);
      if (!jsonMode && npm.stderr) process.stderr.write(npm.stderr);
      return ExitCode.GENERAL_ERROR;
    }
  }

  // Step 3: install harness
  const harnessVerb = sub === 'update' ? 'update' : 'install';
  const installArgs = [harnessVerb, harness];
  if (force && sub === 'install') installArgs.push('--force');
  const hres = await runStep('harness', 'amux', installArgs);
  if (!dryRun && hres.code !== 0) {
    const msg = `amux ${harnessVerb} ${harness} failed on remote (code ${hres.code})`;
    if (jsonMode) printJsonError('INTERNAL', msg);
    else printError(msg);
    if (!jsonMode && hres.stderr) process.stderr.write(hres.stderr);
    return ExitCode.GENERAL_ERROR;
  }

  // Step 4: verify
  const verify = await runStep('verify', 'amux', ['detect', '--all', '--json']);

  if (jsonMode) {
    printJsonOk({
      host: host ?? null,
      mode: modeFlag,
      harness,
      subcommand: sub,
      dryRun: dryRun || undefined,
      steps: steps.map((s) => ({
        step: s.step,
        command: s.command,
        args: s.args,
        code: s.result?.code ?? null,
        stdout: s.result?.stdout ?? '',
        stderr: s.result?.stderr ?? '',
      })),
    });
  } else {
    process.stdout.write(
      `\n${sub === 'update' ? 'Updated' : 'Installed'} ${harness} on ${host ?? modeFlag} (mode=${modeFlag}).\n` +
      (verify.stdout ? `\nVerify output:\n${verify.stdout}\n` : ''),
    );
  }

  return ExitCode.SUCCESS;
}
