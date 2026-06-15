import type { PhaseMapping } from '@a5c-ai/hooks-adapter-core';

/**
 * Genty native event to canonical phase mapping table.
 *
 * Genty has no native hook system -- all hook interactions are
 * emulated through the babysitter bridge. The phase mappings
 * reflect emulated lifecycle events only.
 */

const GENTY_PHASE_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'session.start',
    nativeHook: 'SessionStart',
    supportLevel: 'emulated',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
  },
  {
    canonicalPhase: 'turn.stop',
    nativeHook: 'Stop',
    supportLevel: 'emulated',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
  },
];

export { GENTY_PHASE_MAPPINGS };

/**
 * Look up the phase mapping for a given genty native event name.
 */
export function findMapping(nativeEventName: string): PhaseMapping | undefined {
  return GENTY_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the genty adapter.
 */
export function getSupportedPhases(): string[] {
  return GENTY_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
