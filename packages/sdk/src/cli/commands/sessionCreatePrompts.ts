export function buildProcessDefinitionSystemPrompt(outputPath: string): string {
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
    "",
    `Required output path: ${outputPath}`,
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

export function buildOrchestrationSystemPrompt(selectedHarnessName: string): string {
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
    "- Stay in the orchestration loop until the run completes, fails, or reaches a hard limit reported by the tools.",
    "- When the run reaches a terminal state, call babysitter_finish_orchestration exactly once.",
    "",
    "This phase is the bound orchestration phase. Preserve the hook-style loop semantics by always continuing through the babysitter tools.",
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
