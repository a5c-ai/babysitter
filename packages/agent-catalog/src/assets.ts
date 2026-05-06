import fs from "node:fs";
import path from "node:path";

const PACKAGE_NAME = "@a5c-ai/agent-catalog";
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const ATLAS_GRAPH_ROOT = path.resolve(__dirname, "..", "..", "atlas", "graph", "agent-catalog");
const ALLOWED_ASSET_ROOTS = new Set(["graph", "evidence", "docs"]);

function normalizeAssetPath(relativeAssetPath: string): string {
  const normalized = relativeAssetPath.replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (!normalized || path.isAbsolute(normalized)) {
    throw new Error(`Expected a relative asset path within ${PACKAGE_NAME}, got "${relativeAssetPath}".`);
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => segment === "..")) {
    throw new Error(`Asset path must stay within ${PACKAGE_NAME}, got "${relativeAssetPath}".`);
  }

  if (!ALLOWED_ASSET_ROOTS.has(segments[0])) {
    throw new Error(
      `Asset path must start with one of ${[...ALLOWED_ASSET_ROOTS].join(", ")}; got "${relativeAssetPath}".`,
    );
  }

  return segments.join("/");
}

function resolveExportedAssetPath(relativeAssetPath: string): string | undefined {
  try {
    return require.resolve(`${PACKAGE_NAME}/${relativeAssetPath}`);
  } catch {
    return undefined;
  }
}

function resolvePackageRootCandidates(): string[] {
  const candidates = new Set<string>();

  try {
    candidates.add(path.dirname(require.resolve(`${PACKAGE_NAME}/package.json`)));
  } catch {
    // Ignore packaged/bundled environments that do not expose package.json.
  }

  candidates.add(PACKAGE_ROOT);

  let currentDir = process.cwd();
  while (true) {
    candidates.add(path.join(currentDir, "packages", "agent-catalog"));
    candidates.add(path.join(currentDir, "agent-catalog"));

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return [...candidates];
}

export function resolveCatalogAssetPath(relativeAssetPath: string): string {
  const normalized = normalizeAssetPath(relativeAssetPath);

  // Prefer Atlas graph directory for graph assets
  if (normalized.startsWith("graph/")) {
    const atlasPath = path.join(ATLAS_GRAPH_ROOT, normalized.slice("graph/".length));
    if (fs.existsSync(atlasPath)) {
      return atlasPath;
    }
  }

  const exportedPath = resolveExportedAssetPath(normalized);
  if (exportedPath && fs.existsSync(exportedPath)) {
    return exportedPath;
  }

  for (const packageRoot of resolvePackageRootCandidates()) {
    const localPath = path.join(packageRoot, normalized);
    if (fs.existsSync(localPath)) {
      return localPath;
    }
  }

  throw new Error(`Asset "${relativeAssetPath}" is unavailable for ${PACKAGE_NAME}.`);
}

export function resolveCatalogGraphAssetPath(...segments: string[]): string {
  return resolveCatalogAssetPath(path.posix.join("graph", ...segments.map((segment) => segment.replace(/\\/g, "/"))));
}

export function resolveCatalogEvidenceAssetPath(...segments: string[]): string {
  return resolveCatalogAssetPath(path.posix.join("evidence", ...segments.map((segment) => segment.replace(/\\/g, "/"))));
}
