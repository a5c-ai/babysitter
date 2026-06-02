/**
 * `amux install <agent>`, `amux update <agent>`, `amux detect <agent>`,
 * and `amux uninstall <agent>` commands.
 *
 * Dispatches to the adapter's per-agent install/update/detect methods,
 * so each harness may override behavior.
 *
 * @see docs/10-cli-reference.md
 */

import type {
  AgentMuxClient,
  AgentAdapter,
  Spawner,
  InstallResult,
  DetectInstallationResult,
} from '@a5c-ai/agent-mux-comm';
import { AgentMuxError } from '@a5c-ai/agent-mux-comm';

import type { ParsedArgs, FlagDef } from './cli-helpers.js';
import { flagBool, flagStr } from './cli-helpers.js';
import { ExitCode, errorCodeToExitCode } from './cli-helpers.js';
import type { ExitCodeValue } from './cli-helpers.js';
import {
  printJsonOk, printJsonError, printError, printKeyValue,
} from './cli-helpers.js';
import {
  defaultSpawnRunner, silentSpawnRunner, runSilently,
  type SpawnRunner as HelperSpawnRunner,
} from './install-helpers.js';

/** Flags recognized by the install/uninstall/update/detect commands. */
export const INSTALL_FLAGS: Record<string, FlagDef> = {
  'all': { type: 'boolean' },
  'force': { type: 'boolean' },
  'dry-run': { type: 'boolean' },
  'pkg-version': { type: 'string' },
};

// ---------------------------------------------------------------------------
// Back-compat: SpawnRunner for tests that override install.ts directly.
// New code should set a Spawner on the adapter instead.
// ---------------------------------------------------------------------------

export type SpawnRunner = HelperSpawnRunner;

// ---------------------------------------------------------------------------
// Command entry
// ---------------------------------------------------------------------------

export interface InstallCommandDeps {
  /** Back-compat: overrides the adapter's internal Spawner for this run. */
  spawnRunner?: SpawnRunner;
}

/**
 * Handle `amux install [<agent>] [--all]`, `amux update [<agent>] [--all]`,
 * `amux detect [<agent>] [--all]`, and `amux uninstall <agent>`.
 */
export async function installCommand(
  client: AgentMuxClient,
  args: ParsedArgs,
  deps: InstallCommandDeps = {},
): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const all = flagBool(args.flags, 'all') === true;
  const force = flagBool(args.flags, 'force') === true;
  const dryRun = flagBool(args.flags, 'dry-run') === true;
  const versionFlag = flagStr(args.flags, 'pkg-version');
  const mode: 'install' | 'uninstall' | 'update' | 'detect' =
    args.command === 'uninstall' ? 'uninstall'
    : args.command === 'update' ? 'update'
    : args.command === 'detect' ? 'detect'
    : 'install';

  // In JSON mode, or for `detect` (a read-only query), suppress child
  // process output so it never contaminates structured output or piped JSON.
  const suppressChildOutput = jsonMode || mode === 'detect';
  const spawnRunner = deps.spawnRunner
    ?? (suppressChildOutput ? silentSpawnRunner : defaultSpawnRunner);
  const adapterSpawner = toAdapterSpawner(spawnRunner);

  if ((mode === 'install' || mode === 'update' || mode === 'detect') && all) {
    return handleAll(client, mode, adapterSpawner, { force, dryRun }, jsonMode);
  }

  const agent = args.positionals[0];
  if (!agent) {
    const msg = mode === 'install'
      ? 'Usage: amux install <agent> | amux install --all'
      : mode === 'update'
      ? 'Usage: amux update <agent> | amux update --all'
      : mode === 'detect'
      ? 'Usage: amux detect <agent> | amux detect --all'
      : 'Usage: amux uninstall <agent>';
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  switch (mode) {
    case 'install':
      return installOne(client, agent, adapterSpawner, { force, dryRun, ...(versionFlag !== undefined ? { version: versionFlag } : {}) }, jsonMode);
    case 'update':
      return updateOne(client, agent, adapterSpawner, { dryRun }, jsonMode);
    case 'detect':
      return detectOne(client, agent, adapterSpawner, jsonMode);
    case 'uninstall':
      return uninstallOne(client, agent, spawnRunner, jsonMode);
  }
}

