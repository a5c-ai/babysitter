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

export async function detectExistingRun(): Promise<ExistingRunInfo | undefined> {
  try {
    const runsDir = resolveRunsDir();
    const entries = await fs.readdir(runsDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort().reverse();
    for (const runId of dirs.slice(0, 5)) {
      const runFile = path.join(runsDir, runId, "run.json");
      try {
        const raw = await fs.readFile(runFile, "utf8");
        const meta = JSON.parse(raw) as Record<string, unknown>;
        const entrypoint = meta["entrypoint"] as { importPath?: string; exportName?: string } | undefined;
        const processId = (meta["processId"] as string) ?? "";
        const isBareRun = entrypoint?.importPath === "bare-run";
        return {
          runId,
          runDir: path.join(runsDir, runId),
          processId,
          isBareRun,
          entrypoint: { importPath: entrypoint?.importPath ?? "", exportName: entrypoint?.exportName },
          completionProof: meta["completionProof"] as string | undefined
            ?? (meta["metadata"] as Record<string, unknown> | undefined)?.["completionProof"] as string | undefined,
        };
      } catch { continue; }
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
