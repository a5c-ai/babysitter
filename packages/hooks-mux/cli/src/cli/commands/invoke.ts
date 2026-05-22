/**
 * invoke command — Primary hook entrypoint.
 *
 * Spec section 18.1.
 *
 * Pipeline:
 *   1. Read stdin when adapter expects it
 *   2. Normalize event via adapter normalizer when available, else core normalizeEvent
 *   3. Resolve/load session context via core session store
 *   4. Run handler or fan-out plan via core runPlan
 *   5. Merge results via core mergeResults
 *   6. Persist session store
 *   7. Apply propagation backend
 *   8. Emit adapter-native output via adapter renderer when available
 */

import type { CommandModule } from 'yargs';
import {
  normalizeEvent,
  resolveHookPlan,
  runPlan,
  mergeResults,
  loadSession,
  saveSession,
  adaptOutput,
  propagateEnv,
  type SessionState,
  type MergedExecutionResult,
  type UnifiedHookEvent,
} from '@a5c-ai/hooks-mux-core';
import { loadAdapter } from '../adapter-loader';
import {
  prepareBootstrapSession,
  propagateBootstrapEnv,
  resolveNativeEnvFilePath,
  resolveSessionId,
  tryParseJson,
} from '../bootstrap-runtime';
import { createHooksLogger } from '../hooks-logger';
import { readStdin } from '../stdin';

interface InvokeArgs {
  adapter: string;
  handler?: string[];
  'bootstrap-only'?: boolean;
  'native-event'?: string;
  'session-id'?: string;
  json?: boolean;
}

interface RenderedOutput {
  output: Record<string, unknown>;
  degradedFields: string[];
}

interface RawEventResolution {
  rawEventName: string;
  source: 'cli' | 'env' | 'stdin' | 'claude-heuristic' | 'default';
}

function inferClaudeNativeEventName(
  stdinData: Record<string, unknown> | undefined,
): string | undefined {
  if (!stdinData) {
    return undefined;
  }

  if (
    typeof stdinData['tool_name'] === 'string'
    || typeof stdinData['tool_call_id'] === 'string'
    || stdinData['tool_input'] !== undefined
  ) {
    return stdinData['tool_response'] !== undefined ? 'PostToolUse' : 'PreToolUse';
  }

  if (
    stdinData['stop_hook_active'] !== undefined
    || typeof stdinData['last_assistant_message'] === 'string'
    || typeof stdinData['reason'] === 'string'
  ) {
    return 'Stop';
  }

  if (
    typeof stdinData['source'] === 'string'
    || stdinData['initial_prompt'] !== undefined
  ) {
    return 'SessionStart';
  }

  if (stdinData['prompt'] !== undefined) {
    return 'UserPromptSubmit';
  }

  if (stdinData['agent_type'] !== undefined) {
    return 'SubagentStop';
  }

  if (stdinData['title'] !== undefined || stdinData['message'] !== undefined) {
    return 'Notification';
  }

  return undefined;
}

function resolveRawEventName(
  explicitNativeEvent: string | undefined,
  adapterName: string,
  stdinData: Record<string, unknown> | undefined,
  env: Record<string, string>,
): RawEventResolution {
  if (explicitNativeEvent) {
    return { rawEventName: explicitNativeEvent, source: 'cli' };
  }

  if (env['HOOKS_PROXY_EVENT_NAME']) {
    return { rawEventName: env['HOOKS_PROXY_EVENT_NAME'], source: 'env' };
  }

  if (typeof stdinData?.['event_name'] === 'string') {
    return { rawEventName: stdinData['event_name'], source: 'stdin' };
  }

  if (adapterName === 'claude') {
    const inferred = inferClaudeNativeEventName(stdinData);
    if (inferred) {
      return { rawEventName: inferred, source: 'claude-heuristic' };
    }
  }

  return { rawEventName: 'unknown', source: 'default' };
}

