import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the Oh-My-Pi adapter capability descriptor.
 *
 * Oh-My-Pi is an in-process, library-only adapter built on the Pi
 * extension API. It provides native session IDs via the Pi runtime,
 * supports chained context propagation with session-before
 * short-circuit semantics, but does NOT support tool input mutation.
 *
 * Spec section 17.7:
 * - library-only adapter
 * - preserve chained context behavior and session-before short-circuit
 * - expose mutability limitations explicitly
 */
export function createAdapter(): AdapterCapabilities {
  return {
    name: 'oh-my-pi',
    family: 'in-process',
    sessionIdQuality: 'native',
    supportsOrderedFanout: true,
    supportsNativeAdditionalContext: true,
    supportsBlock: false,
    supportsAsk: false,
    supportsToolInputMutation: false,
    supportsToolResultMutation: false,
    supportsPersistedEnv: true,
    envPersistenceMode: 'runtime_hook',
    toolInterceptionScope: 'none',
    notes: [
      'library-only adapter, no CLI/shell-hook mode',
      'supportsToolInputMutation is explicitly false — Pi supports it but Oh-My-Pi does not',
      'session IDs are natively provided by the Pi runtime',
      'chained context propagation with session-before short-circuit',
    ],
  };
}
