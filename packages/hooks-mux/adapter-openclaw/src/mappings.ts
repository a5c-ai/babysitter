import type { PhaseMapping } from '@a5c-ai/hooks-mux-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/agent-catalog';
import type { HookMappingDescriptor } from '@a5c-ai/agent-catalog';

/**
 * OpenClaw hook origin type.
 *
 * Gateway hooks are infrastructure-level (request routing, auth, rate-limiting).
 * Plugin hooks are agent-lifecycle (session, tool, turn).
 */
export type OpenClawHookOrigin = 'gateway' | 'plugin';

/**
 * OpenClaw native event to canonical phase mappings.
 *
 * Phase mappings are built from the Atlas graph HookMapping records
 * via the agent-catalog. Falls back to hardcoded defaults if the
 * catalog is unavailable.
 *
 * KEY DESIGN DECISION: Gateway hooks and plugin hooks are mapped separately.
 * Gateway hooks use scope 'gateway' and supportLevel 'lossy' because they
 * are NOT semantically equivalent to agent-lifecycle phases.
 *
 * Spec section 8.2 / 17.9.
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

// ---------------------------------------------------------------------------
// Plugin hooks — these map to canonical agent-lifecycle phases
// ---------------------------------------------------------------------------

const FALLBACK_PLUGIN_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'session.start',
    nativeHook: 'plugin.session.start',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Fires when a plugin session begins within OpenClaw.',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'plugin.session.end',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'session',
    notes: 'Observer-only; fires when a plugin session is torn down.',
  },
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'plugin.tool.before',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
    notes: 'Fires before tool execution in plugin context. Can block or mutate tool input.',
  },
  {
    canonicalPhase: 'tool.after',
    nativeHook: 'plugin.tool.after',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'tool',
    notes: 'Observer-only post-tool hook in plugin context.',
  },
  {
    canonicalPhase: 'turn.stop',
    nativeHook: 'plugin.turn.stop',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Fires when plugin turn completes. Can continue or stop.',
  },
  {
    canonicalPhase: 'turn.user_prompt_submitted',
    nativeHook: 'plugin.prompt.submitted',
    supportLevel: 'native',
    blockCapability: false,
    mutationCapability: false,
    scope: 'turn',
    notes: 'Fires when user submits a prompt through the plugin.',
  },
];

// ---------------------------------------------------------------------------
// Gateway hooks — infrastructure-level, NOT agent-lifecycle equivalents
// ---------------------------------------------------------------------------

const FALLBACK_GATEWAY_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'session.start',
    nativeHook: 'gateway.request.received',
    supportLevel: 'lossy',
    blockCapability: false,
    mutationCapability: false,
    scope: 'gateway',
    notes:
      'Gateway request receipt is NOT equivalent to session.start. ' +
      'Mapped with lossy fidelity for observability only.',
  },
  {
    canonicalPhase: 'session.start',
    nativeHook: 'gateway.request.routed',
    supportLevel: 'lossy',
    blockCapability: false,
    mutationCapability: false,
    scope: 'gateway',
    notes:
      'Gateway routing decision. Infrastructure-level, not an agent session start.',
  },
  {
    canonicalPhase: 'session.end',
    nativeHook: 'gateway.request.completed',
    supportLevel: 'lossy',
    blockCapability: false,
    mutationCapability: false,
    scope: 'gateway',
    notes:
      'Gateway request completion is NOT equivalent to session.end. ' +
      'Mapped with lossy fidelity for observability only.',
  },
  {
    canonicalPhase: 'tool.permission_request',
    nativeHook: 'gateway.auth.check',
    supportLevel: 'lossy',
    blockCapability: true,
    mutationCapability: false,
    scope: 'gateway',
    notes:
      'Gateway auth check loosely maps to tool permission but is infrastructure-level. ' +
      'Do not treat as an agent-level permission gate.',
  },
];

function buildFromCatalog(): { plugin: PhaseMapping[]; gateway: PhaseMapping[] } | null {
  try {
    const mappings = listHookMappingsByAdapterFamily('openclaw');
    if (mappings.length === 0) return null;
    const phaseMappings = mappings
      .map(hookMappingToPhaseMapping)
      .filter((m): m is PhaseMapping => m !== null);
    // Split into plugin and gateway
    const plugin = phaseMappings.filter((m) => m.scope !== 'gateway');
    const gateway = phaseMappings.filter((m) => m.scope === 'gateway');
    // Deduplicate by nativeHook within each group
    const dedup = (arr: PhaseMapping[]) => {
      const seen = new Set<string>();
      return arr.filter((m) => {
        if (seen.has(m.nativeHook)) return false;
        seen.add(m.nativeHook);
        return true;
      });
    };
    return { plugin: dedup(plugin), gateway: dedup(gateway) };
  } catch {
    return null;
  }
}

const catalogMappings = buildFromCatalog();

export const OPENCLAW_PLUGIN_MAPPINGS: PhaseMapping[] = catalogMappings?.plugin ?? FALLBACK_PLUGIN_MAPPINGS;
export const OPENCLAW_GATEWAY_MAPPINGS: PhaseMapping[] = catalogMappings?.gateway ?? FALLBACK_GATEWAY_MAPPINGS;

/**
 * All OpenClaw phase mappings (plugin + gateway).
 */
export const OPENCLAW_PHASE_MAPPINGS: PhaseMapping[] = [
  ...OPENCLAW_PLUGIN_MAPPINGS,
  ...OPENCLAW_GATEWAY_MAPPINGS,
];

/**
 * Determine the origin of an OpenClaw native event.
 */
export function classifyHookOrigin(nativeEventName: string): OpenClawHookOrigin {
  if (nativeEventName.startsWith('gateway.')) {
    return 'gateway';
  }
  return 'plugin';
}

/**
 * Look up the phase mapping for a given OpenClaw native event name.
 * Searches plugin mappings first (preferred), then gateway mappings.
 */
export function getOpenClawPhaseMapping(nativeEventName: string): PhaseMapping | undefined {
  // Plugin mappings take priority
  const pluginMatch = OPENCLAW_PLUGIN_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
  if (pluginMatch) return pluginMatch;

  return OPENCLAW_GATEWAY_MAPPINGS.find((m) => m.nativeHook === nativeEventName);
}

/**
 * Get all canonical phases supported by plugin hooks (the true agent-lifecycle mappings).
 */
export function getSupportedPluginPhases(): string[] {
  return OPENCLAW_PLUGIN_MAPPINGS.map((m) => m.canonicalPhase);
}

/**
 * Get all canonical phases across both plugin and gateway mappings.
 */
export function getSupportedPhases(): string[] {
  return OPENCLAW_PHASE_MAPPINGS.map((m) => m.canonicalPhase);
}
