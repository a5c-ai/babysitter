import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the openclaw adapter with its capability metadata.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    family: 'openclaw',
    displayName: 'openclaw',
    version: '0.0.1',
    phaseSupport: {},
    envPersistence: 'none',
    sessionIdQuality: 'none',
    supportsBlocking: false,
    supportsMutation: false,
  };
}
