/**
 * Marketplace manifest normalization helpers.
 * Extracted from marketplace.ts for max-lines compliance.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  MarketplaceManifest,
  MarketplacePluginEntry,
} from "./types";
import {
  MARKETPLACE_MANIFEST_FILENAME,
  MANIFEST_PATH_FILENAME,
} from "./types";

/**
 * Resolves the marketplace manifest path within a cloned marketplace directory.
 */
export async function resolveManifestPath(dir: string): Promise<string> {
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
export function normalizeManifest(raw: Record<string, unknown>): MarketplaceManifest {
  const name = typeof raw.name === "string" ? raw.name : "unknown";
  const description = typeof raw.description === "string" ? raw.description : "";
  const url = typeof raw.url === "string" ? raw.url : "";

  // Normalize owner
  let owner: string;
  if (typeof raw.owner === "string") {
    owner = raw.owner;
  } else if (
    raw.owner && typeof raw.owner === "object" && "name" in raw.owner &&
    typeof (raw.owner as Record<string, unknown>).name === "string"
  ) {
    owner = (raw.owner as Record<string, unknown>).name as string;
  } else {
    owner = "";
  }

  // Check if plugins is already in Record format
  if (raw.plugins && !Array.isArray(raw.plugins)) {
    return {
      name, description, url, owner,
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

      let packagePath = "";
      if (typeof e.packagePath === "string") {
        packagePath = e.packagePath;
      } else if (typeof e.source === "string") {
        packagePath = e.source.replace(/^\.\//, "");
      }

      const version = typeof e.version === "string" ? e.version : "0.0.0";
      const pluginDesc = typeof e.description === "string" ? e.description : "";

      let author = "";
      if (typeof e.author === "string") {
        author = e.author;
      } else if (
        e.author && typeof e.author === "object" && "name" in e.author &&
        typeof (e.author as Record<string, unknown>).name === "string"
      ) {
        author = (e.author as Record<string, unknown>).name as string;
      }

      const tags = Array.isArray(e.tags) ? (e.tags as string[]) : [];
      const versions = Array.isArray(e.versions)
        ? (e.versions as string[])
        : [version];

      plugins[pluginName] = {
        name: pluginName, description: pluginDesc, latestVersion: version,
        versions, packagePath, tags, author,
      };
    }
  }

  return { name, description, url, owner, plugins };
}
