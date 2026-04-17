import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the opencode adapter with its capability metadata.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    family: 'opencode',
    displayName: 'opencode',
    version: '0.0.1',
    phaseSupport: {},
    envPersistence: 'none',
    sessionIdQuality: 'none',
    supportsBlocking: false,
    supportsMutation: false,
  };
}
