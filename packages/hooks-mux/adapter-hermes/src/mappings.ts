import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Hermes native event to canonical phase mapping table.
 *
 * Hermes has a single `onEvent` native hook that maps to the
 * `tool.after` canonical phase. It is non-blocking and does not
 * support mutation.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 *
 * Spec section 17.2.
 */

const SUPPORT_LEVEL_MAP: Record<string, PhaseMapping['supportLevel']> = {
  supported: 'native',
  native: 'native',
  lossy: 'lossy',
  emulated: 'emulated',
  unsupported: 'unsupported',
};

/**
 * Hardcoded fallback mapping for the single Hermes onEvent hook.
 * Used when the catalog is unavailable.
 */
const HERMES_FALLBACK_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'onEvent',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Hermes single onEvent hook, non-blocking post-direction.',
  },
];

function hookMappingToPhaseMapping(mapping: HookMappingDescriptor): PhaseMapping | null {
  if (!mapping.canonicalPhase) return null;
  return {
    canonicalPhase: mapping.canonicalPhase as PhaseMapping['canonicalPhase'],
    nativeHook: mapping.nativeName,
    supportLevel: SUPPORT_LEVEL_MAP[mapping.supportLevel] ?? (mapping.requiresRuntimeHooks ? 'native' : 'lossy'),
    blockCapability: mapping.blockCapability ?? false,
    mutationCapability: mapping.mutationCapability ?? false,
    scope: (mapping.scope ?? 'turn') as PhaseMapping['scope'],
  };
}

function buildFromCatalog(): PhaseMapping[] {
  let mappings: HookMappingDescriptor[];
  try {
    mappings = listHookMappingsByAdapterFamily('hermes');
  } catch {
    return HERMES_FALLBACK_MAPPINGS;
  }
  if (mappings.length === 0) {
    return HERMES_FALLBACK_MAPPINGS;
  }
  const phaseMappings = mappings
    .map(hookMappingToPhaseMapping)
    .filter((m): m is PhaseMapping => m !== null);

  if (phaseMappings.length === 0) {
    return HERMES_FALLBACK_MAPPINGS;
  }

  const seen = new Set<string>();
  return phaseMappings.filter((m) => {
    if (seen.has(m.nativeHook)) return false;
    seen.add(m.nativeHook);
    return true;
  });
}

export const HERMES_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog();

/**
 * Quick lookup from native event name to phase mapping.
 */
export function findMapping(nativeEventName: string): PhaseMapping | undefined {
  return HERMES_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}
