import * as path from "node:path";
import {
  countPendingEffectsFromJournal,
  deriveObservedRunState,
  isTerminalRunState,
} from "../../runtime/runLifecycleState";
import { loadJournal } from "../../storage/journal";
import { readRunMetadata } from "../../storage/runFiles";
import type { RunMetadata } from "../../storage/types";
import { getSessionFilePath, readSessionFile } from "../../session/parse";

export interface AdoptableSessionRun {
  runId: string;
  runDir: string;
  metadata: RunMetadata;
}

/**
 * Find the active bare run created for the current session.
 *
 * Adoption is intentionally conservative: explicit run IDs, terminal runs,
 * assigned runs, cross-project runs, and runs from another harness are left
 * alone so callers retain the old create-a-new-run behavior.
 */
export async function findAdoptableSessionRun(options: {
  runsDir: string;
  stateDir?: string;
  sessionId?: string;
  runIdOverride?: string;
  harness?: string;
}): Promise<AdoptableSessionRun | undefined> {
  if (!options.stateDir || !options.sessionId || options.runIdOverride) return undefined;

  let session;
  try {
    session = await readSessionFile(getSessionFilePath(options.stateDir, options.sessionId));
  } catch {
    return undefined;
  }
  if (!session.state.active || !session.state.runId) return undefined;

  const runsDir = path.resolve(options.runsDir);
  const runId = session.state.runId;
  const expectedRunDir = path.resolve(path.join(runsDir, runId));
  const runDir = path.resolve(session.state.runDir ?? expectedRunDir);
  if (runDir !== expectedRunDir) return undefined;

  let metadata: RunMetadata;
  try {
    metadata = await readRunMetadata(runDir);
  } catch {
    return undefined;
  }
  if (metadata.runId !== runId || metadata.entrypoint.importPath !== "bare-run") return undefined;
  if (options.harness && metadata.harness && metadata.harness !== options.harness) return undefined;
  if (metadata.cwd && path.resolve(metadata.cwd) !== path.resolve(process.cwd())) return undefined;

  let journal;
  try {
    journal = await loadJournal(runDir);
  } catch {
    return undefined;
  }
  if (journal.some((event) => event.type === "PROCESS_ASSIGNED")) return undefined;
  const sessionIds = journal
    .map((event) => event.data.sessionId)
    .filter((value): value is string => typeof value === "string");
  if (sessionIds.some((value) => value !== options.sessionId)) return undefined;
  if (isTerminalRunState(deriveObservedRunState(journal, countPendingEffectsFromJournal(journal)))) {
    return undefined;
  }

  return { runId, runDir, metadata };
}

export function resolveAdoptionStateDir(options: {
  adapter?: { resolveStateDir(args: { stateDir?: string; pluginRoot?: string }): string | undefined } | null;
  stateDir?: string;
  pluginRoot?: string;
}): string | undefined {
  return options.adapter?.resolveStateDir({
    stateDir: options.stateDir,
    pluginRoot: options.pluginRoot,
  });
}
