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
  MANIFEST_PATH_FILENAME,
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
 * @param manifestPath - Optional relative path to marketplace.json within the repo
 * @param branch - Optional git branch/tag/ref to clone (defaults to the repo's default branch)
 * @param force - If true, removes existing clone and re-clones
 * @returns The directory the marketplace was cloned into
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

  // Ensure parent directory exists
  await fs.mkdir(marketplacesDir, { recursive: true });

  // Check if already cloned
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
    // Directory does not exist, proceed with clone
  }

  try {
    const cloneArgs = ["clone", "--depth", "1"];
    if (branch) {
      cloneArgs.push("--branch", branch);
    }
    cloneArgs.push(url, targetDir);
    await execFile("git", cloneArgs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to clone marketplace from ${url}: ${message}`
    );
  }

  // Store custom manifest path if provided
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
 * When a branch is specified, switches to that branch first (fetching it
 * even in shallow clones).
 *
 * @param marketplaceName - Name of the marketplace directory
 * @param scope - Whether to look in global or project marketplaces dir
 * @param projectDir - Required when scope is 'project'
 * @param branch - Optional branch/tag/ref to switch to before pulling
 */
export async function updateMarketplace(
  marketplaceName: string,
  scope: PluginScope,
  projectDir?: string,
  branch?: string
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
    if (branch) {
      // Fetch the specific branch (works with shallow clones)
      await execFile("git", ["-C", dir, "fetch", "--depth", "1", "origin", branch]);
      // Switch to the branch, creating it locally if needed
      try {
        await execFile("git", ["-C", dir, "checkout", branch]);
      } catch {
        // Branch doesn't exist locally — create from FETCH_HEAD
        // Stash any local changes first (e.g. .babysitter-manifest-path)
        try {
          await execFile("git", ["-C", dir, "stash"]);
        } catch {
          // Nothing to stash
        }
        await execFile("git", ["-C", dir, "checkout", "-B", branch, "FETCH_HEAD"]);
      }
    }
    await execFile("git", ["-C", dir, "pull", "--ff-only"]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to update marketplace "${marketplaceName}": ${message}`
    );
  }
}

/**
 * Resolves the marketplace manifest path within a cloned marketplace directory.
 *
 * Search order:
 * 1. Custom path stored in .babysitter-manifest-path
 * 2. Root marketplace.json
 * 3. .claude-plugin/marketplace.json
 */
async function resolveManifestPath(dir: string): Promise<string> {
  // 1. Check for stored custom path
  try {
    const customPath = (
      await fs.readFile(path.join(dir, MANIFEST_PATH_FILENAME), "utf8")
    ).trim();
    const resolved = path.join(dir, customPath);
    await fs.access(resolved);
    return resolved;
  } catch {
    // No custom path or file not found at custom path
  }

  // 2. Check root marketplace.json
  const rootManifest = path.join(dir, MARKETPLACE_MANIFEST_FILENAME);
  try {
    await fs.access(rootManifest);
    return rootManifest;
  } catch {
    // Not at root
  }

  // 3. Check .claude-plugin/marketplace.json
  const claudePluginManifest = path.join(
    dir,
    ".claude-plugin",
    MARKETPLACE_MANIFEST_FILENAME
  );
  try {
    await fs.access(claudePluginManifest);
    return claudePluginManifest;
  } catch {
    // Not found anywhere
  }

  throw new Error(
    `Marketplace manifest not found in ${dir}. Searched: ${MARKETPLACE_MANIFEST_FILENAME}, .claude-plugin/${MARKETPLACE_MANIFEST_FILENAME}, and ${MANIFEST_PATH_FILENAME}. Is this a valid marketplace?`
  );
}

/**
 * Normalizes a marketplace manifest that may use the legacy array format
 * (with `source` field) into the standard Record format (with `packagePath`).
 */
function normalizeManifest(raw: Record<string, unknown>): MarketplaceManifest {
  const name =
    typeof raw.name === "string" ? raw.name : "unknown";
  const description =
    typeof raw.description === "string" ? raw.description : "";
  const url = typeof raw.url === "string" ? raw.url : "";

  // Normalize owner — may be a string or an object with a name field
  let owner: string;
  if (typeof raw.owner === "string") {
    owner = raw.owner;
  } else if (
    raw.owner &&
    typeof raw.owner === "object" &&
    "name" in raw.owner &&
    typeof (raw.owner as Record<string, unknown>).name === "string"
  ) {
    owner = (raw.owner as Record<string, unknown>).name as string;
  } else {
    owner = "";
  }

  // Check if plugins is already in Record format
  if (raw.plugins && !Array.isArray(raw.plugins)) {
    return {
      name,
      description,
      url,
      owner,
      plugins: raw.plugins as Record<string, MarketplacePluginEntry>,
    };
  }

  // Legacy array format: convert to Record
  const plugins: Record<string, MarketplacePluginEntry> = {};
  if (Array.isArray(raw.plugins)) {
    for (const entry of raw.plugins) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const pluginName = typeof e.name === "string" ? e.name : "";
      if (!pluginName) continue;

      // Legacy uses "source" (e.g. "./plugins/babysitter"), normalize to "packagePath"
      let packagePath = "";
      if (typeof e.packagePath === "string") {
        packagePath = e.packagePath;
      } else if (typeof e.source === "string") {
        packagePath = e.source.replace(/^\.\//, "");
      }

      const version = typeof e.version === "string" ? e.version : "0.0.0";
      const pluginDesc =
        typeof e.description === "string" ? e.description : "";

      // Normalize author — may be string or object
      let author = "";
      if (typeof e.author === "string") {
        author = e.author;
      } else if (
        e.author &&
        typeof e.author === "object" &&
        "name" in e.author &&
        typeof (e.author as Record<string, unknown>).name === "string"
      ) {
        author = (e.author as Record<string, unknown>).name as string;
      }

      const tags = Array.isArray(e.tags) ? (e.tags as string[]) : [];
      const versions = Array.isArray(e.versions)
        ? (e.versions as string[])
        : [version];

      plugins[pluginName] = {
        name: pluginName,
        description: pluginDesc,
        latestVersion: version,
        versions,
        packagePath,
        tags,
        author,
      };
    }
  }

  return { name, description, url, owner, plugins };
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
  const manifest = normalizeManifest(
    JSON.parse(raw) as Record<string, unknown>
  );
  return { manifest, manifestPath };
}

/**
 * Reads and parses the marketplace manifest from a cloned marketplace.
 *
 * Searches for the manifest in multiple locations (custom path, root,
 * .claude-plugin/) and normalizes legacy array formats.
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
  const { manifest } = await readManifestWithPath(
    marketplaceName,
    scope,
    projectDir
  );
  return manifest;
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
 * When a custom manifest path is used, plugin packagePaths are resolved
 * relative to the manifest's parent directory.
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
  const { manifest, manifestPath } = await readManifestWithPath(
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

  const manifestDir = path.dirname(manifestPath);
  return path.join(manifestDir, entry.packagePath);
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
