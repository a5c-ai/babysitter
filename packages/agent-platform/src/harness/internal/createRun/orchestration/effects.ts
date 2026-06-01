import * as path from "node:path";
import * as readline from "node:readline";
import {
  isRetryableEffectError,
  buildBreakpointResult,
  invokePromptEffect,
  invokeAgentHarness,
} from "./effectsHelpers";
import {
  getHookDecisionResult,
  resolveHookDecisionResult,
} from "./hookDecisionEffects";
export { readProcessFileFingerprint } from "./effectsHelpers";
import {
  evaluateApprovalChain,
  type ApprovalChainDefinition,
  type ApprovalChainState,
} from "../../../../breakpoints/approvalChains";
import {
  compactSession as compactSessionOverlay,
  shouldAutoCompact as shouldAutoCompactSession,
  type CompactionConfig,
  type CompactionResult,
} from "../../../../compression/compaction";
import {
  McpToolExecutor,
  type McpToolExecutionRequest,
} from "../../../../mcp/client/executor";
import {
  McpClientManager,
  type McpTransportFactory,
} from "../../../../mcp/client/manager";
import { McpToolRegistry } from "../../../../mcp/client/toolRegistry";
import type { McpToolResult } from "../../../../mcp/client/types";
import {
  checkBudget as checkSessionBudget,
  markThresholdsTriggered as markSessionThresholdsTriggered,
  setSessionPaused as setSessionCostPaused,
  updateSessionCost as updateSessionCostState,
  type BudgetCheckResult,
} from "../../../../session/cost";
import {
  addDecision as addSessionDecision,
  saveContextSnapshot as saveSessionContextSnapshot,
} from "../../../../session/history";
import { getAdapterByName } from "../../../";
import type { StreamingOutputOptions } from "../../../types";
import {
  commitEffectResult,
  createRun,
  orchestrateIteration,
} from "@a5c-ai/babysitter-sdk";
import {
  BOLD,
  DEFAULT_EFFECT_RETRY_CONFIG,
  WORKER_TIMEOUT_MS,
  AgentCoreSessionHandle,
  YELLOW,
  buildPiWorkerSessionOptions,
  createAgentCoreSession,
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
  emitAmuxEvent,
  isInternalHarness,
  isProcessModuleLoadFailure,
  promptPiWithRetry,
  resolveTaskHarness,
  shellQuoteArg,
  type AskUserQuestionResponse,
  type CompressionConfig,
  type EffectAction,
  type EffectRetryConfig,
  type HarnessDiscoveryResult,
  type IterationResult,
  type ResolveEffectResult,
} from "../utils";
import {
  buildAgentPrompt,
  coerceAgentResultValue,
  execShellEffect,
} from "../planProcess";
import {
  EFFECT_RETRY_DELAYS_OVERRIDE,
  PROCESS_MODULE_LOAD_RETRY_DELAYS_MS,
} from "./constants";
import {
  dispatchEffectActions,
  harnessSupportsConcurrentEffects,
} from "./dispatch";

async function importOptionalModule(specifier: string): Promise<unknown> {
  return import(specifier);
}

type McpExecutorLike = {
  execute(request: McpToolExecutionRequest): Promise<McpToolResult>;
};

interface McpRoutingOptions {
  executor?: McpExecutorLike;
  manager?: McpClientManager;
  registry?: McpToolRegistry;
  toolRegistry?: {
    registerServer(server: {
      id: string;
      name: string;
      type: "mcp";
      tools: Array<{
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
        source: "mcp";
        sourceQualifier?: string;
        server?: string;
      }>;
    }): void;
  };
  mcpBridge?: {
    registerServer(
      config: { id: string; name: string; transport: "stdio" },
      tools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>,
    ): void;
  };
  dispatcher?: {
    dispatch(
      context: { toolName: string; input: unknown; caller?: string; runId?: string; sessionId?: string },
      executor: () => Promise<unknown>,
    ): Promise<{ output: unknown; durationMs: number; error?: string | { message?: string } }>;
  };
  transportFactory?: McpTransportFactory;
  stateDir?: string;
  autoConnect?: boolean;
  cacheTtlMs?: number;
}

interface EffectResolverOptions {
  workspace?: string;
  model?: string;
  interactive?: boolean;
  compressionConfig?: CompressionConfig | null;
  streaming?: StreamingOutputOptions;
  runsDir?: string;
  runId?: string;
  runDir?: string;
  sessionId?: string;
  maxIterations?: number;
  verbose?: boolean;
  outputMode?: "cli" | "json" | "tui" | "amux-events";
  mcp?: McpRoutingOptions;
}

