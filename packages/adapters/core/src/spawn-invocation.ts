/**
 * Invocation mode dispatch for spawn-runner.
 *
 * Pure function `buildInvocationCommand` transforms a SpawnArgs + agent name
 * into a concrete host command based on the invocation mode (local, docker,
 * ssh, k8s). Split out of spawn-runner.ts for file-size hygiene — no
 * behavior change.
 *
 * GATE 3 (§9.3 / AC-23a / AC-40 / AC-50) — this module hosts the credential-
 * delivery channels the design gates: docker `-e` env (86-89) and `-v` mounts
 * (79-81), ssh `K=V` (120-124), k8s `env`/`--env` (211-216, 249-251), and k8s
 * secret / `--serviceaccount` references (239). Before those channels deliver a
 * SCOPED credential, `gateCredentialInjection` (`./policy-credential-gate.ts`)
 * MUST authorize it: with no valid CommandAuthorization the channel is OMITTED
 * (env dropped, `-v` mount omitted, secret/serviceaccount ref stripped) and, if
 * the policy marks the credential required, the spawn is denied. IMDS / IRSA /
 * pre-existing mounts are a bounded, warned non-goal (AC-50) this seam cannot see.
 */

import { spawn } from 'node:child_process';
import type { SpawnArgs } from './adapter.js';
import type { InvocationMode, K8sInvocation } from './invocation.js';
import { lookupHarnessImage } from './invocation.js';
// GATE 3 credential backstop.
import {
  gateCredentialInjection,
  type ScopedCredential,
  type CredentialChannel,
  type GateCredentialInjectionInput,
} from './policy-credential-gate.js';
export {
  gateCredentialInjection,
  type ScopedCredential,
  type CredentialChannel,
  type GateCredentialInjectionInput,
  type GateCredentialInjectionResult,
} from './policy-credential-gate.js';

/**
 * GATE 3 wiring (§9.3 / AC-23a / AC-50) — the credential-injection gate handed to
 * `buildInvocationCommand`. When present, EACH credential channel this module emits
 * (docker `-e`/`-v`, ssh `K=V`, k8s `env`/`--env`, k8s secret/serviceaccount) is
 * filtered through `gateCredentialInjection`: a scoped credential is emitted ONLY when
 * a valid `CommandAuthorization` covers its scope; with no authorization / unreadable
 * config the scoped credential is DROPPED (channel omitted), and if it is marked
 * required the spawn is DENIED.
 *
 * `scopedEnvKeys` names which `env` keys are SCOPED credentials (from the trusted
 * out-of-agent source, AC-40) — env keys NOT listed are ordinary process env and pass
 * through unchanged. When no gate is provided (the anchor is not pinned) every channel
 * emits as before (back-compat), matching Milestone C's posture.
 */
export interface Gate3Options extends Omit<GateCredentialInjectionInput, 'credentials'> {
  /**
   * The set of `env` keys that are SCOPED credentials to be gated, each mapped to its
   * trusted alias (broker key id / KMS ARN / secret name) used to resolve the scope
   * (AC-40a). Env keys absent from this map are not credentials and pass through.
   */
  scopedEnvKeys: Record<string, { alias: string; required?: boolean }>;
  /**
   * AC-50 — SCOPED docker `-v` file mounts to gate. Keyed by the mount spec string
   * (`host:container[:mode]`) → its trusted alias. A mount NOT listed passes through as an
   * ordinary (non-credential) mount. With no valid authorization a listed mount is OMITTED
   * (channel `docker-mount`); if `required`, the spawn is denied.
   */
  scopedMounts?: Record<string, { alias: string; required?: boolean }>;
  /**
   * AC-50 — a SCOPED k8s `--serviceaccount` / mounted-secret reference to gate. When set and
   * the value matches the invocation's service account, GATE 3 authorizes it; with no valid
   * authorization the `--serviceaccount` flag is STRIPPED (channel `k8s-serviceaccount`); if
   * `required`, the spawn is denied.
   */
  scopedServiceAccount?: { name: string; alias: string; required?: boolean };
}

export interface Gate3Denied {
  denied: true;
  reason: string;
  warnings: string[];
}

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
 * Thrown by `buildInvocationCommand` when GATE 3 (§9.3) DENIES the spawn — a REQUIRED
 * scoped credential could not be authorized for delivery. Fail closed: the invocation
 * is never built with the credential silently dropped when it was marked required.
 */
export class CredentialGateDenied extends Error {
  readonly warnings: string[];
  constructor(reason: string, warnings: string[]) {
    super(`GATE 3 credential injection denied: ${reason}`);
    this.name = 'CredentialGateDenied';
    this.warnings = warnings;
  }
}

