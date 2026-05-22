/**
 * `amux adapters` subcommands.
 *
 * @see docs/10-cli-reference.md Section 8
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import { AgentMuxError } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode, errorCodeToExitCode } from '../exit-codes.js';
import {
  printTable, printKeyValue, printJsonOk, printJsonError, printError,
} from '../output.js';

export async function adaptersCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const sub = args.subcommand;
  const jsonMode = flagBool(args.flags, 'json') === true;

  if (!sub || sub === 'list') {
    return adaptersList(client, jsonMode);
  }

  if (sub === 'detect') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return adaptersDetect(client, agent, jsonMode);
  }

  if (sub === 'info') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return adaptersInfo(client, agent, jsonMode);
  }

  if (jsonMode) {
    printJsonError('VALIDATION_ERROR', `Unknown subcommand: adapters ${sub}`);
  } else {
    printError(`Unknown subcommand: adapters ${sub}`);
  }
  return ExitCode.USAGE_ERROR;
}

async function adaptersList(client: AgentMuxClient, jsonMode: boolean): Promise<number> {
  try {
    const adapters = client.adapters.list();

    if (jsonMode) {
      printJsonOk(adapters);
      return ExitCode.SUCCESS;
    }

    const rows = adapters.map((a) => [
      a.agent,
      a.displayName ?? a.agent,
      a.source ?? 'built-in',
    ]);

    printTable(['Agent', 'Display Name', 'Source'], rows);
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function adaptersDetect(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    const info = await client.adapters.detect(agent);

    if (jsonMode) {
      printJsonOk(info);
      return ExitCode.SUCCESS;
    }

    if (!info) {
      printKeyValue([
        ['Agent:', agent],
        ['Installed:', 'no'],
      ]);
      return ExitCode.SUCCESS;
    }

    printKeyValue([
      ['Agent:', info.agent],
      ['Installed:', info.installed ? 'yes' : 'no'],
      ['Path:', info.cliPath ?? '--'],
      ['Version:', info.version ?? '--'],
    ]);
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function adaptersInfo(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    const caps = client.adapters.capabilities(agent);

    if (jsonMode) {
      printJsonOk(caps);
      return ExitCode.SUCCESS;
    }

    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(caps)) {
      entries.push([`${key}:`, String(value)]);
    }
    printKeyValue(entries);
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
