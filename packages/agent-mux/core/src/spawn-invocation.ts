/**
 * Invocation mode dispatch for spawn-runner.
 *
 * Pure function `buildInvocationCommand` transforms a SpawnArgs + agent name
 * into a concrete host command based on the invocation mode (local, docker,
 * ssh, k8s). Split out of spawn-runner.ts for file-size hygiene — no
 * behavior change.
 */

import { spawn } from 'node:child_process';
import type { SpawnArgs } from './adapter.js';
import type { InvocationMode, K8sInvocation } from './invocation.js';
import { lookupHarnessImage } from './invocation.js';

// ---------------------------------------------------------------------------
// Invocation mode dispatch
// ---------------------------------------------------------------------------

/** Result of applying an invocation mode to a SpawnArgs. */
export interface InvocationCommand {
  /** The process to spawn on the host machine. */
  command: string;
  /** Arguments passed to the host process. */
  args: string[];
  /** Environment variables for the host process (union of host-inherited + inline). */
  env: Record<string, string>;
  /** Working directory for the host process. */
  cwd: string;
  /** Initial stdin (forwarded verbatim). */
  stdin?: string;
  /** Whether the host process requires shell mode. */
  shell: boolean;
}

/** Shell-quote a single argument for use in a remote shell (ssh/docker sh -c). */
function shQuote(arg: string): string {
  if (arg.length > 0 && /^[A-Za-z0-9_\-./=:@%+,]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

/**
 * Transform a SpawnArgs + agent name into an InvocationCommand based on the
 * invocation mode. This is a pure function — no subprocess is started.
 *
 * Modes:
 *  - local  — returns spawnArgs unchanged (env merged).
 *  - docker — `docker run --rm -i [-v cwd:/workspace] [-w /workspace] [-e K=V]* <image> <cmd> <args...>`.
 *  - ssh    — `ssh [-p N] [-i key] [user@]host -- cd <cwd> && <K=V> <cmd> <args...>`.
 *  - k8s    — `kubectl [--context C] [-n NS] exec -i <pod> -- <K=V> <cmd> <args...>`.
 */
export function buildInvocationCommand(
  mode: InvocationMode | undefined,
  spawnArgs: SpawnArgs,
  agent: string,
): InvocationCommandWithCleanup {
  const baseEnv = { ...spawnArgs.env };

  if (!mode || mode.mode === 'local') {
    return {
      command: spawnArgs.command,
      args: [...spawnArgs.args],
      env: baseEnv,
      cwd: spawnArgs.cwd,
      stdin: spawnArgs.stdin,
      shell: spawnArgs.shell ?? false,
    };
  }

  if (mode.mode === 'docker') {
    const image = mode.image ?? lookupHarnessImage(agent)?.image;
    if (!image) {
      throw new Error(
        `DockerInvocation: no image specified and no default docker image found for agent "${agent}"`,
      );
    }
    const workdir = mode.workdir ?? '/workspace';
    const args: string[] = ['run', '--rm', '-i'];
    // Mount the host cwd into the container at workdir.
    args.push('-v', `${spawnArgs.cwd}:${workdir}`);
    args.push('-w', workdir);
    for (const vol of mode.volumes ?? []) {
      args.push('-v', vol);
    }
    if (mode.network) args.push('--network', mode.network);
    // Merge adapter env and invocation env into -e flags.
    const merged: Record<string, string> = { ...baseEnv, ...(mode.env ?? {}) };
    for (const [k, v] of Object.entries(merged)) {
      args.push('-e', `${k}=${v}`);
    }
    args.push(image);
    args.push(spawnArgs.command, ...spawnArgs.args);
    return {
      command: 'docker',
      args,
      env: {},
      cwd: spawnArgs.cwd,
      stdin: spawnArgs.stdin,
      shell: false,
    };
  }

  if (mode.mode === 'ssh') {
    const host = mode.host;
    const args: string[] = [];
    if (mode.port !== undefined) args.push('-p', String(mode.port));
    if (mode.identityFile) args.push('-i', mode.identityFile);
    // `-t` forces pseudo-tty allocation so SIGTERM/SIGINT are propagated from
    // the local ssh client to the remote process group. Required for clean
    // teardown of long-running harness CLIs; see spec 11.
    args.push('-t');
    // Don't hang indefinitely on host key prompts in tests; still honour user config otherwise.
    args.push('-o', 'BatchMode=yes');
    args.push(host);
    // Build the remote command: "cd <dir> && K=V ... cmd arg1 arg2" wrapped in
    // a shell that forwards TERM/INT to the spawned child and `exec`s away so
    // signal delivery is a single hop. `$$` is the wrapper shell's pid; since
    // we launch the real command in the background and `wait` on its pid, the
    // trap can forward TERM to it precisely.
    const remoteDir = mode.remoteDir ?? spawnArgs.cwd;
    const envPrefix = Object.entries(baseEnv)
      .map(([k, v]) => `${k}=${shQuote(v)}`)
      .join(' ');
    const cmdLine = [spawnArgs.command, ...spawnArgs.args].map(shQuote).join(' ');
    const inner = `cd ${shQuote(remoteDir)} && ${envPrefix ? envPrefix + ' ' : ''}${cmdLine}`;
    // POSIX-sh compatible PID-forwarding wrapper. Single-quoted so the remote
    // shell expands $! / $pid, not the local one.
    const wrapper =
      `exec /bin/sh -c '` +
      `${inner.replace(/'/g, `'\\''`)} & ` +
      `pid=$!; ` +
      `trap "kill -TERM $pid 2>/dev/null" TERM INT; ` +
      `wait $pid'`;
    args.push('--', wrapper);
    return {
      command: 'ssh',
      args,
      env: {},
      cwd: spawnArgs.cwd,
      stdin: spawnArgs.stdin,
      shell: false,
    };
  }

  if (mode.mode === 'k8s') {
    return buildK8sInvocation(mode, spawnArgs, agent, baseEnv);
  }

  // Exhaustiveness guard.
  const _never: never = mode;
  throw new Error(`Unknown invocation mode: ${JSON.stringify(_never)}`);
}

/**
 * Describe the k8s cleanup action the caller should perform on abort/exit.
 * For ephemeral `kubectl run --rm` invocations we still emit a best-effort
 * `kubectl delete pod --grace-period=0` so abandoned pods don't linger when
 * the local ssh/kubectl client is killed before `--rm` fires.
 */
export interface K8sCleanup {
  readonly command: 'kubectl';
  readonly args: readonly string[];
}

/** Cleanup attached to an InvocationCommand built in k8s-ephemeral mode. */
export interface InvocationCommandWithCleanup extends InvocationCommand {
  readonly cleanup?: K8sCleanup;
}

/** Fire-and-forget a cleanup command (detached, stdio ignored, unref'd). */
export function runCleanupDetached(cleanup: K8sCleanup): void {
  try {
    const child = spawn(cleanup.command, [...cleanup.args], {
      stdio: 'ignore',
      shell: false,
      detached: true,
    });
    child.on('error', () => { /* best-effort */ });
    child.unref();
  } catch {
    // best-effort
  }
}

let k8sPodCounter = 0;
function generatePodName(agent: string): string {
  const safe = agent.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30) || 'agent';
  const rand = Math.random().toString(36).slice(2, 8);
  const seq = (++k8sPodCounter).toString(36);
  return `amux-${safe}-${Date.now().toString(36)}-${seq}-${rand}`;
}

function buildK8sInvocation(
  mode: K8sInvocation,
  spawnArgs: SpawnArgs,
  agent: string,
  baseEnv: Record<string, string>,
): InvocationCommandWithCleanup {
  // Existing-pod mode: explicit `pod` (or legacy AMUX_K8S_POD) and ephemeral not true.
  const envPodOverride = process.env['AMUX_K8S_POD'];
  const wantsEphemeral = mode.ephemeral ?? (!mode.pod && !envPodOverride);
  const namespace = mode.namespace;

  if (!wantsEphemeral) {
    const args: string[] = [];
    if (mode.context) args.push('--context', mode.context);
    if (namespace) args.push('-n', namespace);
    args.push('exec', '-i');
    const pod = mode.pod ?? envPodOverride ?? agent;
    args.push(pod);
    args.push('--');
    const envEntries = Object.entries(baseEnv);
    if (envEntries.length > 0) {
      args.push('env');
      for (const [k, v] of envEntries) args.push(`${k}=${v}`);
    }
    args.push(spawnArgs.command, ...spawnArgs.args);
    return {
      command: 'kubectl',
      args,
      env: {},
      cwd: spawnArgs.cwd,
      stdin: spawnArgs.stdin,
      shell: false,
    };
  }

  // Ephemeral pod lifecycle: create + run + auto-delete.
  const image = mode.image ?? lookupHarnessImage(agent)?.image;
  if (!image) {
    throw new Error(
      `K8sInvocation: no image specified and no default docker image found for agent "${agent}"`,
    );
  }
  const podName = generatePodName(agent);
  const args: string[] = [];
  if (mode.context) args.push('--context', mode.context);
  if (namespace) args.push('-n', namespace);
  args.push('run', '--rm', '-i', '--restart=Never', `--image=${image}`, podName);
  if (mode.serviceAccount) args.push(`--serviceaccount=${mode.serviceAccount}`);
  if (mode.podStartupTimeoutMs !== undefined) {
    // kubectl expects a duration; ms -> seconds rounded up.
    const secs = Math.max(1, Math.ceil(mode.podStartupTimeoutMs / 1000));
    args.push(`--timeout=${secs}s`);
  }
  const limitParts: string[] = [];
  if (mode.resources?.cpu) limitParts.push(`cpu=${mode.resources.cpu}`);
  if (mode.resources?.memory) limitParts.push(`memory=${mode.resources.memory}`);
  if (limitParts.length > 0) args.push(`--limits=${limitParts.join(',')}`);
  for (const [k, v] of Object.entries(baseEnv)) {
    args.push(`--env=${k}=${v}`);
  }
  args.push('--', spawnArgs.command, ...spawnArgs.args);

  const cleanupArgs: string[] = [];
  if (mode.context) cleanupArgs.push('--context', mode.context);
  if (namespace) cleanupArgs.push('-n', namespace);
  cleanupArgs.push('delete', 'pod', podName, '--grace-period=0', '--ignore-not-found=true');

  return {
    command: 'kubectl',
    args,
    env: {},
    cwd: spawnArgs.cwd,
    stdin: spawnArgs.stdin,
    shell: false,
    cleanup: { command: 'kubectl', args: cleanupArgs },
  };
}
