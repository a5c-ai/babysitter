import type { AdapterCapabilities } from '@a5c-ai/hooks-adapter-core';
import { getPluginTargetDescriptor } from '@a5c-ai/atlas/catalog';

/**
 * Creates the genty adapter with its capability metadata.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * Genty is an internal agent platform with no native hook system.
 * Session identity comes from the AGENT_SESSION_ID env var.
 */
const DEFAULT_ADAPTER_NAME = 'genty';

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'none',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'generated',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? false,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? false,
    supportsBlock: target?.supportsBlock ?? false,
    supportsAsk: target?.supportsAsk ?? false,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? false,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? false,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'none',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'none',
    notes: [
      'internal agent platform with no native hook system',
      'session ID from AGENT_SESSION_ID env var',
      'orchestration provided via babysitter-genty provider package',
      'extension-based command registration',
    ],
  };
}
