/**
 * Helper functions for effect resolution.
 * Extracted from effects.ts for max-lines compliance.
 */

import { statSync } from "node:fs";
import { invokeHarness } from "../../../invoker";
import type { StreamingOutputOptions } from "../../../types";
import {
  PI_WORKER_TIMEOUT_MS,
  compressInternalHarnessPrompt,
  isInternalHarness,
  promptPiWithRetry,
  type AgentCoreSessionHandle,
  type AskUserQuestionResponse,
  type CompressionConfig,
  type EffectAction,
  type ResolveEffectResult,
} from "../utils";
import { coerceAgentResultValue } from "../planProcess";

export function readProcessFileFingerprint(processPath: string): string | undefined {
  try {
    const stat = statSync(processPath);
    return `${stat.size}:${Math.trunc(stat.mtimeMs)}`;
  } catch {
    return undefined;
  }
}

export function isRetryableEffectError(error: unknown): boolean {
  const message = typeof error === "string"
    ? error : error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") || lower.includes("timed out") ||
    lower.includes("econnreset") || lower.includes("econnrefused") ||
    lower.includes("epipe") || lower.includes("rate limit") ||
    lower.includes("too many requests") || lower.includes("server had an error") ||
    lower.includes("temporarily unavailable") || lower.includes("please retry") ||
    lower.includes("killed") || lower.includes("signal") ||
    lower.includes("already processing")
  );
}

export function buildBreakpointResult(
  response: AskUserQuestionResponse, approvalKey: string,
): ResolveEffectResult {
  const option = response.answers[approvalKey] ?? "Reject";
  return { status: "ok", value: { approved: option === "Approve", option, askUserQuestion: response } };
}

export async function invokePromptEffect(
  action: EffectAction, taskHarness: string, prompt: string,
  options: { workspace?: string; model?: string; compressionConfig?: CompressionConfig | null; streaming?: StreamingOutputOptions },
  piSession?: AgentCoreSessionHandle | null,
): Promise<ResolveEffectResult> {
  if ((isInternalHarness(taskHarness) || taskHarness === "pi") && piSession) {
    const piResult = await promptPiWithRetry({
      session: piSession,
      message: compressInternalHarnessPrompt(prompt, options.compressionConfig, "skill"),
      timeout: PI_WORKER_TIMEOUT_MS, label: `effect ${action.effectId}`,
    });
    return {
      status: piResult.success ? "ok" : "error",
      value: piResult.success ? piResult.output : undefined,
      error: piResult.success ? undefined : new Error(piResult.output),
      stdout: piResult.output,
    };
  }
  const result = await invokeHarness(taskHarness, {
    prompt: compressInternalHarnessPrompt(prompt, options.compressionConfig, "skill"),
    workspace: options.workspace, model: options.model, streaming: options.streaming,
  });
  return {
    status: result.success ? "ok" : "error",
    value: result.success ? result.output : undefined,
    error: result.success ? undefined : new Error(result.output),
    stdout: result.output,
  };
}

export async function invokeAgentHarness(
  action: EffectAction, taskHarness: string, prompt: string,
  options: { workspace?: string; model?: string },
): Promise<ResolveEffectResult> {
  const result = await invokeHarness(taskHarness, {
    prompt: compressInternalHarnessPrompt(prompt, null, "agent"),
    workspace: options.workspace, model: options.model,
  });
  return {
    status: result.success ? "ok" : "error",
    value: result.success
      ? coerceAgentResultValue(action.taskDef as unknown as Record<string, unknown>, result.output)
      : undefined,
    error: result.success ? undefined : new Error(result.output),
    stdout: result.output,
  };
}
