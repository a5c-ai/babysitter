/**
 * `amux hooks <agent> <subcommand> [args]` — manage and dispatch hooks.
 *
 * Subcommands:
 *   discover            List native hook types supported by the harness.
 *   list                List registered hooks (project + global).
 *   add <hookType> [--handler builtin|command|script] [--target <t>] [--id <id>] [--global]
 *   remove <id> [--global]
 *   set <id> [--priority N] [--enabled true|false] [--target <t>]
 *   handle <hookType>   Read JSON payload on stdin, dispatch, emit unified result.
 */

import type { AgentMuxClient, AgentName, UnifiedHookPayload } from '@a5c-ai/agent-mux-core';
import {
  HookConfigManager,
  HookDispatcher,
  builtInHooks,
  getHookCatalog,
  parseHookPayload,
  formatHookResult,
} from '@a5c-ai/agent-mux-core';

import type { ParsedArgs } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import type { FlagDef } from '../parse-args.js';
import {
  printError,
  printJsonError,
  printJsonOk,
  printTable,
} from '../output.js';

import { readStdin } from '../read-stdin.js';


export const HOOKS_FLAGS: Record<string, FlagDef> = {
  handler: { type: 'string' },
  target: { type: 'string' },
  priority: { type: 'string' },
  enabled: { type: 'string' },
  id: { type: 'string' },
  global: { type: 'boolean' },
  project: { type: 'boolean' },
};

function jsonMode(args: ParsedArgs): boolean {
  return flagBool(args.flags, 'json') === true;
}

export async function hooksCommand(
  _client: AgentMuxClient,
  args: ParsedArgs,
): Promise<number> {
  const json = jsonMode(args);
  const agent = args.subcommand as AgentName | undefined;
  const sub = args.positionals[0];
  if (!agent || !sub) {
    const msg = 'Usage: amux hooks <agent> <discover|list|add|remove|set|handle> [...]';
    if (json) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }

  const mgr = new HookConfigManager();

  switch (sub) {
    case 'discover':
      return discover(agent, json);
    case 'list':
      return await list(agent, mgr, json);
    case 'add':
      return await add(agent, mgr, args, json);
    case 'remove':
      return await remove(mgr, args, json);
    case 'set':
      return await set(mgr, args, json);
    case 'handle':
      return await handle(agent, mgr, args);
    default: {
      const msg = `Unknown hooks subcommand: ${sub}`;
      if (json) printJsonError('VALIDATION_ERROR', msg);
      else printError(msg);
      return ExitCode.USAGE_ERROR;
    }
  }
}

function discover(agent: string, json: boolean): number {
  const entries = getHookCatalog(agent);
  if (json) {
    printJsonOk({ agent, hookTypes: entries });
    return ExitCode.SUCCESS;
  }
  if (entries.length === 0) {
    process.stdout.write(`(no hook catalog entry for ${agent})\n`);
    return ExitCode.SUCCESS;
  }
  printTable(
    ['Hook', 'Direction', 'Description'],
    entries.map((e) => [e.name, e.direction, e.description]),
  );
  return ExitCode.SUCCESS;
}

async function list(agent: string, mgr: HookConfigManager, json: boolean): Promise<number> {
  const all = await mgr.list();
  const matching = all.filter((h) => h.agent === agent || h.agent === '*');
  if (json) {
    printJsonOk({ hooks: matching });
    return ExitCode.SUCCESS;
  }
  if (matching.length === 0) {
    process.stdout.write('(no hooks registered)\n');
    return ExitCode.SUCCESS;
  }
  printTable(
    ['ID', 'HookType', 'Handler', 'Target', 'Priority', 'Enabled'],
    matching.map((h) => [
      h.id,
      h.hookType,
      h.handler,
      h.target,
      String(h.priority ?? 100),
      String(h.enabled !== false),
    ]),
  );
  return ExitCode.SUCCESS;
}