export interface PostEffectOverlayArgs {
  runId?: string;
  runDir?: string;
  runsDir?: string;
  stateDir?: string;
  sessionId?: string;
  effectCost?: {
    totalCostUsd?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  estimatedStateTokens?: number;
  compactionConfig?: CompactionConfig | null;
  updateSessionCost?: typeof updateSessionCostState;
  checkBudget?: typeof checkSessionBudget;
  compactSession?: typeof compactSessionOverlay;
  shouldAutoCompact?: typeof shouldAutoCompactSession;
  markThresholdsTriggered?: typeof markSessionThresholdsTriggered;
  setSessionPaused?: typeof setSessionCostPaused;
  addDecision?: typeof addSessionDecision;
  saveContextSnapshot?: typeof saveSessionContextSnapshot;
  effectSummary?: {
    effectId: string;
    taskId?: string;
    kind?: string;
    title?: string;
    status: "ok" | "error";
  };
}

export interface PostEffectOverlayResult {
  budget?: BudgetCheckResult;
  budgetEnforcement?: {
    paused: boolean;
    pauseReason?: string;
  };
  compaction?: {
    triggered: boolean;
    results: CompactionResult[];
  };
}

export function resolveHarnessSessionIdForBinding(
  args: { selectedHarnessName: string },
  adapter: NonNullable<ReturnType<typeof getAdapterByName>>,
  orchestrationSession?: AgentCoreSessionHandle | null,
): string | undefined {
  if (isInternalHarness(args.selectedHarnessName) && orchestrationSession?.sessionId) {
    process.env.PI_SESSION_ID = process.env.PI_SESSION_ID || orchestrationSession.sessionId;
    process.env.OMP_SESSION_ID = process.env.OMP_SESSION_ID || orchestrationSession.sessionId;
  }
  const resolved = adapter.resolveSessionId({});
  if (resolved) {
    return resolved;
  }
  return isInternalHarness(args.selectedHarnessName)
    ? orchestrationSession?.sessionId
    : undefined;
}

export async function resolveEffect(
  action: EffectAction,
  harnessName: string,
  options: EffectResolverOptions,
  piSession?: AgentCoreSessionHandle | null,
  discovered?: HarnessDiscoveryResult[],
  rl?: readline.Interface | null,
  json?: boolean,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult> {
  const hookResult = getHookDecisionResult(action);
  if (hookResult) {
    const hookResolution = resolveHookDecisionResult(action, hookResult, {
      maxRetries: (action.taskDef?.metadata as Record<string, unknown> | undefined)?.maxRetries as number | undefined,
    });
    if (hookResolution) {
      return hookResolution;
    }
  }

  const kind = action.kind;
  if (kind === "mcp" || getMcpTaskConfig(action)) {
    return resolveMcpEffect(action, options);
  }

  const tasksMuxResult = await resolveViaTasksMuxIfRoutable(
    action,
    options,
    rl,
    json,
    askUserQuestionHandler,
  );
  if (tasksMuxResult) {
    return tasksMuxResult;
  }

  if (kind === "node" || kind === "orchestrator_task") {
    const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
    const prompt = typeof meta?.prompt === "string"
      ? meta.prompt
      : action.taskDef?.title ?? `Execute task ${action.taskId ?? action.effectId}`;
    return invokePromptEffect(
      action,
      discovered ? resolveTaskHarness(action, harnessName, discovered) : harnessName,
      prompt,
      options,
      piSession,
    );
  }
  if (kind === "shell") {
    const shellDef = action.taskDef?.shell as Record<string, unknown> | undefined;
    const shellMeta = action.taskDef?.metadata as Record<string, unknown> | undefined;
    const command = typeof shellDef?.command === "string"
      ? shellDef.command
      : typeof shellMeta?.command === "string"
        ? shellMeta.command
        : "echo";
    const shellArgs = Array.isArray(shellDef?.args)
      ? shellDef.args.filter((arg): arg is string => typeof arg === "string")
      : Array.isArray(shellMeta?.args)
        ? shellMeta.args.filter((arg): arg is string => typeof arg === "string")
        : [];
    const cwd = typeof shellDef?.cwd === "string"
      ? shellDef.cwd
      : typeof shellMeta?.cwd === "string"
        ? shellMeta.cwd
        : options.workspace;
    if (piSession) {
      const bashResult = await piSession.executeBash(
        [command, ...shellArgs.map(shellQuoteArg)].join(" "),
      );
      if (bashResult.exitCode === 0) {
        return { status: "ok", value: bashResult.output, stdout: bashResult.output };
      }
      return {
        status: "ok",
        value: {
          success: false,
          exitCode: bashResult.exitCode ?? 1,
          stdout: bashResult.output,
          stderr: "",
          error: `Shell command exited with code ${bashResult.exitCode ?? "null"}`,
        },
        stdout: bashResult.output,
      };
    }
    const shellResult = await execShellEffect(command, shellArgs, cwd);
    if (shellResult.exitCode === 0) {
      return {
        status: "ok",
        value: shellResult.stdout,
        stdout: shellResult.stdout,
        stderr: shellResult.stderr,
      };
    }
    return {
      status: "ok",
      value: {
        success: false,
        exitCode: shellResult.exitCode,
        stdout: shellResult.stdout,
        stderr: shellResult.stderr,
        error: `Shell command exited with code ${shellResult.exitCode}`,
      },
      stdout: shellResult.stdout,
      stderr: shellResult.stderr,
    };
  }
  if (kind === "breakpoint") {
    const chainResult = resolveConfiguredApprovalChain(action);
    if (chainResult && chainResult.status !== "approved") {
      return {
        status: "ok",
        value: {
          approved: false,
          option: chainResult.status,
          approvalChain: chainResult,
        },
      };
    }
    return resolveBreakpointLikeEffect(action, options, rl, json, askUserQuestionHandler);
  }
  if (kind === "sleep") {
    const targetMs = action.taskDef?.sleep?.targetEpochMs;
    if (typeof targetMs === "number") {
      const delay = Math.max(0, targetMs - Date.now());
      if (delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
    return { status: "ok", value: { sleptUntil: new Date().toISOString() } };
  }
  if (kind === "agent") {
    const prompt = buildAgentPrompt(action.taskDef as Record<string, unknown>);
    const taskHarness = discovered ? resolveTaskHarness(action, harnessName, discovered) : harnessName;
    if (taskHarness !== harnessName && !isInternalHarness(taskHarness)) {
      return invokeAgentHarness(action, taskHarness, prompt, options);
    }
    if (piSession) {
      const piResult = await promptPiWithRetry({
        session: piSession,
        message: prompt,
        timeout: WORKER_TIMEOUT_MS,
        label: `effect ${action.effectId}`,
      });
      return {
        status: piResult.success ? "ok" : "error",
        value: piResult.success
          ? coerceAgentResultValue(
            action.taskDef as Record<string, unknown>,
            piResult.output,
          )
          : undefined,
        error: piResult.success ? undefined : new Error(piResult.output),
        stdout: piResult.output,
      };
    }
    return invokeAgentHarness(action, taskHarness, prompt, options);
  }
  if (kind === "subprocess") {
    return invokeSubprocessEffect(
      action,
      discovered ? resolveTaskHarness(action, harnessName, discovered) : harnessName,
      options,
      discovered,
      rl,
      json,
      askUserQuestionHandler,
    );
  }
  const fallbackPrompt = action.taskDef?.title ?? `Handle effect ${action.effectId} (kind: ${kind})`;
  return invokePromptEffect(action, harnessName, fallbackPrompt, options, undefined);
}

function getMcpTaskConfig(action: EffectAction): Record<string, unknown> | undefined {
  const taskDef = action.taskDef as Record<string, unknown> | undefined;
  const direct = taskDef?.mcp;
  if (isPlainRecord(direct)) {
    return direct;
  }
  const metadata = taskDef?.metadata;
  if (isPlainRecord(metadata) && isPlainRecord(metadata.mcp)) {
    return metadata.mcp;
  }
  return undefined;
}

function getMcpRequest(action: EffectAction, options: EffectResolverOptions): McpToolExecutionRequest {
  const config = getMcpTaskConfig(action);
  if (!config) {
    throw new Error(`MCP effect ${action.effectId} is missing taskDef.mcp configuration`);
  }
  const qualifiedName = typeof config.qualifiedName === "string"
    ? config.qualifiedName
    : typeof config.tool === "string"
      ? config.tool
      : undefined;
  const colonIdx = qualifiedName?.indexOf(":") ?? -1;
  const serverName = typeof config.serverName === "string"
    ? config.serverName
    : colonIdx > 0 && qualifiedName
      ? qualifiedName.slice(0, colonIdx)
      : undefined;
  const toolName = typeof config.toolName === "string"
    ? config.toolName
    : colonIdx > 0 && qualifiedName
      ? qualifiedName.slice(colonIdx + 1)
      : undefined;
  if (!serverName || !toolName) {
    throw new Error(`MCP effect ${action.effectId} requires serverName and toolName`);
  }
  const args = isPlainRecord(config.args) ? config.args : {};
  const context = {
    ...(isPlainRecord(args.context) ? args.context : {}),
    ...(options.runId ? { runId: options.runId } : {}),
    ...(options.runDir ? { runDir: options.runDir } : {}),
    ...(options.sessionId ? { sessionId: options.sessionId } : {}),
    ...(options.workspace ? { workspace: options.workspace } : {}),
  };
  return {
    serverName,
    toolName,
    args: {
      ...args,
      context,
    },
  };
}

async function resolveMcpExecutor(options: EffectResolverOptions): Promise<McpExecutorLike> {
  if (options.mcp?.executor) {
    return options.mcp.executor;
  }
  const manager = options.mcp?.manager ?? (
    options.mcp?.transportFactory
      ? new McpClientManager({
        stateDir: options.mcp.stateDir ?? options.runDir ?? process.cwd(),
        transportFactory: options.mcp.transportFactory,
      })
      : undefined
  );
  if (!manager) {
    throw new Error("MCP effect routing requires an executor, manager, or transportFactory");
  }
  await manager.initialize(options.mcp?.autoConnect ?? true);
  const registry = options.mcp?.registry ?? new McpToolRegistry(manager, {
    cacheTtlMs: options.mcp?.cacheTtlMs,
    unifiedRegistry: options.mcp?.toolRegistry,
    mcpBridge: options.mcp?.mcpBridge,
  });
  await registry.refreshAll();
  return new McpToolExecutor(manager);
}

function mcpResultToStdout(result: McpToolResult): string {
  return result.content
    .map((item) => typeof item.text === "string" ? item.text : typeof item.data === "string" ? item.data : "")
    .filter(Boolean)
    .join("\n");
}

function streamMcpOutput(text: string, streaming?: StreamingOutputOptions): void {
  if (!streaming?.onLine || !text) {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    if (line.length > 0) {
      streaming.onLine(line, "stdout");
    }
  }
}

async function resolveMcpEffect(
  action: EffectAction,
  options: EffectResolverOptions,
): Promise<ResolveEffectResult> {
  const executor = await resolveMcpExecutor(options);
  const request = getMcpRequest(action, options);
  const result = options.mcp?.dispatcher
    ? await dispatchMcpTool(options.mcp.dispatcher, executor, request, options)
    : await executor.execute(request);
  const stdout = mcpResultToStdout(result);
  streamMcpOutput(stdout, options.streaming);
  return {
    status: result.success ? "ok" : "error",
    value: result,
    error: result.success ? undefined : new Error(result.error ?? stdout),
    stdout,
    stderr: result.success ? undefined : result.error,
  };
}

async function dispatchMcpTool(
  dispatcher: NonNullable<McpRoutingOptions["dispatcher"]>,
  executor: McpExecutorLike,
  request: McpToolExecutionRequest,
  options: EffectResolverOptions,
): Promise<McpToolResult> {
  const dispatched = await dispatcher.dispatch(
    {
      toolName: request.toolName,
      input: request.args,
      caller: "agent-platform:mcp",
      ...(options.runId ? { runId: options.runId } : {}),
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
    },
    async () => executor.execute(request),
  );
  if (dispatched.error) {
    return {
      success: false,
      content: [],
      error: typeof dispatched.error === "string"
        ? dispatched.error
        : dispatched.error.message ?? "MCP tool dispatch failed",
      durationMs: dispatched.durationMs,
    };
  }
  return dispatched.output as McpToolResult;
}

function resolveConfiguredApprovalChain(action: EffectAction): ReturnType<typeof evaluateApprovalChain> | undefined {
  const metadata = action.taskDef?.metadata;
  if (!isPlainRecord(metadata)) {
    return undefined;
  }
  if (!isApprovalChainDefinition(metadata.approvalChain) || !isApprovalChainState(metadata.approvalChainState)) {
    return undefined;
  }
  return evaluateApprovalChain(metadata.approvalChain, metadata.approvalChainState);
}

function isApprovalChainDefinition(value: unknown): value is ApprovalChainDefinition {
  return isPlainRecord(value)
    && typeof value.chainId === "string"
    && Array.isArray(value.steps);
}

function isApprovalChainState(value: unknown): value is ApprovalChainState {
  return isPlainRecord(value)
    && typeof value.chainId === "string"
    && typeof value.currentStepIndex === "number"
    && Array.isArray(value.completedSteps);
}

export async function applyPostEffectOrchestrationOverlays(
  args: PostEffectOverlayArgs,
): Promise<PostEffectOverlayResult> {
  const result: PostEffectOverlayResult = {};
  const updateSessionCost = args.updateSessionCost ?? updateSessionCostState;
  const checkBudget = args.checkBudget ?? checkSessionBudget;
  const compactSession = args.compactSession ?? compactSessionOverlay;
  const shouldAutoCompact = args.shouldAutoCompact ?? shouldAutoCompactSession;
  const markThresholdsTriggered = args.markThresholdsTriggered ?? markSessionThresholdsTriggered;
  const setSessionPaused = args.setSessionPaused ?? setSessionCostPaused;
  const addDecision = args.addDecision ?? addSessionDecision;
  const saveContextSnapshot = args.saveContextSnapshot ?? saveSessionContextSnapshot;

  if (args.stateDir && args.sessionId && args.runId && args.effectCost) {
    const costState = await updateSessionCost(args.stateDir, args.sessionId, {
      runId: args.runId,
      costUsd: args.effectCost.totalCostUsd ?? 0,
      inputTokens: args.effectCost.inputTokens ?? 0,
      outputTokens: args.effectCost.outputTokens ?? 0,
    });
    result.budget = checkBudget(costState);
    await markThresholdsTriggered(
      args.stateDir,
      args.sessionId,
      result.budget.alerts.map((alert) => alert.thresholdPct),
    );
    if (result.budget.shouldPause) {
      await setSessionPaused(args.stateDir, args.sessionId, true);
      result.budgetEnforcement = {
        paused: true,
        pauseReason: result.budget.pauseReason,
      };
    } else {
      result.budgetEnforcement = { paused: false };
    }
  }

  if (args.stateDir && args.sessionId && args.runId && args.effectSummary) {
    const title = args.effectSummary.title ?? args.effectSummary.taskId ?? args.effectSummary.effectId;
    await addDecision(args.stateDir, args.sessionId, {
      runId: args.runId,
      description: `Resolved ${args.effectSummary.kind ?? "unknown"} effect: ${title}`,
      rationale: `Effect ${args.effectSummary.effectId} completed with status ${args.effectSummary.status}`,
    });
    await saveContextSnapshot(args.stateDir, args.sessionId, {
      runId: args.runId,
      snapshot: {
        effectId: args.effectSummary.effectId,
        taskId: args.effectSummary.taskId,
        kind: args.effectSummary.kind,
        title: args.effectSummary.title,
        status: args.effectSummary.status,
      },
    });
  }

  if (
    args.stateDir &&
    args.sessionId &&
    args.runsDir &&
    args.compactionConfig &&
    typeof args.estimatedStateTokens === "number" &&
    shouldAutoCompact(args.estimatedStateTokens, args.compactionConfig)
  ) {
    result.compaction = {
      triggered: true,
      results: await compactSession(
        args.stateDir,
        args.sessionId,
        args.runsDir,
        args.compactionConfig,
      ),
    };
  } else {
    result.compaction = { triggered: false, results: [] };
  }

  return result;
}

async function resolveViaTasksMuxIfRoutable(
  action: EffectAction,
  options: EffectResolverOptions,
  rl?: readline.Interface | null,
  json?: boolean,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult | undefined> {
  if (action.kind !== "agent" && action.kind !== "breakpoint") {
    return undefined;
  }

  let mux: {
    routeTask?: (task: unknown, context?: unknown) => {
      responderType: string;
      route: string;
      responder?: { adapter?: string; model?: string; id?: string };
      unavailable?: boolean;
      reason?: string;
    };
    AgentMuxResponderBackend?: new (config?: Record<string, unknown>) => {
      submitBreakpoint(params: unknown): Promise<{
        answers: Array<{ text: string; responderId: string; responderName: string }>;
      }>;
    };
  };
  try {
    mux = await importOptionalModule("@a5c-ai/agent-mux-tasks") as typeof mux;
  } catch {
    return undefined;
  }

  if (typeof mux.routeTask !== "function") {
    return undefined;
  }

  const decision = mux.routeTask(action.taskDef);
  if (decision.responderType === "internal") {
    return undefined;
  }
  if (decision.responderType === "human") {
    return resolveBreakpointLikeEffect(action, options, rl, json, askUserQuestionHandler);
  }
  if (decision.responderType === "tracker") {
    if (decision.unavailable) {
      return {
        status: "ok",
        value: {
          success: false,
          routedThrough: "tasks-mux",
          responderType: "tracker",
          error: decision.reason ?? "ExternalTrackerBackend unavailable",
        },
        stdout: decision.reason,
      };
    }
    return undefined;
  }

  if (decision.responderType !== "agent") {
    return undefined;
  }
  const fallbackToInternal = shouldFallbackExternalAgentToInternal(action.taskDef);
  if (typeof mux.AgentMuxResponderBackend !== "function") {
    if (fallbackToInternal) {
      return undefined;
    }
    return {
      status: "error",
      error: new Error("tasks-mux AgentMuxResponderBackend is unavailable"),
    };
  }

  const prompt = buildAgentPrompt(action.taskDef as Record<string, unknown>);
  let breakpoint: { answers: Array<{ text: string; responderId: string; responderName: string }> };
  try {
    const backend = new mux.AgentMuxResponderBackend({
      adapter: decision.responder?.adapter ?? decision.responder?.id,
      model: decision.responder?.model ?? options.model,
      cwd: options.workspace,
    });
    breakpoint = await backend.submitBreakpoint({
      text: prompt,
      context: {
        description: action.taskDef?.title ?? action.taskId ?? action.effectId,
        codeSnippets: [],
        fileReferences: [],
        tags: action.labels ?? [],
      },
      routing: {
        strategy: "single",
        targetResponders: decision.responder?.id ? [decision.responder.id] : [],
        timeoutMs: readExternalAgentTimeoutMs(action.taskDef) ?? 300_000,
        presentToUser: false,
        responderType: "agent",
        adapter: decision.responder?.adapter ?? decision.responder?.id,
        model: decision.responder?.model ?? options.model,
      },
    });
  } catch (err) {
    if (fallbackToInternal) {
      return undefined;
    }
    return {
      status: "error",
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
  const answer = breakpoint.answers[0];
  return {
    status: "ok",
    value: coerceAgentResultValue(action.taskDef as Record<string, unknown>, answer?.text ?? ""),
    stdout: answer?.text ?? "",
  };
}

async function resolveBreakpointLikeEffect(
  action: EffectAction,
  options: EffectResolverOptions,
  rl?: readline.Interface | null,
  json?: boolean,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult> {
  const question = (action.taskDef as Record<string, unknown>)?.question as string | undefined
    ?? action.taskDef?.title
    ?? "Breakpoint reached. Continue?";
  const approvalPrompt = createApprovalAskUserQuestion(question);
  const approvalKey = approvalPrompt.questions[0]?.header ?? "Decision";
  if (options.interactive && rl) {
    if (!json) {
      process.stderr.write(`\n${YELLOW}${BOLD}BREAKPOINT ${question}\n`);
    }
    const { promptAskUserQuestionWithReadline } = await import("../../../../interaction");
    const response = await promptAskUserQuestionWithReadline(rl, approvalPrompt);
    return buildBreakpointResult(response, approvalKey);
  }
  if (options.interactive && askUserQuestionHandler) {
    const response = await askUserQuestionHandler(approvalPrompt) as AskUserQuestionResponse;
    return buildBreakpointResult(response, approvalKey);
  }
  return buildBreakpointResult(
    createAskUserQuestionResponse(approvalPrompt, { [approvalKey]: "Approve" }),
    approvalKey,
  );
}

function shouldFallbackExternalAgentToInternal(taskDef: EffectAction["taskDef"] | undefined): boolean {
  const agent = isPlainRecord(taskDef?.agent) ? taskDef.agent : {};
  const metadata = isPlainRecord(taskDef?.metadata) ? taskDef.metadata : {};
  return agent.fallbackToInternal === true
    || metadata.fallbackToInternal === true
    || agent.fallbackType === "internal"
    || metadata.fallbackType === "internal";
}

function readExternalAgentTimeoutMs(taskDef: EffectAction["taskDef"] | undefined): number | undefined {
  const agent = isPlainRecord(taskDef?.agent) ? taskDef.agent : {};
  return typeof agent.timeoutMs === "number" ? agent.timeoutMs : undefined;
}

function parseSubprocessSpec(
  action: EffectAction,
  workspace?: string,
): {
  processPath: string;
  exportName?: string;
  processId: string;
  prompt?: string;
  inputs?: unknown;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  harness?: string;
  model?: string;
  maxIterations?: number;
  shareSession: boolean;
  metadata?: Record<string, unknown>;
} {
  const subprocess = action.taskDef?.subprocess;
  if (!subprocess || typeof subprocess.processPath !== "string" || !subprocess.processPath.trim()) {
    throw new Error(`Subprocess effect ${action.effectId} is missing subprocess.processPath`);
  }

  const resolvedProcessPath = path.isAbsolute(subprocess.processPath)
    ? path.resolve(subprocess.processPath)
    : path.resolve(workspace ?? process.cwd(), subprocess.processPath);
  const processId = typeof subprocess.processId === "string" && subprocess.processId.trim()
    ? subprocess.processId.trim()
    : path.basename(resolvedProcessPath, path.extname(resolvedProcessPath));

  return {
    processPath: resolvedProcessPath,
    exportName: typeof subprocess.exportName === "string" ? subprocess.exportName : undefined,
    processId,
    prompt: typeof subprocess.prompt === "string" ? subprocess.prompt : undefined,
    inputs: subprocess.inputs,
    inputSchema: isPlainRecord(subprocess.inputSchema) ? subprocess.inputSchema : undefined,
    outputSchema: isPlainRecord(subprocess.outputSchema) ? subprocess.outputSchema : undefined,
    harness: typeof subprocess.harness === "string" ? subprocess.harness : undefined,
    model: typeof subprocess.model === "string" ? subprocess.model : undefined,
    maxIterations: typeof subprocess.maxIterations === "number" ? subprocess.maxIterations : undefined,
    shareSession: subprocess.shareSession !== false,
    metadata: subprocess.metadata,
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function summarizeSubprocessValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 240 ? `${value.slice(0, 237)}...` : value;
  }
  if (value instanceof Error) {
    return value.message;
  }
  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 240 ? `${serialized.slice(0, 237)}...` : serialized;
  } catch {
    return String(value);
  }
}

async function disposeWorkerSession(session: AgentCoreSessionHandle | null | undefined): Promise<void> {
  if (!session) {
    return;
  }
  await session.abort().catch(() => undefined);
  session.dispose();
}

async function invokeSubprocessEffect(
  action: EffectAction,
  harnessName: string,
  options: EffectResolverOptions,
  discovered?: HarnessDiscoveryResult[],
  rl?: readline.Interface | null,
  json?: boolean,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult> {
  if (!options.runsDir || !options.runId) {
    return {
      status: "error",
      error: new Error("Subprocess effects require runsDir and parent runId in the harness resolver."),
    };
  }

  const spec = parseSubprocessSpec(action, options.workspace);
  const childHarness = spec.harness ?? harnessName;
  const childModel = spec.model ?? options.model;
  const maxIterations = spec.maxIterations ?? options.maxIterations ?? 65_000;
  const childPrompt = spec.prompt ?? action.taskDef?.title ?? `Run subprocess ${spec.processId}`;

  const childRun = await createRun({
    runsDir: options.runsDir,
    harness: childHarness,
    process: {
      processId: spec.processId,
      importPath: spec.processPath,
      ...(spec.exportName ? { exportName: spec.exportName } : {}),
    },
    prompt: spec.prompt,
    inputs: spec.inputs,
    inputSchema: spec.inputSchema,
    outputSchema: spec.outputSchema,
    metadata: spec.metadata,
    nested: {
      parentRunId: options.runId,
      parentEffectId: action.effectId,
      parentInvocationKey: action.invocationKey,
      ...(spec.shareSession && options.sessionId ? { sessionId: options.sessionId } : {}),
      shareSession: spec.shareSession,
      skipRunStartHook: true,
    },
  });

  emitAmuxEvent(
    {
      type: "subagent_spawn",
      runId: options.runId,
      agent: "babysitter",
      timestamp: new Date().toISOString(),
      subagentId: childRun.runId,
      agentName: "babysitter",
      prompt: childPrompt,
    },
    Boolean(json),
    options.outputMode,
  );

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const iterationResult = await orchestrateIterationWithProcessLoadRetry({ runDir: childRun.runDir });
    if (iterationResult.status === "waiting") {
      await dispatchEffectActions({
        actions: iterationResult.nextActions,
        concurrentEffects: harnessSupportsConcurrentEffects(childHarness, discovered),
        resolveAction: async (childAction) => {
          const effectiveHarness = discovered
            ? resolveTaskHarness(childAction, childHarness, discovered)
            : childHarness;
          let workerSession: AgentCoreSessionHandle | null = null;
          let workerSessionFactory: (() => AgentCoreSessionHandle) | undefined;
          if (childAction.kind === "shell" || isInternalHarness(effectiveHarness)) {
            const createWorkerSession = () => createAgentCoreSession(buildPiWorkerSessionOptions({
              action: childAction,
              workspace: options.workspace,
              model: childModel,
            }));
            workerSession = createWorkerSession();
            workerSessionFactory = createWorkerSession;
          }
          try {
            const childEffectResult = await resolveEffectWithRetry(
              childAction,
              childHarness,
              {
                workspace: options.workspace,
                model: childModel,
                interactive: options.interactive,
                compressionConfig: options.compressionConfig,
                streaming: options.streaming,
                runsDir: options.runsDir,
                runId: childRun.runId,
                runDir: childRun.runDir,
                sessionId: spec.shareSession ? options.sessionId : undefined,
                maxIterations,
                verbose: options.verbose,
                outputMode: options.outputMode,
              },
              workerSession,
              discovered,
              rl,
              json,
              workerSessionFactory,
              disposeWorkerSession,
              askUserQuestionHandler,
            );
            return childEffectResult;
          } finally {
            await disposeWorkerSession(workerSession);
          }
        },
        commitAction: async ({ action: childAction, result: childEffectResult, startedAt, finishedAt }) => {
          await commitEffectResult({
            runDir: childRun.runDir,
            effectId: childAction.effectId,
            invocationKey: childAction.invocationKey,
            result: {
              status: childEffectResult.status,
              value: childEffectResult.value,
              error: childEffectResult.error,
              stdout: childEffectResult.stdout,
              stderr: childEffectResult.stderr,
              startedAt,
              finishedAt,
            },
          });
        },
      });
      continue;
    }

    if (iterationResult.status === "completed") {
      emitAmuxEvent(
        {
          type: "subagent_result",
          runId: options.runId,
          agent: "babysitter",
          timestamp: new Date().toISOString(),
          subagentId: childRun.runId,
          agentName: "babysitter",
          summary: summarizeSubprocessValue(iterationResult.output),
        },
        Boolean(json),
        options.outputMode,
      );
      return {
        status: "ok",
        value: {
          runId: childRun.runId,
          runDir: childRun.runDir,
          output: iterationResult.output,
        },
      };
    }

    const message = iterationResult.status === "halted"
      ? iterationResult.reason
      : "error" in iterationResult && iterationResult.error instanceof Error
        ? iterationResult.error.message
        : "error" in iterationResult
          ? summarizeSubprocessValue(iterationResult.error)
          : summarizeSubprocessValue(iterationResult);
    emitAmuxEvent(
      {
        type: "subagent_error",
        runId: options.runId,
        agent: "babysitter",
        timestamp: new Date().toISOString(),
        subagentId: childRun.runId,
        agentName: "babysitter",
        error: message,
      },
      Boolean(json),
      options.outputMode,
    );
    return {
      status: "error",
      error: new Error(`Nested run ${childRun.runId} failed: ${message}`),
      stderr: message,
    };
  }

  const timeoutMessage = `Nested run ${childRun.runId} reached max iterations (${maxIterations}) without completion.`;
  emitAmuxEvent(
    {
      type: "subagent_error",
      runId: options.runId,
      agent: "babysitter",
      timestamp: new Date().toISOString(),
      subagentId: childRun.runId,
      agentName: "babysitter",
      error: timeoutMessage,
    },
    Boolean(json),
    options.outputMode,
  );
  return {
    status: "error",
    error: new Error(timeoutMessage),
    stderr: timeoutMessage,
  };
}

export async function resolveEffectWithRetry(
  action: EffectAction,
  harnessName: string,
  options: EffectResolverOptions & {
    retryConfig?: Partial<EffectRetryConfig>;
  },
  piSession?: AgentCoreSessionHandle | null,
  discovered?: HarnessDiscoveryResult[],
  rl?: readline.Interface | null,
  json?: boolean,
  piSessionFactory?: () => AgentCoreSessionHandle,
  disposePiSession?: (session: AgentCoreSessionHandle) => Promise<void>,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult> {
  const config = { ...DEFAULT_EFFECT_RETRY_CONFIG, ...options.retryConfig };
  const metadata = action.taskDef?.metadata as Record<string, unknown> | undefined;
  if (typeof metadata?.maxRetries === "number") {
    config.maxRetries = metadata.maxRetries;
  }
  if (metadata?.noRetry === true) {
    config.maxRetries = 0;
  }
  if (config.nonRetryableKinds.includes(action.kind)) {
    return resolveEffect(
      action,
      harnessName,
      options,
      piSession,
      discovered,
      rl,
      json,
      askUserQuestionHandler,
    );
  }
  let lastResult: ResolveEffectResult | undefined;
  let currentPiSession = piSession;
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      lastResult = await resolveEffect(
        action,
        harnessName,
        options,
        currentPiSession,
        discovered,
        rl,
        json,
        askUserQuestionHandler,
      );
      if (lastResult.status === "ok") {
        return lastResult;
      }
      if (
        attempt >= config.maxRetries ||
        !isRetryableEffectError(
          lastResult.error instanceof Error
            ? lastResult.error.message
            : String(lastResult.error ?? ""),
        )
      ) {
        return lastResult;
      }
    } catch (error: unknown) {
      if (attempt >= config.maxRetries || !isRetryableEffectError(error)) {
        return {
          status: "error",
          error: error instanceof Error ? error : new Error(String(error)),
          stderr: error instanceof Error ? error.message : String(error),
        };
      }
      lastResult = {
        status: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
    process.stderr.write(`[babysitter] effect ${action.effectId ?? action.taskDef?.id ?? 'unknown'} retry ${attempt + 1}/${config.maxRetries}: ${lastResult?.error instanceof Error ? lastResult.error.message : String(lastResult?.error ?? 'unknown')}\n`);
    const baseDelay = EFFECT_RETRY_DELAYS_OVERRIDE
      ? (EFFECT_RETRY_DELAYS_OVERRIDE[attempt] ?? 0)
      : Math.min(
        config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs,
      );
    const jitter = EFFECT_RETRY_DELAYS_OVERRIDE
      ? 0
      : baseDelay * 0.2 * (Math.random() * 2 - 1);
    const delay = Math.max(0, Math.round(baseDelay + jitter));
    if (currentPiSession && piSessionFactory) {
      if (disposePiSession) {
        await disposePiSession(currentPiSession);
      } else {
        currentPiSession.dispose();
      }
      currentPiSession = piSessionFactory();
    }
    if (delay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
  return lastResult!;
}

export async function orchestrateIterationWithProcessLoadRetry(args: {
  runDir: string;
  writeVerbose?: (message: string) => void;
  writeVerboseData?: (label: string, value: unknown, maxChars?: number) => void;
}): Promise<IterationResult> {
  let attempt = 0;
  for (;;) {
    try {
      return await orchestrateIteration({
        runDir: args.runDir,
        subprocessSupport: "agent-platform",
      });
    } catch (error: unknown) {
      if (
        !isProcessModuleLoadFailure(error) ||
        attempt >= PROCESS_MODULE_LOAD_RETRY_DELAYS_MS.length
      ) {
        throw error;
      }
      const delayMs = PROCESS_MODULE_LOAD_RETRY_DELAYS_MS[attempt] ?? 0;
      attempt += 1;
      process.stderr.write(
        `[babysitter] process module load attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}, retrying...\n`,
      );
      args.writeVerbose?.(
        `[phaseOrchestration retry] process module load failed for ${args.runDir}; retrying iteration import (attempt ${attempt}/${PROCESS_MODULE_LOAD_RETRY_DELAYS_MS.length}) after ${delayMs}ms`,
      );
      args.writeVerboseData?.(
        "phaseOrchestration retry cause",
        error instanceof Error
          ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause instanceof Error
              ? {
                name: error.cause.name,
                message: error.cause.message,
                stack: error.cause.stack,
              }
              : error.cause,
          }
          : error,
      );
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}
