import type { RunOptions, RuntimeHookDispatcher, RuntimeHookSetup } from '@a5c-ai/agent-mux-core';

import {
  createClaudeRuntimeHookConfig,
  removeClaudeRuntimeHookConfig,
} from './ephemeral-config.js';
import { startClaudeHookSocketServer } from './hook-socket-server.js';

export async function setupClaudeRuntimeHooks(
  options: RunOptions,
  dispatcher: RuntimeHookDispatcher,
): Promise<RuntimeHookSetup | void> {
  if (!options.hooks) {
    return undefined;
  }

  const config = await createClaudeRuntimeHookConfig(dispatcher.runId);
  const server = await startClaudeHookSocketServer({
    socketPath: config.socketPath,
    secret: config.secret,
    dispatcher,
  });

  return {
    env: {
      CLAUDE_CONFIG_DIR: config.dir,
      AMUX_CLAUDE_HOOK_SOCKET: config.socketPath,
    },
    cleanup: async () => {
      await server.close();
      await removeClaudeRuntimeHookConfig(config.dir);
    },
  };
}
