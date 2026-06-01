/**
 * Plugin Path Resolution
 *
 * Helpers for resolving filesystem paths to plugin registries,
 * marketplace directories, and related resources based on scope.
 */

import path from "node:path";
import { homedir } from "node:os";
import { PluginScope, PLUGIN_REGISTRY_FILENAME } from "./types";

/**
 * Base directory name for babysitter configuration.
 */
const BABYSITTER_DIR = ".a5c";

/**
 * Subdirectory within the babysitter config dir for marketplace clones.
 */
const MARKETPLACES_SUBDIR = "marketplaces";

/**
 * Returns the root babysitter configuration directory for the given scope.
 *
 * - `global` — `~/.a5c/`
 * - `project` — `<projectDir>/.a5c/`
 */
function getBaseDir(scope: PluginScope, projectDir?: string): string {
  if (scope === "global") {
    return path.join(homedir(), BABYSITTER_DIR);
  }
  if (!projectDir) {
    throw new Error(
      "projectDir is required when scope is 'project'"
    );
  }
  return path.join(projectDir, BABYSITTER_DIR);
}

/**
 * Returns the full path to the plugin registry JSON file for the given scope.
 *
 * @param scope - Whether to use the global or project registry
 * @param projectDir - Required when scope is 'project'
 */
export function getRegistryPath(
  scope: PluginScope,
  projectDir?: string
): string {
  return path.join(getBaseDir(scope, projectDir), PLUGIN_REGISTRY_FILENAME);
}

/**
 * Returns the directory where marketplace repositories are cloned for the given scope.
 *
 * @param scope - Whether to use the global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 */
export function getMarketplacesDir(
  scope: PluginScope,
  projectDir?: string
): string {
  return path.join(getBaseDir(scope, projectDir), MARKETPLACES_SUBDIR);
}

/**
 * Returns the directory for a specific marketplace clone.
 *
 * @param marketplaceName - Name (or derived name) of the marketplace
 * @param scope - Whether to use the global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 */
export function getMarketplaceDir(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string
): string {
  const dir = getMarketplacesDir(scope, projectDir);
  return path.join(dir, marketplaceName);
}
