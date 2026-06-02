/**
 * `amux models` subcommands.
 *
 * @see docs/10-cli-reference.md Section 10
 */

import type { AgentMuxClient, ProviderId } from '@a5c-ai/agent-mux-comm';
import { AgentMuxError, PROVIDER_DEFAULTS, MODEL_TRANSLATION_TABLE } from '@a5c-ai/agent-mux-comm';
import type { ParsedArgs } from '../parse-args.js';
import { flagBool, flagStr } from '../parse-args.js';
import { ExitCode, errorCodeToExitCode } from '../exit-codes.js';
import {
  printTable, printJsonOk, printJsonError, printError, printJson, printKeyValue, toPlain,
} from '../output.js';

export async function modelsCommand(client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const sub = args.subcommand;
  const jsonMode = flagBool(args.flags, 'json') === true;

  if (sub === 'list') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return modelsList(client, agent, jsonMode);
  }

  if (sub === 'info' || sub === 'get') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    const modelId = args.positionals[1];
    if (!agent || !modelId) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Usage: amux models info <agent> <model>');
      } else {
        printError('Usage: amux models info <agent> <model>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return modelsInfo(client, agent, modelId, jsonMode);
  }

  if (sub === 'refresh') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return modelsRefresh(client, agent, jsonMode);
  }

  if (sub === 'current') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    if (!agent) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Missing required argument: <agent>');
      } else {
        printError('Missing required argument: <agent>');
      }
      return ExitCode.USAGE_ERROR;
    }
    return modelsCurrent(client, agent, jsonMode);
  }

  if (sub === 'set') {
    const agent = args.positionals[0] ?? flagStr(args.flags, 'agent');
    const modelId = args.positionals[1];
    const provider = flagStr(args.flags, 'provider');
    if (!agent || !modelId) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', 'Usage: amux models set <agent> <model> [--provider <provider>]');
      } else {
        printError('Usage: amux models set <agent> <model> [--provider <provider>]');
      }
      return ExitCode.USAGE_ERROR;
    }
    return modelsSet(client, agent, modelId, provider, jsonMode);
  }

  // Top-level --provider flag (no subcommand required)
  const topLevelProvider = flagStr(args.flags, 'provider');
  if (!sub && topLevelProvider) {
    return modelsProvider(topLevelProvider, jsonMode);
  }

  if (!sub) {
    if (jsonMode) {
      printJsonError('VALIDATION_ERROR', 'Missing subcommand. Available: list, info, refresh, current, set');
    } else {
      printError('Missing subcommand. Available: list, info, refresh, current, set');
    }
    return ExitCode.USAGE_ERROR;
  }

  if (jsonMode) {
    printJsonError('VALIDATION_ERROR', `Unknown subcommand: models ${sub}`);
  } else {
    printError(`Unknown subcommand: models ${sub}`);
  }
  return ExitCode.USAGE_ERROR;
}

