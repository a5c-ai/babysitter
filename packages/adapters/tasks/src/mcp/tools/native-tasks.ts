import { z } from "zod";
import type { BreakpointBackend } from "../../backend.js";
import type {
  Breakpoint,
  BreakpointContext,
  BreakpointRouting,
  BreakpointStatus,
  InteractionKind,
  ResponderType,
  TaskPriority,
  Urgency,
} from "../../types.js";
import {
  BreakpointStatusSchema,
  DEFAULT_TIMEOUT_MS,
  TaskPrioritySchema,
} from "../../types.js";

const responderTypeSchema = z.enum(["human", "agent", "tracker", "internal", "auto"]);
const urgencySchema = z.enum(["low", "medium", "high"]);
const taskPrioritySchema = TaskPrioritySchema;
const taskStatusSchema = BreakpointStatusSchema;

const nativeRoutingParams = {
  responderId: z.string().min(1).optional(),
  responderType: responderTypeSchema.optional(),
  adapter: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  trackerBackend: z.string().min(1).optional(),
  fallbackType: responderTypeSchema.optional(),
};

const nativeContextParams = {
  tags: z.array(z.string()).optional(),
  domain: z.string().min(1).optional(),
  urgency: urgencySchema.optional(),
  priority: taskPrioritySchema.optional(),
  dependsOn: z.array(z.string().min(1)).optional(),
  sourceUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  projectId: z.string().min(1).optional(),
  repoId: z.string().min(1).optional(),
};

export const createTodoDescription =
  "Create a todo routed through tasks-adapter. The todo is stored as a task-like breakpoint so existing responder backends, routing, and audit trails remain the source of truth.";

