/**
 * `amux skill <subcommand> <agent> [args] [--global|--project]`
 *
 * Skills are file-convention only — no underlying harness command.
 * We copy/remove skill folders into per-agent locations.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs, FlagDef } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printError, printJsonOk, printJsonError, printTable } from '../output.js';
import { getSkillPaths, getSkillDir, listSupportedAgents, type SkillScope } from '../lib/agent-skill-paths.js';

export const SKILL_FLAGS: Record<string, FlagDef> = {
  global: { type: 'boolean' },
  project: { type: 'boolean' },
  name: { type: 'string' },
  force: { type: 'boolean' },
};

function jsonMode(args: ParsedArgs): boolean {
  return flagBool(args.flags, 'json') === true;
}

function resolveScope(args: ParsedArgs, fallback: SkillScope = 'project'): SkillScope {
  if (flagBool(args.flags, 'global') === true) return 'global';
  if (flagBool(args.flags, 'project') === true) return 'project';
  return fallback;
}

function copyDirRecursive(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDirRecursive(s, d);
    } else if (stat.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function rmDirRecursive(target: string): void {
  fs.rmSync(target, { recursive: true, force: true });
}

export async function skillCommand(
  _client: AgentMuxClient,
  args: ParsedArgs,
): Promise<number> {
  const json = jsonMode(args);

  if (args.flags.help || (!args.subcommand && args.positionals.length === 0)) {
    process.stdout.write([
      'Usage: amux skill <subcommand> <agent> [args] [--global|--project]',
      '',
      'Manage skill folders for an agent (file-convention based, no native command).',
      '',
      'Subcommands:',
      '  list <agent>                       List installed skills',
      '  add <agent> <source-folder>        Copy a skill folder into the agent skills dir',
      '                                     [--name <name>] [--force]',
      '  remove <agent> <name>              Remove a skill folder',
      '  where <agent>                      Show skill directory paths for the agent',
      '  agents                             List agents with known skill conventions',
      '',
      'Scope flags (default: --project):',
      '  --global                           Use the user-level skills dir',
      '  --project                          Use the project-level skills dir',
      '',
      'Examples:',
      '  amux skill list claude',
      '  amux skill add claude ./skills/my-skill --global',
      '  amux skill remove claude my-skill --project',
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

  const paths = getSkillPaths(agent);
  if (!paths) {
    if (json) printJsonError('VALIDATION_ERROR', `Unknown agent for skills: ${agent}`);
    else printError(`Unknown agent for skills: ${agent}. Try: amux skill agents`);
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
      const dir = getSkillDir(agent, scope)!;
      if (!fs.existsSync(dir)) {
        if (json) printJsonOk({ agent, scope, dir, skills: [] });
        else process.stdout.write(`(no skills in ${dir})\n`);
        return ExitCode.SUCCESS;
      }
      const entries = fs.readdirSync(dir).filter((n) => {
        try {
          return fs.statSync(path.join(dir, n)).isDirectory();
        } catch {
          return false;
        }
      });
      if (json) printJsonOk({ agent, scope, dir, skills: entries });
      else if (entries.length === 0) process.stdout.write(`(no skills in ${dir})\n`);
      else {
        printTable(['Skill', 'Path'], entries.map((n) => [n, path.join(dir, n)]));
      }
      return ExitCode.SUCCESS;
    }

    case 'add': {
      const source = args.positionals[1];
      if (!source) {
        if (json) printJsonError('VALIDATION_ERROR', 'Missing source folder');
        else printError('Usage: amux skill add <agent> <source-folder> [--name <n>] [--global|--project]');
        return ExitCode.USAGE_ERROR;
      }
      const absSource = path.resolve(source);
      if (!fs.existsSync(absSource) || !fs.statSync(absSource).isDirectory()) {
        if (json) printJsonError('VALIDATION_ERROR', `Source is not a directory: ${absSource}`);
        else printError(`Source is not a directory: ${absSource}`);
        return ExitCode.GENERAL_ERROR;
      }
      const scope = resolveScope(args, 'project');
      const dir = getSkillDir(agent, scope)!;
      const name = flagStr(args.flags, 'name') ?? path.basename(absSource);
      const dst = path.join(dir, name);
      if (fs.existsSync(dst)) {
        if (flagBool(args.flags, 'force') !== true) {
          if (json) printJsonError('CONFLICT', `Already exists: ${dst} (use --force)`);
          else printError(`Already exists: ${dst} (use --force)`);
          return ExitCode.GENERAL_ERROR;
        }
        rmDirRecursive(dst);
      }
      copyDirRecursive(absSource, dst);
      if (json) printJsonOk({ added: name, scope, path: dst });
      else process.stdout.write(`Installed skill ${name} (${scope}) → ${dst}\n`);
      return ExitCode.SUCCESS;
    }

    case 'remove': {
      const name = args.positionals[1];
      if (!name) {
        if (json) printJsonError('VALIDATION_ERROR', 'Missing skill name');
        else printError('Usage: amux skill remove <agent> <name> [--global|--project]');
        return ExitCode.USAGE_ERROR;
      }
      const scope = resolveScope(args, 'project');
      const dir = getSkillDir(agent, scope)!;
      const target = path.join(dir, name);
      if (!fs.existsSync(target)) {
        if (json) printJsonError('NOT_FOUND', `No skill ${name} in ${dir}`);
        else printError(`No skill ${name} in ${dir}`);
        return ExitCode.GENERAL_ERROR;
      }
      rmDirRecursive(target);
      if (json) printJsonOk({ removed: name, scope, path: target });
      else process.stdout.write(`Removed skill ${name} (${scope})\n`);
      return ExitCode.SUCCESS;
    }

    default: {
      if (json) printJsonError('VALIDATION_ERROR', `Unknown skill subcommand: ${sub}`);
      else printError(`Unknown skill subcommand: ${sub}`);
      return ExitCode.USAGE_ERROR;
    }
  }
}
