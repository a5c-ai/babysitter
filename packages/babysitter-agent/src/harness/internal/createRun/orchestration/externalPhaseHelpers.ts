/**
 * Helper functions for external orchestration phase.
 * Extracted from externalPhase.ts for max-lines compliance.
 */

import * as path from "node:path";
import {
  createPromptContextFromCatalog,
  composeProcessCreatePrompt,
} from "@a5c-ai/babysitter-sdk";
import {
  buildPiWorkerSessionOptions,
  createAgentCoreSession,
  PI_WORKER_TIMEOUT_MS,
  promptPiWithRetry,
  type EffectAction,
} from "../utils";
import { subscribeVerbosePiEvents } from "./verbose";
import type { RunOrchestrationPhaseArgs } from "./types";

export function extractErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error
      ? String((error as Record<string, unknown>).message)
      : String(error);
}

export function extractErrorStack(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "stack" in error
    ? String((error as Record<string, unknown>).stack)
    : undefined;
}

export async function recoverExternalProcessError(args: {
  args: RunOrchestrationPhaseArgs;
  errorMessage: string;
  errorStack?: string;
  registerPiSession: (session: ReturnType<typeof createAgentCoreSession>) => ReturnType<typeof createAgentCoreSession>;
  shutdownPiSession: (session: ReturnType<typeof createAgentCoreSession> | null | undefined) => Promise<void>;
}): Promise<void> {
  const recoverySession = args.registerPiSession(createAgentCoreSession(buildPiWorkerSessionOptions({
    action: {
      effectId: "process-error-recovery",
      invocationKey: "",
      kind: "node",
      taskDef: { title: "Fix process error" },
    } as EffectAction,
    workspace: args.args.workspace,
    model: args.args.model,
  })));
  const recoveryUnsub = subscribeVerbosePiEvents(recoverySession, "recovery", args.args);
  try {
    const guidelines = composeProcessCreatePrompt(createPromptContextFromCatalog('pi', { interactive: false }));
    const recoveryPrompt = [
      `The babysitter process at ${path.resolve(args.args.processPath)} threw an error during execution:`,
      "",
      `Error: ${args.errorMessage}`,
      args.errorStack ? `\nStack trace:\n${args.errorStack}` : "",
      "",
      "This is a bug in the process code, not in the babysitter runtime.",
      "Read the process file, understand the error, and fix the code so the next iteration succeeds.",
      "",
      "--- Process Authoring Reference ---",
      "",
      guidelines,
      "",
      "--- End Reference ---",
      "",
      "Fix the process file and save it. The orchestrator will retry automatically.",
    ].join("\n");
    await promptPiWithRetry({
      session: recoverySession,
      message: recoveryPrompt,
      timeout: PI_WORKER_TIMEOUT_MS,
      label: "process-error-recovery",
    });
  } catch {
    return;
  } finally {
    recoveryUnsub?.();
    await args.shutdownPiSession(recoverySession);
  }
}
