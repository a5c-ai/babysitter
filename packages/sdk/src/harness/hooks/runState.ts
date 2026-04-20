import * as path from "node:path";
import { existsSync } from "node:fs";
import { loadJournal } from "../../storage/journal";
import { readRunMetadata } from "../../storage/runFiles";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { resolveCompletionProof } from "../../cli/completionProof";
import { countPendingByKind, isOnlyBreakpoints } from "./utils";

export interface HookRunStateSummary {
  runState: "" | "completed" | "failed" | "waiting" | "created";
  completionProof: string;
  pendingKinds: string;
  onlyBreakpointsPending: boolean;
}

function resolveRunDir(runId: string, runsDir: string, log?: { info(message: string): void }): string {
  let runDir = path.isAbsolute(runId) ? runId : path.join(runsDir, runId);
  if (!existsSync(path.join(runDir, "run.json")) && !path.isAbsolute(runId)) {
    const alternatives = [
      path.join(".a5c", ".a5c", "runs", runId),
      path.join(".a5c", "runs", runId),
    ];
    for (const candidate of alternatives) {
      const resolved = path.resolve(candidate);
      if (
        resolved !== path.resolve(runDir) &&
        existsSync(path.join(resolved, "run.json"))
      ) {
        log?.info(`Run not found at ${runDir}, using fallback: ${resolved}`);
        runDir = resolved;
        break;
      }
    }
  }
  return runDir;
}

export async function resolveHookRunState(args: {
  runId: string;
  runsDir: string;
  log?: { info(message: string): void };
}): Promise<HookRunStateSummary> {
  try {
    const runDir = resolveRunDir(args.runId, args.runsDir, args.log);
    const metadata = await readRunMetadata(runDir);
    const journal = await loadJournal(runDir);
    const index = await buildEffectIndex({ runDir, events: journal });
    const hasCompleted = journal.some((event) => event.type === "RUN_COMPLETED");
    const hasFailed = journal.some((event) => event.type === "RUN_FAILED");
    const pendingRecords = index.listPendingEffects();
    const pendingByKind = countPendingByKind(pendingRecords);
    const pendingKinds = Object.keys(pendingByKind).join(", ");
    const onlyBreakpointsPending =
      pendingRecords.length > 0 && isOnlyBreakpoints(pendingByKind);

    if (hasCompleted) {
      return {
        runState: "completed",
        completionProof: resolveCompletionProof(metadata),
        pendingKinds,
        onlyBreakpointsPending,
      };
    }
    if (hasFailed) {
      return {
        runState: "failed",
        completionProof: "",
        pendingKinds,
        onlyBreakpointsPending,
      };
    }
    if (pendingRecords.length > 0) {
      return {
        runState: "waiting",
        completionProof: "",
        pendingKinds,
        onlyBreakpointsPending,
      };
    }

    return {
      runState: "created",
      completionProof: "",
      pendingKinds,
      onlyBreakpointsPending,
    };
  } catch {
    return {
      runState: "",
      completionProof: "",
      pendingKinds: "",
      onlyBreakpointsPending: false,
    };
  }
}
