/**
 * Marketplace Management
 *
 * Manages marketplace repositories (clone, update, read manifests)
 * using git operations executed via child_process.execFile.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { getMarketplacesDir, getMarketplaceDir } from "./paths";
import {
  MarketplaceManifest,
  MarketplacePluginEntry,
  PluginScope,
  MARKETPLACE_MANIFEST_FILENAME,
  isNodeError,
} from "./types";

const execFile = promisify(execFileCb);

/**
 * Derives a short marketplace name from a git URL.
 *
 * Examples:
 *   "https://github.com/a5c-ai/marketplace.git" -> "marketplace"
 *   "git@github.com:a5c-ai/my-plugins.git"      -> "my-plugins"
 *   "https://github.com/org/repo"                -> "repo"
 *
 * @param url - Git remote URL
 */
export function deriveMarketplaceName(url: string): string {
  // Strip trailing .git and slashes
  const cleaned = url.replace(/\.git\s*$/, "").replace(/\/+$/, "");
  // Extract the last path segment
  const lastSegment = cleaned.split("/").pop() ?? "";
  // Handle SSH-style URLs (git@host:org/repo)
  const afterColon = lastSegment.split(":").pop() ?? lastSegment;
  if (!afterColon) {
    throw new Error(
      `Unable to derive marketplace name from URL: ${url}`
    );
  }
  return afterColon;
}

/**
 * Clones a marketplace repository with --depth 1 for minimal footprint.
 *
 * @param url - Git remote URL of the marketplace
 * @param scope - Whether to clone into global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 * @returns The directory the marketplace was cloned into
 */
export async function cloneMarketplace(
  url: string,
  scope: PluginScope,
  projectDir?: string
): Promise<string> {
  const name = deriveMarketplaceName(url);
  const marketplacesDir = getMarketplacesDir(scope, projectDir);
  const targetDir = path.join(marketplacesDir, name);

  // Ensure parent directory exists
  await fs.mkdir(marketplacesDir, { recursive: true });

  // Check if already cloned
  try {
    await fs.access(targetDir);
    throw new Error(
      `Marketplace "${name}" already exists at ${targetDir}. Use updateMarketplace() to refresh.`
    );
  } catch (error: unknown) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }
    // Directory does not exist, proceed with clone
  }

  try {
    await execFile("git", ["clone", "--depth", "1", url, targetDir]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to clone marketplace from ${url}: ${message}`
    );
  }

  return targetDir;
}

/**
 * Updates a previously cloned marketplace by pulling latest changes.
 *
 * @param marketplaceName - Name of the marketplace directory
 * @param scope - Whether to look in global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 */
export async function updateMarketplace(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<void> {
  const dir = getMarketplaceDir(marketplaceName, scope, projectDir);

  try {
    await fs.access(dir);
  } catch {
    throw new Error(
      `Marketplace "${marketplaceName}" not found at ${dir}. Clone it first.`
    );
  }

  try {
    await execFile("git", ["-C", dir, "pull", "--ff-only"]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to update marketplace "${marketplaceName}": ${message}`
    );
  }
}

/**
 * Reads and parses the marketplace manifest (marketplace.json) from a cloned marketplace.
 *
 * @param marketplaceName - Name of the marketplace directory
 * @param scope - Whether to look in global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 */
export async function readMarketplaceManifest(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<MarketplaceManifest> {
  const dir = getMarketplaceDir(marketplaceName, scope, projectDir);
  const manifestPath = path.join(dir, MARKETPLACE_MANIFEST_FILENAME);

  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw) as MarketplaceManifest;
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new Error(
        `Marketplace manifest not found at ${manifestPath}. Is "${marketplaceName}" a valid marketplace?`
      );
    }
    throw error;
  }
}

/**
 * Lists all plugins available in a marketplace manifest.
 *
 * @param marketplaceName - Name of the marketplace directory
 * @param scope - Whether to look in global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 */
export async function listMarketplacePlugins(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<MarketplacePluginEntry[]> {
  const manifest = await readMarketplaceManifest(
    marketplaceName,
    scope,
    projectDir
  );
  return Object.values(manifest.plugins).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Resolves the full filesystem path to a plugin's package directory
 * within a cloned marketplace.
 *
 * @param marketplaceName - Name of the marketplace directory
 * @param pluginName - Plugin identifier to look up
 * @param scope - Whether to look in global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 */
export async function resolvePluginPackagePath(
  marketplaceName: string,
  pluginName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<string> {
  const manifest = await readMarketplaceManifest(
    marketplaceName,
    scope,
    projectDir
  );
  const entry = manifest.plugins[pluginName];
  if (!entry) {
    throw new Error(
      `Plugin "${pluginName}" not found in marketplace "${marketplaceName}"`
    );
  }
  const dir = getMarketplaceDir(marketplaceName, scope, projectDir);
  return path.join(dir, entry.packagePath);
}

/**
 * Lists all cloned marketplace directories for the given scope.
 *
 * @param scope - Whether to look in global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 * @returns Array of marketplace directory names
 */
export async function listMarketplaces(
  scope: PluginScope,
  projectDir?: string
): Promise<string[]> {
  const dir = getMarketplacesDir(scope, projectDir);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
