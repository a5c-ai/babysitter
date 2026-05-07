import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * OpenCode native event name to canonical phase mappings.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 *
 * Spec section 8.2 / 17.8.
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
    nativeHook: 'session.created',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires when the OpenCode session is initialized.',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'tool.execute.before',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
    notes: 'Fires before a tool is executed. Can block (deny) or mutate tool input.',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'tool.execute.after',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Observer-only post-tool hook.',
  },
];

function buildFromCatalog(): PhaseMapping[] | null {
  try {
    const mappings = listHookMappingsByAdapterFamily('opencode');
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

export const OPENCODE_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog() ?? FALLBACK_MAPPINGS;

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
  return OPENCODE_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