async function add(
  agent: string,
  mgr: HookConfigManager,
  args: ParsedArgs,
  json: boolean,
): Promise<number> {
  const hookType = args.positionals[1];
  if (!hookType) {
    const msg = 'Usage: amux hooks <agent> add <hookType> [--handler ...] [--target ...]';
    if (json) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }
  const id = flagStr(args.flags, 'id') ?? `${agent}.${hookType}.${Date.now().toString(36)}`;
  const handler = (flagStr(args.flags, 'handler') ?? 'builtin') as 'builtin' | 'command' | 'script';
  const target = flagStr(args.flags, 'target') ?? 'log';
  const priority = flagStr(args.flags, 'priority');
  const scope = flagBool(args.flags, 'global') === true ? 'global' : 'project';
  const reg = {
    id,
    agent: agent as AgentName,
    hookType,
    handler,
    target,
    priority: priority ? Number(priority) : undefined,
    enabled: true,
  };
  await mgr.add(reg, scope);
  if (json) printJsonOk({ added: reg, scope });
  else process.stdout.write(`Added hook ${id} (${scope}).\n`);
  return ExitCode.SUCCESS;
}

async function remove(
  mgr: HookConfigManager,
  args: ParsedArgs,
  json: boolean,
): Promise<number> {
  const id = args.positionals[1];
  if (!id) {
    const msg = 'Usage: amux hooks <agent> remove <id>';
    if (json) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }
  const scope = flagBool(args.flags, 'global') === true ? 'global'
    : flagBool(args.flags, 'project') === true ? 'project' : undefined;
  const removed = await mgr.remove(id, scope);
  if (json) printJsonOk({ removed, id });
  else process.stdout.write(removed ? `Removed ${id}.\n` : `No hook with id ${id}.\n`);
  return removed ? ExitCode.SUCCESS : ExitCode.GENERAL_ERROR;
}

async function set(
  mgr: HookConfigManager,
  args: ParsedArgs,
  json: boolean,
): Promise<number> {
  const id = args.positionals[1];
  if (!id) {
    const msg = 'Usage: amux hooks <agent> set <id> [--priority N] [--enabled true|false] [--target ...]';
    if (json) printJsonError('VALIDATION_ERROR', msg);
    else printError(msg);
    return ExitCode.USAGE_ERROR;
  }
  const patch: Record<string, unknown> = {};
  const priority = flagStr(args.flags, 'priority');
  const enabled = flagStr(args.flags, 'enabled');
  const target = flagStr(args.flags, 'target');
  if (priority !== undefined) patch['priority'] = Number(priority);
  if (enabled !== undefined) patch['enabled'] = enabled === 'true';
  if (target !== undefined) patch['target'] = target;
  const updated = await mgr.set(id, patch);
  if (!updated) {
    if (json) printJsonError('VALIDATION_ERROR', `No hook with id ${id}`);
    else printError(`No hook with id ${id}`);
    return ExitCode.GENERAL_ERROR;
  }
  if (json) printJsonOk({ updated });
  else process.stdout.write(`Updated ${id}.\n`);
  return ExitCode.SUCCESS;
}

async function handle(
  agent: string,
  mgr: HookConfigManager,
  args: ParsedArgs,
): Promise<number> {
  const hookType = args.positionals[1];
  if (!hookType) {
    process.stderr.write('Usage: amux hooks <agent> handle <hookType>\n');
    return ExitCode.USAGE_ERROR;
  }
  const raw = await readStdin();
  let parsed: unknown = {};
  if (raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { body: raw };
    }
  }
  const payload: UnifiedHookPayload = parseHookPayload(agent, hookType, parsed);
  const dispatcher = new HookDispatcher(mgr, builtInHooks);
  const result = await dispatcher.dispatch(payload);
  const { stdout, exitCode } = formatHookResult(agent, hookType, result);
  if (stdout) process.stdout.write(stdout);
  return exitCode;
}

