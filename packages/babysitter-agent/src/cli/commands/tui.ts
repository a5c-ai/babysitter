/**
 * tui command -- stub redirecting to agent-mux TUI with babysitter plugins.
 *
 * The babysitter-agent dashboard has been removed. Use the agent-mux TUI
 * with babysitter-tui-plugins instead (packages/babysitter-tui-plugins/).
 *
 * `babysitter tui --json` still works as a non-interactive JSON fallback
 * for run listing / detail inspection.
 */

import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  readRunMetadata,
  loadJournal,
  getRunDir,
  buildEffectIndex,
} from "@a5c-ai/babysitter-sdk";

interface TuiArgs {
  runsDir: string;
  json?: boolean;
  verbose?: boolean;
  positional?: string[];
  harness?: string;
  workspace?: string;
  prompt?: string;
  runId?: string;
  verbosity?: string;
}

// ---------------------------------------------------------------------------
// JSON mode (non-interactive fallback -- retained)
// ---------------------------------------------------------------------------

interface RunSummary {
  runId: string;
  state: string;
  processId: string;
  createdAt: string;
  eventCount: number;
  pendingCount: number;
  prompt?: string;
}

async function scanRunsForJson(runsDir: string): Promise<RunSummary[]> {
  const resolvedDir = path.resolve(runsDir);
  let entries: string[];
  try {
    entries = await fs.readdir(resolvedDir);
  } catch {
    return [];
  }

  const summaries: RunSummary[] = [];

  for (const entry of entries) {
    const runDir = path.join(resolvedDir, entry);
    const metadataPath = path.join(runDir, "run.json");
    try {
      await fs.access(metadataPath);
    } catch {
      continue;
    }

    try {
      const metadata = await readRunMetadata(runDir);
      let journal: Array<{ type: string; recordedAt: string; seq: number }> = [];
      try {
        journal = await loadJournal(runDir);
      } catch {
        // Journal may not exist yet
      }

      const lastLifecycleType = [...journal].reverse().find(
        (e) => e.type === "RUN_COMPLETED" || e.type === "RUN_FAILED"
      )?.type;
      const pendingCount = journal.filter((e) => e.type === "EFFECT_REQUESTED").length
        - journal.filter((e) => e.type === "EFFECT_RESOLVED").length;

      let state: string;
      if (lastLifecycleType === "RUN_COMPLETED") state = "completed";
      else if (lastLifecycleType === "RUN_FAILED") state = "failed";
      else if (pendingCount > 0) state = "waiting";
      else state = "created";

      summaries.push({
        runId: metadata.runId ?? entry,
        state,
        processId: metadata.processId ?? "unknown",
        createdAt: metadata.createdAt ?? "",
        eventCount: journal.length,
        pendingCount: Math.max(0, pendingCount),
        prompt: (metadata as Record<string, unknown>).prompt as string | undefined,
      });
    } catch {
      // Skip malformed runs
    }
  }

  summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return summaries;
}

async function handleJsonMode(args: TuiArgs): Promise<number> {
  const runIdArg = args.runId ?? args.positional?.[0];
  if (runIdArg) {
    const runDir = getRunDir(args.runsDir, runIdArg);
    try {
      const metadata = await readRunMetadata(runDir);
      const journal = await loadJournal(runDir);
      const index = await buildEffectIndex({ runDir, events: journal });

      const lastLifecycleType = [...journal].reverse().find(
        (e) => e.type === "RUN_COMPLETED" || e.type === "RUN_FAILED"
      )?.type;
      const pendingCount = journal.filter((e) => e.type === "EFFECT_REQUESTED").length
        - journal.filter((e) => e.type === "EFFECT_RESOLVED").length;

      let state: string;
      if (lastLifecycleType === "RUN_COMPLETED") state = "completed";
      else if (lastLifecycleType === "RUN_FAILED") state = "failed";
      else if (pendingCount > 0) state = "waiting";
      else state = "created";

      const allEffects = index.listEffects();
      const effects = allEffects.map((rec) => ({
        effectId: rec.effectId,
        kind: rec.kind ?? "unknown",
        status: rec.status === "resolved_ok" || rec.status === "resolved_error"
          ? "completed" : rec.status === "requested" ? "pending" : "running",
        title: rec.taskId ?? rec.effectId,
      }));

      console.log(JSON.stringify({
        runId: runIdArg,
        state,
        processId: metadata.processId,
        createdAt: metadata.createdAt,
        events: journal.map((e) => ({
          type: e.type,
          recordedAt: e.recordedAt,
          seq: e.seq,
        })),
        effects,
        pendingCount: Math.max(0, pendingCount),
      }, null, 2));
    } catch (err) {
      console.error(`[tui] unable to read run ${runIdArg}: ${(err as Error).message}`);
      return 1;
    }
    return 0;
  }

  const runs = await scanRunsForJson(args.runsDir);
  console.log(JSON.stringify({
    runs: runs.map((r) => ({
      runId: r.runId,
      state: r.state,
      processId: r.processId,
      createdAt: r.createdAt,
      eventCount: r.eventCount,
      pendingCount: r.pendingCount,
      prompt: r.prompt,
    })),
  }, null, 2));
  return 0;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function handleTui(args: TuiArgs): Promise<number> {
  // JSON mode: non-interactive listing (retained for backward compat)
  if (args.json) {
    return handleJsonMode(args);
  }

  // Interactive TUI: redirect to agent-mux TUI
  console.error(
    "The babysitter-agent TUI has been removed.\n" +
    "Use agent-mux TUI with babysitter plugins instead:\n" +
    "  npx agent-mux tui --workspace .\n" +
    "\n" +
    "For non-interactive run listing, use: babysitter-agent tui --json"
  );
  return 1;
}
