import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";

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
  createTodoDescription,
  createTodoParams,
  escalateDescription,
  escalateParams,
  handleAssignTask,
  handleCreateTodo,
  handleEscalate,
  handleSearchTasks,
  searchTasksDescription,
  searchTasksParams,
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
