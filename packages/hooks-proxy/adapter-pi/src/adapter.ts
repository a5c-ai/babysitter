import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the Pi adapter capability descriptor.
 *
 * Pi is an in-process harness with native session IDs,
 * extension-state persistence, and mutable tool input semantics
 * (later handlers see earlier mutations).
 *
 * Spec section 17.6.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    name: 'pi',
    family: 'in-process',
    sessionIdQuality: 'native',
    supportsOrderedFanout: true,
    supportsNativeAdditionalContext: false,
    supportsBlock: true,
    supportsAsk: false,
    supportsToolInputMutation: true,
    supportsToolResultMutation: false,
    supportsPersistedEnv: true,
    envPersistenceMode: 'runtime_hook',
    toolInterceptionScope: 'all',
    notes: [
      'Library-only adapter — Pi hooks are in-process, not shell subprocesses',
      'Tool input mutation is in-place; later handlers see earlier mutations',
      'Session persistence via native extension-state; does not automatically enter model context',
      'No stdin parsing required — input arrives as programmatic objects',
    ],
  };
}
