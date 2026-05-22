import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Claude Code native event name to canonical phase mappings.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 *
 * Spec section 8.2 / 17.1.
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
  const mappings = listHookMappingsByAdapterFamily('claude');
  if (mappings.length === 0) {
    throw new Error('hooks-mux adapter-claude: catalog unavailable or returned no mappings for family "claude"');
  }
  const phaseMappings = mappings
    .map(hookMappingToPhaseMapping)
    .filter((m): m is PhaseMapping => m !== null);
  // Deduplicate by nativeHook (prefer first occurrence)
  const seen = new Set<string>();
  return phaseMappings.filter((m) => {
    if (seen.has(m.nativeHook)) return false;
    seen.add(m.nativeHook);
    return true;
  });
}

export const CLAUDE_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog();

/**
 * Look up the phase mapping for a given Claude native event name.
 */
export function getClaudePhaseMapping(nativeEventName: string): PhaseMapping | undefined {
  return CLAUDE_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the Claude adapter.
 */
export function getSupportedPhases(): string[] {
  return CLAUDE_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
