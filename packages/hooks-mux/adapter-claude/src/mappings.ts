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
    notes: 'source values: startup, resume, clear, compact. CLAUDE_ENV_FILE available.',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'SessionEnd',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Observer-only; no blocking or mutation.',
  },
  {
    canonicalPhase: 'session.compact.before',
    nativeHook: 'PreCompact',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires before context compaction. Observer-only.',
  },
  {
    canonicalPhase: 'turn.user_prompt_submitted',
    nativeHook: 'UserPromptSubmit',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Fires when user submits a prompt.',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'PreToolUse',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Can block (deny) or ask for permission. Tool input mutation not supported.',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'PostToolUse',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Observer-only post-tool hook. CLAUDE_ENV_FILE available.',
  },
  {
    canonicalPhase: 'turn.stop',
    nativeHook: 'Stop',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Can continue session or stop. Guard against recursion via stop_hook_active.',
  },
  {
    canonicalPhase: 'subagent.end',
    nativeHook: 'SubagentStop',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'subagent',
    notes: 'Fires when a subagent completes.',
  },
  {
    canonicalPhase: 'notification',
    nativeHook: 'Notification',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'notification',
    notes: 'Observer-only notification event.',
  },
];

function buildFromCatalog(): PhaseMapping[] | null {
  try {
    const mappings = listHookMappingsByAdapterFamily('claude');
    if (mappings.length === 0) return null;
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
  } catch {
    return null;
  }
}

export const CLAUDE_PHASE_MAPPINGS: PhaseMapping[] = buildFromCatalog() ?? FALLBACK_MAPPINGS;

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
