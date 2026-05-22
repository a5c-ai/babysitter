import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ChildProcess } from 'node:child_process';

import type { AgentAdapter, SpawnArgs } from './adapter.js';
import type { ErrorCode, RetryPolicy } from './types.js';

export interface ActiveSpawn {
  child: ChildProcess;
  killTimer: NodeJS.Timeout | null;
}

export const isWindows = process.platform === 'win32';

function resolveWindowsSpawnPath(resolvedPath: string): { command: string; shell?: boolean } {
  if (/\.(cmd|bat)$/i.test(resolvedPath)) {
    const powershellShim = resolvedPath.replace(/\.(cmd|bat)$/i, '.ps1');
    if (fs.existsSync(powershellShim)) {
      return {
        command: 'powershell.exe',
        shell: false,
      };
    }
    return { command: resolvedPath, shell: true };
  }
  if (/\.(exe|ps1)$/i.test(resolvedPath)) {
    return { command: resolvedPath };
  }
  const siblingPowershellShim = `${resolvedPath}.ps1`;
  if (fs.existsSync(siblingPowershellShim)) {
    return {
      command: 'powershell.exe',
      shell: false,
    };
  }
  for (const extension of ['.cmd', '.bat', '.exe', '.ps1']) {
    const candidate = `${resolvedPath}${extension}`;
    if (fs.existsSync(candidate)) {
      return {
        command: candidate,
        shell: /\.(cmd|bat)$/i.test(candidate) ? true : undefined,
      };
    }
  }
  return { command: resolvedPath };
}

export function computeDelay(policy: Required<RetryPolicy>, attempt: number): number {
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * Math.pow(2, attempt - 1));
  const jitter = exp * policy.jitterFactor * Math.random();
  return Math.floor(exp + jitter);
}

export async function resolveSpawnArgs(
  adapter: AgentAdapter,
  spawnArgs: SpawnArgs,
): Promise<SpawnArgs> {
  if (
    spawnArgs.shell === true ||
    spawnArgs.command !== adapter.cliCommand ||
    typeof adapter.detectInstallation !== 'function'
  ) {
    return spawnArgs;
  }

  const installation = await adapter.detectInstallation().catch(() => null);
  if (!installation?.installed || !installation.path) {
    return spawnArgs;
  }

  const resolvedPath = installation.path;
  if (isWindows && adapter.agent === 'codex') {
    const installDir = path.dirname(resolvedPath);
    const nodeExe = path.join(installDir, 'node.exe');
    const codexJs = path.join(installDir, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    if (fs.existsSync(nodeExe) && fs.existsSync(codexJs)) {
      return {
        ...spawnArgs,
        command: nodeExe,
        args: [codexJs, ...spawnArgs.args],
        shell: false,
      };
    }
  }
  const windowsResolved = isWindows ? resolveWindowsSpawnPath(resolvedPath) : { command: resolvedPath };
  const windowsResolvedArgs =
    isWindows && (resolvedPath.endsWith('.cmd') || fs.existsSync(`${resolvedPath}.ps1`))
      ? (() => {
          const powershellShim = resolvedPath.endsWith('.cmd')
            ? resolvedPath.replace(/\.cmd$/i, '.ps1')
            : `${resolvedPath}.ps1`;
          if (fs.existsSync(powershellShim) && windowsResolved.command === 'powershell.exe') {
            return ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', powershellShim, ...spawnArgs.args];
          }
          return spawnArgs.args;
        })()
      : spawnArgs.args;

  return {
    ...spawnArgs,
    command: windowsResolved.command,
    args: windowsResolvedArgs,
    shell: spawnArgs.shell ?? windowsResolved.shell,
  };
}

export function resolveExitOutcome(options: {
  runTimeoutHit: boolean;
  inactivityTimeoutHit: boolean;
  aborted: boolean;
  code: number | null;
  signal: string | null;
}): {
  exitReason: import('./run-handle.js').RunResult['exitReason'];
  terminalCode: ErrorCode | null;
  emitCrash: boolean;
} {
  if (options.runTimeoutHit) {
    return { exitReason: 'timeout', terminalCode: 'TIMEOUT', emitCrash: false };
  }
  if (options.inactivityTimeoutHit) {
    return { exitReason: 'inactivity', terminalCode: 'INACTIVITY_TIMEOUT', emitCrash: false };
  }
  if (options.aborted) {
    return { exitReason: 'aborted', terminalCode: 'ABORTED', emitCrash: false };
  }
  if (options.code === 0) {
    return { exitReason: 'completed', terminalCode: null, emitCrash: false };
  }
  if (options.signal) {
    return { exitReason: 'killed', terminalCode: 'AGENT_CRASH', emitCrash: false };
  }
  return { exitReason: 'crashed', terminalCode: 'AGENT_CRASH', emitCrash: true };
}
