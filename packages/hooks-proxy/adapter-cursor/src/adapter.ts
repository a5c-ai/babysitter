import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the cursor adapter with its capability metadata.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    family: 'cursor',
    displayName: 'cursor',
    version: '0.0.1',
    phaseSupport: {},
    envPersistence: 'none',
    sessionIdQuality: 'none',
    supportsBlocking: false,
    supportsMutation: false,
  };
}