export const createTodoParams = {
  title: z.string().min(1).describe("Short todo title."),
  description: z.string().optional().describe("Optional todo details."),
  ...nativeRoutingParams,
  ...nativeContextParams,
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const createTaskDescription =
  "Create a task routed through tasks-adapter. This is an alias-friendly task surface backed by the same breakpoint storage as assign_task.";

export const createTaskParams = {
  title: z.string().min(1).describe("Task title."),
  instructions: z.string().optional().describe("Task instructions or acceptance notes."),
  ...nativeRoutingParams,
  ...nativeContextParams,
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const assignTaskDescription =
  "Assign a task through tasks-adapter responder routing. Use this instead of direct agent delegation when the work should be visible to the task router.";

export const assignTaskParams = {
  taskId: z.string().min(1).optional().describe("Existing task or breakpoint id to assign. If omitted, creates a new task."),
  title: z.string().min(1).describe("Task title."),
  instructions: z.string().optional().describe("Task instructions or acceptance notes."),
  assignee: z.string().min(1).optional().describe("Responder id to assign to."),
  ...nativeRoutingParams,
  ...nativeContextParams,
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const searchTasksDescription =
  "Search task-like breakpoints currently visible to tasks-adapter. This is read-only and uses the configured BreakpointBackend.";

export const searchTasksParams = {
  query: z.string().optional(),
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
  priority: z.union([taskPrioritySchema, z.array(taskPrioritySchema)]).optional(),
  assigneeId: z.string().optional(),
  responderId: z.string().optional(),
  domain: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "priority", "status"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().optional(),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const addCommentDescription =
  "Add a discussion comment to a task-like breakpoint through the configured BreakpointBackend.";

export const addCommentParams = {
  taskId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1).optional(),
  text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const addCommentToBreakpointDescription =
  "Add a discussion comment to a breakpoint through the configured BreakpointBackend.";

export const addCommentToBreakpointParams = {
  breakpointId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1).optional(),
  text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const bulkUpdateTasksDescription =
  "Apply a backend-agnostic bulk operation to task-like breakpoints with per-item success and failure details.";

export const bulkUpdateTasksParams = {
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(["approve", "close", "cancel", "reassign", "transition"]),
  actorId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).optional(),
  assigneeName: z.string().min(1).optional(),
  status: taskStatusSchema.optional(),
  message: z.string().optional(),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const taskStatsDescription =
  "Compute deterministic task metrics grouped by status and priority.";

export const taskStatsParams = {
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
  priority: z.union([taskPrioritySchema, z.array(taskPrioritySchema)]).optional(),
  assigneeId: z.string().optional(),
  responderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  domain: z.string().optional(),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const exportTasksDescription =
  "Export matching task-like breakpoints with credential-bearing notification targets redacted.";

export const exportTasksParams = {
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
  priority: z.union([taskPrioritySchema, z.array(taskPrioritySchema)]).optional(),
  assigneeId: z.string().optional(),
  responderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  domain: z.string().optional(),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const escalateDescription =
  "Escalate an existing task or create a high-urgency intervention through tasks-adapter routing.";

export const escalateParams = {
  taskId: z.string().min(1).optional().describe("Existing task or breakpoint id to escalate."),
  title: z.string().min(1).optional().describe("Escalation title. Defaults from taskId when available."),
  reason: z.string().min(1).describe("Why escalation is required."),
  targetResponderId: z.string().min(1).optional().describe("Responder id that should receive the escalation."),
  ...nativeRoutingParams,
  ...nativeContextParams,
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const cancelBreakpointDescription =
  "Cancel a pending breakpoint through the configured BreakpointBackend.";

export const cancelBreakpointParams = {
  breakpointId: z.string().min(1),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const escalateBreakpointDescription =
  "Escalate an existing breakpoint through tasks-adapter routing and lifecycle state.";

export const escalateBreakpointParams = {
  breakpointId: z.string().min(1).describe("Existing breakpoint id to escalate."),
  reason: z.string().min(1).describe("Why escalation is required."),
  targetResponderId: z.string().min(1).optional().describe("Responder id that should receive the escalation."),
  ...nativeRoutingParams,
  ...nativeContextParams,
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export interface NativeTaskResult {
  tool: "create_todo" | "create_task" | "assign_task" | "escalate" | "escalate_breakpoint";
  taskId: string;
  breakpoint: Breakpoint;
  routing: BreakpointRouting;
  metadata: Record<string, unknown>;
}

export interface SearchTasksResult {
  tool: "search_tasks";
  count: number;
  tasks: Breakpoint[];
}

export async function handleCreateTodo(
  params: z.infer<z.ZodObject<typeof createTodoParams>>,
  backend: BreakpointBackend,
): Promise<NativeTaskResult> {
  const parsed = z.object(createTodoParams).parse(params);
  const breakpoint = await backend.submitBreakpoint({
    text: parsed.title,
    context: buildContext({
      title: parsed.title,
      description: parsed.description ?? parsed.title,
      interactionKind: "notification",
      nativeTool: "create_todo",
      nativeKind: "todo",
      tags: parsed.tags,
      domain: parsed.domain,
      urgency: parsed.urgency,
      sourceUrl: parsed.sourceUrl,
      metadata: parsed.metadata,
    }),
    routing: buildRouting(parsed),
    priority: parsed.priority,
    dependsOn: parsed.dependsOn?.map((id) => ({ id, blocking: true })),
    projectId: parsed.projectId,
    repoId: parsed.repoId,
  });

  return nativeResult("create_todo", breakpoint);
}

export async function handleAssignTask(
  params: z.infer<z.ZodObject<typeof assignTaskParams>>,
  backend: BreakpointBackend,
): Promise<NativeTaskResult> {
  const parsed = z.object(assignTaskParams).parse(params);
  const responderId = parsed.assignee ?? parsed.responderId;
  if (parsed.taskId && responderId && backend.assignBreakpoint) {
    const breakpoint = await backend.assignBreakpoint(parsed.taskId, {
      assigneeId: responderId,
      actorId: parsed.metadata?.actorId as string | undefined,
    });
    return nativeResult("assign_task", breakpoint);
  }

  const breakpoint = await backend.submitBreakpoint({
    text: parsed.title,
    context: buildContext({
      title: parsed.title,
      description: parsed.instructions ?? parsed.title,
      interactionKind: "handoff",
      nativeTool: "assign_task",
      nativeKind: "task",
      tags: parsed.tags,
      domain: parsed.domain,
      urgency: parsed.urgency,
      sourceUrl: parsed.sourceUrl,
      metadata: { ...parsed.metadata, assignee: responderId },
    }),
    routing: buildRouting({ ...parsed, responderId }),
    priority: parsed.priority,
    dependsOn: parsed.dependsOn?.map((id) => ({ id, blocking: true })),
    projectId: parsed.projectId,
    repoId: parsed.repoId,
  });

  return nativeResult("assign_task", breakpoint);
}

export async function handleCreateTask(
  params: z.infer<z.ZodObject<typeof createTaskParams>>,
  backend: BreakpointBackend,
): Promise<NativeTaskResult> {
  const parsed = z.object(createTaskParams).parse(params);
  const breakpoint = await backend.submitBreakpoint({
    text: parsed.title,
    context: buildContext({
      title: parsed.title,
      description: parsed.instructions ?? parsed.title,
      interactionKind: "handoff",
      nativeTool: "create_task",
      nativeKind: "task",
      tags: parsed.tags,
      domain: parsed.domain,
      urgency: parsed.urgency,
      sourceUrl: parsed.sourceUrl,
      metadata: parsed.metadata,
    }),
    routing: buildRouting(parsed),
    priority: parsed.priority,
    dependsOn: parsed.dependsOn?.map((id) => ({ id, blocking: true })),
    projectId: parsed.projectId,
    repoId: parsed.repoId,
  });

  return nativeResult("create_task", breakpoint);
}

export async function handleSearchTasks(
  params: z.infer<z.ZodObject<typeof searchTasksParams>>,
  backend: BreakpointBackend,
): Promise<SearchTasksResult> {
  const parsed = z.object(searchTasksParams).parse(params);
  if (backend.searchBreakpoints) {
    const result = await backend.searchBreakpoints({
      query: parsed.query,
      status: normalizeArray(parsed.status),
      priority: normalizeArray(parsed.priority),
      assigneeId: parsed.assigneeId,
      responderId: parsed.responderId,
      domain: parsed.domain,
      tags: parsed.tags,
      sortBy: parsed.sortBy,
      sortDirection: parsed.sortDirection,
      offset: parsed.offset,
      limit: parsed.limit,
    });
    return { tool: "search_tasks", count: result.total, tasks: result.items };
  }

  const pending = await backend.listPendingBreakpoints(parsed.responderId);
  const query = parsed.query?.toLowerCase();
  const tags = parsed.tags?.map((tag) => tag.toLowerCase()) ?? [];
  const domain = parsed.domain?.toLowerCase();
  const statuses = normalizeArray(parsed.status);
  const priorities = normalizeArray(parsed.priority);
  const filtered = pending.filter((task) => {
    if (statuses && !statuses.includes(task.status)) return false;
    if (priorities && !priorities.includes(task.priority ?? "medium")) return false;
    if (parsed.assigneeId && task.assigneeId !== parsed.assigneeId) return false;
    if (parsed.responderId && !matchesResponder(task, parsed.responderId)) return false;
    if (domain && !task.context.domain?.toLowerCase().includes(domain)) return false;
    if (tags.length > 0) {
      const taskTags = new Set(task.context.tags.map((tag) => tag.toLowerCase()));
      if (!tags.every((tag) => taskTags.has(tag))) return false;
    }
    if (query && !searchText(task).includes(query)) return false;
    return true;
  });

  const tasks = typeof parsed.limit === "number" ? filtered.slice(0, parsed.limit) : filtered;
  return { tool: "search_tasks", count: tasks.length, tasks };
}

export async function handleEscalate(
  params: z.infer<z.ZodObject<typeof escalateParams>>,
  backend: BreakpointBackend,
): Promise<NativeTaskResult> {
  const parsed = z.object(escalateParams).parse(params);
  const existing = parsed.taskId ? await getExistingTask(backend, parsed.taskId) : undefined;
  if (existing && backend.transitionBreakpoint) {
    const breakpoint = await backend.transitionBreakpoint(existing.id, {
      status: "escalated",
      actorId: parsed.metadata?.actorId as string | undefined,
      message: parsed.reason,
    });
    return nativeResult("escalate", breakpoint);
  }

  const title = parsed.title ?? (existing ? `Escalate: ${existing.text}` : "Escalation required");
  const responderId = parsed.targetResponderId ?? parsed.responderId;
  const breakpoint = await backend.submitBreakpoint({
    text: title,
    context: buildContext({
      title,
      description: existing
        ? `${parsed.reason}\n\nEscalated task: ${existing.id}\n${existing.text}`
        : parsed.reason,
      interactionKind: "intervention",
      nativeTool: "escalate",
      nativeKind: "escalation",
      tags: ["escalation", ...(parsed.tags ?? [])],
      domain: parsed.domain ?? existing?.context.domain,
      urgency: "high",
      sourceUrl: parsed.sourceUrl,
      metadata: { ...parsed.metadata, escalatedTaskId: parsed.taskId },
    }),
    routing: buildRouting({
      ...parsed,
      responderId,
      responderType: parsed.responderType ?? "human",
    }),
    priority: "critical",
    dependsOn: parsed.taskId ? [{ id: parsed.taskId, blocking: false }] : undefined,
    projectId: parsed.projectId,
    repoId: parsed.repoId,
  });

  return nativeResult("escalate", breakpoint);
}

export async function handleCancelBreakpoint(
  params: z.infer<z.ZodObject<typeof cancelBreakpointParams>>,
  backend: BreakpointBackend,
) {
  const parsed = z.object(cancelBreakpointParams).parse(params);
  await backend.cancelBreakpoint(parsed.breakpointId);
  return { tool: "cancel_breakpoint", breakpointId: parsed.breakpointId, cancelled: true };
}

export async function handleEscalateBreakpoint(
  params: z.infer<z.ZodObject<typeof escalateBreakpointParams>>,
  backend: BreakpointBackend,
): Promise<NativeTaskResult> {
  const parsed = z.object(escalateBreakpointParams).parse(params);
  const result = await handleEscalate({
    ...parsed,
    taskId: parsed.breakpointId,
  }, backend);
  return {
    ...result,
    tool: "escalate_breakpoint",
    metadata: {
      ...result.metadata,
      nativeTool: "escalate_breakpoint",
    },
  };
}

export async function handleAddComment(
  params: z.infer<z.ZodObject<typeof addCommentParams>>,
  backend: BreakpointBackend,
) {
  const parsed = z.object(addCommentParams).parse(params);
  if (!backend.addBreakpointComment) {
    throw new Error(`Backend "${backend.name}" does not support task comments`);
  }
  const comment = await backend.addBreakpointComment(parsed.taskId, {
    authorId: parsed.authorId,
    authorName: parsed.authorName,
    text: parsed.text,
    metadata: parsed.metadata,
  });
  return { tool: "add_comment", taskId: parsed.taskId, comment };
}

export async function handleAddCommentToBreakpoint(
  params: z.infer<z.ZodObject<typeof addCommentToBreakpointParams>>,
  backend: BreakpointBackend,
) {
  const parsed = z.object(addCommentToBreakpointParams).parse(params);
  const result = await handleAddComment({
    taskId: parsed.breakpointId,
    authorId: parsed.authorId,
    authorName: parsed.authorName,
    text: parsed.text,
    metadata: parsed.metadata,
  }, backend);
  return { ...result, tool: "add_comment_to_breakpoint", breakpointId: parsed.breakpointId };
}

export async function handleBulkUpdateTasks(
  params: z.infer<z.ZodObject<typeof bulkUpdateTasksParams>>,
  backend: BreakpointBackend,
) {
  const parsed = z.object(bulkUpdateTasksParams).parse(params);
  if (!backend.bulkUpdateBreakpoints) {
    throw new Error(`Backend "${backend.name}" does not support bulk task operations`);
  }
  return {
    tool: "bulk_update_tasks",
    ...(await backend.bulkUpdateBreakpoints(parsed)),
  };
}

export async function handleTaskStats(
  params: z.infer<z.ZodObject<typeof taskStatsParams>>,
  backend: BreakpointBackend,
) {
  const parsed = z.object(taskStatsParams).parse(params);
  if (!backend.getBreakpointMetrics) {
    throw new Error(`Backend "${backend.name}" does not support task stats`);
  }
  return {
    tool: "task_stats",
    ...(await backend.getBreakpointMetrics({
      status: normalizeArray(parsed.status),
      priority: normalizeArray(parsed.priority),
      assigneeId: parsed.assigneeId,
      responderId: parsed.responderId,
      tags: parsed.tags,
      domain: parsed.domain,
    })),
  };
}

export async function handleExportTasks(
  params: z.infer<z.ZodObject<typeof exportTasksParams>>,
  backend: BreakpointBackend,
) {
  const parsed = z.object(exportTasksParams).parse(params);
  if (!backend.exportBreakpoints) {
    throw new Error(`Backend "${backend.name}" does not support task export`);
  }
  return {
    tool: "export_tasks",
    ...(await backend.exportBreakpoints({
      status: normalizeArray(parsed.status),
      priority: normalizeArray(parsed.priority),
      assigneeId: parsed.assigneeId,
      responderId: parsed.responderId,
      tags: parsed.tags,
      domain: parsed.domain,
    })),
  };
}

function buildContext(args: {
  title: string;
  description: string;
  interactionKind: InteractionKind;
  nativeTool: string;
  nativeKind: string;
  tags?: string[];
  domain?: string;
  urgency?: Urgency;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}): BreakpointContext {
  return {
    title: args.title,
    description: args.description,
    codeSnippets: [],
    fileReferences: [],
    tags: Array.from(new Set([args.nativeKind, ...(args.tags ?? [])])),
    domain: args.domain,
    urgency: args.urgency,
    interactionKind: args.interactionKind,
    links: args.sourceUrl ? [{ label: "Source", url: args.sourceUrl, kind: "reference" }] : undefined,
    metadata: {
      ...args.metadata,
      nativeTool: args.nativeTool,
      nativeKind: args.nativeKind,
    },
  };
}

function buildRouting(params: {
  responderId?: string;
  responderType?: ResponderType;
  adapter?: string;
  model?: string;
  provider?: string;
  trackerBackend?: string;
  fallbackType?: ResponderType;
}): BreakpointRouting {
  return {
    strategy: "single",
    targetResponders: params.responderId ? [params.responderId] : [],
    timeoutMs: DEFAULT_TIMEOUT_MS,
    presentToUser: params.responderType !== "agent",
    responderType: params.responderType,
    adapter: params.adapter,
    model: params.model,
    provider: params.provider,
    trackerBackend: params.trackerBackend,
    fallbackType: params.fallbackType,
  };
}

function nativeResult(
  tool: NativeTaskResult["tool"],
  breakpoint: Breakpoint,
): NativeTaskResult {
  return {
    tool,
    taskId: breakpoint.id,
    breakpoint,
    routing: breakpoint.routing,
    metadata: {
      nativeTool: tool,
      backendStatus: breakpoint.status,
    },
  };
}

async function getExistingTask(
  backend: BreakpointBackend,
  taskId: string,
): Promise<Breakpoint | undefined> {
  try {
    return await backend.getBreakpoint(taskId);
  } catch {
    return undefined;
  }
}

function matchesResponder(task: Breakpoint, responderId: string): boolean {
  return task.routing.targetResponders.includes(responderId) ||
    task.claimedByResponderId === responderId ||
    task.answers.some((answer) => answer.responderId === responderId);
}

function searchText(task: Breakpoint): string {
  return [
    task.id,
    task.text,
    task.context.title,
    task.context.summary,
    task.context.description,
    task.context.domain,
    ...task.context.tags,
  ].filter(Boolean).join("\n").toLowerCase();
}

function normalizeArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}
