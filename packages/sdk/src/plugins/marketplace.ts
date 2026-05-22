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
  MANIFEST_PATH_FILENAME,
  isNodeError,
} from "./types";
import { resolveManifestPath, normalizeManifest } from "./marketplaceHelpers";

const execFile = promisify(execFileCb);

/**
 * Derives a short marketplace name from a git URL.
 */
export function deriveMarketplaceName(url: string): string {
  const cleaned = url.replace(/\.git\s*$/, "").replace(/\/+$/, "");
  const lastSegment = cleaned.split("/").pop() ?? "";
  const afterColon = lastSegment.split(":").pop() ?? lastSegment;
  if (!afterColon) {
    throw new Error(`Unable to derive marketplace name from URL: ${url}`);
  }
  return afterColon;
}

/**
 * Clones a marketplace repository with --depth 1 for minimal footprint.
 */
export async function cloneMarketplace(
  url: string,
  scope: PluginScope,
  projectDir?: string,
  manifestPath?: string,
  branch?: string,
  force?: boolean
): Promise<string> {
  const name = deriveMarketplaceName(url);
  const marketplacesDir = getMarketplacesDir(scope, projectDir);
  const targetDir = path.join(marketplacesDir, name);

  await fs.mkdir(marketplacesDir, { recursive: true });

  try {
    await fs.access(targetDir);
    if (force) {
      await fs.rm(targetDir, { recursive: true, force: true });
    } else {
      throw new Error(
        `Marketplace "${name}" already exists at ${targetDir}. Use --force to replace or plugin:update-marketplace to refresh.`
      );
    }
  } catch (error: unknown) {
    if (!isNodeError(error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  try {
    const cloneArgs = ["clone", "--depth", "1"];
    if (branch) { cloneArgs.push("--branch", branch); }
    cloneArgs.push(url, targetDir);
    await execFile("git", cloneArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to clone marketplace from ${url}: ${message}`);
  }

  if (manifestPath) {
    await fs.writeFile(
      path.join(targetDir, MANIFEST_PATH_FILENAME),
      manifestPath.replace(/\\/g, "/"),
      "utf8"
    );
  }

  return targetDir;
}

/**
 * Updates a previously cloned marketplace by pulling latest changes.
 */
export async function updateMarketplace(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string,
  branch?: string
): Promise<void> {
  const dir = getMarketplaceDir(marketplaceName, scope, projectDir);

  try { await fs.access(dir); } catch {
    throw new Error(`Marketplace "${marketplaceName}" not found at ${dir}. Clone it first.`);
  }

  try {
    if (branch) {
      await execFile("git", ["-C", dir, "fetch", "--depth", "1", "origin", branch]);
      try {
        await execFile("git", ["-C", dir, "checkout", branch]);
      } catch {
        try { await execFile("git", ["-C", dir, "stash"]); } catch { /* Nothing to stash */ }
        await execFile("git", ["-C", dir, "checkout", "-B", branch, "FETCH_HEAD"]);
      }
    }
    await execFile("git", ["-C", dir, "pull", "--ff-only"]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update marketplace "${marketplaceName}": ${message}`);
  }
}

/**
 * Internal helper that reads the manifest and returns both the parsed
 * manifest and the resolved manifest file path.
 */
async function readManifestWithPath(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<{ manifest: MarketplaceManifest; manifestPath: string }> {
  const dir = getMarketplaceDir(marketplaceName, scope, projectDir);
  const manifestPath = await resolveManifestPath(dir);
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = normalizeManifest(JSON.parse(raw) as Record<string, unknown>);
  return { manifest, manifestPath };
}

/**
 * Reads and parses the marketplace manifest from a cloned marketplace.
 */
export async function readMarketplaceManifest(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<MarketplaceManifest> {
  const { manifest } = await readManifestWithPath(marketplaceName, scope, projectDir);
  return manifest;
}

/**
 * Lists all plugins available in a marketplace manifest.
 */
export async function listMarketplacePlugins(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<MarketplacePluginEntry[]> {
  const manifest = await readMarketplaceManifest(marketplaceName, scope, projectDir);
  return Object.values(manifest.plugins).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolves the full filesystem path to a plugin's package directory.
 */
export async function resolvePluginPackagePath(
  marketplaceName: string,
  pluginName: string,
  scope: PluginScope,
  projectDir?: string
): Promise<string> {
  const { manifest, manifestPath } = await readManifestWithPath(marketplaceName, scope, projectDir);
  const entry = manifest.plugins[pluginName];
  if (!entry) {
    throw new Error(`Plugin "${pluginName}" not found in marketplace "${marketplaceName}"`);
  }
  const manifestDir = path.dirname(manifestPath);
  return path.join(manifestDir, entry.packagePath);
}

/**
 * Lists all cloned marketplace directories for the given scope.
 */
export async function listMarketplaces(
  scope: PluginScope,
  projectDir?: string
): Promise<string[]> {
  const dir = getMarketplacesDir(scope, projectDir);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") { return []; }
    throw error;
  }
}
