import { CANONICAL_PHASES, LIFECYCLE_SCOPES } from '@a5c-ai/agent-mux-hooks-core';
import type { PhaseMapping } from '@a5c-ai/agent-mux-hooks-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/atlas/catalog';
import type { HookMappingDescriptor } from '@a5c-ai/atlas/catalog';

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

const CANONICAL_PHASE_SET = new Set<string>(CANONICAL_PHASES);
const LIFECYCLE_SCOPE_SET = new Set<string>(LIFECYCLE_SCOPES);

function asCanonicalPhase(value: string, nativeName: string): PhaseMapping['canonicalPhase'] {
  if (CANONICAL_PHASE_SET.has(value)) {
    return value as PhaseMapping['canonicalPhase'];
  }
  throw new Error(`hooks-mux adapter-claude: unknown canonical phase "${value}" for ${nativeName}`);
}

function asPhaseScope(value: string | undefined, nativeName: string): PhaseMapping['scope'] {
  const scope = value ?? 'session';
  if (LIFECYCLE_SCOPE_SET.has(scope) || scope === 'gateway') {
    return scope as PhaseMapping['scope'];
  }
  throw new Error(`hooks-mux adapter-claude: unknown lifecycle scope "${scope}" for ${nativeName}`);
}

function hookMappingToPhaseMapping(mapping: HookMappingDescriptor): PhaseMapping | null {
  if (!mapping.canonicalPhase) return null;
  return {
    canonicalPhase: asCanonicalPhase(mapping.canonicalPhase, mapping.nativeName),
    nativeHook: mapping.nativeName,
    supportLevel: SUPPORT_LEVEL_MAP[mapping.supportLevel] ?? 'native',
    blockCapability: mapping.blockCapability ?? false,
    mutationCapability: mapping.mutationCapability ?? false,
    scope: asPhaseScope(mapping.scope, mapping.nativeName),
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
