import { promptPhaseSession } from "./phaseHelpers";
import type { AgentCoreSessionHandle } from "../utils";

export function buildUnderstandIntentPrompt(args: {
  prompt: string;
  interactive: boolean;
  workspaceAssessment: {
    kind: "empty" | "non-empty";
    entries: string[];
  };
}): string {
  const workspaceEntries = args.workspaceAssessment.entries.length > 0
    ? args.workspaceAssessment.entries.join(", ")
    : "(no files)";

  return [
    "PhaseUnderstandIntent.",
    "Inspect the workspace and clarify the user's intent before authoring the process.",
    "Do not write the process file yet and do not call babysitter_report_process_definition in this step.",
    args.interactive
      ? "If material requirements are missing, call AskUserQuestion and converge on a concise working brief."
      : "Non-interactive mode: infer missing details from the request and workspace, then produce the best working brief you can.",
    "",
    `Workspace assessment: ${args.workspaceAssessment.kind}.`,
    `Workspace entries: ${workspaceEntries}`,
    "",
    "Reply with a concise intent brief that covers:",
    "- Goal: the concrete outcome the user wants",
    "- Constraints: important limits, requirements, or non-goals",
    "- Workspace context: the relevant repo/workspace facts you found",
    "- Assumptions: only the assumptions still in play after inspection",
    "- Execution posture: the shape of the process that should be authored next",
    "",
    `User request: ${args.prompt}`,
  ].join("\n");
}

function buildIntentHandoffSummary(intentOutput: string): string {
  const normalized = intentOutput.trim();
  if (!normalized) {
    return "No additional intent analysis was captured.";
  }
  const maxChars = 4_000;
  return normalized.length <= maxChars
    ? normalized
    : `${normalized.slice(0, maxChars)}\n... [truncated ${normalized.length - maxChars} chars]`;
}

export function appendIntentHandoffToPlanPrompt(
  planPrompt: string,
  intentOutput: string,
): string {
  return [
    planPrompt,
    "",
    "PhaseUnderstandIntent handoff:",
    "Use this brief as the current contract unless later tool evidence clearly contradicts it.",
    buildIntentHandoffSummary(intentOutput),
  ].join("\n");
}

export async function runUnderstandIntentPhase(args: {
  session: AgentCoreSessionHandle;
  promptMessage: string;
  writeVerbose: (message: string) => void;
  writeVerboseData: (label: string, value: unknown, maxChars?: number) => void;
  timeout: number;
}): Promise<{ success: boolean; output: string; handoffSummary: string }> {
  const result = await promptPhaseSession({
    session: args.session,
    message: args.promptMessage,
    timeout: args.timeout,
    label: "phaseUnderstandIntent",
    writeVerbose: args.writeVerbose,
    writeVerboseData: args.writeVerboseData,
  });
  return {
    success: result.success,
    output: result.output,
    handoffSummary: buildIntentHandoffSummary(result.output),
  };
}
