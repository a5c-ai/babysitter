import type { HarnessDiscoveryResult } from "../../harness/types";

export interface SessionCreatePromptContext {
  platform: string;
  arch: string;
  nodeVersion: string;
  cwd: string;
  workspace: string;
  selectedHarnessName?: string;
  discoveredHarnesses: HarnessDiscoveryResult[];
  compressionEnabled: boolean;
  secureSandboxImage: string;
  piDefaultBashSandbox: "local" | "auto" | "secure";
  piIsolationDefault: boolean;
  envFlags: Array<{ name: string; value: string }>;
}

function formatHarnessCatalog(context: SessionCreatePromptContext): string[] {
  const lines = ["Discovered harnesses:"];
  for (const harness of context.discoveredHarnesses) {
    const parts = [
      `${harness.name}`,
      `installed=${harness.installed ? "yes" : "no"}`,
      `cli=${harness.cliCommand}`,
      `config=${harness.configFound ? "yes" : "no"}`,
    ];
    if (harness.version) {
      parts.push(`version=${harness.version}`);
    }
    if (harness.capabilities.length > 0) {
      parts.push(`capabilities=${harness.capabilities.join(",")}`);
    }

    if (harness.name === "pi" || harness.name === "oh-my-pi") {
      parts.push("profile=internal-programmatic");
    } else if (harness.installed) {
      parts.push("profile=external-cli");
    }

    lines.push(`- ${parts.join(" | ")}`);
  }
  return lines;
}

function formatRuntimeContext(context: SessionCreatePromptContext): string[] {
  return [
    "Runtime environment:",
    `- platform=${context.platform}`,
    `- arch=${context.arch}`,
    `- node=${context.nodeVersion}`,
    `- cwd=${context.cwd}`,
    `- workspace=${context.workspace}`,
    `- compression=${context.compressionEnabled ? "enabled" : "disabled"}`,
    `- secure_pi_sandbox_image=${context.secureSandboxImage}`,
    `- pi_default_bash_sandbox=${context.piDefaultBashSandbox}`,
    `- pi_default_isolated=${context.piIsolationDefault ? "true" : "false"}`,
    ...context.envFlags.map((flag) => `- env.${flag.name}=${flag.value}`),
  ];
}

function formatHarnessAssignmentGuidance(context: SessionCreatePromptContext): string[] {
  const installedHarnesses = context.discoveredHarnesses
    .filter((h) => h.installed)
    .map((h) => h.name);
  const installedList = installedHarnesses.length > 0
    ? installedHarnesses.join(", ")
    : "(none)";

  return [
    "Harness assignment guidance:",
    `- Only assign installed harness names. Installed harnesses: ${installedList}.`,
    "- For `agent`, `node`, or `orchestrator_task` work that should run on a specific harness, set `task.metadata.harness` to that harness name.",
    "- Treat `pi` / `oh-my-pi` as the internal harness. Its default worker mode is native/local PI execution with isolation disabled unless the task opts into stronger guardrails.",
    "- Shell effects run through the internal PI worker even when orchestration is bound to an external CLI harness. Keep shell work on that worker by default.",
    "- For risky shell or system-changing subtasks, encode guardrails explicitly in task metadata: `bashSandbox: \"secure\"` to opt into AgentSH, `isolated: true` to disable repo/global extensions and skills, and `enableCompaction: true` when a long-running internal worker needs compaction.",
    "- Treat `claude-code`, `codex`, `gemini-cli`, and other external CLIs as text-agent harnesses. Use them only when their behavior is materially better for that task.",
    "- External CLI harnesses do not inherit AgentSH protection for their own internal shell or tool execution. Route security-sensitive shell work through the internal PI worker instead of assuming the external harness is guarded.",
    context.selectedHarnessName
      ? `- The selected orchestration binding harness for this run is ${context.selectedHarnessName}.`
      : "- No orchestration binding harness has been selected yet.",
  ];
}

