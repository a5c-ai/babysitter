import type { PhaseMapping } from '@a5c-ai/hooks-adapter-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/atlas/catalog';
import type { HookMappingDescriptor } from '@a5c-ai/atlas/catalog';

/**
 * Antigravity CLI native event name to canonical phase mappings.
 *
 * Antigravity CLI inherits the event vocabulary from Gemini CLI but
 * uses a workflow-driven hook dispatch model. Phase mappings are
 * built from the Atlas graph HookMapping records via the agent-catalog,
 * falling back to hardcoded defaults when the catalog is unavailable.
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
    notes: mapping.nativeName === 'BeforeToolSelection'
      ? 'Union-style aggregation across matching workflow handlers.'
      : undefined,
  };
}

/**
 * Hardcoded phase mappings for Antigravity CLI.
 *
 * Antigravity inherits the same event names as Gemini CLI, so the
 * native hook names are identical. The key architectural difference
 * is the hook dispatch mechanism (workflow-driven vs shell scripts).
 */
const HARDCODED_PHASE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'planner.before_tool_selection', nativeHook: 'BeforeToolSelection', supportLevel: 'native', blockCapability: false, mutationCapability: true, scope: 'planner' },
  { canonicalPhase: 'model.before_request', nativeHook: 'BeforeModel', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'model' },
  { canonicalPhase: 'model.after_response', nativeHook: 'AfterModel', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'model' },
  { canonicalPhase: 'turn.before_agent', nativeHook: 'BeforeAgent', supportLevel: 'native', blockCapability: true, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'turn.after_agent', nativeHook: 'AfterAgent', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'turn' },
  { canonicalPhase: 'tool.before', nativeHook: 'BeforeTool', supportLevel: 'native', blockCapability: true, mutationCapability: true, scope: 'tool' },
  { canonicalPhase: 'tool.after', nativeHook: 'AfterTool', supportLevel: 'native', blockCapability: false, mutationCapability: false, scope: 'tool' },
];

const BRIDGE_LIFECYCLE_MAPPINGS: PhaseMapping[] = [
  { canonicalPhase: 'session.start', nativeHook: 'SessionStart', supportLevel: 'emulated', blockCapability: false, mutationCapability: false, scope: 'session' },
  { canonicalPhase: 'turn.stop', nativeHook: 'Stop', supportLevel: 'emulated', blockCapability: true, mutationCapability: false, scope: 'turn' },
];

function buildFromCatalog(): PhaseMapping[] {
  const mappings = listHookMappingsByAdapterFamily('antigravity');
  if (mappings.length > 0) {
    const phaseMappings = mappings
      .map(hookMappingToPhaseMapping)
      .filter((m): m is PhaseMapping => m !== null);
    const merged = [...phaseMappings, ...BRIDGE_LIFECYCLE_MAPPINGS];
    const seen = new Set<string>();
    return merged.filter((m) => {
      if (seen.has(m.nativeHook)) return false;
      seen.add(m.nativeHook);
      return true;
    });
  }

  // No catalog entries yet for antigravity — use hardcoded mappings
  const merged = [...HARDCODED_PHASE_MAPPINGS, ...BRIDGE_LIFECYCLE_MAPPINGS];
  const seen = new Set<string>();
  return merged.filter((m) => {
    if (seen.has(m.nativeHook)) return false;
    seen.add(m.nativeHook);
    return true;
  });
}

export const ANTIGRAVITY_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog();

/**
 * Look up the phase mapping for a given Antigravity native event name.
 */
export function getAntigravityPhaseMapping(nativeEventName: string): PhaseMapping | undefined {
  return ANTIGRAVITY_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the Antigravity adapter.
 */
export function getSupportedPhases(): string[] {
  return ANTIGRAVITY_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
