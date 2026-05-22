/**
 * `amux sessions` subcommands.
 *
 * @see docs/10-cli-reference.md Section 12
 */

import type { AgentMuxClient, SessionQuery } from '@a5c-ai/agent-mux-core';
import { AgentMuxError } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../parse-args.js';
import { flagBool, flagStr, flagNum, flagArr } from '../parse-args.js';
import { ExitCode, errorCodeToExitCode } from '../exit-codes.js';
import {
  printTable, printJsonOk, printJsonError, printError, printJson, toPlain,
} from '../output.js';

export async function sessionsCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const sub = args.subcommand;
  const jsonMode = flagBool(args.flags, 'json') === true;

  if (!sub || sub === 'list') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return sessionsList(client, agent, args, jsonMode);
  }

  if (sub === 'show') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    const sessionId = args.positionals[1];
    if (!agent || !sessionId) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Usage: amux sessions show <agent> <session-id>');
      } else {
        printError('Usage: amux sessions show <agent> <session-id>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return sessionsShow(client, agent, sessionId, args, jsonMode);
  }

  if (sub === 'search') {
    const query = args.positionals[0];
    if (!query) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <query>');
      } else {
        printError('Missing required argument: <query>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return sessionsSearch(client, query, args, jsonMode);
  }

  if (sub === 'export') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    const sessionId = args.positionals[1];
    if (!agent || !sessionId) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Usage: amux sessions export <agent> <session-id>');
      } else {
        printError('Usage: amux sessions export <agent> <session-id>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return sessionsExport(client, agent, sessionId, args, jsonMode);
  }

  if (sub === 'cost') {
    return sessionsCost(client, args, jsonMode);
  }

  if (jsonMode) {
    printJsonError('VALIDATION_ERROR', `Unknown subcommand: sessions ${sub}`);
  } else {
    printError(`Unknown subcommand: sessions ${sub}`);
  }
  return ExitCode.USAGE_ERROR;
}

async function sessionsList(
  client: AgentMuxClient, agent: string, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    const opts: Record<string, unknown> = {};
    const since = flagStr(args.flags, 'since');
    const until = flagStr(args.flags, 'until');
    const model = flagStr(args.flags, 'model');
    const tags = flagArr(args.flags, 'tag');
    const limit = flagNum(args.flags, 'limit');
    const sort = flagStr(args.flags, 'sort');

    if (since) opts['since'] = since;
    if (until) opts['until'] = until;
    if (model) opts['model'] = model;
    if (tags.length > 0) opts['tags'] = tags;
    if (limit !== undefined) opts['limit'] = limit;
    if (sort) opts['sort'] = sort;

    const sessions = await client.sessions.list(agent, opts);

    if (jsonMode) {
      printJsonOk(sessions);
      return ExitCode.SUCCESS;
    }

    const rows = sessions.map((session) => {
      const s = toPlain(session);
      return [
        String(s['sessionId'] ?? s['id'] ?? '--'),
        String(s['model'] ?? '--'),
        String(s['turns'] ?? '--'),
        String(s['cost'] ?? '--'),
        String(s['date'] ?? s['startedAt'] ?? '--'),
        String(s['summary'] ?? '--'),
      ];
    });

    printTable(['Session ID', 'Model', 'Turns', 'Cost', 'Date', 'Summary'], rows);
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function sessionsShow(
  client: AgentMuxClient, agent: string, sessionId: string, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    const format = flagStr(args.flags, 'format') ?? 'markdown';
    const result = await client.sessions.export(agent, sessionId, format as 'json' | 'jsonl' | 'markdown');

    if (jsonMode) {
      printJsonOk(result);
    } else {
      process.stdout.write(typeof result === 'string' ? result + '\n' : JSON.stringify(result, null, 2) + '\n');
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function sessionsSearch(
  client: AgentMuxClient, query: string, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    const agent = flagStr(args.flags, 'agent');
    const since = flagStr(args.flags, 'since');
    const until = flagStr(args.flags, 'until');

    const searchOpts: SessionQuery = {
      text: query,
      ...(agent !== undefined ? { agent } : {}),
      ...(since !== undefined ? { since: new Date(since) } : {}),
      ...(until !== undefined ? { until: new Date(until) } : {}),
    };

    const results = await client.sessions.search(searchOpts);

    if (jsonMode) {
      printJsonOk(results);
      return ExitCode.SUCCESS;
    }

    const rows = results.map((result) => {
      const s = toPlain(result);
      return [
        String(s['sessionId'] ?? s['id'] ?? '--'),
        String(s['agent'] ?? '--'),
        String(s['summary'] ?? '--'),
      ];
    });

    printTable(['Session ID', 'Agent', 'Summary'], rows);
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function sessionsExport(
  client: AgentMuxClient, agent: string, sessionId: string, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    const format = flagStr(args.flags, 'format') ?? 'json';
    const result = await client.sessions.export(agent, sessionId, format as 'json' | 'jsonl' | 'markdown');

    if (typeof result === 'string') {
      process.stdout.write(result + '\n');
    } else {
      printJson(result);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function sessionsCost(
  client: AgentMuxClient, args: ParsedArgs, jsonMode: boolean,
): Promise<number> {
  try {
    const costData = await client.sessions.totalCost();

    if (jsonMode) {
      printJsonOk(costData);
      return ExitCode.SUCCESS;
    }

    if (typeof costData === 'object' && costData !== null) {
      const entries = Object.entries(toPlain(costData));
      const rows = entries.map(([k, v]) => [k, String(v)]);
      printTable(['Agent', 'Cost'], rows);
    } else {
      process.stdout.write(`Total cost: ${String(costData)}\n`);
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
