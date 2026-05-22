/**
 * `amux auth` subcommands.
 *
 * @see docs/10-cli-reference.md Section 18
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import { AgentMuxError } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode, errorCodeToExitCode } from '../exit-codes.js';
import {
  printTable, printKeyValue, printJsonOk, printJsonError, printError, toPlain,
} from '../output.js';

export async function authCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const sub = args.subcommand;
  const jsonMode = flagBool(args.flags, 'json') === true;

  if (sub === 'check') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    return authCheck(client, agent, jsonMode);
  }

  if (sub === 'setup') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return authSetup(client, agent, jsonMode);
  }

  if (!sub) {
    if (jsonMode) {
      printJsonError('VALIDATION_ERROR', 'Missing subcommand. Available: check, setup');
    } else {
      printError('Missing subcommand. Available: check, setup');
    }
    return ExitCode.USAGE_ERROR;
  }

  if (jsonMode) {
    printJsonError('VALIDATION_ERROR', `Unknown subcommand: auth ${sub}`);
  } else {
    printError(`Unknown subcommand: auth ${sub}`);
  }
  return ExitCode.USAGE_ERROR;
}

async function authCheck(
  client: AgentMuxClient, agent: string | undefined, jsonMode: boolean,
): Promise<number> {
  try {
    if (agent) {
      const state = await client.auth.check(agent);

      if (jsonMode) {
        printJsonOk(state);
        return ExitCode.SUCCESS;
      }

      const s = toPlain(state);
      printKeyValue([
        ['Agent:', agent],
        ['Status:', String(s['status'] ?? '--')],
        ['Method:', String(s['method'] ?? '--')],
        ['Identity:', String(s['identity'] ?? '--')],
      ]);
      return ExitCode.SUCCESS;
    }

    // Check all agents
    const allStates = await client.auth.checkAll();

    if (jsonMode) {
      printJsonOk(allStates);
      return ExitCode.SUCCESS;
    }

    const entries = Object.entries(allStates);
    const rows = entries.map(([name, state]) => {
      const s = toPlain(state);
      return [
        name,
        String(s['status'] ?? '--'),
        String(s['method'] ?? '--'),
        String(s['identity'] ?? '--'),
      ];
    });

    printTable(['Agent', 'Status', 'Method', 'Identity'], rows);
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function authSetup(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    const guidance = await client.auth.getSetupGuidance(agent);

    if (jsonMode) {
      printJsonOk(guidance);
      return ExitCode.SUCCESS;
    }

    const g = toPlain(guidance);
    process.stdout.write(`Authentication setup for ${agent}\n\n`);

    if (g['steps'] && Array.isArray(g['steps'])) {
      const steps = g['steps'] as Array<Record<string, unknown>>;
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!;
        process.stdout.write(`${i + 1}. ${step['description'] ?? step['instruction'] ?? String(step)}\n`);
      }
    }

    if (g['envVars'] && Array.isArray(g['envVars'])) {
      process.stdout.write('\nEnvironment variables:\n');
      for (const v of g['envVars'] as string[]) {
        process.stdout.write(`  ${v}\n`);
      }
    }

    if (g['docsUrl']) {
      process.stdout.write(`\nDocumentation: ${g['docsUrl']}\n`);
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
