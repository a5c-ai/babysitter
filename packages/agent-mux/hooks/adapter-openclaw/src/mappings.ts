import type { PhaseMapping } from '@a5c-ai/agent-mux-hooks-core';
import { listHookMappingsByAdapterFamily } from '@a5c-ai/atlas/catalog';
import type { HookMappingDescriptor } from '@a5c-ai/atlas/catalog';

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
    supportLevel: SUPPORT_LEVEL_MAP[mapping.supportLevel] ?? (mapping.scope === 'gateway' ? 'lossy' : 'native'),
    blockCapability: mapping.blockCapability ?? false,
    mutationCapability: mapping.mutationCapability ?? false,
    scope: (mapping.scope ?? 'session') as PhaseMapping['scope'],
  };
}

function buildFromCatalog(): { plugin: PhaseMapping[]; gateway: PhaseMapping[] } {
  const mappings = listHookMappingsByAdapterFamily('openclaw');
  if (mappings.length === 0) {
    throw new Error('hooks-mux adapter-openclaw: catalog unavailable or returned no mappings for family "openclaw"');
  }
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
}

const catalogMappings = buildFromCatalog();

export const OPENCLAW_PLUGIN_MAPPINGS: PhaseMapping[] = catalogMappings.plugin;
export const OPENCLAW_GATEWAY_MAPPINGS: PhaseMapping[] = catalogMappings.gateway;

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
