import type { PhaseMapping } from '@a5c/hooks-proxy-core';

/**
 * Oh-My-Pi native event to canonical phase mapping table.
 *
 * Oh-My-Pi uses the Pi extension API lifecycle events. The adapter
 * maps these to canonical phases. Tool mutation is not supported
 * (unlike the base Pi adapter), so tool.before has no mutation
 * capability.
 *
 * Spec section 17.7: "preserve chained context behavior and
 * session-before short-circuit semantics."
 */
export const OH_MY_PI_PHASE_MAPPINGS: PhaseMapping[] = [
  // --- Session lifecycle ---
  {
    canonicalPhase: 'session.start',
    nativeHook: 'session_start',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires on Pi session initialization. Supports session-before short-circuit.',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'session_end',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires on Pi session teardown. Observer-only.',
  },
  {
    canonicalPhase: 'session.config_changed',
    nativeHook: 'context',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Context injection event from the Pi extension API.',
  },

  // --- Turn lifecycle ---
  {
    canonicalPhase: 'turn.user_prompt_submitted',
    nativeHook: 'prompt',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Fires when the user submits a prompt.',
  },
  {
    canonicalPhase: 'turn.error',
    nativeHook: 'error',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Fires on runtime error during a turn.',
  },

  // --- Tool lifecycle ---
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'tool_call',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Tool call interception. Mutation is NOT supported in Oh-My-Pi (explicit limitation).',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'tool_result',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Fires after tool execution completes. Observer-only.',
  },

  // --- Model lifecycle ---
  {
    canonicalPhase: 'model.before_request',
    nativeHook: 'before_provider_request',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'model',
    notes: 'Fires before a request is sent to the model provider.',
  },
];

/**
 * Quick lookup from native event name to phase mapping.
 */
export function findMapping(nativeEventName: string): PhaseMapping | undefined {
  return OH_MY_PI_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the Oh-My-Pi adapter.
 */
export function getSupportedPhases(): string[] {
  return OH_MY_PI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
