/**
 * tui command -- stub redirecting to adapters TUI with babysitter plugins.
 *
 * The genty dashboard uses the adapters TUI
 * with babysitter-tui-plugins instead (packages/genty/tui-plugins/).
 *
 * `babysitter tui --json` still works as a non-interactive JSON fallback
 * for run listing / detail inspection.
 */

import * as path from "node:path";
import { promises as fs } from "node:fs";
import { readRunMetadata } from "@a5c-ai/genty-platform/storage";
import { loadJournalEvents } from "@a5c-ai/genty-platform/orchestration";

function getRunDir(runsRoot: string, runId: string): string {
  return path.join(runsRoot, runId);
}

/**
 * Lightweight effect summary extracted from journal events.
 * Replaces the SDK's full EffectIndex for TUI display purposes.
 */
interface EffectSummary {
  effectId: string;
  kind: string;
  status: "pending" | "completed" | "running";
  title: string;
}

/**
 * Build a flat effect list from journal events for JSON display.
 * This replaces the SDK's `buildEffectIndex` with a purpose-built
 * lightweight version that only extracts what the TUI JSON mode needs.
 */
function buildEffectSummaries(events: Array<{ type: string; data: Record<string, unknown> }>): EffectSummary[] {
  const requested = new Map<string, { kind: string; taskId?: string }>();
  const resolved = new Set<string>();

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const effectId = event.data.effectId as string | undefined;
      if (effectId) {
        requested.set(effectId, {
          kind: (event.data.kind as string) ?? "unknown",
          taskId: event.data.taskId as string | undefined,
        });
      }
    } else if (event.type === "EFFECT_RESOLVED" || event.type === "EFFECT_CANCELLED") {
      const effectId = event.data.effectId as string | undefined;
      if (effectId) resolved.add(effectId);
    }
  }

  const summaries: EffectSummary[] = [];
  for (const [effectId, info] of requested) {
    summaries.push({
      effectId,
      kind: info.kind,
      status: resolved.has(effectId) ? "completed" : "pending",
      title: info.taskId ?? effectId,
    });
  }
  return summaries;
}

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
      let journal: Array<{ type: string; recordedAt: string; seq: number; data: Record<string, unknown> }> = [];
      try {
        journal = await loadJournalEvents(runDir) as Array<{ type: string; recordedAt: string; seq: number; data: Record<string, unknown> }>;
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
      const journal = await loadJournalEvents(runDir);

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

      const effects = buildEffectSummaries(
        journal as Array<{ type: string; data: Record<string, unknown> }>,
      );

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

  // Interactive TUI: redirect to adapters TUI
  console.error(
    "The genty TUI delegates to adapters.\n" +
    "Use adapters TUI with babysitter plugins instead:\n" +
    "  npx adapters tui --workspace .\n" +
    "\n" +
    "For non-interactive run listing, use: genty tui --json"
  );
  return 1;
}
