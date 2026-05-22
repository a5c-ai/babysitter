import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Copilot native hook names mapped to canonical lifecycle phases.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 */

const SUPPORT_LEVEL_MAP: Record<string, PhaseMapping['supportLevel']> = {
  supported: 'native',
  native: 'native',
  lossy: 'lossy',
  emulated: 'emulated',
  unsupported: 'unsupported',
};

function hookMappingToPhaseMapping(mapping: HookMappingDescriptor): PhaseMapping | null {
  if (!mapping.canonicalPhase) return null;
  return {
    canonicalPhase: mapping.canonicalPhase as PhaseMapping['canonicalPhase'],
    nativeHook: mapping.nativeName,
    supportLevel: SUPPORT_LEVEL_MAP[mapping.supportLevel] ?? 'native',
    blockCapability: mapping.blockCapability ?? false,
    mutationCapability: mapping.mutationCapability ?? false,
    scope: (mapping.scope ?? 'session') as PhaseMapping['scope'],
  };
}

function buildFromCatalog(): PhaseMapping[] {
  const mappings = listHookMappingsByAdapterFamily('copilot');
  if (mappings.length === 0) {
    throw new Error('hooks-mux adapter-copilot: catalog unavailable or returned no mappings for family "copilot"');
  }
  const phaseMappings = mappings
    .map(hookMappingToPhaseMapping)
    .filter((m): m is PhaseMapping => m !== null);
  const seen = new Set<string>();
  return phaseMappings.filter((m) => {
    if (seen.has(m.nativeHook)) return false;
    seen.add(m.nativeHook);
    return true;
  });
}

export const COPILOT_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog();

/**
 * Lookup a phase mapping by native hook name.
 */
export function getMappingByNativeHook(nativeHook: string): PhaseMapping | undefined {
  return COPILOT_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeHook);
}

/**
 * Lookup a phase mapping by canonical phase.
 */
export function getMappingByPhase(phase: string): PhaseMapping | undefined {
  return COPILOT_PHASE_MAPPINGS.find((m) => m.canonicalPhase === phase);
}
