import * as readline from "node:readline";
import {

  isRetryableEffectError,
  buildBreakpointResult,
  invokePromptEffect,
  invokeAgentHarness,
} from "./effectsHelpers";
export { readProcessFileFingerprint } from "./effectsHelpers";
import { getAdapterByName } from "../../../";
import type { StreamingOutputOptions } from "../../../types";
import { orchestrateIteration } from "@a5c-ai/babysitter-sdk";
import {
  BOLD,
  DEFAULT_EFFECT_RETRY_CONFIG,
  PI_WORKER_TIMEOUT_MS,
  AgentCoreSessionHandle,
  YELLOW,
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
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
  options: {
    workspace?: string;
    model?: string;
    interactive?: boolean;
    compressionConfig?: CompressionConfig | null;
    streaming?: StreamingOutputOptions;
  },
  piSession?: AgentCoreSessionHandle | null,
  discovered?: HarnessDiscoveryResult[],
  rl?: readline.Interface | null,
  json?: boolean,
  askUserQuestionHandler?: ((params: unknown) => Promise<unknown>) | null,
): Promise<ResolveEffectResult> {
  const kind = action.kind;
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
    const prompt = buildAgentPrompt(action.taskDef as unknown as Record<string, unknown>);
    const taskHarness = discovered ? resolveTaskHarness(action, harnessName, discovered) : harnessName;
    if (taskHarness !== harnessName && !isInternalHarness(taskHarness)) {
      return invokeAgentHarness(action, taskHarness, prompt, options);
    }
    if (piSession) {
      const piResult = await promptPiWithRetry({
        session: piSession,
        message: prompt,
        timeout: PI_WORKER_TIMEOUT_MS,
        label: `effect ${action.effectId}`,
      });
      return {
        status: piResult.success ? "ok" : "error",
        value: piResult.success
          ? coerceAgentResultValue(
            action.taskDef as unknown as Record<string, unknown>,
            piResult.output,
          )
          : undefined,
        error: piResult.success ? undefined : new Error(piResult.output),
        stdout: piResult.output,
      };
    }
    return invokeAgentHarness(action, taskHarness, prompt, options);
  }
  const fallbackPrompt = action.taskDef?.title ?? `Handle effect ${action.effectId} (kind: ${kind})`;
  return invokePromptEffect(action, harnessName, fallbackPrompt, options, undefined);
}

export async function resolveEffectWithRetry(
  action: EffectAction,
  harnessName: string,
  options: {
    workspace?: string;
    model?: string;
    interactive?: boolean;
    compressionConfig?: CompressionConfig | null;
    retryConfig?: Partial<EffectRetryConfig>;
    streaming?: StreamingOutputOptions;
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
      return await orchestrateIteration({ runDir: args.runDir });
    } catch (error: unknown) {
      if (
        !isProcessModuleLoadFailure(error) ||
        attempt >= PROCESS_MODULE_LOAD_RETRY_DELAYS_MS.length
      ) {
        throw error;
      }
      const delayMs = PROCESS_MODULE_LOAD_RETRY_DELAYS_MS[attempt] ?? 0;
      attempt += 1;
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

