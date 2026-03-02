import * as path from "node:path";
import { existsSync } from "node:fs";

/**
 * Collapse doubled ".a5c/runs" segments in a path.
 *
 * When a relative path containing `.a5c/runs/...` is resolved from a working
 * directory that is itself inside `.a5c/runs/`, the result can contain the
 * segment twice (or more). This function collapses all consecutive duplications
 * into a single occurrence.
 *
 * Handles both forward-slash (Unix) and back-slash (Windows) separators as
 * well as mixed-separator paths.
 *
 * @example
 * collapseDoubledA5cRuns("/project/.a5c/runs/.a5c/runs/01RUN")
 * // => "/project/.a5c/runs/01RUN"
 *
 * @example
 * collapseDoubledA5cRuns("C:\\project\\.a5c\\runs\\.a5c\\runs\\01RUN")
 * // => "C:\\project\\.a5c\\runs\\01RUN"
 */
export function collapseDoubledA5cRuns(p: string): string {
  // Match both forward and back-slash variants
  const pattern = /([/\\]?\.a5c[/\\]runs)[/\\]\.a5c[/\\]runs([/\\]|$)/;
  let result = p;
  // Collapse repeatedly in case of triple+ duplication
  while (pattern.test(result)) {
    result = result.replace(pattern, "$1$2");
  }
  return result;
}

/**
 * Detect whether the given directory path sits inside a `.a5c/runs` subtree.
 *
 * Uses a platform-aware regex that matches both `/` and `\` separators so
 * the check works on Windows as well as Unix.
 */
function isInsideA5cRuns(dir: string): boolean {
  const normalized = dir.replace(/\\/g, "/");
  return /[/]\.a5c[/]runs[/]/.test(normalized + "/");
}

/**
 * Given a directory that is known to be inside `.a5c/runs/`, walk up the
 * path to find the project root — i.e. the directory that **contains** the
 * `.a5c` folder.
 *
 * The algorithm splits on the first `.a5c/runs` segment and returns the
 * parent of `.a5c`. If no `.a5c` directory can be found on disk the
 * function falls back to the split-based heuristic.
 *
 * @returns The project root directory, or `undefined` if it cannot be
 *          determined.
 */
function findProjectRoot(dir: string): string | undefined {
  // Normalize to forward slashes for splitting, but preserve original for
  // path operations so we stay platform-correct.
  const normalized = dir.replace(/\\/g, "/");

  // Find the first occurrence of .a5c/runs (or .a5c\runs on Windows)
  const marker = ".a5c/runs";
  const idx = normalized.indexOf(marker);
  if (idx === -1) return undefined;

  // The project root is the directory containing .a5c — everything before
  // the `.a5c` segment.
  const candidate = dir.substring(0, idx === 0 ? 0 : idx).replace(/[/\\]+$/, "");

  if (candidate.length === 0) {
    // Edge case: path starts with .a5c/runs (pure relative from project root)
    return undefined;
  }

  // Sanity check: the candidate should contain a .a5c directory
  const a5cDir = path.join(candidate, ".a5c");
  try {
    if (existsSync(a5cDir)) {
      return candidate;
    }
  } catch {
    // Filesystem check failed — fall through to heuristic
  }

  // Return the candidate even if we can't verify via filesystem —
  // the substring heuristic is reliable when the path truly contains
  // .a5c/runs.
  return candidate;
}

/**
 * Resolve an input file path robustly, accounting for the CLI being invoked
 * from inside a task directory (or any subdirectory of `.a5c/runs/`).
 *
 * The standard `path.resolve(inputPath)` resolves relative to
 * `process.cwd()`. When the working directory is a task directory such as
 * `/project/.a5c/runs/RUN/tasks/TASK/`, resolving a relative path like
 * `.a5c/runs/RUN/tasks/EFFECT/file.json` produces a doubled path:
 * `/project/.a5c/runs/RUN/tasks/TASK/.a5c/runs/RUN/tasks/EFFECT/file.json`
 *
 * This function detects that situation and resolves relative to the project
 * root instead.
 *
 * **Resolution rules (in order):**
 * 1. `"-"` (stdin sentinel) — returned as-is.
 * 2. Absolute paths (including Windows drive letters like `C:\`) — normalized
 *    and returned.
 * 3. If `inputPath` contains a `.a5c/runs` segment **and** the current
 *    working directory is itself inside a `.a5c/runs` subtree — resolve
 *    relative to the detected project root.
 * 4. Otherwise — standard `path.resolve(inputPath)`.
 * 5. `collapseDoubledA5cRuns` is always applied as a final safety net.
 *
 * @param inputPath  The raw path argument supplied by the user or script.
 * @returns          A fully resolved, absolute path (or `"-"` for stdin).
 *
 * @example
 * // CWD = /project/.a5c/runs/RUN/tasks/TASK
 * resolveInputPath(".a5c/runs/RUN/tasks/EFFECT/input.json")
 * // => "/project/.a5c/runs/RUN/tasks/EFFECT/input.json"
 *
 * @example
 * resolveInputPath("/absolute/path/to/file.json")
 * // => "/absolute/path/to/file.json"
 *
 * @example
 * resolveInputPath("-")
 * // => "-"
 */
export function resolveInputPath(inputPath: string): string {
  // 1. Stdin sentinel — pass through unchanged
  if (inputPath === "-") {
    return inputPath;
  }

  // 2. Absolute path (Unix or Windows drive letter) — normalize and return
  if (path.isAbsolute(inputPath) || /^[A-Za-z]:[\\/]/.test(inputPath)) {
    return collapseDoubledA5cRuns(path.normalize(inputPath));
  }

  // 3. Smart resolution when both inputPath and CWD are inside .a5c/runs
  const inputNormalized = inputPath.replace(/\\/g, "/");
  const hasA5cRuns =
    inputNormalized.includes(".a5c/runs") ||
    inputPath.includes(".a5c\\runs");

  if (hasA5cRuns) {
    const cwd = process.cwd();
    if (isInsideA5cRuns(cwd)) {
      const projectRoot = findProjectRoot(cwd);
      if (projectRoot) {
        const resolved = path.resolve(projectRoot, inputPath);
        return collapseDoubledA5cRuns(resolved);
      }
    }
  }

  // 4. Standard resolution relative to CWD
  const resolved = path.resolve(inputPath);
  // 5. Safety net — collapse any accidental doubling
  return collapseDoubledA5cRuns(resolved);
}
