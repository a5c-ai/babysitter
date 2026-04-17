import type { AdapterCapabilities } from '@a5c/hooks-proxy-core';

/**
 * Creates the codex adapter with its capability metadata.
 */
export function createAdapter(): AdapterCapabilities {
  return {
    family: 'codex',
    displayName: 'codex',
    version: '0.0.1',
    phaseSupport: {},
    envPersistence: 'none',
    sessionIdQuality: 'none',
    supportsBlocking: false,
    supportsMutation: false,
  };
}
