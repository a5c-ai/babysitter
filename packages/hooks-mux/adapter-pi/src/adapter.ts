import type { AdapterCapabilities } from '@a5c-ai/hooks-mux-core';
import { getPluginTargetDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Creates the Pi adapter capability descriptor.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * Spec section 17.6.
 */
const DEFAULT_ADAPTER_NAME = 'pi';

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'in-process',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'native',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? true,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? false,
    supportsBlock: target?.supportsBlock ?? true,
    supportsAsk: target?.supportsAsk ?? false,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? true,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? true,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'runtime_hook',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'all',
    notes: [
      'Library-only adapter — Pi hooks are in-process, not shell subprocesses',
      'Tool input mutation is in-place; later handlers see earlier mutations',
      'Session persistence via native extension-state; does not automatically enter model context',
      'No stdin parsing required — input arrives as programmatic objects',
    ],
  };
}