// ---------------------------------------------------------------------------
// install <agent>
// ---------------------------------------------------------------------------

async function installOne(
  client: AgentMuxClient,
  agent: string,
  spawner: Spawner,
  opts: { force: boolean; dryRun: boolean; version?: string },
  jsonMode: boolean,
): Promise<number> {
  const adapter = client.adapters.get(agent);
  if (!adapter) {
    if (opts.dryRun) {
      if (jsonMode) printJsonOk({ agent, dryRun: true, installed: false, reason: 'unknown-agent' });
      else process.stdout.write(`[dry-run] Unknown agent "${agent}" — no install method available.\n`);
      return ExitCode.SUCCESS;
    }
    const msg = `Unknown agent: ${agent}`;
    if (jsonMode) printJsonError('UNKNOWN_AGENT', msg);
    else printError(msg);
    return errorCodeToExitCode('UNKNOWN_AGENT');
  }

  injectSpawner(adapter, spawner);

  if (!adapter.install) {
    const msg = `Agent "${agent}" does not support install().`;
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.GENERAL_ERROR;
  }

  let result: InstallResult;
  try {
    result = await adapter.install({
      force: opts.force,
      dryRun: opts.dryRun,
      ...(opts.version !== undefined ? { version: opts.version } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode) printJsonError('INTERNAL', `Install failed: ${msg}`);
    else printError(`Install failed: ${msg}`);
    return ExitCode.GENERAL_ERROR;
  }

  // Render result.
  if (jsonMode) {
    printJsonOk({
      agent,
      installed: result.ok,
      method: result.method,
      command: result.command,
      dryRun: opts.dryRun || undefined,
      version: result.installedVersion,
      message: result.message,
    });
  } else {
    if (result.method === 'already-installed') {
      process.stdout.write(`${agent} is already installed${result.installedVersion ? ` (${result.installedVersion})` : ''}.\n`);
      process.stdout.write(`Use --force to reinstall.\n`);
    } else if (opts.dryRun) {
      process.stdout.write(`[dry-run] Would install ${agent} via: ${result.command}\n`);
    } else if (result.method === 'manual') {
      process.stdout.write(`${result.message ?? `Install ${agent} manually: ${result.command}`}\n`);
    } else {
      if (result.command) process.stdout.write(`Installing ${agent} via: ${result.command}\n`);
      printKeyValue([
        ['Agent:', agent],
        ['Method:', result.method],
        ['Installed:', result.ok ? 'yes' : 'no'],
        ['Version:', result.installedVersion ?? '--'],
      ]);
      if (result.stderr && !result.ok) process.stderr.write(result.stderr);
    }
  }

  // Manual install is "not an error" — surface as success.
  if (result.method === 'manual') return ExitCode.SUCCESS;
  if (result.method === 'already-installed') return ExitCode.SUCCESS;
  return result.ok ? ExitCode.SUCCESS : ExitCode.GENERAL_ERROR;
}

// ---------------------------------------------------------------------------
// update <agent>
// ---------------------------------------------------------------------------

async function updateOne(
  client: AgentMuxClient,
  agent: string,
  spawner: Spawner,
  opts: { dryRun: boolean },
  jsonMode: boolean,
): Promise<number> {
  const adapter = client.adapters.get(agent);
  if (!adapter) {
    const msg = `Unknown agent: ${agent}`;
    if (jsonMode) printJsonError('UNKNOWN_AGENT', msg);
    else printError(msg);
    return errorCodeToExitCode('UNKNOWN_AGENT');
  }
  injectSpawner(adapter, spawner);

  if (!adapter.update) {
    const msg = `Agent "${agent}" does not support update().`;
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.GENERAL_ERROR;
  }

  let result: InstallResult;
  try {
    result = await adapter.update({ dryRun: opts.dryRun });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode) printJsonError('INTERNAL', `Update failed: ${msg}`);
    else printError(`Update failed: ${msg}`);
    return ExitCode.GENERAL_ERROR;
  }

  if (jsonMode) {
    printJsonOk({
      agent,
      updated: result.ok,
      method: result.method,
      command: result.command,
      dryRun: opts.dryRun || undefined,
      version: result.installedVersion,
      message: result.message,
    });
  } else {
    if (opts.dryRun) {
      process.stdout.write(`[dry-run] Would update ${agent} via: ${result.command}\n`);
    } else if (result.method === 'manual') {
      process.stdout.write(`${result.message ?? `Update ${agent} manually.`}\n`);
    } else {
      if (result.command) process.stdout.write(`Updating ${agent} via: ${result.command}\n`);
      printKeyValue([
        ['Agent:', agent],
        ['Method:', result.method],
        ['Updated:', result.ok ? 'yes' : 'no'],
        ['Version:', result.installedVersion ?? '--'],
      ]);
      if (result.stderr && !result.ok) process.stderr.write(result.stderr);
    }
  }
  if (result.method === 'manual') return ExitCode.SUCCESS;
  return result.ok ? ExitCode.SUCCESS : ExitCode.GENERAL_ERROR;
}

// ---------------------------------------------------------------------------
// detect <agent>
// ---------------------------------------------------------------------------

async function detectOne(
  client: AgentMuxClient,
  agent: string,
  spawner: Spawner,
  jsonMode: boolean,
): Promise<number> {
  const adapter = client.adapters.get(agent);
  if (!adapter) {
    const msg = `Unknown agent: ${agent}`;
    if (jsonMode) printJsonError('UNKNOWN_AGENT', msg);
    else printError(msg);
    return errorCodeToExitCode('UNKNOWN_AGENT');
  }
  injectSpawner(adapter, spawner);

  let result: DetectInstallationResult;
  try {
    if (!adapter.detectInstallation) {
      result = { installed: false, notes: 'detectInstallation() not implemented' };
    } else {
      result = await adapter.detectInstallation();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode) printJsonError('INTERNAL', `Detect failed: ${msg}`);
    else printError(`Detect failed: ${msg}`);
    return ExitCode.GENERAL_ERROR;
  }

  if (jsonMode) {
    printJsonOk({
      agent,
      installed: result.installed,
      version: result.version,
      path: result.path,
      notes: result.notes,
    });
  } else {
    printKeyValue([
      ['Agent:', agent],
      ['Installed:', result.installed ? 'yes' : 'no'],
      ['Version:', result.version ?? '--'],
      ['Path:', result.path ?? '--'],
      ['Notes:', result.notes ?? '--'],
    ]);
  }
  return ExitCode.SUCCESS;
}

// ---------------------------------------------------------------------------
// --all dispatch
// ---------------------------------------------------------------------------

async function handleAll(
  client: AgentMuxClient,
  mode: 'install' | 'update' | 'detect',
  spawner: Spawner,
  opts: { force: boolean; dryRun: boolean },
  jsonMode: boolean,
): Promise<number> {
  const registered = client.adapters.list();
  const results: Array<Record<string, unknown>> = [];
  let overall: ExitCodeValue = ExitCode.SUCCESS;

  if (mode === 'detect' && jsonMode) {
    const detectResults = await Promise.all(registered.map(async (info) => {
      const adapter = client.adapters.get(info.agent);
      if (!adapter) {
        return {
          agent: info.agent,
          exitCode: errorCodeToExitCode('UNKNOWN_AGENT'),
          error: `Unknown agent: ${info.agent}`,
        };
      }

      injectSpawner(adapter, spawner);

      try {
        const detected = adapter.detectInstallation
          ? await adapter.detectInstallation()
          : { installed: false, notes: 'detectInstallation() not implemented' };
        return {
          agent: info.agent,
          exitCode: ExitCode.SUCCESS,
          installed: detected.installed,
          version: detected.version,
          path: detected.path,
          notes: detected.notes,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          agent: info.agent,
          exitCode: ExitCode.GENERAL_ERROR,
          error: `Detect failed: ${msg}`,
        };
      }
    }));

    for (const result of detectResults) {
      results.push(result);
      if (result.exitCode !== ExitCode.SUCCESS && overall === ExitCode.SUCCESS) {
        overall = ExitCode.GENERAL_ERROR;
      }
    }

    printJsonOk({ results });
    return overall;
  }

  for (const info of registered) {
    if (!jsonMode) process.stdout.write(`\n=== ${info.agent} ===\n`);
    let code: number;
    // In JSON mode, silence stdout/stderr while each per-agent handler
    // runs so their envelopes don't contaminate the aggregate JSON
    // response emitted at the end. Exit codes are still captured.
    const run = async (): Promise<number> => {
      if (mode === 'install') {
        return installOne(client, info.agent, spawner, opts, jsonMode);
      } else if (mode === 'update') {
        return updateOne(client, info.agent, spawner, { dryRun: opts.dryRun }, jsonMode);
      }
      return detectOne(client, info.agent, spawner, jsonMode);
    };
    code = jsonMode ? await runSilently(run) : await run();
    results.push({ agent: info.agent, exitCode: code });
    if (code !== ExitCode.SUCCESS && overall === ExitCode.SUCCESS) {
      overall = ExitCode.GENERAL_ERROR;
    }
  }

  if (jsonMode) printJsonOk({ results });
  return overall;
}

// ---------------------------------------------------------------------------
// uninstall <agent>
// ---------------------------------------------------------------------------

async function uninstallOne(
  client: AgentMuxClient,
  agent: string,
  spawnRunner: SpawnRunner,
  jsonMode: boolean,
): Promise<number> {
  const adapter = client.adapters.get(agent);
  if (!adapter) {
    const msg = `Unknown agent: ${agent}`;
    if (jsonMode) printJsonError('UNKNOWN_AGENT', msg);
    else printError(msg);
    return errorCodeToExitCode('UNKNOWN_AGENT');
  }

  const methods = safeInstallInstructions(client, agent);
  const npmMethod = methods.find((m) => m.type === 'npm');
  const brewMethod = methods.find((m) => m.type === 'brew');

  let cmd: string | null = null;
  let argsList: string[] = [];

  if (npmMethod) {
    const parts = npmMethod.command.split(/\s+/).filter(Boolean);
    const pkg = parts[parts.length - 1];
    if (pkg) {
      cmd = 'npm';
      argsList = ['uninstall', '-g', pkg];
    }
  } else if (brewMethod) {
    const parts = brewMethod.command.split(/\s+/).filter(Boolean);
    const pkg = parts[parts.length - 1];
    if (pkg) {
      cmd = 'brew';
      argsList = ['uninstall', pkg];
    }
  }

  if (!cmd) {
    const msg = `No supported uninstall method for agent "${agent}".`;
    if (jsonMode) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.GENERAL_ERROR;
  }

  if (!jsonMode) {
    process.stdout.write(`Uninstalling ${agent} via: ${cmd} ${argsList.join(' ')}\n`);
  }

  try {
    const result = await spawnRunner(cmd, argsList);
    if (result.code !== 0) {
      const msg = `Uninstall command exited with code ${result.code}`;
      if (jsonMode) printJsonError('INTERNAL', msg);
      else printError(msg);
      return ExitCode.GENERAL_ERROR;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode) printJsonError('INTERNAL', `Uninstall failed: ${msg}`);
    else printError(`Uninstall failed: ${msg}`);
    return ExitCode.GENERAL_ERROR;
  }

  if (jsonMode) printJsonOk({ agent, uninstalled: true });
  else process.stdout.write(`${agent} uninstalled.\n`);
  return ExitCode.SUCCESS;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeInstallInstructions(
  client: AgentMuxClient,
  agent: string,
): { type: string; command: string }[] {
  try {
    return client.adapters.installInstructions(agent) as unknown as { type: string; command: string }[];
  } catch {
    return [];
  }
}

/** Adapt a CLI-level SpawnRunner to the adapter-level Spawner interface. */
function toAdapterSpawner(runner: SpawnRunner): Spawner {
  return (command, args, _opts) => runner(command, args);
}

/** Attach a Spawner to a BaseAgentAdapter (duck-typed via setSpawner). */
function injectSpawner(adapter: AgentAdapter, spawner: Spawner): void {
  const a = adapter as unknown as { setSpawner?: (s: Spawner) => void };
  if (typeof a.setSpawner === 'function') {
    a.setSpawner(spawner);
  }
}

// Silence unused imports for AgentMuxError (kept for compatibility).
void AgentMuxError;
