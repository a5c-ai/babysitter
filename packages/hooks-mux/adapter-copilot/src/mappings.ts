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

function hookMappingToPhaseMapping(mapping: HookMappingDescriptor): PhaseMapping | null {
  if (!mapping.canonicalPhase) return null;
  return {
    canonicalPhase: mapping.canonicalPhase as PhaseMapping['canonicalPhase'],
    nativeHook: mapping.nativeName,
    supportLevel: 'native',
    blockCapability: mapping.blockCapability ?? false,
    mutationCapability: mapping.mutationCapability ?? false,
    scope: (mapping.scope ?? 'session') as PhaseMapping['scope'],
  };
}

const FALLBACK_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'session.start',
    nativeHook: 'sessionStart',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Session-start output is ignored by Copilot CLI; observer-only plus session-store init',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'sessionEnd',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
  },
  {
    canonicalPhase: 'turn.user_prompt_submitted',
    nativeHook: 'userPromptSubmitted',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Output ignored on this event; observer-only',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'preToolUse',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'tool',
    notes: 'permissionDecision supports allow|deny|ask in schema but only deny is processed',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'postToolUse',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Output ignored on non-preTool events',
  },
  {
    canonicalPhase: 'turn.error',
    nativeHook: 'errorOccurred',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Error reporting; output ignored',
  },
];

function buildFromCatalog(): PhaseMapping[] | null {
  try {
    const mappings = listHookMappingsByAdapterFamily('copilot');
    if (mappings.length === 0) return null;
    const phaseMappings = mappings
      .map(hookMappingToPhaseMapping)
      .filter((m): m is PhaseMapping => m !== null);
    const seen = new Set<string>();
    return phaseMappings.filter((m) => {
      if (seen.has(m.nativeHook)) return false;
      seen.add(m.nativeHook);
      return true;
    });
  } catch {
    return null;
  }
}

export const COPILOT_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog() ?? FALLBACK_MAPPINGS;

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