function renderOutput(
  args: InvokeArgs,
  loaded: ReturnType<typeof loadAdapter>,
  merged: MergedExecutionResult,
  rawEventName: string,
  stdinPayload: unknown,
  event: UnifiedHookEvent,
): RenderedOutput {
  if (!loaded.renderer) {
    return adaptOutput({
      adapter: args.adapter,
      mergedResult: merged,
      nativeInput: stdinPayload,
      capabilities: loaded.capabilities,
    });
  }

  const rendered = loaded.renderer(merged, rawEventName, event);
  if (rendered && typeof rendered === 'object' && !Array.isArray(rendered) && 'output' in rendered) {
    const adapterRendered = rendered as {
      output?: unknown;
      degradedFields?: unknown;
      droppedFields?: unknown;
    };

    return {
      output: (
        adapterRendered.output
        && typeof adapterRendered.output === 'object'
        && !Array.isArray(adapterRendered.output)
      )
        ? adapterRendered.output as Record<string, unknown>
        : {},
      degradedFields: [
        ...(Array.isArray(adapterRendered.degradedFields) ? adapterRendered.degradedFields : []),
        ...(Array.isArray(adapterRendered.droppedFields) ? adapterRendered.droppedFields : []),
      ].filter((value): value is string => typeof value === 'string'),
    };
  }

  return {
    output: (rendered && typeof rendered === 'object' && !Array.isArray(rendered))
      ? rendered as Record<string, unknown>
      : {},
    degradedFields: [],
  };
}

/**
 * Parse --handler values into HandlerRef objects.
 * Format: "source:handler" or just "source" (handler defaults to "handler").
 */
function findWindowsPathPrefixLength(value: string): number {
  if (/^[A-Za-z]:[\\/]/.test(value)) {
    return 2;
  }

  if (/^[\\/]{2}\?[\\/][A-Za-z]:[\\/]/.test(value)) {
    return 6;
  }

  return 0;
}

function parseHandlerArgs(handlers: string[]): Array<{ source: string; handler: string }> {
  return handlers.map((h) => {
    const windowsPrefixLength = findWindowsPathPrefixLength(h);
    const colonIdx = windowsPrefixLength > 0
      ? h.indexOf(':', windowsPrefixLength)
      : h.indexOf(':');
    if (colonIdx >= 0) {
      return { source: h.slice(0, colonIdx), handler: h.slice(colonIdx + 1) };
    }
    return { source: h, handler: 'handler' };
  });
}