function formatSharedContext(context: SessionCreatePromptContext): string[] {
  return [
    "",
    ...formatRuntimeContext(context),
    "",
    ...formatHarnessCatalog(context),
    "",
    ...formatHarnessAssignmentGuidance(context),
  ];
}

export function buildProcessDefinitionSystemPrompt(
  outputPath: string,
  context: SessionCreatePromptContext,
): string {
  return [
    "You are the babysitter session:create phase 1 agent.",
    "Your job is to turn the user's intent into a concrete babysitter process definition before any run is created or bound.",
    "",
    "Rules:",
    "- This phase is unbound. Do not create a run, bind a session, iterate a run, or post task results.",
    "- Use the AskUserQuestion tool when clarification is useful. Ask focused, high-signal questions in batches when possible.",
    "- Research the workspace before finalizing the process. Use your available read/search/bash/write tools as needed.",
    "- Write the final JavaScript process file to the exact output path provided below.",
    "- After the file is written, call babysitter_report_process_definition exactly once with the final path and a concise summary.",
    "- Do not claim completion in plain text without calling babysitter_report_process_definition.",
    "- If different tasks should run on different harnesses, encode that in the process definition rather than leaving it implicit.",
    "- Encode internal worker guardrails explicitly in task metadata when needed. Use `task.metadata.bashSandbox`, `task.metadata.isolated`, and `task.metadata.enableCompaction` instead of assuming every internal task is secure or isolated by default.",
    "",
    `Required output path: ${outputPath}`,
    ...formatSharedContext(context),
  ].join("\n");
}

export function buildProcessDefinitionUserPrompt(
  userPrompt: string,
  outputPath: string,
): string {
  return [
    "Interview the user as needed, research the codebase, define the process, and write the process file.",
    "",
    `User request: ${userPrompt}`,
    `Output path: ${outputPath}`,
  ].join("\n");
}

export function buildOrchestrationSystemPrompt(
  selectedHarnessName: string,
  context: SessionCreatePromptContext,
): string {
  return [
    "You are the babysitter session:create phase 2 orchestration agent.",
    "Your job is to run the babysitter orchestration loop through tools, not by narrating what should happen.",
    "",
    "Rules:",
    `- Treat ${selectedHarnessName} as the target harness binding for this orchestration session.`,
    "- Call babysitter_run_create to create the run if it does not already exist.",
    "- Immediately call babysitter_bind_session after run creation and before the first orchestration iteration.",
    "- Drive orchestration by repeatedly calling babysitter_run_iterate.",
    "- When babysitter_run_iterate reports pending effects, resolve each effect through tools.",
    "- For breakpoint effects, use AskUserQuestion to get the user decision, then call babysitter_task_post_result.",
    "- For non-breakpoint effects, call babysitter_execute_effect, then persist the returned result with babysitter_task_post_result.",
    "- Do not execute effect work directly with your own shell/write tools when a babysitter tool is available for it.",
    "- When choosing how to execute pending work, respect task-level harness metadata and the installed harness catalog provided below.",
    "- Shell effects execute on internal PI worker sessions. Respect `task.metadata.bashSandbox`, `task.metadata.isolated`, and `task.metadata.enableCompaction` when the process encoded stronger guardrails for that worker.",
    "- Internal secure execution is available through opt-in PI worker sessions; prefer that path for shell or security-sensitive work instead of assuming an external CLI harness is guarded.",
    "- Stay in the orchestration loop until the run completes, fails, or reaches a hard limit reported by the tools.",
    "- When the run reaches a terminal state, call babysitter_finish_orchestration exactly once.",
    "",
    "This phase is the bound orchestration phase. Preserve the hook-style loop semantics by always continuing through the babysitter tools.",
    ...formatSharedContext(context),
  ].join("\n");
}

export function buildOrchestrationUserPrompt(
  processPath: string,
  userPrompt: string | undefined,
  maxIterations: number,
): string {
  return [
    "Create and run the babysitter orchestration session.",
    "",
    `Process path: ${processPath}`,
    `User prompt: ${userPrompt ?? ""}`,
    `Maximum iterations: ${maxIterations}`,
  ].join("\n");
}
