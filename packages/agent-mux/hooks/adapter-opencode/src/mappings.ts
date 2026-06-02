import type { PhaseMapping } from '@a5c-ai/agent-mux-hooks-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/atlas/catalog';
import type { HookMappingDescriptor } from '@a5c-ai/atlas/catalog';

/**
 * OpenCode native event name to canonical phase mappings.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 *
 * Spec section 8.2 / 17.8.
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

/** Native hooks excluded from the standard phase mapping table. */
const EXCLUDED_NATIVE_HOOKS = new Set(['shell.env']);

function buildFromCatalog(): PhaseMapping[] {
  const mappings = listHookMappingsByAdapterFamily('opencode');
  if (mappings.length === 0) {
    throw new Error('hooks-mux adapter-opencode: catalog unavailable or returned no mappings for family "opencode"');
  }
  const phaseMappings = mappings
    .map(hookMappingToPhaseMapping)
    .filter((m): m is PhaseMapping => m !== null)
    .filter((m) => !EXCLUDED_NATIVE_HOOKS.has(m.nativeHook));
  const seen = new Set<string>();
  return phaseMappings.filter((m) => {
    if (seen.has(m.nativeHook)) return false;
    seen.add(m.nativeHook);
    return true;
  });
}

export const OPENCODE_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog();

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
  return [...new Set(OPENCODE_PHASE_MAPPINGS.map((m) => m.canonicalPhase))];
}
