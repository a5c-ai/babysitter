/**
 * Helper functions for internal tools.
 * Extracted from internalTools.ts for max-lines compliance.
 */

import {
  BabysitterRuntimeError,
  ErrorCategory,
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
  type OrchestrationState,
} from "../utils";
import type { RunOrchestrationPhaseArgs } from "./types";

interface PendingEffectResult {
  status: "ok" | "error";
  value?: unknown;
  error?: string;
}

export function buildBreakpointEffectResult(
  args: {
    phaseArgs: RunOrchestrationPhaseArgs;
    state: OrchestrationState;
  },
  action: OrchestrationState["pendingActions"] extends Map<string, infer T> ? T : never,
): PendingEffectResult {
  if (args.phaseArgs.interactive && !args.state.lastAskUserQuestionResponse) {
    throw new BabysitterRuntimeError(
      "InteractiveBreakpointDecisionMissing",
      "Interactive breakpoint results require AskUserQuestion before babysitter_task_post_result.",
      { category: ErrorCategory.Runtime },
    );
  }
  const question = (action.taskDef as Record<string, unknown>)?.question as string | undefined
    ?? action.taskDef?.title
    ?? "Breakpoint reached. Continue?";
  const askResponse = args.state.lastAskUserQuestionResponse
    ?? createAskUserQuestionResponse(
      createApprovalAskUserQuestion(question),
      { Decision: "Approve" },
    );
  const option = askResponse.answers.Decision ?? "Approve";
  return {
    status: "ok" as const,
    value: { approved: option === "Approve", option, askUserQuestion: askResponse },
  };
}
