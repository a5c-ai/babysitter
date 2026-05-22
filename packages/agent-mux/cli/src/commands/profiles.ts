/**
 * `amux profiles` subcommands.
 *
 * @see docs/10-cli-reference.md Section 17
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import { AgentMuxError } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode, errorCodeToExitCode } from '../exit-codes.js';
import {
  printTable, printJsonOk, printJsonError, printError, printJson, toPlain,
} from '../output.js';

export async function profilesCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const sub = args.subcommand;
  const jsonMode = flagBool(args.flags, 'json') === true;

  if (sub === 'list' || !sub) {
    return profilesList(client, args, jsonMode);
  }

  if (sub === 'show') {
    const name = args.positionals[0];
    if (!name) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <name>');
      } else {
        printError('Missing required argument: <name>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return profilesShow(client, name, jsonMode);
  }

  if (sub === 'set') {
    const name = args.positionals[0];
    if (!name) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <name>');
      } else {
        printError('Missing required argument: <name>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return profilesSet(client, name, args, jsonMode);
  }

  if (sub === 'delete') {
    const name = args.positionals[0];
    if (!name) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <name>');
      } else {
        printError('Missing required argument: <name>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return profilesDelete(client, name, args, jsonMode);
  }

  if (sub === 'apply') {
    const name = args.positionals[0];
    if (!name) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <name>');
      } else {
        printError('Missing required argument: <name>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return profilesApply(client, name, jsonMode);
  }

  if (jsonMode) {
    printJsonError('VALIDATION_ERROR', `Unknown subcommand: profiles ${sub}`);
  } else {
    printError(`Unknown subcommand: profiles ${sub}`);
  }
  return ExitCode.USAGE_ERROR;
}

function parseScope(raw: string | undefined): 'global' | 'project' | undefined {
  if (raw === undefined) return undefined;
  if (raw === 'global' || raw === 'project') return raw;
  throw new Error(`Invalid --scope: "${raw}" (expected "global" or "project")`);
}

async function profilesList(
  client: AgentMuxClient, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    const scope = parseScope(flagStr(args.flags, 'scope'));
    const opts = scope ? { scope } : undefined;
    const profiles = await client.profiles.list(opts);

    if (jsonMode) {
      printJsonOk(profiles);
      return ExitCode.SUCCESS;
    }

    const rows = profiles.map((profile) => {
      const p = toPlain(profile);
      return [
        String(p['name'] ?? '--'),
        String(p['scope'] ?? '--'),
        String(p['agent'] ?? '--'),
        String(p['model'] ?? '--'),
      ];
    });

    printTable(['Name', 'Scope', 'Agent', 'Model'], rows);
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function profilesShow(client: AgentMuxClient, name: string, jsonMode: boolean): Promise<number> {
  try {
    const profile = await client.profiles.show(name);

    if (jsonMode) {
      printJsonOk(profile);
    } else {
      printJson(profile);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function profilesSet(
  client: AgentMuxClient, name: string, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    // Build profile data from remaining flags
    const data: Record<string, unknown> = {};
    const scope = parseScope(flagStr(args.flags, 'scope'));

    const agent = flagStr(args.flags, 'agent');
    const model = flagStr(args.flags, 'model');
    if (agent) data['agent'] = agent;
    if (model) data['model'] = model;

    // Pass through known run flags
    for (const key of Object.keys(args.flags)) {
      if (['agent', 'model', 'scope', 'json', 'help', 'debug', 'config-dir', 'project-dir', 'no-color', 'version'].includes(key)) {
        continue;
      }
      data[key] = args.flags[key];
    }

    const opts = scope ? { scope } : undefined;
    await client.profiles.set(name, data, opts);

    if (jsonMode) {
      printJsonOk({ name, data });
    } else {
      process.stdout.write(`Profile "${name}" saved.\n`);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function profilesDelete(
  client: AgentMuxClient, name: string, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    const scope = parseScope(flagStr(args.flags, 'scope'));
    const opts = scope ? { scope } : undefined;
    await client.profiles.delete(name, opts);

    if (jsonMode) {
      printJsonOk({ deleted: name });
    } else {
      process.stdout.write(`Profile "${name}" deleted.\n`);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function profilesApply(client: AgentMuxClient, name: string, jsonMode: boolean): Promise<number> {
  try {
    const resolved = await client.profiles.apply(name);

    if (jsonMode) {
      printJsonOk(resolved);
    } else {
      printJson(resolved);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

function handleError(err: unknown, jsonMode: boolean): number {
  if (err instanceof AgentMuxError) {
    if (jsonMode) {
      printJsonError(err.code, err.message, err.recoverable);
    } else {
      printError(err.message);
    }
    return errorCodeToExitCode(err.code);
  }

  const message = err instanceof Error ? err.message : String(err);
  if (jsonMode) {
    printJsonError('INTERNAL', message);
  } else {
    printError(message);
  }
  return ExitCode.GENERAL_ERROR;
}