/**
 * Apply GATE 3 to an `env` map for a given delivery channel. Returns the env map with
 * scoped credentials that FAILED authorization removed (channel omitted, AC-50). Throws
 * `CredentialGateDenied` when a REQUIRED scoped credential is undeliverable.
 *
 * Non-credential env keys (not in `gate3.scopedEnvKeys`) pass through untouched. When
 * `gate3` is undefined the env map is returned unchanged (back-compat, no anchor).
 */
function applyGate3ToEnv(
  env: Record<string, string>,
  channel: CredentialChannel,
  gate3: Gate3Options | undefined,
): Record<string, string> {
  if (!gate3 || !gate3.scopedEnvKeys || Object.keys(gate3.scopedEnvKeys).length === 0) {
    return env;
  }
  const scoped: ScopedCredential[] = [];
  for (const [name, value] of Object.entries(env)) {
    const spec = gate3.scopedEnvKeys[name];
    if (spec) {
      scoped.push({ name, value, alias: spec.alias, channel, ...(spec.required ? { required: true } : {}) });
    }
  }
  if (scoped.length === 0) return env;

  const result = gateCredentialInjection({
    issuerRoots: gate3.issuerRoots,
    policyDocHash: gate3.policyDocHash,
    currentConfigEpoch: gate3.currentConfigEpoch,
    minEpochFloor: gate3.minEpochFloor,
    now: gate3.now,
    toolName: gate3.toolName,
    toolCallId: gate3.toolCallId,
    command: gate3.command,
    args: gate3.args,
    credentialSource: gate3.credentialSource,
    credentials: scoped,
    resolveAuthorization: gate3.resolveAuthorization,
  });

  if (result.denied) {
    throw new CredentialGateDenied(result.reason ?? 'required scoped credential undeliverable', result.warnings);
  }

  // Drop every credential the gate did not authorize (channel omitted, AC-50).
  const injectedNames = new Set(result.injected.map((c) => c.name));
  const dropped = new Set(scoped.filter((c) => !injectedNames.has(c.name)).map((c) => c.name));
  if (dropped.size === 0) return env;
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (!dropped.has(k)) filtered[k] = v;
  }
  return filtered;
}

/**
 * Apply GATE 3 to a set of candidate docker `-v` mount specs (AC-50, channel
 * `docker-mount`). Returns the mounts that passed the gate (unlisted mounts pass through
 * as ordinary mounts). Throws `CredentialGateDenied` when a REQUIRED scoped mount is
 * undeliverable. When `gate3` is undefined every mount passes through (back-compat).
 */
function applyGate3ToMounts(
  mounts: string[],
  gate3: Gate3Options | undefined,
): string[] {
  if (!gate3 || !gate3.scopedMounts || Object.keys(gate3.scopedMounts).length === 0) {
    return mounts;
  }
  const scoped: ScopedCredential[] = [];
  for (const spec of mounts) {
    const s = gate3.scopedMounts[spec];
    if (s) {
      scoped.push({ name: spec, value: spec, alias: s.alias, channel: 'docker-mount', ...(s.required ? { required: true } : {}) });
    }
  }
  if (scoped.length === 0) return mounts;

  const result = gateCredentialInjection({
    issuerRoots: gate3.issuerRoots,
    policyDocHash: gate3.policyDocHash,
    currentConfigEpoch: gate3.currentConfigEpoch,
    minEpochFloor: gate3.minEpochFloor,
    now: gate3.now,
    toolName: gate3.toolName,
    toolCallId: gate3.toolCallId,
    command: gate3.command,
    args: gate3.args,
    credentialSource: gate3.credentialSource,
    credentials: scoped,
    resolveAuthorization: gate3.resolveAuthorization,
  });
  if (result.denied) {
    throw new CredentialGateDenied(result.reason ?? 'required scoped mount undeliverable', result.warnings);
  }
  const injectedNames = new Set(result.injected.map((c) => c.name));
  const dropped = new Set(scoped.filter((c) => !injectedNames.has(c.name)).map((c) => c.name));
  if (dropped.size === 0) return mounts;
  return mounts.filter((spec) => !dropped.has(spec));
}

/**
 * Apply GATE 3 to a k8s `--serviceaccount` reference (AC-50, channel
 * `k8s-serviceaccount`). Returns the service-account name to emit, or `undefined` when the
 * scoped serviceaccount failed authorization (flag stripped). Throws when a REQUIRED scoped
 * serviceaccount is undeliverable. When `gate3` is undefined the value passes through.
 */
