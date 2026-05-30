import type { EffectRecord, ProcessLogger } from "../../runtime/types";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { loadJournal } from "../../storage/journal";
import { readTaskDefinition } from "../../storage/tasks";
import type { JsonRecord } from "../../storage/types";
import type { HookLogger } from "./utils";

interface AgentMuxBreakpoint {
  answers?: Array<{ text?: string; responderId?: string; responderName?: string }>;
  context?: {
    metadata?: {
      agentMux?: JsonRecord;
    };
  };
}

interface TasksMuxModule {
  routeTask?: (task: unknown, context?: unknown) => {
    responderType: string;
    responder?: { adapter?: string; model?: string; id?: string };
    unavailable?: boolean;
    reason?: string;
  };
  AgentMuxResponderBackend?: new (config?: Record<string, unknown>) => {
    submitBreakpoint(params: unknown): Promise<AgentMuxBreakpoint>;
  };
}

export interface ExternalAgentEffectResolution {
  effectId: string;
  status: "ok" | "error";
  resultRef?: string;
  error?: string;
}

export interface ExternalAgentEffectsResult {
  attempted: number;
  resolved: ExternalAgentEffectResolution[];
}

export async function resolveExternalAgentEffectsForStopHook(args: {
  runDir: string;
  workspace?: string;
  model?: string;
  log?: HookLogger;
}): Promise<ExternalAgentEffectsResult> {
  const events = await loadJournal(args.runDir);
  const index = await buildEffectIndex({ runDir: args.runDir, events });
  const pending = index
    .listPendingEffects()
    .filter((record) => record.kind === "agent");
  if (pending.length === 0) {
    return { attempted: 0, resolved: [] };
  }

  let mux: TasksMuxModule;
  try {
    mux = await import("@a5c-ai/tasks-mux") as unknown as TasksMuxModule;
  } catch {
    return { attempted: 0, resolved: [] };
  }

  const resolved: ExternalAgentEffectResolution[] = [];
  for (const record of pending) {
    const taskDef = await readTaskDefinition(args.runDir, record.effectId);
    if (!taskDef || !isExternalAgentTask(taskDef, mux)) {
      continue;
    }
    resolved.push(await resolveOneExternalAgentEffect({
      runDir: args.runDir,
      record,
      taskDef,
      mux,
      workspace: args.workspace,
      model: args.model,
      log: args.log,
    }));
  }

  return { attempted: resolved.length, resolved };
}

function isExternalAgentTask(taskDef: JsonRecord, mux: TasksMuxModule): boolean {
  if (taskDef.kind !== "agent") {
    return false;
  }
  const agent = asRecord(taskDef.agent);
  if (agent?.external === true) {
    return true;
  }
  if (agent?.responderType === "agent") {
    return true;
  }
  if (typeof mux.routeTask === "function") {
    try {
      return mux.routeTask(taskDef)?.responderType === "agent";
    } catch {
      return false;
    }
  }
  return false;
}

