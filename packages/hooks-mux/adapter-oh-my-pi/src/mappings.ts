import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * Oh-My-Pi native event to canonical phase mapping table.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 *
 * Spec section 17.7.
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
    nativeHook: 'session_start',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires on Pi session initialization. Supports session-before short-circuit.',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'session_end',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires on Pi session teardown. Observer-only.',
  },
  {
    canonicalPhase: 'session.config_changed',
    nativeHook: 'context',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Context injection event from the Pi extension API.',
  },
  {
    canonicalPhase: 'turn.user_prompt_submitted',
    nativeHook: 'prompt',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Fires when the user submits a prompt.',
  },
  {
    canonicalPhase: 'turn.error',
    nativeHook: 'error',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Fires on runtime error during a turn.',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'tool_call',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Tool call interception. Mutation is NOT supported in Oh-My-Pi (explicit limitation).',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'tool_result',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Fires after tool execution completes. Observer-only.',
  },
  {
    canonicalPhase: 'model.before_request',
    nativeHook: 'before_provider_request',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'model',
    notes: 'Fires before a request is sent to the model provider.',
  },
];

function buildFromCatalog(): PhaseMapping[] | null {
  try {
    const mappings = listHookMappingsByAdapterFamily('oh-my-pi');
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

export const OH_MY_PI_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog() ?? FALLBACK_MAPPINGS;

/**
 * Quick lookup from native event name to phase mapping.
 */
export function findMapping(nativeEventName: string): PhaseMapping | undefined {
  return OH_MY_PI_PHASE_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by the Oh-My-Pi adapter.
 */
export function getSupportedPhases(): string[] {
  return OH_MY_PI_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
