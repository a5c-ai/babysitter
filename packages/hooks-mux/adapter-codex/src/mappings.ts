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
    notes: 'Bootstrap event; output is largely ignored by Codex runtime',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'SessionEnd',
    supportLevel: 'lossy',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Codex may not reliably fire SessionEnd in all exit paths',
  },
  {
    canonicalPhase: 'turn.user_prompt_submitted',
    nativeHook: 'UserPromptSubmit',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'turn',
  },
  {
    canonicalPhase: 'turn.stop',
    nativeHook: 'Stop',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'turn',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'PreToolUse',
    supportLevel: 'lossy',
    blockCapability: true,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Bash-only; non-Bash tool calls are not intercepted',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'PostToolUse',
    supportLevel: 'lossy',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Bash-only; non-Bash tool calls are not intercepted',
  },
];

function buildFromCatalog(): PhaseMapping[] | null {
  try {
    const mappings = listHookMappingsByAdapterFamily('codex');
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

export const CODEX_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog() ?? FALLBACK_MAPPINGS;

/**
 * Quick lookup from native event name to phase mapping.
 */
export function findMapping(nativeEventName: string): PhaseMapping | undefined {
  return CODEX_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}
