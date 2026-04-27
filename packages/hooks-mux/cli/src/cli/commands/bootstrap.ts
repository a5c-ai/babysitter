/**
 * bootstrap command — Dedicated no-op context bootstrap.
 *
 * Spec section 18.3.
 *
 * Reads stdin for session discovery, resolves adapter-native session IDs,
 * creates/loads session state, persists baseline env, and applies any
 * supported propagation backend.
 */

import type { CommandModule } from 'yargs';
import {
  normalizeEvent,
  loadSession,
  saveSession,
} from '@a5c-ai/hooks-mux-core';
import { loadAdapter } from '../adapter-loader';
import {
  prepareBootstrapSession,
  propagateBootstrapEnv,
  resolveSessionId,
  tryParseJson,
} from '../bootstrap-runtime';
import { createHooksLogger } from '../hooks-logger';
import { readStdin } from '../stdin';

interface BootstrapArgs {
  adapter: string;
  'session-id'?: string;
  json?: boolean;
}

export const bootstrapCommand: CommandModule<object, BootstrapArgs> = {
  command: 'bootstrap',
  describe: 'No-op context bootstrap — initialize session without running handlers',
  builder: (yargs) =>
    yargs
      .option('adapter', {
        type: 'string',
        demandOption: true,
        describe: 'Adapter name (e.g. claude, codex, copilot) or "auto" to detect from environment',
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
    const logger = createHooksLogger('bootstrap');
    const loaded = loadAdapter(args.adapter);
    const env = process.env as Record<string, string>;
    const rawStdin = await readStdin();
    const stdinPayload = tryParseJson(rawStdin);
    const stdinData = (typeof stdinPayload === 'object' && stdinPayload !== null && !Array.isArray(stdinPayload))
      ? stdinPayload as Record<string, unknown>
      : undefined;

    const rawEventName = loaded.capabilities.name === 'claude'
      ? 'SessionStart'
      : 'bootstrap';

    const event = loaded.normalizer
      ? loaded.normalizer(rawEventName, rawStdin, env)
      : normalizeEvent({
        adapter: args.adapter,
        rawEventName,
        stdinPayload,
        env,
        adapterMappings: loaded.phaseMappings,
      });

    const sessionId = resolveSessionId(
      loaded.sessionResolver,
      args['session-id'],
      event.execution.sessionId,
      stdinData,
      env,
    ) ?? `bootstrap-${Date.now()}`;

    const prepared = prepareBootstrapSession({
      existingSession: await loadSession(sessionId),
      adapter: args.adapter,
      event,
      sessionId,
    });
    const session = prepared.session;

    if (session) {
      await saveSession(session);
    }
    const propagated = await propagateBootstrapEnv(
      loaded.capabilities.envPersistenceMode,
      prepared.persistEnv,
      env,
    );
    await logger.info('bootstrap completed', {
      adapter: args.adapter,
      sessionId,
      createdAt: session?.createdAt ?? null,
      propagated,
    });

    const output = {
      status: 'bootstrapped',
      sessionId,
      adapter: args.adapter,
      createdAt: session?.createdAt ?? null,
    };

    if (args.json) {
      process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    } else {
      process.stderr.write(`Session bootstrapped: ${sessionId} (adapter: ${args.adapter})\n`);
    }
  },
};
