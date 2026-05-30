import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { SubscribeRequestSchema, UnsubscribeRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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
  claimBreakpointDescription,
  claimBreakpointParams,
  handleClaimBreakpoint,
} from "./tools/claim-breakpoint.js";
import {
  pollBreakpointsDescription,
  pollBreakpointsParams,
  handlePollBreakpoints,
} from "./tools/poll-breakpoints.js";
import {
  addCommentToBreakpointDescription,
  addCommentToBreakpointParams,
  assignTaskDescription,
  assignTaskParams,
  cancelBreakpointDescription as cancelBreakpointToolDescription,
  cancelBreakpointParams as cancelBreakpointToolParams,
  createTaskDescription,
  createTaskParams,
  createTodoDescription,
  createTodoParams,
  escalateBreakpointDescription,
  escalateBreakpointParams,
  handleAddCommentToBreakpoint,
  handleAssignTask,
  handleCancelBreakpoint,
  handleCreateTask,
  handleCreateTodo,
  handleEscalateBreakpoint,
  handleSearchTasks,
  searchTasksDescription,
  searchTasksParams,
} from "./tools/task-tools.js";
import {
  breakpointResourceTemplate,
  readBreakpointResource,
} from "./resources/breakpoint-resource.js";
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
 * Create a tasks-mux MCP server with all 8 tools registered.
 */
export function createBreakpointMcpServer(): McpServer {
  const server = new McpServer({
    name: "tasks-mux",
    version: "0.1.0",
  });

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

  server.tool(
    "create_todo",
    createTodoDescription,
    toCompatShape(createTodoParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleCreateTodo(args as Parameters<typeof handleCreateTodo>[0], backend);
      server.sendResourceListChanged();
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
      server.sendResourceListChanged();
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
      await server.server.sendResourceUpdated({ uri: `breakpoint://${result.id}` }).catch(() => {});
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
    cancelBreakpointToolDescription,
    toCompatShape(cancelBreakpointToolParams),
    async (args) => {
      const backend = resolveToolBackend(args);
      const result = await handleCancelBreakpoint(args as Parameters<typeof handleCancelBreakpoint>[0], backend);
      await server.server.sendResourceUpdated({ uri: `breakpoint://${result.id}` }).catch(() => {});
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
      await server.server.sendResourceUpdated({ uri: `breakpoint://${result.id}` }).catch(() => {});
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
      await server.server.sendResourceUpdated({ uri: `breakpoint://${result.breakpointId}` }).catch(() => {});
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  const subscriptions = new Map<string, () => void>();

  server.registerResource(
    "breakpoint",
    new ResourceTemplate(breakpointResourceTemplate, {
      list: undefined,
    }),
    {
      title: "Breakpoint",
      description: "Current tasks-mux breakpoint state.",
      mimeType: "application/json",
    },
    async (uri) => {
      const backend = resolveToolBackend();
      return readBreakpointResource(uri, backend);
    },
  );

  server.server.setRequestHandler(SubscribeRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (!uri.startsWith("breakpoint://")) {
      throw new Error(`Unsupported resource subscription URI: ${uri}`);
    }
    if (subscriptions.has(uri)) {
      return {};
    }
    const backend = resolveToolBackend();
    const unsubscribe = backend.subscribeToTaskChanges?.((event) => {
      if (event.uri === uri) {
        void server.server.sendResourceUpdated({ uri: event.uri });
      }
    });
    if (unsubscribe) {
      subscriptions.set(uri, unsubscribe);
    }
    return {};
  });

  server.server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
    const unsubscribe = subscriptions.get(request.params.uri);
    unsubscribe?.();
    subscriptions.delete(request.params.uri);
    return {};
  });

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
