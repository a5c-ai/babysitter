import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveRunsDir } from "../../config";

export interface ExistingRunInfo {
  runId: string;
  runDir: string;
  processId: string;
  isBareRun: boolean;
  entrypoint: { importPath: string; exportName?: string };
  completionProof?: string;
}

/**
 * How many of the most-recent runs to inspect. Because we now skip completed
 * and cross-project runs, the first parseable match may not be the very latest
 * directory, so we scan a window rather than only the top entry.
 */
const SCAN_WINDOW = 25;

export async function detectExistingRun(): Promise<ExistingRunInfo | undefined> {
  try {
    const runsDir = resolveRunsDir();
    const currentCwd = path.resolve(process.cwd());
    const entries = await fs.readdir(runsDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort().reverse();
    for (const runId of dirs.slice(0, SCAN_WINDOW)) {
      const runFile = path.join(runsDir, runId, "run.json");
      let meta: Record<string, unknown>;
      try {
        meta = JSON.parse(await fs.readFile(runFile, "utf8")) as Record<string, unknown>;
      } catch { continue; }

      // A run that already carries a completion proof is finished — it is never
      // an "existing run to resume", so it must not be surfaced as overlap state.
      const completionProof = (meta["completionProof"] as string | undefined)
        ?? ((meta["metadata"] as Record<string, unknown> | undefined)?.["completionProof"] as string | undefined);
      if (completionProof) continue;

      // Project scoping: when the run recorded the cwd it was created in, only
      // surface it if that matches the current working directory. Runs from
      // other projects/worktrees share the global runs dir and must not leak in.
      const recordedCwd = meta["cwd"] as string | undefined;
      if (recordedCwd && path.resolve(recordedCwd) !== currentCwd) continue;

      const entrypoint = meta["entrypoint"] as { importPath?: string; exportName?: string } | undefined;
      const processId = (meta["processId"] as string) ?? "";
      const isBareRun = entrypoint?.importPath === "bare-run";
      return {
        runId,
        runDir: path.join(runsDir, runId),
        processId,
        isBareRun,
        entrypoint: { importPath: entrypoint?.importPath ?? "", exportName: entrypoint?.exportName },
      };
    }
  } catch { /* no runs dir */ }
  return undefined;
}

export function formatExistingRunBlock(existingRun: ExistingRunInfo): string {
  return [
    '## Existing Run State',
    '',
    `- Run ID: \`${existingRun.runId}\``,
    `- Run Dir: \`${existingRun.runDir}\``,
    `- Process ID: \`${existingRun.processId}\``,
    `- Bare Run: \`${existingRun.isBareRun}\``,
    `- Entrypoint: \`${existingRun.entrypoint.importPath}${existingRun.entrypoint.exportName ? '#' + existingRun.entrypoint.exportName : ''}\``,
    '',
    existingRun.isBareRun
      ? `**This is a bare run.** Use \`run:assign-process ${existingRun.runDir} --entry <path>#<export>\` to assign a process before iterating.`
      : `This run already has a process assigned. Use \`run:iterate ${existingRun.runDir} --json\` to continue.`,
    '',
    '---',
    '',
  ].join('\n');
}
