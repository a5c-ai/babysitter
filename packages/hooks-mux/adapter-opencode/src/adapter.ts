import type { AdapterCapabilities } from '@a5c-ai/hooks-mux-core';
import { getPluginTargetDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Creates the OpenCode adapter capability descriptor.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * Spec section 17.8.
 */
const DEFAULT_ADAPTER_NAME = 'opencode';

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'in-process',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'native',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? false,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? false,
    supportsBlock: target?.supportsBlock ?? true,
    supportsAsk: target?.supportsAsk ?? false,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? true,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? true,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'runtime_hook',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'all',
    notes: [
      'Library-only adapter; no CLI shell-hook mode',
      'Native env injection via shell.env hook',
      'Session ID provided natively by the OpenCode runtime',
    ],
  };
}
