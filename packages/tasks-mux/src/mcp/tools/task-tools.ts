import { z } from "zod";

import type { BreakpointBackend, SubmitAnswerParams, SubmitBreakpointParams } from "../../backend.js";
import { unsupportedBackendFeatureMessage } from "../../backend.js";
import { BreakpointStatusSchema } from "../../types.js";
import type { Breakpoint, BreakpointContext, BreakpointRouting, TaskSearchParams } from "../../types.js";

const backendParams = {
  backend: z.string().optional().describe("Backend name override."),
  breakpointsDir: z.string().optional().describe("Directory for git-native breakpoint files."),
};

export const createTodoDescription = "Create a todo in tasks-mux.";
export const createTodoParams = {
  text: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  ...backendParams,
};

export const createTaskDescription = "Create a task in tasks-mux.";
export const createTaskParams = {
  text: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
  responderIds: z.array(z.string()).optional(),
  timeoutMs: z.number().positive().optional(),
  ...backendParams,
};

export const assignTaskDescription = "Assign a task to a responder.";
export const assignTaskParams = {
  id: z.string().min(1),
  responderId: z.string().min(1),
  ...backendParams,
};

export const searchTasksDescription = "Search tasks and breakpoints.";
export const searchTasksParams = {
  query: z.string().optional(),
  status: BreakpointStatusSchema.optional(),
  responderId: z.string().optional(),
  limit: z.number().int().positive().optional(),
  ...backendParams,
};

export const cancelBreakpointDescription = "Cancel a breakpoint.";
export const cancelBreakpointParams = {
  id: z.string().min(1),
  ...backendParams,
};

export const escalateBreakpointDescription = "Escalate a breakpoint.";
export const escalateBreakpointParams = {
  id: z.string().min(1),
  reason: z.string().optional(),
  targetResponderId: z.string().optional(),
  ...backendParams,
};

export const addCommentToBreakpointDescription = "Add a comment to a breakpoint.";
export const addCommentToBreakpointParams = {
  id: z.string().min(1),
  comment: z.string().min(1),
  responderId: z.string().optional(),
  ...backendParams,
};

function taskContext(
  text: string,
  kind: "todo" | "task",
  context?: Record<string, unknown>,
  tags: string[] = [],
): BreakpointContext {
  return {
    description: typeof context?.description === "string" ? context.description : text,
    codeSnippets: [],
    fileReferences: [],
    tags,
    metadata: {
      ...context,
      taskKind: kind,
    },
  };
}

function taskRouting(responderIds: string[] = [], timeoutMs = 1_800_000): BreakpointRouting {
  return {
    strategy: "first-response-wins",
    targetResponders: responderIds,
    timeoutMs,
    presentToUser: false,
  };
}

function taskView(breakpoint: Breakpoint) {
  return {
    id: breakpoint.id,
    status: breakpoint.status,
    text: breakpoint.text,
    resourceUri: `breakpoint://${breakpoint.id}`,
    breakpoint,
  };
}

export async function handleCreateTodo(
  params: { text: string; context?: Record<string, unknown>; tags?: string[] },
  backend: BreakpointBackend,
) {
  const submitParams: SubmitBreakpointParams = {
    text: params.text,
    context: taskContext(params.text, "todo", params.context, params.tags),
    routing: taskRouting(),
  };
  const breakpoint = await backend.submitBreakpoint(submitParams);
  return taskView(breakpoint);
}

export async function handleCreateTask(
  params: { text: string; context?: Record<string, unknown>; responderIds?: string[]; timeoutMs?: number },
  backend: BreakpointBackend,
) {
  const submitParams: SubmitBreakpointParams = {
    text: params.text,
    context: taskContext(params.text, "task", params.context),
    routing: taskRouting(params.responderIds, params.timeoutMs),
  };
  const breakpoint = await backend.submitBreakpoint(submitParams);
  return taskView(breakpoint);
}

export async function handleAssignTask(
  params: { id: string; responderId: string },
  backend: BreakpointBackend,
) {
  if (backend.assignTask) {
    return backend.assignTask(params.id, { responderId: params.responderId });
  }
  if (backend.claimBreakpoint) {
    return backend.claimBreakpoint(params.id, params.responderId);
  }
  throw new Error(unsupportedBackendFeatureMessage(backend.name, "assign_task"));
}

export async function handleSearchTasks(
  params: TaskSearchParams,
  backend: BreakpointBackend,
) {
  if (backend.searchTasks) {
    return backend.searchTasks(params);
  }

  const pending = await backend.listPendingBreakpoints(params.responderId);
  const query = params.query?.toLowerCase();
  let tasks = pending;
  if (params.status) tasks = tasks.filter((task) => task.status === params.status);
  if (query) {
    tasks = tasks.filter((task) => [
      task.id,
      task.text,
      task.context.description,
      task.context.domain,
      ...(task.context.tags ?? []),
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
  }
  if (params.limit) tasks = tasks.slice(0, params.limit);
  return { tasks, count: tasks.length };
}

export async function handleCancelBreakpoint(
  params: { id: string },
  backend: BreakpointBackend,
) {
  await backend.cancelBreakpoint(params.id);
  return { id: params.id, cancelled: true };
}

export async function handleEscalateBreakpoint(
  params: { id: string; reason?: string; targetResponderId?: string },
  backend: BreakpointBackend,
) {
  if (!backend.escalateTask) {
    throw new Error(unsupportedBackendFeatureMessage(backend.name, "escalate_breakpoint"));
  }
  return backend.escalateTask(params.id, {
    reason: params.reason,
    targetResponderId: params.targetResponderId,
  });
}

export async function handleAddCommentToBreakpoint(
  params: { id: string; comment: string; responderId?: string },
  backend: BreakpointBackend,
) {
  if (!backend.addTaskComment) {
    throw new Error(unsupportedBackendFeatureMessage(backend.name, "add_comment_to_breakpoint"));
  }
  return backend.addTaskComment(params.id, {
    text: params.comment,
    responderId: params.responderId,
  });
}

export async function handleApproveTask(
  params: { id: string; responderId: string; responderName?: string; text?: string },
  backend: BreakpointBackend,
) {
  const answer: SubmitAnswerParams = {
    responderId: params.responderId,
    responderName: params.responderName ?? params.responderId,
    text: params.text ?? "Approved.",
    approved: true,
    confidence: 100,
  };
  return backend.approveTask ? backend.approveTask(params.id, answer) : backend.answerBreakpoint(params.id, answer);
}
