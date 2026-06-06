import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_ENV_VARS, getConfiguredGlobalStateRoot } from "./defaults";

export type RunsScope = "global" | "repo";

function normalizeComparablePath(value: string): string {
  const normalized = path.normalize(path.resolve(value));
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function dedupePaths(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const comparable = normalizeComparablePath(value);
    if (seen.has(comparable)) {
      continue;
    }
    seen.add(comparable);
    result.push(path.resolve(value));
  }
  return result;
}

function isPresentPath(target: string): boolean {
  try {
    return fs.existsSync(target);
  } catch {
    return false;
  }
}

export function parseRunsScope(rawValue?: string): RunsScope {
  const normalized = rawValue?.trim().toLowerCase();
  switch (normalized) {
    case "repo":
    case "project":
    case "root":
    case "local":
      return "repo";
    case "global":
    case "home":
    case "user":
    case undefined:
    case "":
      return "global";
    default:
      return "global";
  }
}

export function getRunsScope(): RunsScope {
  return parseRunsScope(process.env[CONFIG_ENV_VARS.RUNS_SCOPE]);
}

export function findRepoRoot(startDir = process.cwd()): string | undefined {
  let current = path.resolve(startDir);
  let reachedRoot = false;
  while (!reachedRoot) {
    if (isPresentPath(path.join(current, ".git")) || isPresentPath(path.join(current, ".a5c"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      reachedRoot = true;
      continue;
    }
    current = parent;
  }
  return undefined;
}

export function getRepoRoot(startDir = process.cwd()): string {
  return findRepoRoot(startDir) ?? path.resolve(startDir);
}

export function getRepoRunsDir(startDir = process.cwd()): string {
  return path.join(getRepoRoot(startDir), ".a5c", "runs");
}

export function getGlobalRunsDir(): string {
  return path.join(getConfiguredGlobalStateRoot(), "runs");
}

function resolveRelativeRunsDir(value: string, cwd: string): string {
  const scope = getRunsScope();
  const baseDir = scope === "repo" ? getRepoRoot(cwd) : getConfiguredGlobalStateRoot();
  return path.resolve(baseDir, value);
}

export function resolveRunsDir(options?: {
  cwd?: string;
  override?: string;
}): string {
  const cwd = options?.cwd ?? process.cwd();
  const explicit = options?.override?.trim() || process.env[CONFIG_ENV_VARS.RUNS_DIR]?.trim();
  if (explicit) {
    return path.isAbsolute(explicit)
      ? path.resolve(explicit)
      : resolveRelativeRunsDir(explicit, cwd);
  }

  return getRunsScope() === "repo"
    ? getRepoRunsDir(cwd)
    : getGlobalRunsDir();
}

export function getReadableRunsDirs(options?: {
  cwd?: string;
  override?: string;
}): string[] {
  const cwd = options?.cwd ?? process.cwd();
  const primary = resolveRunsDir({ cwd, override: options?.override });
  const legacyRepo = getRepoRunsDir(cwd);
  return dedupePaths([primary, legacyRepo]);
}

export function resolveExistingRunDir(
  runRef: string,
  options?: {
    cwd?: string;
    override?: string;
  },
): string {
  const cwd = options?.cwd ?? process.cwd();
  const readableRoots = getReadableRunsDirs({ cwd, override: options?.override });
  const repoRoot = getRepoRoot(cwd);

  if (path.isAbsolute(runRef)) {
    return path.resolve(runRef);
  }

  const normalizedRef = runRef.replace(/\\/g, "/");
  const looksLikePath =
    normalizedRef.includes("/") ||
    normalizedRef.includes(".a5c/") ||
    normalizedRef === "." ||
    normalizedRef === "..";

  const candidates = looksLikePath
    ? dedupePaths([
      path.resolve(cwd, runRef),
      path.resolve(repoRoot, runRef),
    ])
    : readableRoots.map((root) => path.join(root, runRef));

  for (const candidate of candidates) {
    if (isPresentPath(path.join(candidate, "run.json"))) {
      return candidate;
    }
  }

  return candidates[0];
}

export function resolveRunRootFromRunDir(runDir: string, cwd = process.cwd()): string {
  const absoluteRunDir = path.resolve(runDir);
  for (const candidateRoot of getReadableRunsDirs({ cwd })) {
    const relative = path.relative(candidateRoot, absoluteRunDir);
    if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
      return candidateRoot;
    }
  }
  return path.dirname(absoluteRunDir);
}

export function resolveProjectRootForRun(
  runDir: string,
  entryImportPath?: string,
  fallbackCwd = process.cwd(),
): string {
  if (entryImportPath?.trim()) {
    const absoluteEntrypoint = path.resolve(runDir, entryImportPath);
    const repoRoot = findRepoRoot(path.dirname(absoluteEntrypoint));
    if (repoRoot) {
      return repoRoot;
    }
  }

  const cwdRepoRoot = findRepoRoot(fallbackCwd);
  if (cwdRepoRoot) {
    return cwdRepoRoot;
  }

  return path.dirname(resolveRunRootFromRunDir(runDir, fallbackCwd));
}