async function modelsList(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    const models = client.models.catalog(agent);

    if (jsonMode) {
      printJsonOk(models);
      return ExitCode.SUCCESS;
    }

    const rows = models.map((model) => {
      const m = toPlain(model);
      return [
      String(m['id'] ?? m['modelId'] ?? '--'),
      String(m['displayName'] ?? m['name'] ?? '--'),
      String(m['provider'] ?? '--'),
      String(m['protocol'] ?? '--'),
      String(m['deployment'] ?? '--'),
      String(m['contextWindow'] ?? '--'),
      String(m['source'] ?? '--'),
      m['isDefault'] ? 'yes' : 'no',
      ];
    });

    printTable(
      ['Model ID', 'Display Name', 'Provider', 'Protocol', 'Deploy', 'Context', 'Source', 'Default'],
      rows,
    );
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function modelsInfo(
  client: AgentMuxClient, agent: string, modelId: string, jsonMode: boolean,
): Promise<number> {
  try {
    const model = client.models.model(agent, modelId);

    if (!model) {
      if (jsonMode) {
        printJsonError('AGENT_NOT_FOUND', `Model "${modelId}" not found for agent "${agent}"`);
      } else {
        printError(`Model "${modelId}" not found for agent "${agent}"`);
      }
      return ExitCode.GENERAL_ERROR;
    }

    if (jsonMode) {
      printJsonOk(model);
    } else {
      printJson(model);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function modelsRefresh(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    await client.models.refresh(agent);
    const models = client.models.catalog(agent);
    const lastUpdated = client.models.lastUpdated(agent).toISOString();

    if (jsonMode) {
      printJsonOk({ refreshed: agent, count: models.length, lastUpdated });
    } else {
      process.stdout.write(`Model list refreshed for ${agent} (${models.length} entries, ${lastUpdated}).\n`);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function modelsCurrent(client: AgentMuxClient, agent: string, jsonMode: boolean): Promise<number> {
  try {
    const selection = client.config.getModelSelection(agent);
    const effective = selection.effectiveModel
      ? client.models.model(agent, selection.effectiveModel)
      : null;
    const payload = {
      agent,
      configuredModel: selection.configuredModel,
      configuredProvider: selection.configuredProvider,
      defaultModel: selection.defaultModel,
      effectiveModel: effective?.modelId ?? selection.effectiveModel,
      effectiveModelDetails: effective,
    };

    if (jsonMode) {
      printJsonOk(payload);
    } else {
      printKeyValue([
        ['Agent', agent],
        ['Configured Model', selection.configuredModel ?? '--'],
        ['Configured Provider', selection.configuredProvider ?? '--'],
        ['Default Model', selection.defaultModel ?? '--'],
        ['Effective Model', effective?.modelId ?? selection.effectiveModel ?? '--'],
        ['Provider', effective?.provider ?? '--'],
        ['Protocol', effective?.protocol ?? '--'],
        ['Deployment', effective?.deployment ?? '--'],
      ]);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

async function modelsSet(
  client: AgentMuxClient,
  agent: string,
  modelId: string,
  provider: string | undefined,
  jsonMode: boolean,
): Promise<number> {
  try {
    const validation = client.models.validate(agent, modelId);
    if (!validation.valid || !validation.model) {
      if (jsonMode) {
        printJsonError('VALIDATION_ERROR', validation.message);
      } else {
        printError(validation.message);
      }
      return ExitCode.USAGE_ERROR;
    }

    const resolvedModelId = validation.resolvedModelId ?? validation.model.modelId;
    await client.config.setModelSelection(agent, { model: resolvedModelId, provider });
    const selection = client.config.getModelSelection(agent);
    const payload = {
      agent,
      requestedModel: modelId,
      configuredModel: selection.configuredModel,
      configuredProvider: selection.configuredProvider,
      status: validation.status,
      effectiveModel: selection.effectiveModel,
    };

    if (jsonMode) {
      printJsonOk(payload);
    } else {
      process.stdout.write(`Set model for ${agent} to ${resolvedModelId}${provider ? ` (${provider})` : ''}.\n`);
    }
    return ExitCode.SUCCESS;
  } catch (err: unknown) {
    return handleError(err, jsonMode);
  }
}

function modelsProvider(providerId: string, jsonMode: boolean): number {
  const defaults = PROVIDER_DEFAULTS[providerId as keyof typeof PROVIDER_DEFAULTS];
  if (!defaults) {
    const available = Object.keys(PROVIDER_DEFAULTS).join(', ');
    if (jsonMode) {
      printJsonError('VALIDATION_ERROR', `Unknown provider: ${providerId}. Available: ${available}`);
    } else {
      printError(`Unknown provider: ${providerId}. Available: ${available}`);
    }
    return ExitCode.USAGE_ERROR;
  }

  // Collect translation table entries that have a mapping for this provider
  const translationRows: Array<[string, string]> = [];
  for (const [canonical, mapping] of Object.entries(MODEL_TRANSLATION_TABLE)) {
    const translated = (mapping as Partial<Record<ProviderId, string>>)[providerId as ProviderId];
    if (translated) {
      translationRows.push([canonical, translated]);
    }
  }

  if (jsonMode) {
    printJsonOk({
      provider: providerId,
      defaultModel: defaults.defaultModel,
      transport: defaults.transport,
      authType: defaults.authType,
      apiBase: defaults.apiBase,
      envKey: defaults.envKey ?? null,
      modelTranslations: Object.fromEntries(translationRows),
    });
    return ExitCode.SUCCESS;
  }

  printKeyValue([
    ['Provider', providerId],
    ['Default Model', defaults.defaultModel || '--'],
    ['Transport', defaults.transport],
    ['Auth Type', defaults.authType],
    ['API Base', defaults.apiBase || '--'],
    ['Env Key', defaults.envKey ?? '--'],
  ]);

  if (translationRows.length > 0) {
    process.stdout.write('\nModel Translations:\n');
    printTable(
      ['Canonical Model', `${providerId} Model ID`],
      translationRows,
    );
  }

  return ExitCode.SUCCESS;
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
