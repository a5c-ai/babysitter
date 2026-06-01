/**
 * GAP-PROMPT-002: Deterministic Capability Projection
 *
 * Collects capability signals from installed plugins, process-library bindings,
 * harness adapters, and feature flags, producing a sorted, deterministic
 * capability array for PromptContext enrichment.
 *
 * @module prompts/capabilityCollector
 */

import { readPluginRegistry } from '../blueprints/registry';
import { resolveActiveProcessLibrary } from '../processLibrary/active';
import type { PluginScope } from '../blueprints/types';
import { listPluginTargetDescriptors } from '@a5c-ai/atlas/catalog';

/**
 * Collected capabilities from all runtime signal sources.
 */
export interface CollectedCapabilities {
  pluginCapabilities: string[];
  libraryCapabilities: string[];
  adapterCapabilities: string[];
  flagCapabilities: string[];
  /** Sorted union of all capability arrays */
  all: string[];
}

/**
 * Options for capability collection.
 */
export interface CapabilityCollectionOptions {
  /** Global state directory (default: ~/.a5c) */
  globalStateDir?: string;
  /** Project state directory (default: .a5c) */
  stateDir?: string;
  /** Harness name for adapter capability detection */
  harness?: string;
  /** Feature flags: only truthy values are projected */
  featureFlags?: Record<string, boolean>;
  /** Override state dir for process library resolution */
  processLibraryStateDir?: string;
}

/**
 * Collect capabilities from installed plugins, process-library bindings,
 * harness adapters, and feature flags.
 *
 * The output is deterministic: same inputs always produce the same sorted result.
 */
export async function collectCapabilities(
  options: CapabilityCollectionOptions = {},
): Promise<CollectedCapabilities> {
  const pluginCapabilities = await collectPluginCapabilities(options);
  const libraryCapabilities = await collectLibraryCapabilities(options);
  const adapterCapabilities = collectAdapterCapabilities(options);
  const flagCapabilities = collectFlagCapabilities(options);

  const allSet = new Set([
    ...pluginCapabilities,
    ...libraryCapabilities,
    ...adapterCapabilities,
    ...flagCapabilities,
  ]);
  const all = [...allSet].sort();

  return {
    pluginCapabilities: [...pluginCapabilities].sort(),
    libraryCapabilities: [...libraryCapabilities].sort(),
    adapterCapabilities: [...adapterCapabilities].sort(),
    flagCapabilities: [...flagCapabilities].sort(),
    all,
  };
}

/**
 * Merge baseline capabilities with collected capabilities.
 * Deduplicates and returns a sorted array.
 */
export function mergeCapabilities(
  base: string[],
  collected: CollectedCapabilities,
): string[] {
  const merged = new Set([...base, ...collected.all]);
  return [...merged].sort();
}

/**
 * Collect plugin capabilities from both global and project registries.
 */
async function collectPluginCapabilities(
  options: CapabilityCollectionOptions,
): Promise<string[]> {
  const caps: string[] = [];
  const scopes: PluginScope[] = ['global', 'project'];

  for (const scope of scopes) {
    try {
      const registry = await readPluginRegistry(
        scope,
        scope === 'project' ? options.stateDir : undefined,
      );
      for (const name of Object.keys(registry.plugins)) {
        caps.push(name ? `plugin:${name}` : 'plugin:unknown');
      }
    } catch {
      // Registry read failures are non-fatal — skip silently
    }
  }

  return caps;
}

/**
 * Collect library capabilities from process-library binding state.
 */
async function collectLibraryCapabilities(
  options: CapabilityCollectionOptions,
): Promise<string[]> {
  try {
    const result = await resolveActiveProcessLibrary({
      stateDir: options.processLibraryStateDir ?? options.stateDir,
    });
    if (result.binding) {
      return ['process-library'];
    }
  } catch {
    // Binding resolution failures are non-fatal
  }
  return [];
}

/**
 * Collect adapter capabilities from harness name.
 * Reads capabilities from the agent-catalog (Atlas graph) instead of a
 * hardcoded map. Falls back to empty when the catalog is unavailable.
 */
function collectAdapterCapabilities(
  options: CapabilityCollectionOptions,
): string[] {
  if (!options.harness) return [];

  const target = listPluginTargetDescriptors().find(t => t.targetId === options.harness);
  if (target?.harnessCapabilities) {
    return capabilityIdsToAdapterCapabilities(target.harnessCapabilities);
  }

  return [];
}

/** Map Atlas capability IDs (PascalCase) to adapter capability strings (kebab-case). */
function capabilityIdsToAdapterCapabilities(ids: string[]): string[] {
  const CAPABILITY_MAP: Record<string, string> = {
    SessionBinding: 'session-binding',
    StopHook: 'stop-hook',
    Mcp: 'mcp',
    HeadlessPrompt: 'headless-prompt',
    Programmatic: 'programmatic-session',
  };
  // Also include hooks if StopHook is present
  const mapped = ids.map(id => CAPABILITY_MAP[id]).filter((c): c is string => Boolean(c));
  if (ids.includes('StopHook') && !mapped.includes('hooks')) {
    mapped.unshift('hooks');
  }
  return mapped;
}

/**
 * Collect flag capabilities from feature flags.
 */
function collectFlagCapabilities(
  options: CapabilityCollectionOptions,
): string[] {
  if (!options.featureFlags) return [];

  return Object.entries(options.featureFlags)
    .filter(([_key, value]) => value === true)
    .map(([key]) => `flag:${key}`);
}
