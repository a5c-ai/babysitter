import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the OpenClaw adapter capability descriptor.
 *
 * OpenClaw is a library-first (in-process) harness that exposes two distinct
 * hook layers:
 *
 *   1. **Gateway hooks** — internal lifecycle events fired by the OpenClaw
 *      gateway/router (e.g. request routing, auth, rate-limiting). These are
 *      infrastructure-level and do NOT map to canonical agent-lifecycle phases.
 *
 *   2. **Plugin hooks** — lifecycle events fired by OpenClaw plugins that
 *      participate in the agent conversation loop (session, tool, turn).
 *      These map cleanly to canonical phases.
 *
 * The adapter preserves this distinction by tagging normalized events with
 * an `origin` field ('gateway' | 'plugin') in execution metadata, and by
 * mapping only plugin hooks to canonical phases. Gateway hooks are mapped
 * to scope 'gateway' with supportLevel 'lossy' to signal they are not
 * semantically equivalent to agent-lifecycle phases.
 *
 * Spec section 17.9.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    name: 'openclaw',
    family: 'in-process',
    sessionIdQuality: 'derived',
    supportsOrderedFanout: true,
    supportsNativeAdditionalContext: false,
    supportsBlock: true,
    supportsAsk: false,
    supportsToolInputMutation: true,
    supportsToolResultMutation: false,
    supportsPersistedEnv: false,
    envPersistenceMode: 'runtime_hook',
    toolInterceptionScope: 'all',
    notes: [
      'Gateway hooks (request.received, request.routed, request.completed, auth.check) are infrastructure-level; do not treat as agent lifecycle',
      'Plugin hooks (plugin.session.start, plugin.session.end, plugin.tool.before, plugin.tool.after, plugin.turn.stop) map to canonical phases',
      'Session ID derived from plugin context or gateway request correlation ID',
      'Library-first: designed for in-process integration, not shell subprocess invocation',
    ],
  };
}
