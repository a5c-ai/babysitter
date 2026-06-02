/**
 * Install/update helpers for BaseAgentAdapter.
 *
 * The install and update flows share the "pick method → resolve command →
 * spawn → re-detect" skeleton. Extracted here so the base class stays
 * small; no behavior change.
 */

import * as os from 'node:os';

import type {
  AdapterInstallOptions,
  AdapterUpdateOptions,
  DetectInstallationResult,
  InstallMethod,
  InstallResult,
  Spawner,
} from '@a5c-ai/agent-mux-comm';

/** Collaborators the helpers need from the adapter. */
export interface InstallContext {
  readonly cliCommand: string;
  readonly displayName: string;
  readonly spawner: Spawner;
  detectInstallation(): Promise<DetectInstallationResult>;
  pickInstallMethod(): InstallMethod | undefined;
  applyVersionToCommand(method: InstallMethod, version?: string): string;
  deriveUpdateCommand(method: InstallMethod): string | null;
}

/** Returns true when a command string contains shell operators (pipe, &&, etc.). */
function needsShell(command: string): boolean {
  return /[|&;><]/.test(command);
}

async function executeCommand(
  ctx: InstallContext,
  method: InstallMethod,
  command: string,
): Promise<InstallResult> {
  let cmd: string;
  let argv: string[];

  if (needsShell(command)) {
    // The command contains shell operators (e.g. "curl ... | bash").
    // Spawner uses shell:false, so we wrap in an explicit shell invocation.
    if (os.platform() === 'win32') {
      cmd = 'cmd';
      argv = ['/c', command];
    } else {
      cmd = 'sh';
      argv = ['-c', command];
    }
  } else {
    const parts = command.split(/\s+/).filter(Boolean);
    [cmd, ...argv] = parts as [string, ...string[]];
  }

  let runResult;
  try {
    runResult = await ctx.spawner(cmd, argv);
  } catch (err) {
    return {
      ok: false,
      method: method.type,
      command,
      stderr: err instanceof Error ? err.message : String(err),
    };
  }

  const ok = runResult.code === 0;
  let installedVersion: string | undefined;
  if (ok) {
    const det = await ctx.detectInstallation().catch(() => null);
    if (det?.version) installedVersion = det.version;
  }

  const result: InstallResult = {
    ok,
    method: method.type,
    command,
    stdout: runResult.stdout,
    stderr: runResult.stderr,
  };
  if (installedVersion) result.installedVersion = installedVersion;
  return result;
}

export async function runInstall(
  ctx: InstallContext,
  opts: AdapterInstallOptions,
): Promise<InstallResult> {
  if (!opts.force && !opts.dryRun) {
    const existing = await ctx.detectInstallation();
    if (existing.installed) {
      const r: InstallResult = {
        ok: true,
        method: 'already-installed',
        command: '',
        message: `${ctx.cliCommand} is already installed${existing.version ? ` (${existing.version})` : ''}`,
      };
      if (existing.version) r.installedVersion = existing.version;
      return r;
    }
  }

  const method = ctx.pickInstallMethod();
  if (!method) {
    return {
      ok: false,
      method: 'none',
      command: '',
      message: `No compatible install method for platform ${os.platform()}`,
    };
  }

  if (method.type === 'manual') {
    return {
      ok: false,
      method: 'manual',
      command: method.command,
      message: `${ctx.displayName} must be installed manually: ${method.command}`,
    };
  }

  const command = ctx.applyVersionToCommand(method, opts.version);

  if (opts.dryRun) {
    return {
      ok: true,
      method: method.type,
      command,
      message: `[dry-run] would execute: ${command}`,
    };
  }

  return executeCommand(ctx, method, command);
}

export async function runUpdate(
  ctx: InstallContext,
  opts: AdapterUpdateOptions,
): Promise<InstallResult> {
  const method = ctx.pickInstallMethod();
  if (!method) {
    return {
      ok: false,
      method: 'none',
      command: '',
      message: `No compatible update method for platform ${os.platform()}`,
    };
  }

  const command = ctx.deriveUpdateCommand(method);
  if (!command) {
    return {
      ok: false,
      method: method.type,
      command: method.command,
      message: `Update not supported for method "${method.type}". Install command: ${method.command}`,
    };
  }

  if (opts.dryRun) {
    return {
      ok: true,
      method: method.type,
      command,
      message: `[dry-run] would execute: ${command}`,
    };
  }

  return executeCommand(ctx, method, command);
}
