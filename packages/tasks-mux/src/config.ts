import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, resolve, dirname } from "node:path";

import { RoutingConfigSchema } from "./types.js";
import type { RoutingConfig } from "./types.js";

export interface RepoConfigResolutionOptions {
  repoRoot?: string;
  configRoot?: string;
  responderDir?: string;
  startDir?: string;
}

export function resolveRepositoryRoot(startDir = process.cwd()): string | undefined {
  let current = resolve(startDir);

  while (true) {
    if (existsSync(join(current, ".git"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
}

export function resolveConfigRoot(options: RepoConfigResolutionOptions = {}): string {
  const startDir = resolve(options.startDir ?? process.cwd());

  if (options.configRoot) {
    return resolveAgainstKnownRoots(options.configRoot, options.repoRoot, startDir);
  }

  const repoRoot = options.repoRoot
    ? resolveAgainstKnownRoots(options.repoRoot, undefined, startDir)
    : resolveRepositoryRoot(startDir);

  if (repoRoot) {
    return join(repoRoot, ".a5c");
  }

  return join(startDir, ".a5c");
}

export function resolveResponderDirectory(options: RepoConfigResolutionOptions = {}): string {
  const startDir = resolve(options.startDir ?? process.cwd());

  if (options.responderDir) {
    if (isAbsolute(options.responderDir)) {
      return options.responderDir;
    }

    const configRoot = options.configRoot
      ? resolveAgainstKnownRoots(options.configRoot, options.repoRoot, startDir)
      : undefined;
    const repoRoot = options.repoRoot
      ? resolveAgainstKnownRoots(options.repoRoot, undefined, startDir)
      : (configRoot ? dirname(configRoot) : undefined);

    if (configRoot && !looksLikeRepoRelativeA5cPath(options.responderDir)) {
      return resolve(configRoot, options.responderDir);
    }

    return resolveAgainstKnownRoots(options.responderDir, repoRoot, startDir);
  }

  return join(resolveConfigRoot(options), "responder");
}

function resolveAgainstKnownRoots(pathValue: string, repoRoot: string | undefined, startDir: string): string {
  if (isAbsolute(pathValue)) {
    return pathValue;
  }

  if (repoRoot) {
    const normalizedRepoRoot = isAbsolute(repoRoot) ? repoRoot : resolve(startDir, repoRoot);
    return resolve(normalizedRepoRoot, pathValue);
  }

  const discoveredRepoRoot = resolveRepositoryRoot(startDir);
  if (discoveredRepoRoot) {
    return resolve(discoveredRepoRoot, pathValue);
  }

  return resolve(startDir, pathValue);
}

function looksLikeRepoRelativeA5cPath(pathValue: string): boolean {
  return pathValue === ".a5c" || pathValue.startsWith(`.a5c/`) || pathValue.startsWith(`.a5c\\`);
}

/**
 * Returns the path to the routing.json config file.
 */
export function resolveRoutingConfigPath(configRoot?: string): string {
  const root = configRoot ?? resolveConfigRoot();
  return join(root, "routing.json");
}

/**
 * Loads and validates routing configuration from `.a5c/routing.json`.
 * Returns `undefined` when the file does not exist or fails validation.
 */
export function loadRoutingConfigSync(configRoot?: string): RoutingConfig | undefined {
  const configPath = resolveRoutingConfigPath(configRoot);

  if (!existsSync(configPath)) {
    return undefined;
  }

  try {
    const raw: unknown = JSON.parse(readFileSync(configPath, "utf-8"));
    const result = RoutingConfigSchema.safeParse(raw);
    if (result.success) {
      return result.data;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
