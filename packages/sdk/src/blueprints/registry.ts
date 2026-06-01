/**
 * Plugin Registry CRUD
 *
 * Manages the plugin registry file using atomic writes for crash safety.
 * The registry tracks all installed plugins, their versions, and metadata.
 */

import { promises as fs } from "node:fs";
import { writeFileAtomic } from "../storage/atomic";
import { getRegistryPath } from "./paths";
import {
  PluginRegistry,
  PluginRegistryEntry,
  PluginScope,
  PLUGIN_REGISTRY_SCHEMA_VERSION,
  isNodeError,
} from "./types";

/**
 * Creates an empty plugin registry with the current schema version.
 */
function createEmptyRegistry(): PluginRegistry {
  return {
    schemaVersion: PLUGIN_REGISTRY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    plugins: {},
  };
}

/**
 * Reads the plugin registry from disk.
 * Returns an empty registry if the file does not exist.
 *
 * @param scope - Whether to read the global or project registry
 * @param projectDir - Required when scope is 'project'
 */
export async function readPluginRegistry(
  scope: PluginScope,
  projectDir?: string
): Promise<PluginRegistry> {
  const registryPath = getRegistryPath(scope, projectDir);
  try {
    const raw = await fs.readFile(registryPath, "utf8");
    return JSON.parse(raw) as PluginRegistry;
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return createEmptyRegistry();
    }
    throw error;
  }
}

/**
 * Writes the plugin registry to disk using an atomic write.
 *
 * @param registry - The full registry object to persist
 * @param scope - Whether to write the global or project registry
 * @param projectDir - Required when scope is 'project'
 */
export async function writePluginRegistry(
  registry: PluginRegistry,
  scope: PluginScope,
  projectDir?: string
): Promise<void> {
  const registryPath = getRegistryPath(scope, projectDir);
  await writeFileAtomic(
    registryPath,
    JSON.stringify(registry, null, 2) + "\n"
  );
}

/**
 * Looks up a plugin entry by name in the registry.
 * Returns undefined if the plugin is not registered.
 *
 * @param registry - The registry to search
 * @param pluginName - The plugin identifier to look up
 */
export function getPluginEntry(
  registry: PluginRegistry,
  pluginName: string
): PluginRegistryEntry | undefined {
  return registry.plugins[pluginName];
}

/**
 * Returns a new registry with the given entry inserted or updated.
 * Sets the registry's updatedAt timestamp. Does not mutate the input.
 *
 * @param registry - The current registry
 * @param entry - The plugin entry to insert or update
 */
export function upsertPluginEntry(
  registry: PluginRegistry,
  entry: PluginRegistryEntry
): PluginRegistry {
  const now = new Date().toISOString();
  return {
    ...registry,
    updatedAt: now,
    plugins: {
      ...registry.plugins,
      [entry.name]: {
        ...entry,
        updatedAt: now,
      },
    },
  };
}

/**
 * Returns a new registry with the named plugin removed.
 * Does not mutate the input. Throws if the plugin is not found.
 *
 * @param registry - The current registry
 * @param pluginName - The plugin identifier to remove
 */
export function removePluginEntry(
  registry: PluginRegistry,
  pluginName: string
): PluginRegistry {
  if (!(pluginName in registry.plugins)) {
    throw new Error(
      `Plugin "${pluginName}" is not present in the registry`
    );
  }
  const { [pluginName]: _removed, ...remaining } = registry.plugins;
  return {
    ...registry,
    updatedAt: new Date().toISOString(),
    plugins: remaining,
  };
}

/**
 * Returns all plugin entries as a sorted array (sorted by name).
 *
 * @param registry - The registry to list
 */
export function listPluginEntries(
  registry: PluginRegistry
): PluginRegistryEntry[] {
  return Object.values(registry.plugins).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
