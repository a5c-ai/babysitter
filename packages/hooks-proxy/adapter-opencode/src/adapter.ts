import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the OpenCode adapter capability descriptor.
 *
 * OpenCode is a library-only (in-process) adapter with native runtime env
 * injection via its `shell.env` hook. It supports `session.created`,
 * `tool.execute.before`, `tool.execute.after`, and `shell.env` events.
 *
 * Spec section 17.8.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    name: 'opencode',
    family: 'in-process',
    sessionIdQuality: 'native',
    supportsOrderedFanout: false,
    supportsNativeAdditionalContext: false,
    supportsBlock: true,
    supportsAsk: false,
    supportsToolInputMutation: true,
    supportsToolResultMutation: false,
    supportsPersistedEnv: true,
    envPersistenceMode: 'runtime_hook',
    toolInterceptionScope: 'all',
    notes: [
      'Library-only adapter; no CLI shell-hook mode',
      'Native env injection via shell.env hook',
      'Session ID provided natively by the OpenCode runtime',
    ],
  };
}
