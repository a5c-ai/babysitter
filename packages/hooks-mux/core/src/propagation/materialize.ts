import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { MaterializeOptions, ExecMaterialization } from './types';
import { generateTempEnvFile } from './env-file';

/**
 * Materialize execution context for a downstream process.
 *
 * Loads the session, injects standard AGENT_ env vars, optionally rehydrates
 * persisted env keys from session (filtered by allowlist), writes
 * a context file and temp env file.
 */
export async function materializeExecContext(
  options: MaterializeOptions,
): Promise<ExecMaterialization> {
  const { sessionId, sessionStore, envAllowlist, tempDir, capabilities } = options;

  const session = await sessionStore.loadSession(sessionId);

  const env: Record<string, string> = {};

  // Always inject session ID
  env['AGENT_SESSION_ID'] = sessionId;

  if (session) {
    // Inject adapter
    if (session.adapter) {
      env['AGENT_ADAPTER'] = session.adapter;
    }

    // Inject turn ID from metadata if available
    const turnId = session.metadata?.['turnId'];
    if (typeof turnId === 'string') {
      env['AGENT_TURN_ID'] = turnId;
    }

    // Inject workspace root from metadata or cwd
    const workspaceRoot = session.metadata?.['workspaceRoot'];
    if (typeof workspaceRoot === 'string') {
      env['AGENT_WORKSPACE_ROOT'] = workspaceRoot;
    } else if (session.cwd) {
      env['AGENT_WORKSPACE_ROOT'] = session.cwd;
    }

    // Inject transcript path from session or metadata
    if (session.transcriptPath) {
      env['AGENT_TRANSCRIPT_PATH'] = session.transcriptPath;
    } else {
      const transcriptPath = session.metadata?.['transcriptPath'];
      if (typeof transcriptPath === 'string') {
        env['AGENT_TRANSCRIPT_PATH'] = transcriptPath;
      }
    }

    // Rehydrate persisted env keys from session, filtered by allowlist
    const persistedEnv = session.persistedEnv;
    if (persistedEnv) {
      for (const [key, value] of Object.entries(persistedEnv)) {
        if (typeof value !== 'string') continue;
        // Skip AGENT_ keys -- they're injected explicitly above
        if (key.startsWith('AGENT_')) continue;
        // Only rehydrate keys in the allowlist (if one is provided)
        if (envAllowlist && !envAllowlist.includes(key)) continue;
        env[key] = value;
      }
    }

    if (
      env['CLAUDE_PROJECT_DIR'] == null
      && (!envAllowlist || envAllowlist.includes('CLAUDE_PROJECT_DIR'))
    ) {
      const projectDir = typeof workspaceRoot === 'string' ? workspaceRoot : session.cwd;
      if (projectDir) {
        env['CLAUDE_PROJECT_DIR'] = projectDir;
      }
    }
  }

  // Inject adapter capabilities as JSON for downstream consumers
  if (capabilities) {
    env['AGENT_CAPABILITIES_JSON'] = JSON.stringify(capabilities);
  }

  // Write context file with session state summary
  let contextFilePath: string | undefined;
  if (session) {
    const targetDir = tempDir ?? os.tmpdir();
    await fs.promises.mkdir(targetDir, { recursive: true });
    contextFilePath = path.join(targetDir, `a5c-context-${sessionId}-${Date.now()}.json`);

    const contextData = {
      sessionId: session.sessionId,
      adapter: session.adapter,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      cwd: session.cwd,
      fragmentCount: session.contextFragments.length,
    };

    await fs.promises.writeFile(contextFilePath, JSON.stringify(contextData, null, 2), 'utf-8');
    env['AGENT_CONTEXT_FILE'] = contextFilePath;
  }

  // Generate temp env file
  const tempEnvFilePath = Object.keys(env).length > 0
    ? await generateTempEnvFile(env, tempDir)
    : undefined;

  return {
    env,
    contextFilePath,
    tempEnvFilePath,
  };
}
