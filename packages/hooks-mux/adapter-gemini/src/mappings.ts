import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Gemini CLI native event name to canonical phase mappings.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 *
 * Spec section 8.2 / 17.3.
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
    nativeHook: 'SessionStart',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'SessionEnd',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
  },
  {
    canonicalPhase: 'planner.before_tool_selection',
    nativeHook: 'BeforeToolSelection',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'planner',
  },
  {
    canonicalPhase: 'model.before_request',
    nativeHook: 'BeforeModel',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'model',
  },
  {
    canonicalPhase: 'model.after_response',
    nativeHook: 'AfterModel',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'model',
  },
  {
    canonicalPhase: 'turn.before_agent',
    nativeHook: 'BeforeAgent',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'turn',
  },
  {
    canonicalPhase: 'turn.after_agent',
    nativeHook: 'AfterAgent',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'turn',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'BeforeTool',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'AfterTool',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
  },
];

function buildFromCatalog(): PhaseMapping[] | null {
  try {
    const mappings = listHookMappingsByAdapterFamily('gemini');
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

export const GEMINI_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog() ?? FALLBACK_MAPPINGS;

/**
 * Look up the phase mapping for a given Gemini native event name.
 */
export function getGeminiPhaseMapping(nativeEventName: string): PhaseMapping | undefined {
  return GEMINI_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the Gemini adapter.
 */
export function getSupportedPhases(): string[] {
  return GEMINI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
