/** Session recovery helpers extracted from stopHookHandler. */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { DEFAULTS, getReadableRunsDirs } from "../../config";
import { getSessionFilePath } from "../../session/parse";
import type { SessionState } from "../../session/types";
import { getCurrentTimestamp, writeSessionFile } from "../../session/write";
import {
  countPendingEffectsFromJournal,
  deriveObservedRunState,
  isTerminalRunState,
} from "../../runtime/runLifecycleState";
import { loadJournal } from "../../storage/journal";
import { readRunMetadata } from "../../storage/runFiles";
import type { HookLogger } from "./utils";

interface MissingSessionRunCandidate {
  runId: string;
  runDir: string;
  runState: string;
  prompt: string;
}

export interface MissingSessionRecoveryResult {
  status: "recovered" | "none" | "ambiguous" | "error";
  sessionId: string;
  filePath: string;
  message?: string;
}

export async function findMissingSessionRunCandidates(
  args: {
    sessionId: string;
    runsDir: string;
    harness: string;
  },
): Promise<MissingSessionRunCandidate[]> {
  const roots = getReadableRunsDirs({ override: args.runsDir });
  const candidates: MissingSessionRunCandidate[] = [];

  for (const root of roots) {
    let entries: Array<{ name: string; isDirectory(): boolean }>;
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const runDir = path.join(root, entry.name);
      let metadata: Awaited<ReturnType<typeof readRunMetadata>>;
      try {
        metadata = await readRunMetadata(runDir);
      } catch {
        continue;
      }

      let journal;
      try {
        journal = await loadJournal(runDir);
      } catch {
        continue;
      }

      const matchesSession = journal.some((event) => {
        const data = event.data as Record<string, unknown> | undefined;
        const eventSessionId = typeof data?.sessionId === "string" ? data.sessionId : "";
        if (eventSessionId !== args.sessionId) return false;
        const eventHarness = typeof data?.harness === "string" ? data.harness : "";
        return !eventHarness || eventHarness === args.harness;
      });
      if (!matchesSession) continue;

      const runState = deriveObservedRunState(journal, countPendingEffectsFromJournal(journal));
      if (isTerminalRunState(runState)) continue;

      candidates.push({
        runId: metadata.runId || entry.name,
        runDir,
        runState,
        prompt: typeof metadata.prompt === "string" ? metadata.prompt : "",
      });
    }
  }

  return candidates;
}

export async function recoverMissingSessionFile(
  args: {
    sessionId: string;
    stateDir: string;
    runsDir: string;
    harness: string;
    log: HookLogger;
  },
): Promise<MissingSessionRecoveryResult> {
  const filePath = getSessionFilePath(args.stateDir, args.sessionId);
  const candidates = await findMissingSessionRunCandidates({
    sessionId: args.sessionId,
    runsDir: args.runsDir,
    harness: args.harness,
  });

  if (candidates.length === 0) {
    return { status: "none", sessionId: args.sessionId, filePath };
  }

  if (candidates.length > 1) {
    const runIds = candidates.map((candidate) => candidate.runId).join(", ");
    return {
      status: "ambiguous",
      sessionId: args.sessionId,
      filePath,
      message: `Multiple active runs found for missing session ${args.sessionId}: ${runIds}`,
    };
  }

  const candidate = candidates[0];
  const nowTs = getCurrentTimestamp();
  const recoveredState: SessionState = {
    active: true,
    iteration: 1,
    maxIterations: DEFAULTS.maxIterations,
    runId: candidate.runId,
    runDir: candidate.runDir,
    runIds: [candidate.runId],
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
    metadata: {
      recoveredFromMissingSessionFile: "true",
      missingSessionRecoveredAt: nowTs,
      missingSessionRecoverySource: "stop-hook",
      missingSessionRecoveryRunState: candidate.runState,
    },
  };

  try {
    await writeSessionFile(filePath, recoveredState, candidate.prompt);
    args.log.info(`Recovered missing session state file for run ${candidate.runId}: ${filePath}`);
    return { status: "recovered", sessionId: args.sessionId, filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      sessionId: args.sessionId,
      filePath,
      message: `Failed to recover missing session ${args.sessionId}: ${message}`,
    };
  }
}

export async function recoverFirstMissingSession(
  args: {
    sessionIds: string[];
    stateDir: string;
    runsDir: string;
    harness: string;
    log: HookLogger;
  },
): Promise<MissingSessionRecoveryResult> {
  let firstNone: MissingSessionRecoveryResult | undefined;
  for (const sessionId of args.sessionIds) {
    const result = await recoverMissingSessionFile({
      sessionId,
      stateDir: args.stateDir,
      runsDir: args.runsDir,
      harness: args.harness,
      log: args.log,
    });
    if (result.status === "recovered" || result.status === "ambiguous" || result.status === "error") {
      return result;
    }
    firstNone ??= result;
  }
  return firstNone ?? {
    status: "none",
    sessionId: args.sessionIds[0] ?? "",
    filePath: "",
  };
}
