/**
 * `amux agent <subcommand> <agent> [args] [--global|--project]`
 *
 * Custom sub-agent management. Like skills, this is file-convention only
 * — no underlying harness command. We copy/remove agent definition files
 * (typically markdown) into per-agent locations.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs, FlagDef } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printError, printJsonOk, printJsonError, printTable } from '../output.js';
import {
  getSubagentPaths,
  getSubagentDir,
  listSupportedAgents,
  type SubagentScope,
} from '../lib/agent-subagent-paths.js';

export const AGENT_FLAGS: Record<string, FlagDef> = {
  global: { type: 'boolean' },
  project: { type: 'boolean' },
  name: { type: 'string' },
  force: { type: 'boolean' },
};

function jsonMode(args: ParsedArgs): boolean {
  return flagBool(args.flags, 'json') === true;
}

function resolveScope(args: ParsedArgs, fallback: SubagentScope = 'project'): SubagentScope {
  if (flagBool(args.flags, 'global') === true) return 'global';
  if (flagBool(args.flags, 'project') === true) return 'project';
  return fallback;
}

function copyPath(src: string, dst: string): void {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) copyPath(path.join(src, name), path.join(dst, name));
  } else if (st.isFile()) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

function removePath(target: string): void {
  fs.rmSync(target, { recursive: true, force: true });
}

const AGENT_FILE_EXTS = ['.md', '.markdown', '.yaml', '.yml', '.json', '.toml'];

function listAgentFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => {
    try {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) return true;
      return AGENT_FILE_EXTS.includes(path.extname(name).toLowerCase());
    } catch {
      return false;
    }
  });
}

export async function agentCommand(
  _client: AgentMuxClient,
  args: ParsedArgs,
): Promise<number> {
  const json = jsonMode(args);

  if (args.flags.help || (!args.subcommand && args.positionals.length === 0)) {
    process.stdout.write([
      'Usage: amux agent <subcommand> <agent> [args] [--global|--project]',
      '',
      'Manage custom sub-agents for a harness (file-convention based, no native command).',
      '',
      'Subcommands:',
      '  list <agent>                       List installed sub-agents',
      '  add <agent> <source>               Copy an agent file or folder into the agents dir',
      '                                     [--name <name>] [--force]',
      '  remove <agent> <name>              Remove an agent file or folder',
      '  where <agent>                      Show agent directory paths',
      '  agents                             List harnesses with known agent conventions',
      '',
      'Scope flags (default: --project):',
      '  --global                           Use the user-level agents dir',
      '  --project                          Use the project-level agents dir',
      '',
      'Examples:',
      '  amux agent list claude',
      '  amux agent add claude ./my-agent.md --global',
      '  amux agent remove claude my-agent.md --project',
    ].join('\n') + '\n');
    return ExitCode.SUCCESS;
  }

  const sub = args.subcommand;
  if (!sub) {
    if (json) printJsonError('VALIDATION_ERROR', 'Missing subcommand');
    else printError('Missing subcommand. Available: list, add, remove, where, agents');
    return ExitCode.USAGE_ERROR;
  }

  if (sub === 'agents') {
    const agents = listSupportedAgents();
    if (json) printJsonOk({ agents });
    else process.stdout.write(agents.join('\n') + '\n');
    return ExitCode.SUCCESS;
  }

  const agent = args.positionals[0];
  if (!agent) {
    if (json) printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
    else printError('Missing required argument: <agent>');
    return ExitCode.USAGE_ERROR;
  }

  const paths = getSubagentPaths(agent);
  if (!paths) {
    if (json) printJsonError('VALIDATION_ERROR', `Unknown agent for sub-agents: ${agent}`);
    else printError(`Unknown agent for sub-agents: ${agent}. Try: amux agent agents`);
    return ExitCode.USAGE_ERROR;
  }

  switch (sub) {
    case 'where': {
      if (json) printJsonOk({ agent, ...paths });
      else {
        printTable(['Scope', 'Path'], [
          ['global', paths.global],
          ['project', paths.project],
        ]);
      }
      return ExitCode.SUCCESS;
    }

    case 'list': {
      const scope = resolveScope(args, 'project');
      const dir = getSubagentDir(agent, scope)!;
      const entries = listAgentFiles(dir);
      if (json) printJsonOk({ agent, scope, dir, subagents: entries });
      else if (entries.length === 0) process.stdout.write(`(no sub-agents in ${dir})\n`);
      else printTable(['Name', 'Path'], entries.map((n) => [n, path.join(dir, n)]));
      return ExitCode.SUCCESS;
    }

    case 'add': {
      const source = args.positionals[1];
      if (!source) {
        if (json) printJsonError('VALIDATION_ERROR', 'Missing source path');
        else printError('Usage: amux agent add <agent> <source> [--name <n>] [--global|--project]');
        return ExitCode.USAGE_ERROR;
      }
      const absSource = path.resolve(source);
      if (!fs.existsSync(absSource)) {
        if (json) printJsonError('VALIDATION_ERROR', `Source does not exist: ${absSource}`);
        else printError(`Source does not exist: ${absSource}`);
        return ExitCode.GENERAL_ERROR;
      }
      const scope = resolveScope(args, 'project');
      const dir = getSubagentDir(agent, scope)!;
      const name = flagStr(args.flags, 'name') ?? path.basename(absSource);
      const dst = path.join(dir, name);
      if (fs.existsSync(dst)) {
        if (flagBool(args.flags, 'force') !== true) {
          if (json) printJsonError('CONFLICT', `Already exists: ${dst} (use --force)`);
          else printError(`Already exists: ${dst} (use --force)`);
          return ExitCode.GENERAL_ERROR;
        }
        removePath(dst);
      }
      fs.mkdirSync(dir, { recursive: true });
      copyPath(absSource, dst);
      if (json) printJsonOk({ added: name, scope, path: dst });
      else process.stdout.write(`Installed sub-agent ${name} (${scope}) → ${dst}\n`);
      return ExitCode.SUCCESS;
    }

    case 'remove': {
      const name = args.positionals[1];
      if (!name) {
        if (json) printJsonError('VALIDATION_ERROR', 'Missing sub-agent name');
        else printError('Usage: amux agent remove <agent> <name> [--global|--project]');
        return ExitCode.USAGE_ERROR;
      }
      const scope = resolveScope(args, 'project');
      const dir = getSubagentDir(agent, scope)!;
      const target = path.join(dir, name);
      if (!fs.existsSync(target)) {
        if (json) printJsonError('NOT_FOUND', `No sub-agent ${name} in ${dir}`);
        else printError(`No sub-agent ${name} in ${dir}`);
        return ExitCode.GENERAL_ERROR;
      }
      removePath(target);
      if (json) printJsonOk({ removed: name, scope, path: target });
      else process.stdout.write(`Removed sub-agent ${name} (${scope})\n`);
      return ExitCode.SUCCESS;
    }

    default: {
      if (json) printJsonError('VALIDATION_ERROR', `Unknown agent subcommand: ${sub}`);
      else printError(`Unknown agent subcommand: ${sub}`);
      return ExitCode.USAGE_ERROR;
    }
  }
}
