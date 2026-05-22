import type { AdapterCapabilities } from '@a5c-ai/hooks-mux-core';
import { getPluginTargetDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Creates the Cursor adapter capability descriptor.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * Spec section 17.5.
 */
const DEFAULT_ADAPTER_NAME = 'cursor';

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'shell-hook',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'derived',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? true,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? false,
    supportsBlock: target?.supportsBlock ?? true,
    supportsAsk: target?.supportsAsk ?? false,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? false,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? false,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'wrapper_only',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'all',
    notes: [
      'Hook surface is stable as of Cursor 3.0',
      'IDE and CLI share the same hook surface',
    ],
  };
}
