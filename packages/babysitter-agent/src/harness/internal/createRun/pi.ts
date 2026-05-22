import * as path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import type { EffectAction } from "@a5c-ai/babysitter-sdk";
import type {
  AgentCorePromptResult,
  AgentCoreSessionOptions,
} from "../../types";
import { mapHarnessToAmuxAdapter, hasAmuxAdapter } from "../../amux/amuxHarnessMap";
import { normalizeBuiltInHarnessName } from "../../builtInHarness";
import type { DelegationConfig } from "./utils";

export const TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS = process.env.VITEST
  ? [0, 0]
  : [1_000, 3_000];

export const PI_PARENT_PROMPT_TIMEOUT_MS = 0;
export const PI_DEFAULT_PROMPT_TIMEOUT_MS = 900_000;
export const PI_WORKER_TIMEOUT_MS = 1_800_000;

export function readBooleanMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
): boolean | undefined {
  const value = metadata?.[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

export function readBashSandboxMetadata(
  metadata: Record<string, unknown> | undefined,
): AgentCoreSessionOptions["bashSandbox"] | undefined {
  const value = metadata?.bashSandbox;
  return value === "auto" || value === "secure" || value === "local"
    ? value
    : undefined;
}

export function readStringMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

export function isProcessModuleLoadFailure(error: unknown): boolean {
  return error instanceof Error && /^Failed to load process module at /.test(error.message);
}

export function isRetryablePiPromptFailure(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "output" in error
          ? String((error as { output?: unknown }).output ?? "")
          : "";

  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return normalized.includes("the server had an error processing your request") ||
    normalized.includes("please retry your request") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("pitimeouterror") ||
    normalized.includes("pi prompt timed out") ||
    normalized.includes("deadline exceeded") ||
    normalized.includes("already processing");
}

export function isIgnorablePiPromptFailure(output: string): boolean {
  return output.includes("msg.content.filter is not a function");
}

type PromptCapableSession = {
  prompt(text: string, timeout?: number): Promise<AgentCorePromptResult>;
};

export async function promptPiWithRetry(args: {
  session: PromptCapableSession;
  message: string;
  timeout: number;
  label: string;
  writeVerbose?: (message: string) => void;
  writeVerboseData?: (label: string, value: unknown, maxChars?: number) => void;
}): Promise<AgentCorePromptResult> {
  let attempt = 0;

  for (;;) {
    try {
      const result = await args.session.prompt(args.message, args.timeout);
      if (
        result.success ||
        !isRetryablePiPromptFailure(result.output) ||
        attempt >= TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length
      ) {
        return result;
      }

      const delayMs = TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS[attempt] ?? 0;
      attempt += 1;
      args.writeVerbose?.(
        `[${args.label} retry] transient PI failure; retrying prompt attempt ${attempt}/${TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length} after ${delayMs}ms`,
      );
      args.writeVerboseData?.(`${args.label} retry failure output`, result.output);
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: unknown) {
      if (!isRetryablePiPromptFailure(error) || attempt >= TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length) {
        throw error;
      }

      const delayMs = TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS[attempt] ?? 0;
      attempt += 1;
      args.writeVerbose?.(
        `[${args.label} retry] transient PI exception; retrying prompt attempt ${attempt}/${TRANSIENT_PI_PROMPT_RETRY_DELAYS_MS.length} after ${delayMs}ms`,
      );
      args.writeVerboseData?.(`${args.label} retry error`, error);
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}

export function buildPiWorkerSessionOptions(args: {
  action: EffectAction;
  workspace?: string;
  model?: string;
  customTools?: unknown[];
  delegationConfig?: DelegationConfig;
}): AgentCoreSessionOptions {
  const metadata = args.action.taskDef?.metadata as Record<string, unknown> | undefined;
  const isolated = readBooleanMetadata(metadata, "isolated");
  const enableCompaction = readBooleanMetadata(metadata, "enableCompaction");

  const effectiveModel = args.delegationConfig?.model ?? args.model;
  const effectiveTimeout = args.delegationConfig?.timeout ?? PI_WORKER_TIMEOUT_MS;
  const effectiveToolsMode = args.delegationConfig?.toolsMode
    ?? readStringMetadata(metadata, "toolsMode") as "default" | "coding" | "readonly" | undefined
    ?? "coding";
  const rawThinkingLevel = args.delegationConfig?.thinkingLevel
    ?? readStringMetadata(metadata, "thinkingLevel") as "none" | "low" | "medium" | "high" | undefined;
  const effectiveThinkingLevel: AgentCoreSessionOptions["thinkingLevel"] | undefined =
    rawThinkingLevel === "none" ? undefined : rawThinkingLevel;
  const effectiveBashSandbox = args.delegationConfig?.bashSandbox
    ?? readBashSandboxMetadata(metadata);

  let appendSystemPrompt: string[] | undefined;
  const skillNames = args.delegationConfig?.skills ?? (metadata?.skills as string[] | undefined);
  if (skillNames?.length) {
    const skillContents: string[] = [];
    for (const skillName of skillNames) {
      try {
        const candidates = [
          path.join(args.workspace ?? process.cwd(), ".a5c", "skills", skillName, "SKILL.md"),
          path.join(args.workspace ?? process.cwd(), ".claude", "plugins", skillName, "SKILL.md"),
        ];
        for (const candidate of candidates) {
          if (existsSync(candidate)) {
            skillContents.push(readFileSync(candidate, "utf8"));
            break;
          }
        }
      } catch { /* skip missing skills */ }
    }
    if (skillContents.length) {
      appendSystemPrompt = [skillContents.join("\n\n---\n\n")];
    }
  }

  const subagentName = args.delegationConfig?.subagentName ?? readStringMetadata(metadata, "subagentName");
  let agentDir: string | undefined;
  if (subagentName) {
    const candidates = [
      path.join(args.workspace ?? process.cwd(), ".claude", "agents", subagentName),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        agentDir = candidate;
        break;
      }
    }
  }

  return {
    workspace: args.workspace,
    model: effectiveModel,
    timeout: effectiveTimeout,
    toolsMode: effectiveToolsMode,
    ephemeral: true,
    ...(args.customTools?.length ? { customTools: args.customTools } : {}),
    ...(isolated !== undefined ? { isolated } : {}),
    ...(enableCompaction !== undefined ? { enableCompaction } : {}),
    ...(effectiveBashSandbox ? { bashSandbox: effectiveBashSandbox } : {}),
    ...(effectiveThinkingLevel ? { thinkingLevel: effectiveThinkingLevel } : {}),
    ...(appendSystemPrompt ? { appendSystemPrompt } : {}),
    ...(agentDir ? { agentDir } : {}),
  };
}

export function resolveAgentCoreBackendForHarness(harnessName?: string): string | undefined {
  const normalizedHarness = normalizeBuiltInHarnessName(harnessName?.trim() ?? "");
  if (!normalizedHarness || normalizedHarness === "agent-core") {
    return undefined;
  }
  if (normalizedHarness === "pi") {
    return "pi";
  }
  if (hasAmuxAdapter(normalizedHarness)) {
    return mapHarnessToAmuxAdapter(normalizedHarness);
  }
  return normalizedHarness;
}
