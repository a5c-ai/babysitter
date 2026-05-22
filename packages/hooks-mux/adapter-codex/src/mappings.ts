import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Codex native event to canonical phase mapping table.
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

const CODEX_COMPATIBILITY_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'PreToolUse',
    supportLevel: 'lossy',
    blockCapability: true,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Bash-only compatibility alias for legacy Codex hook payloads.',
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
    scope: (mapping.scope ?? 'session') as PhaseMapping['scope'],
  };
}

function buildFromCatalog(): PhaseMapping[] {
  const mappings = listHookMappingsByAdapterFamily('codex');
  if (mappings.length === 0) {
    throw new Error('hooks-mux adapter-codex: catalog unavailable or returned no mappings for family "codex"');
  }
  const phaseMappings = [
    ...CODEX_COMPATIBILITY_MAPPINGS,
    ...mappings
      .map(hookMappingToPhaseMapping)
      .filter((m): m is PhaseMapping => m !== null),
  ];
  const seen = new Set<string>();
  return phaseMappings.filter((m) => {
    if (seen.has(m.nativeHook)) return false;
    seen.add(m.nativeHook);
    return true;
  });
}

export const CODEX_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog();

/**
 * Quick lookup from native event name to phase mapping.
 */
export function findMapping(nativeEventName: string): PhaseMapping | undefined {
  return CODEX_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}
