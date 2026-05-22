import type { AdapterCapabilities } from '@a5c-ai/hooks-mux-core';
import { getPluginTargetDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Creates the Codex adapter with its capability metadata.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * Spec section 17.2.
 */
const DEFAULT_ADAPTER_NAME = 'codex';

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'shell-hook',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'native',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? true,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? false,
    supportsBlock: target?.supportsBlock ?? true,
    supportsAsk: target?.supportsAsk ?? false,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? false,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? false,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'wrapper_only',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'partial_shell_only',
    notes: [
      'experimental',
      'tool interception is bash-only',
      'multiple matching hooks can launch concurrently',
      'many parsed output fields currently fail open',
    ],
  };
}
