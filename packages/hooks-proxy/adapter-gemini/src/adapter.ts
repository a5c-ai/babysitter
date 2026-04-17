import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the gemini adapter with its capability metadata.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    family: 'gemini',
    displayName: 'gemini',
    version: '0.0.1',
    phaseSupport: {},
    envPersistence: 'none',
    sessionIdQuality: 'none',
    supportsBlocking: false,
    supportsMutation: false,
  };
}
