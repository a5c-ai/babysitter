import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createRun,
  orchestrateIteration,
} from "../../runtime";
import { readRunMetadata } from "../../storage";
import { rebuildStateCache } from "../../runtime/replay/stateCache";
import { apiRunStatus, apiRunEvents } from "../../api/runs";
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
      nonInteractive: z.boolean().optional().describe("When true, breakpoints are auto-approved without human interaction"),
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
          ...(args.nonInteractive ? { metadata: { nonInteractive: true } } : {}),
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
      const runsDir = resolveRunDir(args.runsDir);
      const result = await apiRunStatus({ runId: args.runId, runsDir });

      if (!result.ok) {
        return toolError(result.error.message);
      }

      const pendingByKind: Record<string, number> = {};
      for (const eff of result.data.pendingEffects) {
        const kind = eff.kind ?? "unknown";
        pendingByKind[kind] = (pendingByKind[kind] ?? 0) + 1;
      }

      return toolResult({
        runId: result.data.runId,
        processId: result.data.processId,
        state: result.data.state,
        pendingEffects: result.data.pendingEffects,
        pendingByKind,
      });
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

        if (result.status === "process-error") {
          return toolResult({
            status: "process-error",
            recoverable: true,
            error: result.error instanceof Error ? result.error.message : result.error,
            hint: "The process code has a bug. Fix the process file and retry the iteration.",
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
      const runsDir = resolveRunDir(args.runsDir);
      const filterType = args.filterType?.toUpperCase();

      // When reverse is requested, we cannot apply limit server-side because
      // the API applies limit before ordering. Fetch all matching events and
      // apply limit after reversing.
      const apiLimit = args.reverse ? undefined : args.limit;

      // Fetch all events (unfiltered) to get the total count,
      // then apply filter via the API.
      const [allResult, filteredResult] = filterType
        ? await Promise.all([
            apiRunEvents({ runId: args.runId, runsDir }),
            apiRunEvents({ runId: args.runId, runsDir, limit: apiLimit, filterType }),
          ])
        : [
            await apiRunEvents({ runId: args.runId, runsDir, limit: apiLimit }),
            undefined,
          ];

      if (!allResult.ok) {
        return toolError(allResult.error.message);
      }
      if (filteredResult && !filteredResult.ok) {
        return toolError(filteredResult.error.message);
      }

      const matchingEvents = filteredResult?.ok ? filteredResult.data.events : allResult.data.events;

      // Apply ordering
      const ordered = args.reverse ? matchingEvents.slice().reverse() : matchingEvents;

      // Apply limit (needed when reverse deferred limit from API)
      const limited = (args.limit !== undefined && args.reverse)
        ? ordered.slice(0, args.limit)
        : ordered;

      return toolResult({
        total: allResult.data.events.length,
        matching: matchingEvents.length,
        showing: limited.length,
        events: limited,
      });
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
