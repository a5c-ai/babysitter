/**
 * Cost data collector for Babysitter runs.
 *
 * Bridges the Claude Code JSONL parser with the run journal: parses a
 * session file (including subagent files), then writes COST_TRACKED events
 * to the run's journal for later aggregation and reporting.
 */

import * as path from "node:path";
import * as os from "node:os";
import { parseClaudeCodeSessionWithSubagents } from "./claudeCodeParser";
import { appendCostEvent } from "./journal";
import type { CostEventData } from "./types";

/**
 * Parse a Claude Code session (main + subagents) and write COST_TRACKED
 * events into the run journal.
 *
 * Each assistant message with usage data becomes a separate journal event,
 * preserving the full token breakdown for fine-grained cost analysis.
 *
 * @param runDir - Absolute path to the run directory (e.g. `.a5c/runs/<runId>`).
 * @param sessionJsonlPath - Absolute path to the main session `.jsonl` file.
 * @returns The number of COST_TRACKED events written to the journal.
 */
export async function collectCostDataForRun(
  runDir: string,
  sessionJsonlPath: string,
): Promise<number> {
  const events: CostEventData[] =
    await parseClaudeCodeSessionWithSubagents(sessionJsonlPath);

  let written = 0;
  for (const event of events) {
    await appendCostEvent(runDir, event);
    written += 1;
  }

  return written;
}

/**
 * Resolve the Claude Code projects directory path for a given session ID.
 *
 * Claude Code stores session JSONL files at:
 * ```
 * ~/.claude/projects/<project-slug>/<sessionId>.jsonl
 * ```
 *
 * Since we don't always know the project slug, this function returns the
 * base Claude Code projects directory. The caller can then search for the
 * session file within the project subdirectories.
 *
 * If a workspace path is provided, the project slug is derived using Claude
 * Code's path-encoding convention (forward slashes and colons replaced with
 * dashes, prefixed with the drive letter on Windows).
 *
 * @param sessionId - The Claude Code session UUID.
 * @param workspacePath - Optional absolute workspace path to derive the project slug.
 * @returns Absolute path to the session `.jsonl` file (when workspace is
 *   provided) or the Claude Code projects directory (when workspace is omitted).
 */
export function resolveClaudeCodeSessionDir(
  sessionId: string,
  workspacePath?: string,
): string {
  const homeDir = os.homedir();
  const projectsDir = path.join(homeDir, ".claude", "projects");

  if (!workspacePath) {
    return projectsDir;
  }

  // Claude Code encodes the workspace path as the project directory name.
  // On Windows: C:\Users\foo\project -> C--Users-foo-project
  //   The colon becomes a dash, backslashes become dashes (so :\ -> --)
  // On Unix: /home/foo/project -> -home-foo-project
  const projectSlug = workspacePath
    .replace(/\\/g, "/")       // Normalize to forward slashes.
    .replace(/\//g, "-")       // Replace path separators with dashes.
    .replace(/:/g, "-");       // Replace colons with dashes (Windows drive).

  return path.join(projectsDir, projectSlug, `${sessionId}.jsonl`);
}
