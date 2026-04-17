import type { PhaseMapping } from '@a5c/hooks-proxy-core';

/**
 * Pi native event name to canonical phase mappings.
 *
 * Pi extension events:
 *   session_start, tool_call, context, before_provider_request
 *
 * Spec section 8.2 / 17.6.
 */
export const PI_PHASE_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'session.start',
    nativeHook: 'session_start',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires when a Pi session begins. Extension-state is available for persistence.',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'tool_call',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
    notes: 'Tool input mutation is in-place; later handlers see earlier mutations.',
  },
  {
    canonicalPhase: 'turn.before_agent',
    nativeHook: 'context',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Context injection point before the agent processes a turn.',
  },
  {
    canonicalPhase: 'model.before_request',
    nativeHook: 'before_provider_request',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'model',
    notes: 'Fires before the provider (LLM) request is sent.',
  },
];

/**
 * Look up the phase mapping for a given Pi native event name.
 */
export function getPiPhaseMapping(nativeEventName: string): PhaseMapping | undefined {
  return PI_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the Pi adapter.
 */
export function getSupportedPhases(): string[] {
  return PI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
