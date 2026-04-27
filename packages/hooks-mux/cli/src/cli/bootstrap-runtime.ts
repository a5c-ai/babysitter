import {
  type PropagationBackend,
  type SessionState,
  type UnifiedHookEvent,
  propagateEnv,
} from '@a5c-ai/hooks-mux-core';
import type { loadAdapter } from './adapter-loader';

export function tryParseJson(raw: string): unknown | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export function resolveSessionId(
  adapterSessionResolver: ReturnType<typeof loadAdapter>['sessionResolver'],
  explicitSessionId: string | undefined,
  normalizedSessionId: string | null | undefined,
  stdinData: Record<string, unknown> | undefined,
  env: Record<string, string>,
): string | null {
  if (adapterSessionResolver) {
    const resolved = adapterSessionResolver(stdinData ?? {}, env, explicitSessionId);
    const adapterSessionId = typeof resolved === 'string'
      ? resolved
      : resolved?.sessionId;
    if (adapterSessionId) {
      return adapterSessionId;
    }
  }

  if (explicitSessionId) return explicitSessionId;
  if (env['AGENT_SESSION_ID']) return env['AGENT_SESSION_ID'];
  if (normalizedSessionId) return normalizedSessionId;
  if (stdinData && typeof stdinData['session_id'] === 'string') {
    return stdinData['session_id'] as string;
  }
  return null;
}

export function resolveNativeEnvFilePath(env: Record<string, string>): string | undefined {
  return env['CLAUDE_ENV_FILE'] ?? env['HOOKS_PROXY_ENV_FILE'];
}

export function buildBootstrapPersistEnv(
  event: UnifiedHookEvent,
  sessionId: string | null,
): Record<string, string> {
  const persistEnv = { ...event.env.persisted };
  if (sessionId) {
    persistEnv['AGENT_SESSION_ID'] = sessionId;
  }
  return persistEnv;
}

export function prepareBootstrapSession(args: {
  existingSession: SessionState | null;
  adapter: string;
  event: UnifiedHookEvent;
  sessionId: string | null;
  now?: Date;
}): {
  session: SessionState | null;
  persistEnv: Record<string, string>;
} {
  const nowIso = (args.now ?? new Date()).toISOString();
  const persistEnv = buildBootstrapPersistEnv(args.event, args.sessionId);

  if (!args.sessionId) {
    return {
      session: null,
      persistEnv,
    };
  }

  const existing = args.existingSession;
  const session: SessionState = existing
    ? {
      ...existing,
      updatedAt: nowIso,
      cwd: existing.cwd ?? args.event.execution.cwd ?? undefined,
      transcriptPath: existing.transcriptPath ?? args.event.execution.transcriptPath ?? undefined,
      persistedEnv: { ...existing.persistedEnv, ...persistEnv },
      contextVars: existing.contextVars ?? {},
      contextFragments: existing.contextFragments ?? [],
      metadata: existing.metadata ?? {},
    }
    : {
      version: 'a5c.hooks.session.v1',
      sessionId: args.sessionId,
      adapter: args.adapter,
      createdAt: nowIso,
      updatedAt: nowIso,
      cwd: args.event.execution.cwd ?? undefined,
      transcriptPath: args.event.execution.transcriptPath ?? undefined,
      persistedEnv: persistEnv,
      contextVars: {},
      contextFragments: [],
      metadata: {},
    };

  return {
    session,
    persistEnv,
  };
}

export async function propagateBootstrapEnv(
  backend: PropagationBackend,
  persistEnv: Record<string, string>,
  env: Record<string, string>,
): Promise<boolean> {
  if (Object.keys(persistEnv).length === 0) {
    return false;
  }

  if (backend === 'native_env_file') {
    const nativeEnvFilePath = resolveNativeEnvFilePath(env);
    if (!nativeEnvFilePath) {
      return false;
    }
    await propagateEnv(backend, persistEnv, { nativeEnvFilePath });
    return true;
  }

  await propagateEnv(backend, persistEnv, {
    nativeEnvFilePath: resolveNativeEnvFilePath(env),
  });
  return true;
}
