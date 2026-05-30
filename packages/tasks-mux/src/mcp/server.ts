import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import {
  EmptyResultSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { HttpMcpServerOptions, HttpMcpServerResult } from "./http-transport.js";
import {
  askBreakpointDescription,
  askBreakpointParams,
  handleAskBreakpoint,
} from "./tools/ask-breakpoint.js";
import {
  checkBreakpointStatusDescription,
  checkBreakpointStatusParams,
  handleCheckBreakpointStatus,
} from "./tools/check-status.js";
import {
  listBreakpointsDescription,
  listBreakpointsParams,
  handleListBreakpoints,
} from "./tools/list-breakpoints.js";
import {
  answerBreakpointDescription,
  answerBreakpointParams,
  handleAnswerBreakpoint,
} from "./tools/answer-breakpoint.js";
import {
  verifyBreakpointAnswerDescription,
  verifyBreakpointAnswerParams,
  handleVerifyBreakpointAnswer,
} from "./tools/verify-answer.js";
import {
  listRespondersDescription,
  listRespondersParams,
  handleListResponders,
} from "./tools/list-responders.js";
import {
  assignTaskDescription,
  assignTaskParams,
  addCommentDescription,
  addCommentParams,
  addCommentToBreakpointDescription,
  addCommentToBreakpointParams,
  bulkUpdateTasksDescription,
  bulkUpdateTasksParams,
  cancelBreakpointDescription,
  cancelBreakpointParams,
  createTaskDescription,
  createTaskParams,
  createTodoDescription,
  createTodoParams,
  escalateDescription,
  escalateBreakpointDescription,
  escalateBreakpointParams,
  escalateParams,
  exportTasksDescription,
  exportTasksParams,
  handleAssignTask,
  handleAddComment,
  handleAddCommentToBreakpoint,
  handleBulkUpdateTasks,
  handleCancelBreakpoint,
  handleCreateTask,
  handleCreateTodo,
  handleEscalate,
  handleEscalateBreakpoint,
  handleExportTasks,
  handleSearchTasks,
  handleTaskStats,
  searchTasksDescription,
  searchTasksParams,
  taskStatsDescription,
  taskStatsParams,
} from "./tools/native-tasks.js";
import {
  claimBreakpointDescription,
  claimBreakpointParams,
  handleClaimBreakpoint,
} from "./tools/claim-breakpoint.js";
import {
  pollBreakpointsDescription,
  pollBreakpointsParams,
  handlePollBreakpoints,
} from "./tools/poll-breakpoints.js";
import { resolveBreakpointBackend } from "./backend-resolver.js";
import { createDefaultBackend } from "../backends/index.js";
import type { BreakpointBackend } from "../backend.js";

/**
 * Resolve the backend for an MCP tool call.
 * Uses the backend-resolver (env var, routing config) or defaults to git-native.
 */
function resolveToolBackend(params?: {
  backend?: string;
  breakpointsDir?: string;
  domain?: string;
  tags?: string[];
}): BreakpointBackend {
  if (!params?.backend && params?.breakpointsDir) {
    return createDefaultBackend({ breakpointsDir: params.breakpointsDir });
  }

  const { backend } = resolveBreakpointBackend({
    explicitBackend: params?.backend,
    breakpointsDir: params?.breakpointsDir,
    domain: params?.domain,
    tags: params?.tags,
  });
  return backend;
}

function toCompatShape(shape: Record<string, unknown>): ZodRawShapeCompat {
  return shape as unknown as ZodRawShapeCompat;
}

/**
 * Create a tasks-mux MCP server with breakpoint, responder, and native task tools registered.
 */
export function createBreakpointMcpServer(): McpServer {
  const server = new McpServer({
    name: "tasks-mux",
    version: "0.1.0",
  }, {
    capabilities: {
      resources: {
        listChanged: true,
        subscribe: true,
      },
    },
  });

  const subscribedResources = new Set<string>();

  server.server.setRequestHandler(SubscribeRequestSchema, (request) => {
    subscribedResources.add(request.params.uri);
    return EmptyResultSchema.parse({});
  });

  server.server.setRequestHandler(UnsubscribeRequestSchema, (request) => {
    subscribedResources.delete(request.params.uri);
    return EmptyResultSchema.parse({});
  });

  server.registerResource(
    "breakpoint",
    new ResourceTemplate("breakpoint://{id}", {
      list: async () => {
        const backend = resolveToolBackend();
        if (!backend.searchBreakpoints) return { resources: [] };
        const result = await backend.searchBreakpoints({});
        return {
          resources: result.items.map((breakpoint) => ({
            uri: `breakpoint://${breakpoint.id}`,
            name: breakpoint.id,
            description: breakpoint.text,
            mimeType: "application/json",
          })),
        };
      },
    }),
    {
      title: "Breakpoint",
      description: "Read a breakpoint by id using breakpoint://[id]. Subscribe to the URI to receive resource update notifications from transports that support them.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const id = String(variables.id);
      const breakpoint = await resolveToolBackend().getBreakpoint(id);
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify({
            ...breakpoint,
            subscribed: subscribedResources.has(uri.toString()),
          }, null, 2),
        }],
      };
    },
  );

  // ── Submitter-side tools ──────────────────────────────────────────────

  server.tool(
    "ask_breakpoint",
    askBreakpointDescription,
    toCompatShape(askBreakpointParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleAskBreakpoint(args as Parameters<typeof handleAskBreakpoint>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "check_breakpoint_status",
    checkBreakpointStatusDescription,
    toCompatShape(checkBreakpointStatusParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleCheckBreakpointStatus(args as Parameters<typeof handleCheckBreakpointStatus>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "list_breakpoints",
    listBreakpointsDescription,
    toCompatShape(listBreakpointsParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleListBreakpoints(args as Parameters<typeof handleListBreakpoints>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "create_todo",
    createTodoDescription,
    toCompatShape(createTodoParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleCreateTodo(args as Parameters<typeof handleCreateTodo>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "create_task",
    createTaskDescription,
    toCompatShape(createTaskParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleCreateTask(args as Parameters<typeof handleCreateTask>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "assign_task",
    assignTaskDescription,
    toCompatShape(assignTaskParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleAssignTask(args as Parameters<typeof handleAssignTask>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "search_tasks",
    searchTasksDescription,
    toCompatShape(searchTasksParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleSearchTasks(args as Parameters<typeof handleSearchTasks>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "cancel_breakpoint",
    cancelBreakpointDescription,
    toCompatShape(cancelBreakpointParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleCancelBreakpoint(args as Parameters<typeof handleCancelBreakpoint>[0], backend);
      await server.server.sendResourceUpdated({ uri: `breakpoint://${args.breakpointId}` }).catch(() => {});
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "add_comment",
    addCommentDescription,
    toCompatShape(addCommentParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleAddComment(args as Parameters<typeof handleAddComment>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "add_comment_to_breakpoint",
    addCommentToBreakpointDescription,
    toCompatShape(addCommentToBreakpointParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleAddCommentToBreakpoint(args as Parameters<typeof handleAddCommentToBreakpoint>[0], backend);
      await server.server.sendResourceUpdated({ uri: `breakpoint://${args.breakpointId}` }).catch(() => {});
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "bulk_update_tasks",
    bulkUpdateTasksDescription,
    toCompatShape(bulkUpdateTasksParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleBulkUpdateTasks(args as Parameters<typeof handleBulkUpdateTasks>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "task_stats",
    taskStatsDescription,
    toCompatShape(taskStatsParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleTaskStats(args as Parameters<typeof handleTaskStats>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "export_tasks",
    exportTasksDescription,
    toCompatShape(exportTasksParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleExportTasks(args as Parameters<typeof handleExportTasks>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "escalate",
    escalateDescription,
    toCompatShape(escalateParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleEscalate(args as Parameters<typeof handleEscalate>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "escalate_breakpoint",
    escalateBreakpointDescription,
    toCompatShape(escalateBreakpointParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleEscalateBreakpoint(args as Parameters<typeof handleEscalateBreakpoint>[0], backend);
      await server.server.sendResourceUpdated({ uri: `breakpoint://${args.breakpointId}` }).catch(() => {});
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "answer_breakpoint",
    answerBreakpointDescription,
    toCompatShape(answerBreakpointParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleAnswerBreakpoint(args as Parameters<typeof handleAnswerBreakpoint>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "verify_breakpoint_answer",
    verifyBreakpointAnswerDescription,
    toCompatShape(verifyBreakpointAnswerParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleVerifyBreakpointAnswer(args as Parameters<typeof handleVerifyBreakpointAnswer>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── Responder-side tools ──────────────────────────────────────────────

  server.tool(
    "list_responders",
    listRespondersDescription,
    toCompatShape(listRespondersParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleListResponders(args as Parameters<typeof handleListResponders>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "claim_breakpoint",
    claimBreakpointDescription,
    toCompatShape(claimBreakpointParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleClaimBreakpoint(args as Parameters<typeof handleClaimBreakpoint>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "poll_breakpoints",
    pollBreakpointsDescription,
    toCompatShape(pollBreakpointsParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handlePollBreakpoints(args as Parameters<typeof handlePollBreakpoints>[0], backend);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  return server;
}

/**
 * Start the tasks-mux MCP server on stdio transport.
 */
export async function startBreakpointMcpServer(): Promise<void> {
  const server = createBreakpointMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Start the tasks-mux MCP server on HTTP transport with Streamable HTTP.
 *
 * The HTTP server provides:
 * - POST/GET/DELETE /mcp -- MCP Streamable HTTP transport
 * - GET /healthz -- health check
 * - Bearer token authentication (when BPX_MCP_TOKEN is set or token is provided)
 */
export async function startHttpBreakpointMcpServer(
  options?: HttpMcpServerOptions,
): Promise<HttpMcpServerResult> {
  // Dynamic import to avoid pulling in http-transport for stdio-only usage
  const { startHttpMcpServer } = await import("./http-transport.js");
  const server = createBreakpointMcpServer();
  return startHttpMcpServer(server, options);
}
