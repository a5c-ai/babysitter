import type { PhaseMapping } from '@a5c/hooks-proxy-core';

/**
 * OpenCode native event name to canonical phase mappings.
 *
 * OpenCode exposes four hook events:
 *   session.created, tool.execute.before, tool.execute.after, shell.env
 *
 * The `shell.env` event is used for runtime env injection and does not
 * map directly to a standard lifecycle phase; it is mapped to
 * `session.start` with a 'lossy' support level since it is an env
 * propagation mechanism rather than a true session start signal.
 *
 * Spec section 8.2 / 17.8.
 */
export const OPENCODE_PHASE_MAPPINGS: PhaseMapping[] = [
  // --- Session lifecycle ---
  {
    canonicalPhase: 'session.start',
    nativeHook: 'session.created',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires when the OpenCode session is initialized.',
  },

  // --- Tool lifecycle ---
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'tool.execute.before',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
    notes: 'Fires before a tool is executed. Can block (deny) or mutate tool input.',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'tool.execute.after',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Observer-only post-tool hook.',
  },
];

/**
 * The shell.env event is a special env-injection hook, not a standard
 * lifecycle phase. We track it separately so the normalizer can handle
 * it without conflating it with session.start.
 */
export const SHELL_ENV_NATIVE_HOOK = 'shell.env';

/**
 * Look up the phase mapping for a given OpenCode native event name.
 */
export function getOpenCodePhaseMapping(nativeEventName: string): PhaseMapping | undefined {
  return OPENCODE_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the OpenCode adapter.
 */
export function getSupportedPhases(): string[] {
  return OPENCODE_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
