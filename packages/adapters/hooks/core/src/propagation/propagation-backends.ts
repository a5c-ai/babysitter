import * as fs from 'fs';
import type { PropagationBackend, PropagationOptions } from './types';
import { buildExportEnvFileLines, generateTempEnvFile } from './env-file';

/**
 * Propagate environment variables via the specified backend mode.
 *
 * Four propagation modes per spec section 14.2:
 * - Mode A: native_env_file -- append exported KEY=VALUE lines to a harness-provided env file path
 * - Mode B: runtime_hook -- return env vars for the runtime to inject (no-op write; env passed back)
 * - Mode C: wrapper_only -- materialize env file for subprocess wrapping
 * - Mode D: none -- session-store only, no downstream injection
 */
export async function propagateEnv(
  backend: PropagationBackend,
  env: Record<string, string>,
  options: PropagationOptions = {},
): Promise<void> {
  switch (backend) {
    case 'native_env_file':
      await propagateNativeEnvFile(env, options);
      break;
    case 'runtime_hook':
      // Mode B: env vars are returned in the hook result; no file I/O needed.
      // The caller is responsible for injecting them into the runtime.
      break;
    case 'wrapper_only':
      await propagateWrapperOnly(env, options);
      break;
    case 'none':
      await propagateNone(env, options);
      break;
    default: {
      const _exhaustive: never = backend;
      throw new Error(`Unknown propagation backend: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Mode A: Append exported KEY=VALUE lines to a harness-provided env file.
 */
async function propagateNativeEnvFile(
  env: Record<string, string>,
  options: PropagationOptions,
): Promise<void> {
  if (!options.nativeEnvFilePath) {
    throw new Error(
      'native_env_file backend requires nativeEnvFilePath in options',
    );
  }

  const lines = buildExportEnvFileLines(env);
  const content = '\n' + lines.join('\n') + '\n';

  await fs.promises.appendFile(options.nativeEnvFilePath, content, 'utf-8');
}

/**
 * Mode C: Generate a temp env file for subprocess wrapping.
 */
async function propagateWrapperOnly(
  env: Record<string, string>,
  options: PropagationOptions,
): Promise<void> {
  await generateTempEnvFile(env, options.tempDir);
}

/**
 * Mode D: Persist env to session store only; no downstream injection.
 */
async function propagateNone(
  env: Record<string, string>,
  options: PropagationOptions,
): Promise<void> {
  if (options.sessionStore && options.sessionId) {
    const session = await options.sessionStore.loadSession(options.sessionId);
    if (session) {
      const merged = { ...session.persistedEnv, ...env };
      session.persistedEnv = merged;
      await options.sessionStore.saveSession(session);
    }
  }
}
