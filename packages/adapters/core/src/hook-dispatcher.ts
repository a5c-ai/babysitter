/**
 * HookDispatcher — runs registered hooks for a payload and aggregates results.
 *
 * Deny wins over allow; modifiedInput is merged in priority order; stdout
 * fragments are concatenated. exitCode follows the first non-zero.
 */

import { spawn } from 'node:child_process';
import type {
  HookConfigManager,
  HookRegistration,
  UnifiedHookPayload,
  UnifiedHookResult,
} from './hooks.js';
import type { BuiltInHooksRegistry } from './builtin-hooks.js';

export interface DispatchOptions {
  /** Override env passed to command/script hooks. */
  env?: NodeJS.ProcessEnv;
  /** Working directory for command/script hooks. */
  cwd?: string;
  /** Timeout per external hook (ms). */
  timeoutMs?: number;
}

export class HookDispatcher {
  constructor(
    private readonly config: HookConfigManager,
    private readonly builtins: BuiltInHooksRegistry,
  ) {}

  async dispatch(
    payload: UnifiedHookPayload,
    opts: DispatchOptions = {},
  ): Promise<UnifiedHookResult> {
    const matches = await this.config.getForAgent(payload.agent, payload.hookType);
    return await this.runAll(matches, payload, opts);
  }

  async runAll(
    regs: HookRegistration[],
    payload: UnifiedHookPayload,
    opts: DispatchOptions,
  ): Promise<UnifiedHookResult> {
    let aggregate: UnifiedHookResult = { decision: 'allow', stdout: '', exitCode: 0 };
    for (const reg of regs) {
      const result = await this.runOne(reg, payload, opts);
      aggregate = mergeResults(aggregate, result);
      if (aggregate.decision === 'deny') break;
    }
    if (!aggregate.stdout) delete aggregate.stdout;
    if (aggregate.exitCode === 0) delete aggregate.exitCode;
    return aggregate;
  }

  private async runOne(
    reg: HookRegistration,
    payload: UnifiedHookPayload,
    opts: DispatchOptions,
  ): Promise<UnifiedHookResult> {
    if (reg.handler === 'builtin') {
      return this.builtins.run(reg.target, payload);
    }
    return await runExternal(reg, payload, opts);
  }
}

function mergeResults(a: UnifiedHookResult, b: UnifiedHookResult): UnifiedHookResult {
  const decision: UnifiedHookResult['decision'] =
    a.decision === 'deny' || b.decision === 'deny'
      ? 'deny'
      : a.decision === 'modify' || b.decision === 'modify'
        ? 'modify'
        : 'allow';
  const modifiedInput =
    a.modifiedInput || b.modifiedInput
      ? { ...(a.modifiedInput ?? {}), ...(b.modifiedInput ?? {}) }
      : undefined;
  return {
    decision,
    message: b.message ?? a.message,
    modifiedInput,
    stdout: (a.stdout ?? '') + (b.stdout ?? ''),
    exitCode: (a.exitCode && a.exitCode !== 0) ? a.exitCode : (b.exitCode ?? 0),
  };
}

function runExternal(
  reg: HookRegistration,
  payload: UnifiedHookPayload,
  opts: DispatchOptions,
): Promise<UnifiedHookResult> {
  return new Promise((resolve) => {
    const child = spawn(reg.target, [], {
      shell: reg.handler === 'command',
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
    });
    let stdout = '';
    let stderr = '';
    const t = opts.timeoutMs
      ? setTimeout(() => child.kill('SIGTERM'), opts.timeoutMs)
      : null;
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => {
      if (t) clearTimeout(t);
      const exit = code ?? 0;
      resolve({
        decision: exit === 0 ? 'allow' : 'deny',
        stdout,
        exitCode: exit,
        message: stderr || undefined,
      });
    });
    child.on('error', (err) => {
      if (t) clearTimeout(t);
      resolve({ decision: 'deny', message: err.message, exitCode: 1 });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(payload));
  });
}