async function resolveOneExternalAgentEffect(args: {
  runDir: string;
  record: EffectRecord;
  taskDef: JsonRecord;
  mux: TasksMuxModule;
  workspace?: string;
  model?: string;
  log?: HookLogger;
}): Promise<ExternalAgentEffectResolution> {
  const startedAt = new Date().toISOString();
  try {
    if (typeof args.mux.AgentMuxResponderBackend !== "function") {
      throw new Error("tasks-mux AgentMuxResponderBackend is unavailable");
    }

    const decision = typeof args.mux.routeTask === "function"
      ? args.mux.routeTask(args.taskDef)
      : undefined;
    const agent = asRecord(args.taskDef.agent);
    const adapter = asString(decision?.responder?.adapter)
      ?? asString(decision?.responder?.id)
      ?? asString(agent?.adapter)
      ?? asString(agent?.name);
    if (!adapter) {
      throw new Error(`External agent effect ${args.record.effectId} is missing agent.adapter`);
    }

    const backend = new args.mux.AgentMuxResponderBackend({
      adapter,
      model: asString(decision?.responder?.model) ?? asString(agent?.model) ?? args.model,
      cwd: args.workspace,
    });
    const breakpoint = await backend.submitBreakpoint({
      text: buildAgentPrompt(args.taskDef),
      context: {
        description: asString(args.taskDef.title) ?? args.record.taskId ?? args.record.effectId,
        codeSnippets: [],
        fileReferences: [],
        tags: args.record.labels ?? [],
      },
      routing: {
        strategy: "single",
        targetResponders: decision?.responder?.id ? [decision.responder.id] : [],
        timeoutMs: asNumber(agent?.timeoutMs) ?? 300_000,
        presentToUser: false,
        responderType: "agent",
        adapter,
        model: asString(decision?.responder?.model) ?? asString(agent?.model) ?? args.model,
      },
    });
    const answerText = breakpoint.answers?.[0]?.text ?? "";
    const agentMux = breakpoint.context?.metadata?.agentMux;
    const finishedAt = new Date().toISOString();
    const { commitEffectResult } = await import("../../runtime/commitEffectResult");
    const artifacts = await commitEffectResult({
      runDir: args.runDir,
      effectId: args.record.effectId,
      invocationKey: args.record.invocationKey,
      logger: toProcessLogger(args.log),
      result: {
        status: "ok",
        value: coerceAgentResultValue(args.taskDef, answerText),
        stdout: answerText,
        startedAt,
        finishedAt,
        metadata: agentMux ? { routedThrough: "tasks-mux", agentMux } : { routedThrough: "tasks-mux" },
      },
    });
    await appendAgentMuxCostEvent({
      runDir: args.runDir,
      effectId: args.record.effectId,
      taskId: args.record.taskId,
      model: asString(agentMux?.model) ?? asString(agent?.model) ?? args.model ?? "unknown",
      agentMux,
    });
    args.log?.info(`Resolved external agent effect ${args.record.effectId} through tasks-mux`);
    return { effectId: args.record.effectId, status: "ok", resultRef: artifacts.resultRef };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);
    const { commitEffectResult } = await import("../../runtime/commitEffectResult");
    const artifacts = await commitEffectResult({
      runDir: args.runDir,
      effectId: args.record.effectId,
      invocationKey: args.record.invocationKey,
      logger: toProcessLogger(args.log),
      result: {
        status: "error",
        error: { name: error instanceof Error ? error.name : "ExternalAgentEffectError", message },
        stderr: message,
        startedAt,
        finishedAt,
        metadata: { routedThrough: "tasks-mux" },
      },
    });
    args.log?.warn(`External agent effect ${args.record.effectId} failed through tasks-mux: ${message}`);
    return { effectId: args.record.effectId, status: "error", resultRef: artifacts.resultRef, error: message };
  }
}

function buildAgentPrompt(taskDef: JsonRecord): string {
  const agent = asRecord(taskDef.agent);
  const prompt = agent?.prompt;
  if (typeof prompt === "string") {
    return prompt;
  }
  const promptRecord = asRecord(prompt);
  if (Array.isArray(promptRecord?.instructions)) {
    return promptRecord.instructions.filter((line): line is string => typeof line === "string").join("\n");
  }
  return asString(promptRecord?.task) ?? asString(taskDef.title) ?? "Execute this task";
}

function coerceAgentResultValue(taskDef: JsonRecord, text: string): unknown {
  if (taskDef.outputSchema && text.trim()) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

async function appendAgentMuxCostEvent(args: {
  runDir: string;
  effectId: string;
  taskId?: string;
  model: string;
  agentMux?: JsonRecord;
}): Promise<void> {
  if (!args.agentMux) {
    return;
  }
  const tokenUsage = asRecord(args.agentMux.tokenUsage);
  const cost = asRecord(args.agentMux.cost);
  const inputTokens = firstNumber(tokenUsage?.inputTokens, tokenUsage?.input_tokens, cost?.inputTokens, cost?.input_tokens) ?? 0;
  const outputTokens = firstNumber(tokenUsage?.outputTokens, tokenUsage?.output_tokens, cost?.outputTokens, cost?.output_tokens) ?? 0;
  const costUsd = firstNumber(cost?.costUsd, cost?.totalCostUsd, cost?.usd, args.agentMux.costUsd, args.agentMux.totalCostUsd);
  if (inputTokens === 0 && outputTokens === 0 && costUsd === undefined) {
    return;
  }
  const { appendCostEvent } = await import("../../cost/journal");
  await appendCostEvent(args.runDir, {
    model: args.model,
    inputTokens,
    outputTokens,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    cacheCreation5mTokens: 0,
    cacheCreation1hTokens: 0,
    effectId: args.effectId,
    taskId: args.taskId,
    taskKind: "agent",
    source: "tasks-mux:agent-mux",
    idempotencyKey: `tasks-mux:agent-mux:${args.effectId}`,
    durationMs: firstNumber(args.agentMux.durationMs),
    costUsd,
  });
}

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  return values.find((value): value is number => asNumber(value) !== undefined);
}

function toProcessLogger(log?: HookLogger): ProcessLogger | undefined {
  return log ? (...args: unknown[]) => log.info(args.map(String).join(" ")) : undefined;
}
