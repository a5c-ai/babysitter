/**
 * Discovery of BABYSITTER.md files from a starting directory up to the git repo root.
 *
 * Walks the directory hierarchy upward, collecting BABYSITTER.md files (case-insensitive)
 * at each level, and returns them sorted from repo root to leaf.
 *
 * @module prompts/babysitterMdDiscovery
 */

import * as fs from "fs";
import * as path from "path";

/** A discovered BABYSITTER.md file with its content and location metadata. */
export interface BabysitterMdFile {
  /** Absolute file path */
  filePath: string;
  /** Content of the file */
  content: string;
  /** Path relative to the repo root (forward-slash separated) */
  relativePath: string;
}

/**
 * Finds the git repository root by walking upward from `startDir` looking for
 * a `.git` directory or file.
 *
 * @param startDir - The directory to start searching from.
 * @returns The absolute path to the repo root, or `undefined` if not inside a git repo.
 */
export function findGitRoot(startDir: string): string | undefined {
  let current = path.resolve(startDir);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const gitPath = path.join(current, ".git");
      const stat = fs.statSync(gitPath);
      // .git can be a directory (normal repo) or a file (worktree/submodule)
      if (stat.isDirectory() || stat.isFile()) {
        return current;
      }
    } catch {
      // .git not found at this level — keep walking up
    }

    const parent = path.dirname(current);
    if (parent === current) {
      // Reached filesystem root without finding .git
      return undefined;
    }
    current = parent;
  }
}

/**
 * Discovers BABYSITTER.md files from `startDir` upward to the git repo root.
 *
 * At each directory level the function reads directory entries and performs a
 * case-insensitive match against "babysitter.md". Results are returned sorted
 * from repo root to leaf (outermost first).
 *
 * @param startDir - The directory to start searching from. Defaults to `process.cwd()`.
 * @returns An array of discovered files sorted root-to-leaf, or an empty array
 *   if not inside a git repo or no files are found.
 */
export function discoverBabysitterMdFiles(startDir?: string): BabysitterMdFile[] {
  const resolvedStart = path.resolve(startDir ?? process.cwd());
  const repoRoot = findGitRoot(resolvedStart);

  if (repoRoot === undefined) {
    return [];
  }

  const found: BabysitterMdFile[] = [];
  let current = path.resolve(resolvedStart);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const match = findBabysitterMdInDir(current);
    if (match !== undefined) {
      const rel = path.relative(repoRoot, match);
      // Normalize to forward slashes for cross-platform consistency
      const relativePath = rel.split(path.sep).join("/");
      try {
        const content = fs.readFileSync(match, "utf-8");
        found.push({ filePath: match, content, relativePath });
      } catch {
        // File couldn't be read — skip it
      }
    }

    // Stop after processing the repo root
    if (normalizePath(current) === normalizePath(repoRoot)) {
      break;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      // Reached filesystem root without hitting repo root (shouldn't happen
      // since we verified repoRoot is an ancestor, but guard anyway)
      break;
    }
    current = parent;
  }

  // Reverse so repo root comes first (we collected leaf-to-root)
  found.reverse();
  return found;
}

/**
 * Looks for a BABYSITTER.md file (case-insensitive) in the given directory.
 *
 * @returns The absolute path to the matched file, or `undefined` if not found.
 */
function findBabysitterMdInDir(dir: string): string | undefined {
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry.toLowerCase() === "babysitter.md") {
        return path.join(dir, entry);
      }
    }
  } catch {
    // Directory unreadable — skip
  }
  return undefined;
}

/** Normalizes a path for reliable comparison (resolves case, trailing separators). */
function normalizePath(p: string): string {
  return path.resolve(p).toLowerCase();
}
