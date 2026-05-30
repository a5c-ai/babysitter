import * as path from "node:path";
import { existsSync } from "node:fs";
import { loadJournal } from "../../storage/journal";
import { readRunMetadata } from "../../storage/runFiles";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { deriveObservedRunState } from "../../runtime/runLifecycleState";
import { resolveCompletionProof } from "../../cli/completionProof";
import { resolveExistingRunDir } from "../../config";
import { countPendingByKind, isOnlyBreakpoints } from "./utils";

export interface HookRunStateSummary {
  runState: "" | "completed" | "halted" | "failed" | "waiting" | "created";
  completionProof: string;
  pendingKinds: string;
  onlyBreakpointsPending: boolean;
  currentPendingEffectId?: string;
}

function resolveRunDir(runId: string, runsDir: string, log?: { info(message: string): void }): string {
  const runDir = resolveExistingRunDir(runId, { override: runsDir });
  if (!existsSync(path.join(runDir, "run.json")) && !path.isAbsolute(runId)) {
    log?.info(`Run ${runId} was not found in the primary runs root; continuing with compatibility lookup result ${runDir}`);
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
    const pendingRecords = index.listPendingEffects();
    const runState = deriveObservedRunState(journal, pendingRecords.length);
    const pendingByKind = countPendingByKind(pendingRecords);
    const pendingKinds = Object.keys(pendingByKind).join(", ");
    const onlyBreakpointsPending =
      pendingRecords.length > 0 && isOnlyBreakpoints(pendingByKind);
    const currentPendingEffectId = pendingRecords
      .filter((record) => record.kind !== "breakpoint")
      .sort((left, right) =>
        (left.requestedAt ?? "").localeCompare(right.requestedAt ?? "")
        || left.effectId.localeCompare(right.effectId),
      )[0]?.effectId;

    if (runState === "completed") {
      return {
        runState,
        completionProof: resolveCompletionProof(metadata),
        pendingKinds,
        onlyBreakpointsPending,
        currentPendingEffectId,
      };
    }
    if (runState === "failed") {
      return {
        runState,
        completionProof: "",
        pendingKinds,
        onlyBreakpointsPending,
        currentPendingEffectId,
      };
    }
    if (runState === "waiting") {
      return {
        runState,
        completionProof: "",
        pendingKinds,
        onlyBreakpointsPending,
        currentPendingEffectId,
      };
    }

    return {
      runState,
      completionProof: "",
      pendingKinds,
      onlyBreakpointsPending,
      currentPendingEffectId,
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
