import type { AdapterCapabilities } from '@a5c-ai/hooks-mux-core';
import { getPluginTargetDescriptor } from '@a5c-ai/atlas/catalog';

/**
 * Creates the OpenClaw adapter capability descriptor.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * OpenClaw exposes two distinct hook layers:
 *   1. Gateway hooks — infrastructure-level (request routing, auth, rate-limiting)
 *   2. Plugin hooks — agent-lifecycle (session, tool, turn)
 *
 * Spec section 17.9.
 */
const DEFAULT_ADAPTER_NAME = 'openclaw';

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'in-process',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'derived',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? true,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? false,
    supportsBlock: target?.supportsBlock ?? true,
    supportsAsk: target?.supportsAsk ?? false,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? true,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? false,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'runtime_hook',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'all',
    notes: [
      'Gateway hooks (request.received, request.routed, request.completed, auth.check) are infrastructure-level; do not treat as agent lifecycle',
      'Plugin hooks (plugin.session.start, plugin.session.end, plugin.tool.before, plugin.tool.after, plugin.turn.stop) map to canonical phases',
      'Session ID derived from plugin context or gateway request correlation ID',
      'Library-first: designed for in-process integration, not shell subprocess invocation',
    ],
  };
}
