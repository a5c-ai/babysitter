import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { commitEffectCancellation, commitEffectResult } from "../../runtime/commitEffectResult";
import { loadJournal } from "../../storage";
import { readTaskDefinition, readTaskResult } from "../../storage/tasks";
import type { JournalEvent } from "../../storage/types";
import { toolResult, toolError } from "../util/errors";
import { resolveRunDir } from "../util/resolve-run-dir";
import { registerMcpTool } from "../util/registerTool";

/**
 * Build a task list from journal events by tracking requested effects and
 * terminal resolution/cancellation events.
 */
function buildTaskList(events: JournalEvent[]): Array<{
  effectId: string;
  kind: string;
  status: "pending" | "resolved" | "cancelled";
  label?: string;
  taskId?: string;
  requestedAt?: string;
  resolvedAt?: string;
  cancelledAt?: string;
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
  const terminal = new Map<string, {
    status: "resolved" | "cancelled";
    resolvedAt?: string;
    cancelledAt?: string;
  }>();

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
        terminal.set(data.effectId, {
          status: "resolved",
          resolvedAt: event.recordedAt,
        });
      }
    } else if (event.type === "EFFECT_CANCELLED") {
      const data = event.data as { effectId?: string };
      if (data.effectId) {
        terminal.set(data.effectId, {
          status: "cancelled",
          resolvedAt: event.recordedAt,
          cancelledAt: event.recordedAt,
        });
      }
    }
  }

  const tasks: Array<{
    effectId: string;
    kind: string;
    status: "pending" | "resolved" | "cancelled";
    label?: string;
    taskId?: string;
    requestedAt?: string;
    resolvedAt?: string;
    cancelledAt?: string;
  }> = [];

  for (const [effectId, info] of requested) {
    const terminalInfo = terminal.get(effectId);
    tasks.push({
      effectId,
      kind: info.kind,
      status: terminalInfo?.status ?? "pending",
      label: info.label,
      taskId: info.taskId,
      requestedAt: info.requestedAt,
      resolvedAt: terminalInfo?.resolvedAt,
      cancelledAt: terminalInfo?.cancelledAt,
    });
  }

  return tasks.sort((a, b) => a.effectId.localeCompare(b.effectId));
}

export function registerTaskTools(server: McpServer): void {
  // ── task_post ───────────────────────────────────────────────────────
  registerMcpTool(
    server,
    "task_post",
    {
      description: "Post a result for a pending task effect",
      inputSchema: {
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

  // ── task_cancel ─────────────────────────────────────────────────────
  server.tool(
    "task_cancel",
    "Cancel a pending task effect",
    {
      runId: z.string().describe("The run ID the task belongs to"),
      effectId: z.string().describe("The effect ID of the task to cancel"),
      reason: z.string().optional().describe("Human-readable cancellation reason"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);

        const committed = await commitEffectCancellation({
          runDir,
          effectId: args.effectId,
          reason: args.reason,
        });

        return toolResult({
          status: "cancelled",
          effectId: args.effectId,
          resultRef: committed.resultRef,
          ...(args.reason !== undefined ? { reason: args.reason } : {}),
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── task_list ───────────────────────────────────────────────────────
  registerMcpTool(
    server,
    "task_list",
    {
      description: "List all tasks for a run, optionally showing only pending tasks",
      inputSchema: {
        runId: z.string().describe("The run ID to list tasks for"),
        pendingOnly: z
          .boolean()
          .optional()
          .describe("If true, only show pending (unresolved) tasks"),
        runsDir: z.string().optional().describe("Override runs directory path"),
      },
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
  registerMcpTool(
    server,
    "task_show",
    {
      description: "Show details of a specific task including its definition and result",
      inputSchema: {
        runId: z.string().describe("The run ID the task belongs to"),
        effectId: z.string().describe("The effect ID of the task"),
        runsDir: z.string().optional().describe("Override runs directory path"),
      },
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

        // Read task result if terminal
        let taskResultData: unknown = null;
        if (taskEntry.status !== "pending") {
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
