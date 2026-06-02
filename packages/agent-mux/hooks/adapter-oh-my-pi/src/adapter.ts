import type { AdapterCapabilities } from '@a5c-ai/agent-mux-hooks-core';
import { getPluginTargetDescriptor } from '@a5c-ai/atlas/catalog';

/**
 * Creates the Oh-My-Pi adapter capability descriptor.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * Spec section 17.7.
 */
const DEFAULT_ADAPTER_NAME = 'oh-my-pi';

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name === 'oh-my-pi' ? 'oh-my-pi' : name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'in-process',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'native',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? true,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? true,
    supportsBlock: target?.supportsBlock ?? false,
    supportsAsk: target?.supportsAsk ?? false,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? false,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? true,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'runtime_hook',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'none',
    notes: [
      'library-only adapter, no CLI/shell-hook mode',
      'supportsToolInputMutation is explicitly false — Pi supports it but Oh-My-Pi does not',
      'session IDs are natively provided by the Pi runtime',
      'chained context propagation with session-before short-circuit',
    ],
  };
}
