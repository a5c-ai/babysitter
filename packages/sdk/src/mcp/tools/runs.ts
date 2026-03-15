import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createRun,
  orchestrateIteration,
} from "../../runtime";
import {
  loadJournal,
  readRunMetadata,
} from "../../storage";
import { rebuildStateCache } from "../../runtime/replay/stateCache";
import type { JournalEvent } from "../../storage/types";
import { toolResult, toolError } from "../util/errors";
import { resolveRunDir } from "../util/resolve-run-dir";

/**
 * Parse an entrypoint specifier like "path/to/file.js#exportName" into its parts.
 */
function parseEntrypoint(entrypoint: string): { importPath: string; exportName?: string } {
  const hashIndex = entrypoint.lastIndexOf("#");
  if (hashIndex <= 0) {
    return { importPath: entrypoint };
  }
  const importPath = entrypoint.slice(0, hashIndex);
  const exportName = entrypoint.slice(hashIndex + 1) || undefined;
  return { importPath, exportName };
}

const RUN_LIFECYCLE_TYPES = new Set(["RUN_CREATED", "RUN_COMPLETED", "RUN_FAILED"]);

function findLastLifecycleEvent(events: JournalEvent[]): JournalEvent | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    if (RUN_LIFECYCLE_TYPES.has(events[i].type)) {
      return events[i];
    }
  }
  return undefined;
}

function deriveRunState(
  lastLifecycleEventType: string | undefined,
  pendingCount: number
): string {
  if (lastLifecycleEventType === "RUN_COMPLETED") return "completed";
  if (lastLifecycleEventType === "RUN_FAILED") return "failed";
  if (pendingCount > 0) return "waiting";
  return "created";
}

function countPendingEffects(events: JournalEvent[]): {
  pendingEffects: Array<{ effectId: string; kind: string; label?: string }>;
  pendingByKind: Record<string, number>;
} {
  const requested = new Map<string, { effectId: string; kind: string; label?: string }>();
  const resolved = new Set<string>();

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const data = event.data as { effectId?: string; kind?: string; label?: string };
      if (data.effectId) {
        requested.set(data.effectId, {
          effectId: data.effectId,
          kind: data.kind ?? "unknown",
          label: data.label,
        });
      }
    } else if (event.type === "EFFECT_RESOLVED") {
      const data = event.data as { effectId?: string };
      if (data.effectId) {
        resolved.add(data.effectId);
      }
    }
  }

  const pendingEffects: Array<{ effectId: string; kind: string; label?: string }> = [];
  const pendingByKind: Record<string, number> = {};

  for (const [effectId, info] of requested) {
    if (!resolved.has(effectId)) {
      pendingEffects.push(info);
      pendingByKind[info.kind] = (pendingByKind[info.kind] ?? 0) + 1;
    }
  }

  return { pendingEffects, pendingByKind };
}

export function registerRunTools(server: McpServer): void {
  // ── run_create ──────────────────────────────────────────────────────
  server.tool(
    "run_create",
    "Create a new babysitter run for a given process definition",
    {
      processId: z.string().describe("The process identifier to run"),
      entrypoint: z.string().describe("Path to the process JS entrypoint file (optionally path#exportName)"),
      inputs: z.string().optional().describe("JSON-encoded inputs for the process"),
      runsDir: z.string().optional().describe("Override runs directory path"),
      prompt: z.string().optional().describe("Prompt or description for the run"),
    },
    async (args) => {
      try {
        const { importPath, exportName } = parseEntrypoint(args.entrypoint);
        const absoluteImportPath = path.resolve(importPath);
        const runsDir = resolveRunDir(args.runsDir);

        let inputs: unknown;
        if (args.inputs) {
          try {
            inputs = JSON.parse(args.inputs);
          } catch {
            return toolError("Invalid JSON in inputs parameter");
          }
        }

        const result = await createRun({
          runsDir,
          process: {
            processId: args.processId,
            importPath: absoluteImportPath,
            exportName,
          },
          prompt: args.prompt,
          inputs,
        });

        return toolResult({
          runId: result.runId,
          runDir: result.runDir,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── run_status ──────────────────────────────────────────────────────
  server.tool(
    "run_status",
    "Get the current status and metadata of a run",
    {
      runId: z.string().describe("The run ID to query"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        const metadata = await readRunMetadata(runDir);
        const journal = await loadJournal(runDir);

        const lastLifecycleEvent = findLastLifecycleEvent(journal);
        const { pendingEffects, pendingByKind } = countPendingEffects(journal);
        const state = deriveRunState(lastLifecycleEvent?.type, pendingEffects.length);

        const completionProof = state === "completed" ? metadata.completionProof : undefined;

        return toolResult({
          runId: metadata.runId,
          processId: metadata.processId,
          state,
          pendingEffects,
          pendingByKind,
          completionProof: completionProof ?? null,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── run_iterate ─────────────────────────────────────────────────────
  server.tool(
    "run_iterate",
    "Execute one orchestration iteration for a run",
    {
      runId: z.string().describe("The run ID to iterate"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        const result = await orchestrateIteration({ runDir });

        if (result.status === "completed") {
          const metadata = await readRunMetadata(runDir);
          const completionProof = metadata.completionProof ?? null;
          return toolResult({
            status: "completed",
            output: result.output,
            completionProof,
            metadata: result.metadata,
          });
        }

        if (result.status === "failed") {
          return toolResult({
            status: "failed",
            error: result.error instanceof Error ? result.error.message : result.error,
            metadata: result.metadata,
          });
        }

        // status === "waiting"
        return toolResult({
          status: "waiting",
          nextActions: result.nextActions.map((action) => ({
            effectId: action.effectId,
            kind: action.kind,
            label: action.label,
            labels: action.labels,
            taskId: action.taskId,
            stepId: action.stepId,
          })),
          metadata: result.metadata,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── run_events ──────────────────────────────────────────────────────
  server.tool(
    "run_events",
    "List journal events for a run",
    {
      runId: z.string().describe("The run ID to query"),
      runsDir: z.string().optional().describe("Override runs directory path"),
      limit: z.number().optional().describe("Maximum number of events to return"),
      filterType: z.string().optional().describe("Filter events by type (e.g. EFFECT_REQUESTED)"),
      reverse: z.boolean().optional().describe("Return events in reverse chronological order"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        const journal = await loadJournal(runDir);

        // Apply type filter
        const filterType = args.filterType?.toUpperCase();
        const filtered = filterType
          ? journal.filter((event) => event.type.toUpperCase() === filterType)
          : journal;

        // Apply ordering
        const ordered = args.reverse ? filtered.slice().reverse() : filtered;

        // Apply limit
        const limited = args.limit !== undefined ? ordered.slice(0, args.limit) : ordered;

        return toolResult({
          total: journal.length,
          matching: filtered.length,
          showing: limited.length,
          events: limited.map((event) => ({
            seq: event.seq,
            type: event.type,
            recordedAt: event.recordedAt,
            data: event.data,
          })),
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── run_rebuild_state ───────────────────────────────────────────────
  server.tool(
    "run_rebuild_state",
    "Rebuild the state cache for a run from its journal",
    {
      runId: z.string().describe("The run ID to rebuild state for"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        const snapshot = await rebuildStateCache(runDir);

        return toolResult({
          success: true,
          stateVersion: snapshot.stateVersion,
          journalHead: snapshot.journalHead,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
