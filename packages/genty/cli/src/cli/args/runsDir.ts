/**
 * Run directory resolution for genty CLI.
 *
 * Mirrors the SDK's resolveRunsDir / resolveExistingRunDir logic locally
 * so genty-cli does not import from @a5c-ai/babysitter-sdk for path
 * resolution.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

type RunsScope = "global" | "repo";

function isPresentPath(target: string): boolean {
  try {
    return fs.existsSync(target);
  } catch {
    return false;
  }
}

function getGlobalStateRoot(): string {
  const explicit = process.env.BABYSITTER_STATE_ROOT?.trim()
    ?? process.env.AGENT_STATE_ROOT?.trim();
  if (explicit) return path.resolve(explicit);
  return path.join(os.homedir(), ".a5c");
}

function parseRunsScope(raw?: string): RunsScope {
  const normalized = raw?.trim().toLowerCase();
  switch (normalized) {
    case "repo": case "project": case "root": case "local":
      return "repo";
    default:
      return "global";
  }
}

function getRunsScope(): RunsScope {
  return parseRunsScope(process.env.BABYSITTER_RUNS_SCOPE ?? process.env.AGENT_RUNS_SCOPE);
}

function findRepoRoot(startDir = process.cwd()): string | undefined {
  let current = path.resolve(startDir);
  for (;;) {
    if (isPresentPath(path.join(current, ".git")) || isPresentPath(path.join(current, ".a5c"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function getRepoRoot(startDir = process.cwd()): string {
  return findRepoRoot(startDir) ?? path.resolve(startDir);
}

function getRepoRunsDir(startDir = process.cwd()): string {
  return path.join(getRepoRoot(startDir), ".a5c", "runs");
}

function getGlobalRunsDir(): string {
  return path.join(getGlobalStateRoot(), "runs");
}

export function resolveRunsDir(options?: { cwd?: string; override?: string }): string {
  const cwd = options?.cwd ?? process.cwd();
  const explicit = options?.override?.trim()
    ?? process.env.BABYSITTER_RUNS_DIR?.trim()
    ?? process.env.AGENT_RUNS_DIR?.trim();
  if (explicit) {
    if (path.isAbsolute(explicit)) return path.resolve(explicit);
    const scope = getRunsScope();
    const baseDir = scope === "repo" ? getRepoRoot(cwd) : getGlobalStateRoot();
    return path.resolve(baseDir, explicit);
  }
  return getRunsScope() === "repo" ? getRepoRunsDir(cwd) : getGlobalRunsDir();
}

function normalizeComparablePath(value: string): string {
  const normalized = path.normalize(path.resolve(value));
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function dedupePaths(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const comparable = normalizeComparablePath(value);
    if (seen.has(comparable)) continue;
    seen.add(comparable);
    result.push(path.resolve(value));
  }
  return result;
}

function getReadableRunsDirs(options?: { cwd?: string; override?: string }): string[] {
  const cwd = options?.cwd ?? process.cwd();
  const primary = resolveRunsDir({ cwd, override: options?.override });
  const legacyRepo = getRepoRunsDir(cwd);
  return dedupePaths([primary, legacyRepo]);
}

export function resolveExistingRunDir(
  runRef: string,
  options?: { cwd?: string; override?: string },
): string {
  const cwd = options?.cwd ?? process.cwd();
  const readableRoots = getReadableRunsDirs({ cwd, override: options?.override });
  const repoRoot = getRepoRoot(cwd);

  if (path.isAbsolute(runRef)) return path.resolve(runRef);

  const normalizedRef = runRef.replace(/\\/g, "/");
  const looksLikePath =
    normalizedRef.includes("/") ||
    normalizedRef.includes(".a5c/") ||
    normalizedRef === "." ||
    normalizedRef === "..";

  const candidates = looksLikePath
    ? dedupePaths([path.resolve(cwd, runRef), path.resolve(repoRoot, runRef)])
    : readableRoots.map((root) => path.join(root, runRef));

  for (const candidate of candidates) {
    if (isPresentPath(path.join(candidate, "run.json"))) return candidate;
  }
  return candidates[0];
}