function applyGate3ToServiceAccount(
  serviceAccount: string | undefined,
  gate3: Gate3Options | undefined,
): string | undefined {
  if (serviceAccount === undefined) return undefined;
  if (!gate3 || !gate3.scopedServiceAccount) return serviceAccount;
  if (gate3.scopedServiceAccount.name !== serviceAccount) {
    // The invocation's service account is not the scoped one — pass through unchanged.
    return serviceAccount;
  }
  const spec = gate3.scopedServiceAccount;
  const result = gateCredentialInjection({
    issuerRoots: gate3.issuerRoots,
    policyDocHash: gate3.policyDocHash,
    currentConfigEpoch: gate3.currentConfigEpoch,
    minEpochFloor: gate3.minEpochFloor,
    now: gate3.now,
    toolName: gate3.toolName,
    toolCallId: gate3.toolCallId,
    command: gate3.command,
    args: gate3.args,
    credentialSource: gate3.credentialSource,
    credentials: [{
      name: serviceAccount,
      value: serviceAccount,
      alias: spec.alias,
      channel: 'k8s-serviceaccount',
      ...(spec.required ? { required: true } : {}),
    }],
    resolveAuthorization: gate3.resolveAuthorization,
  });
  if (result.denied) {
    throw new CredentialGateDenied(result.reason ?? 'required scoped serviceaccount undeliverable', result.warnings);
  }
  // Strip the flag when the scoped serviceaccount was not authorized (dropped).
  return result.injected.length > 0 ? serviceAccount : undefined;
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
  gate3?: Gate3Options,
): InvocationCommandWithCleanup {
  const baseEnv = { ...spawnArgs.env };

  if (!mode || mode.mode === 'local') {
    // Local mode delivers env in-process (not a remote channel this module constructs);
    // the design's GATE-3-mediated channels are docker/ssh/k8s (AC-23a/AC-50). Local env
    // passes through unchanged.
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
    // GATE 3 — the docker `-v` credential-mount channel (AC-50). A scoped mount is emitted
    // only with a valid authorization; an unauthorized scoped mount is OMITTED (and if
    // marked required, the spawn is denied). Non-credential mounts pass through unchanged.
    const gatedVolumes = applyGate3ToMounts([...(mode.volumes ?? [])], gate3);
    for (const vol of gatedVolumes) {
      args.push('-v', vol);
    }
    if (mode.network) args.push('--network', mode.network);
    // Merge adapter env and invocation env, then GATE 3 the docker `-e` channel: a
    // scoped credential is emitted only with a valid authorization (AC-23a/AC-50).
    const merged: Record<string, string> = { ...baseEnv, ...(mode.env ?? {}) };
    const gatedMerged = applyGate3ToEnv(merged, 'docker-env', gate3);
    for (const [k, v] of Object.entries(gatedMerged)) {
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
    // GATE 3 — the ssh `K=V` env-prefix channel (AC-23a/AC-50).
    const gatedSshEnv = applyGate3ToEnv(baseEnv, 'ssh-env', gate3);
    const envPrefix = Object.entries(gatedSshEnv)
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
    return buildK8sInvocation(mode, spawnArgs, agent, baseEnv, gate3);
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
  return `adapters-${safe}-${Date.now().toString(36)}-${seq}-${rand}`;
}

function buildK8sInvocation(
  mode: K8sInvocation,
  spawnArgs: SpawnArgs,
  agent: string,
  baseEnv: Record<string, string>,
  gate3?: Gate3Options,
): InvocationCommandWithCleanup {
  // Existing-pod mode: explicit `pod` (or legacy AGENT_MUX_K8S_POD) and ephemeral not true.
  const envPodOverride = process.env['AGENT_MUX_K8S_POD'];
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
    // GATE 3 — the k8s exec `env K=V` channel (AC-23a/AC-50).
    const gatedExecEnv = applyGate3ToEnv(baseEnv, 'k8s-env', gate3);
    const envEntries = Object.entries(gatedExecEnv);
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
  // GATE 3 — the k8s `--serviceaccount` credential channel (AC-50). A scoped serviceaccount
  // is emitted only with a valid authorization; unauthorized → the flag is STRIPPED (and if
  // required, the spawn is denied). A non-scoped serviceaccount passes through unchanged.
  const gatedServiceAccount = applyGate3ToServiceAccount(mode.serviceAccount, gate3);
  if (gatedServiceAccount) args.push(`--serviceaccount=${gatedServiceAccount}`);
  if (mode.podStartupTimeoutMs !== undefined) {
    // kubectl expects a duration; ms -> seconds rounded up.
    const secs = Math.max(1, Math.ceil(mode.podStartupTimeoutMs / 1000));
    args.push(`--timeout=${secs}s`);
  }
  const limitParts: string[] = [];
  if (mode.resources?.cpu) limitParts.push(`cpu=${mode.resources.cpu}`);
  if (mode.resources?.memory) limitParts.push(`memory=${mode.resources.memory}`);
  if (limitParts.length > 0) args.push(`--limits=${limitParts.join(',')}`);
  // GATE 3 — the k8s ephemeral `--env=K=V` channel (AC-23a/AC-50).
  const gatedEphemeralEnv = applyGate3ToEnv(baseEnv, 'k8s-env', gate3);
  for (const [k, v] of Object.entries(gatedEphemeralEnv)) {
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
