import { z } from "zod";
import type { BreakpointBackend } from "../../backend.js";
import type {
  Breakpoint,
  BreakpointContext,
  BreakpointRouting,
  InteractionKind,
  ResponderType,
  Urgency,
} from "../../types.js";
import { DEFAULT_TIMEOUT_MS } from "../../types.js";

const responderTypeSchema = z.enum(["human", "agent", "tracker", "internal", "auto"]);
const urgencySchema = z.enum(["low", "medium", "high"]);

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
  sourceUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  projectId: z.string().min(1).optional(),
  repoId: z.string().min(1).optional(),
};

export const createTodoDescription =
  "Create a todo routed through tasks-mux. The todo is stored as a task-like breakpoint so existing responder backends, routing, and audit trails remain the source of truth.";

export const createTodoParams = {
  title: z.string().min(1).describe("Short todo title."),
  description: z.string().optional().describe("Optional todo details."),
  ...nativeRoutingParams,
  ...nativeContextParams,
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const assignTaskDescription =
  "Assign a task through tasks-mux responder routing. Use this instead of direct agent delegation when the work should be visible to the task router.";

export const assignTaskParams = {
  title: z.string().min(1).describe("Task title."),
  instructions: z.string().optional().describe("Task instructions or acceptance notes."),
  assignee: z.string().min(1).optional().describe("Responder id to assign to."),
  ...nativeRoutingParams,
  ...nativeContextParams,
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const searchTasksDescription =
  "Search task-like breakpoints currently visible to tasks-mux. This is read-only and uses the configured BreakpointBackend.";

export const searchTasksParams = {
  query: z.string().optional(),
  status: z.string().optional(),
  responderId: z.string().optional(),
  domain: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional(),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

export const escalateDescription =
  "Escalate an existing task or create a high-urgency intervention through tasks-mux routing.";

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

export interface NativeTaskResult {
  tool: "create_todo" | "assign_task" | "escalate";
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
    projectId: parsed.projectId,
    repoId: parsed.repoId,
  });

  return nativeResult("assign_task", breakpoint);
}

export async function handleSearchTasks(
  params: z.infer<z.ZodObject<typeof searchTasksParams>>,
  backend: BreakpointBackend,
): Promise<SearchTasksResult> {
  const parsed = z.object(searchTasksParams).parse(params);
  const pending = await backend.listPendingBreakpoints(parsed.responderId);
  const query = parsed.query?.toLowerCase();
  const tags = parsed.tags?.map((tag) => tag.toLowerCase()) ?? [];
  const domain = parsed.domain?.toLowerCase();
  const filtered = pending.filter((task) => {
    if (parsed.status && task.status !== parsed.status) return false;
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
    projectId: parsed.projectId,
    repoId: parsed.repoId,
  });

  return nativeResult("escalate", breakpoint);
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
