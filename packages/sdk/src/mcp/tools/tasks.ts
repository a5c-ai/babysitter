import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import { loadJournal } from "../../storage";
import { readTaskDefinition, readTaskResult } from "../../storage/tasks";
import type { JournalEvent } from "../../storage/types";
import { toolResult, toolError } from "../util/errors";
import { resolveRunDir } from "../util/resolve-run-dir";

/**
 * Build a task list from journal events by tracking EFFECT_REQUESTED and
 * EFFECT_RESOLVED events.
 */
function buildTaskList(events: JournalEvent[]): Array<{
  effectId: string;
  kind: string;
  status: "pending" | "resolved";
  label?: string;
  taskId?: string;
  requestedAt?: string;
  resolvedAt?: string;
}> {
  const requested = new Map<
    string,
    {
      effectId: string;
      kind: string;
      label?: string;
      taskId?: string;
      requestedAt?: string;
    }
  >();
  const resolved = new Map<string, { resolvedAt?: string }>();

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const data = event.data as {
        effectId?: string;
        kind?: string;
        label?: string;
        taskId?: string;
      };
      if (data.effectId) {
        requested.set(data.effectId, {
          effectId: data.effectId,
          kind: data.kind ?? "unknown",
          label: data.label,
          taskId: data.taskId,
          requestedAt: event.recordedAt,
        });
      }
    } else if (event.type === "EFFECT_RESOLVED") {
      const data = event.data as { effectId?: string };
      if (data.effectId) {
        resolved.set(data.effectId, { resolvedAt: event.recordedAt });
      }
    }
  }

  const tasks: Array<{
    effectId: string;
    kind: string;
    status: "pending" | "resolved";
    label?: string;
    taskId?: string;
    requestedAt?: string;
    resolvedAt?: string;
  }> = [];

  for (const [effectId, info] of requested) {
    const resolvedInfo = resolved.get(effectId);
    tasks.push({
      effectId,
      kind: info.kind,
      status: resolvedInfo ? "resolved" : "pending",
      label: info.label,
      taskId: info.taskId,
      requestedAt: info.requestedAt,
      resolvedAt: resolvedInfo?.resolvedAt,
    });
  }

  return tasks.sort((a, b) => a.effectId.localeCompare(b.effectId));
}

export function registerTaskTools(server: McpServer): void {
  // ── task_post ───────────────────────────────────────────────────────
  server.tool(
    "task_post",
    "Post a result for a pending task effect",
    {
      runId: z.string().describe("The run ID the task belongs to"),
      effectId: z.string().describe("The effect ID of the task to resolve"),
      status: z
        .enum(["ok", "error"])
        .describe("Result status: ok for success, error for failure"),
      value: z
        .string()
        .optional()
        .describe("JSON-encoded result value (when status=ok)"),
      error: z
        .string()
        .optional()
        .describe("JSON-encoded error payload (when status=error)"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        let value: unknown;
        let errorPayload: unknown;

        if (args.status === "ok" && args.value) {
          try {
            value = JSON.parse(args.value);
          } catch {
            return toolError("Invalid JSON in value parameter");
          }
        }

        if (args.status === "error") {
          if (args.error) {
            try {
              errorPayload = JSON.parse(args.error);
            } catch {
              return toolError("Invalid JSON in error parameter");
            }
          } else {
            errorPayload = { name: "Error", message: "Task reported failure" };
          }
        }

        const nowIso = new Date().toISOString();

        const committed = await commitEffectResult({
          runDir,
          effectId: args.effectId,
          result:
            args.status === "ok"
              ? {
                  status: "ok",
                  value,
                  startedAt: nowIso,
                  finishedAt: nowIso,
                }
              : {
                  status: "error",
                  error: errorPayload,
                  startedAt: nowIso,
                  finishedAt: nowIso,
                },
        });

        return toolResult({
          status: args.status,
          effectId: args.effectId,
          resultRef: committed.resultRef ?? null,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── task_list ───────────────────────────────────────────────────────
  server.tool(
    "task_list",
    "List all tasks for a run, optionally showing only pending tasks",
    {
      runId: z.string().describe("The run ID to list tasks for"),
      pendingOnly: z
        .boolean()
        .optional()
        .describe("If true, only show pending (unresolved) tasks"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        const journal = await loadJournal(runDir);
        const allTasks = buildTaskList(journal);

        const tasks = args.pendingOnly
          ? allTasks.filter((t) => t.status === "pending")
          : allTasks;

        return toolResult({
          total: allTasks.length,
          showing: tasks.length,
          pendingCount: allTasks.filter((t) => t.status === "pending").length,
          tasks,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── task_show ───────────────────────────────────────────────────────
  server.tool(
    "task_show",
    "Show details of a specific task including its definition and result",
    {
      runId: z.string().describe("The run ID the task belongs to"),
      effectId: z.string().describe("The effect ID of the task"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        // Get task status from journal
        const journal = await loadJournal(runDir);
        const allTasks = buildTaskList(journal);
        const taskEntry = allTasks.find((t) => t.effectId === args.effectId);

        if (!taskEntry) {
          return toolError(
            `Effect ${args.effectId} not found in run ${args.runId}`
          );
        }

        // Read task definition
        let taskDef: unknown = null;
        try {
          taskDef = await readTaskDefinition(runDir, args.effectId);
        } catch {
          // Task definition might not exist yet
        }

        // Read task result if resolved
        let taskResultData: unknown = null;
        if (taskEntry.status === "resolved") {
          try {
            taskResultData = await readTaskResult(runDir, args.effectId);
          } catch {
            // Result file might not be readable
          }
        }

        return toolResult({
          effect: taskEntry,
          task: taskDef,
          result: taskResultData,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