export const invokeCommand: CommandModule<object, InvokeArgs> = {
  command: 'invoke',
  describe: 'Primary hook entrypoint — normalize, execute, merge, propagate',
  builder: (yargs) =>
    yargs
      .option('adapter', {
        type: 'string',
        demandOption: true,
        describe: 'Adapter name (e.g. claude, codex, copilot) or "auto" to detect from environment',
      })
      .option('handler', {
        type: 'array',
        string: true,
        describe: 'Shell command handler(s) in command:label format',
      })
      .option('bootstrap-only', {
        type: 'boolean',
        default: false,
        describe: 'Only bootstrap session context, skip handler execution',
      })
      .option('native-event', {
        type: 'string',
        describe: 'Explicit native hook event name (for Claude: SessionStart, PreToolUse, PostToolUse, Stop, etc.)',
      })
      .option('session-id', {
        type: 'string',
        describe: 'Explicit session ID override',
      })
      .option('json', {
        type: 'boolean',
        default: false,
        describe: 'Output JSON format',
      }),
  handler: async (args) => {
    const logger = createHooksLogger('invoke');

    // 1. Load adapter
    const loaded = loadAdapter(args.adapter);
    await logger.info('invoke started', {
      adapter: args.adapter,
      bootstrapOnly: Boolean(args['bootstrap-only']),
      handlerCount: args.handler?.length ?? 0,
    });

    // 2. Read stdin
    const rawStdin = await readStdin();
    const stdinPayload = tryParseJson(rawStdin);
    const stdinData = (typeof stdinPayload === 'object' && stdinPayload !== null && !Array.isArray(stdinPayload))
      ? stdinPayload as Record<string, unknown>
      : undefined;

    // Determine raw event name from env or stdin
    const env = process.env as Record<string, string>;
    const rawEvent = resolveRawEventName(
      args['native-event'],
      loaded.capabilities.name,
      stdinData,
      env,
    );
    const { rawEventName } = rawEvent;
    await logger.debug('stdin parsed', {
      rawEventName,
      rawEventNameSource: rawEvent.source,
      stdinBytes: rawStdin.length,
      stdinJson: Boolean(stdinData),
    });

    // 3. Normalize event
    const event = loaded.normalizer
      ? loaded.normalizer(rawEventName, rawStdin, env)
      : normalizeEvent({
        adapter: args.adapter,
        rawEventName,
        stdinPayload,
        env,
        adapterMappings: loaded.phaseMappings,
      });

    // 4. Resolve session
    const sessionId = resolveSessionId(
      loaded.sessionResolver,
      args['session-id'],
      event.execution.sessionId,
      stdinData,
      env,
    );
    await logger.debug('session resolved', {
      sessionId,
      explicitSessionId: args['session-id'] ?? null,
    });
    let session: SessionState | null = null;
    if (sessionId) {
      const prepared = prepareBootstrapSession({
        existingSession: await loadSession(sessionId),
        adapter: args.adapter,
        event,
        sessionId,
      });
      session = prepared.session;

      // Inject session context into event execution
      event.execution.sessionId = sessionId;
      if (session?.persistedEnv) {
        Object.assign(event.execution.persistedEnv, session.persistedEnv);
      }
    }

    // 5. Bootstrap-only mode: persist session and exit
    if (args['bootstrap-only']) {
      const prepared = prepareBootstrapSession({
        existingSession: session,
        adapter: args.adapter,
        event,
        sessionId,
      });
      session = prepared.session;
      if (session) {
        await saveSession(session);
      }
      const propagated = await propagateBootstrapEnv(
        loaded.capabilities.envPersistenceMode,
        prepared.persistEnv,
        env,
      );
      await logger.info('bootstrap-only invoke completed', {
        adapter: args.adapter,
        sessionId,
        propagated,
      });
      if (args.json) {
        process.stdout.write(JSON.stringify({ status: 'bootstrapped', sessionId }, null, 2) + '\n');
      }
      return;
    }

    // 6. Resolve execution plan
    const handlers = args.handler ? parseHandlerArgs(args.handler) : [];
    const plan = resolveHookPlan({
      phase: event.phase,
      handlers,
    });

    // 7. Run plan and merge
    let merged: MergedExecutionResult;
    if (plan.length > 0) {
      const results = await runPlan(event, plan, { capabilities: loaded.capabilities });
      merged = mergeResults(results);
    } else {
      // No handlers: produce a noop result
      merged = mergeResults([{ decision: 'noop' }]);
    }
    await logger.debug('plan executed', {
      phase: event.phase,
      planLength: plan.length,
      decision: merged.decision,
      degradedFields: merged.diagnostics.degradedFields,
    });

    // 8. Persist session updates
    if (session && sessionId) {
      if (Object.keys(merged.persistEnv).length > 0) {
        session.persistedEnv = { ...session.persistedEnv, ...merged.persistEnv };
      }
      if (Object.keys(merged.contextVars).length > 0) {
        session.contextVars = { ...session.contextVars, ...merged.contextVars };
      }
      for (const key of merged.unsetEnv) {
        delete session.persistedEnv[key];
      }
      session.updatedAt = new Date().toISOString();
      await saveSession(session);
    }

    // 9. Apply propagation backend
    if (Object.keys(merged.persistEnv).length > 0) {
      const backend = loaded.capabilities.envPersistenceMode;
      await propagateEnv(backend, merged.persistEnv, {
        nativeEnvFilePath: resolveNativeEnvFilePath(env),
      });
    }

    // 10. Emit adapter-native output
    const adapted = renderOutput(args, loaded, merged, rawEventName, stdinPayload, event);

    await logger.info('invoke completed', {
      adapter: args.adapter,
      phase: event.phase,
      sessionId,
      decision: merged.decision,
      degradedFields: adapted.degradedFields,
    });
    const finalOutput: Record<string, unknown> = { ...adapted.output };
    if (Object.keys(adapted.output).length === 0) {
      finalOutput.decision = merged.decision;
    }
    if (Object.keys(merged.persistEnv).length > 0) {
      finalOutput.persistEnv = merged.persistEnv;
    }
    finalOutput.metadata = {
      ...(sessionId ? { AGENT_SESSION_ID: sessionId } : {}),
      AGENT_ADAPTER: args.adapter,
    };
    process.stdout.write(JSON.stringify(finalOutput, null, args.json ? 2 : 0) + '\n');
  },
};
