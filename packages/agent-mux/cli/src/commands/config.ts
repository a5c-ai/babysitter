/**
 * `amux config` subcommands.
 *
 * @see docs/10-cli-reference.md Section 16
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import { AgentMuxError } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode, errorCodeToExitCode } from '../exit-codes.js';
import {
  printJson, printJsonOk, printJsonError, printError, printKeyValue, toPlain,
} from '../output.js';

export async function configCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const sub = args.subcommand;
  const jsonMode = flagBool(args.flags, 'json') === true;

  if (sub === 'get') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    const field = args.positionals[1];
    return configGet(client, agent, field, jsonMode);
  }

  if (sub === 'set') {
    const agent = args.positionals[0];
    const field = args.positionals[1];
    const value = args.positionals[2];
    if (!agent || !field || value === undefined) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Usage: amux config set <agent> <field> <value>');
      } else {
        printError('Usage: amux config set <agent> <field> <value>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return configSet(client, agent, field, value, jsonMode);
  }

  if (sub === 'schema') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return configSchema(client, agent, jsonMode);
  }

  if (sub === 'validate') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return configValidate(client, agent, jsonMode);
  }

  if (sub === 'reload') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    return configReload(client, agent, jsonMode);
  }

  if (!sub) {
    if (jsonMode) {
      printJsonError('VALIDATION_ERROR', 'Missing subcommand. Available: get, set, schema, validate, reload');
    } else {
      printError('Missing subcommand. Available: get, set, schema, validate, reload');
    }
    return ExitCode.USAGE_ERROR;
  }

  if (jsonMode) {
    printJsonError('VALIDATION_ERROR', `Unknown subcommand: config ${sub}`);
  } else {
    printError(`Unknown subcommand: config ${sub}`);
  }
  return ExitCode.USAGE_ERROR;
}

async function configGet(
  client: AgentMuxClient, agent: string, field: string | undefined, jsonMode: boolean,
): Promise<number> {
  try {
    let result: unknown;
    if (field) {
      result = await client.config.getField(agent, field);
    } else {
      result = await client.config.get(agent);
    }

    if (jsonMode) {
      // Ensure `data` key is present even when the field is missing, so
      // consumers can rely on a consistent { ok, data } shape.
      printJsonOk(result === undefined ? null : result);
    } else if (typeof result === 'object' && result !== null) {
      printJson(result);
    } else {
      process.stdout.write(String(result) + '\n');
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function configSet(
  client: AgentMuxClient, agent: string, field: string, rawValue: string, jsonMode: boolean,
): Promise<number> {
  try {
    // Parse value: JSON if it starts with {, [, ", or is a number/boolean
    let value: unknown = rawValue;
    if (
      rawValue.startsWith('{') || rawValue.startsWith('[') || rawValue.startsWith('"') ||
      rawValue === 'true' || rawValue === 'false' || rawValue === 'null' ||
      !Number.isNaN(Number(rawValue))
    ) {
      try {
        value = JSON.parse(rawValue);
      } catch {
        // Keep as string
      }
    }

    await client.config.setField(agent, field, value);

    if (jsonMode) {
      printJsonOk({ agent, field, value });
    } else {
      process.stdout.write(`Set ${agent}.${field} = ${JSON.stringify(value)}\n`);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function configSchema(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    const schema = await client.config.schema(agent);

    if (jsonMode) {
      printJsonOk(schema);
    } else {
      printJson(schema);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function configValidate(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    const config = await client.config.get(agent);
    const result = await client.config.validate(agent, config);

    if (jsonMode) {
      printJsonOk(result);
    } else {
      const r = toPlain(result);
      if (r['valid']) {
        process.stdout.write('Configuration is valid.\n');
      } else {
        const errors = (r['errors'] ?? []) as Array<Record<string, unknown>>;
        for (const e of errors) {
          process.stderr.write(`  ${e['field']}: ${e['message']}\n`);
        }
      }
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function configReload(
  client: AgentMuxClient, agent: string | undefined, jsonMode: boolean,
): Promise<number> {
  try {
    if (agent) {
      await client.config.reload(agent);
    } else {
      await client.config.reload();
    }

    if (jsonMode) {
      printJsonOk({ reloaded: agent ?? 'all' });
    } else {
      process.stdout.write(`Configuration reloaded${agent ? ` for ${agent}` : ''}.\n`);
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
