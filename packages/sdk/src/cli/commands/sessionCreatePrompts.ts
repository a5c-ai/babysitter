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

export interface ProcessDefinitionUserPromptOptions {
  interactive: boolean;
  workspaceAssessment?: "empty" | "non-empty";
  workspaceEntries?: string[];
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
    "- Treat the provided workspace as the only relevant filesystem root unless the user explicitly points you somewhere else.",
    "- Do not read files outside the workspace just to find process examples, SDK patterns, or inspiration.",
    "- Use babysitter_write_process_definition to write the final JavaScript process file to the exact output path provided below.",
    "- The module must export a named `async function process(inputs, ctx)`.",
    "- If you define tasks with `defineTask(...)`, every returned TaskDef must include a top-level `kind` field.",
    "- Agent tasks must use `kind: \"agent\"` with `agent: { name, prompt, outputSchema }`; shell tasks must use `kind: \"shell\"` with `shell: { command: \"...\" }`; node tasks must use `kind: \"node\"` with `node: { entry, args? }`.",
    "- Call defined tasks with `await ctx.task(definedTask, args)`; do not invent alternate task runners.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; never pass plain object task definitions or ad-hoc task objects.",
    "- Inside that named `process(inputs, ctx)` export, do not reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists in runtime context. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Keep the generated module syntactically valid ESM. If you embed HTML/CSS/JS asset contents inside the process source, do not use raw nested template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- The generated process must directly execute the user's requested work. Do not generate a meta-process that writes another babysitter process unless the user explicitly asked for process authoring.",
    "- After the file is written through babysitter_write_process_definition, call babysitter_report_process_definition exactly once with the final path and a concise summary.",
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
  options?: ProcessDefinitionUserPromptOptions,
): string {
  const interactive = options?.interactive ?? true;
  const workspaceAssessment = options?.workspaceAssessment;
  const workspaceEntries = options?.workspaceEntries ?? [];
  const workspaceSummary = workspaceEntries.length > 0
    ? workspaceEntries.join(", ")
    : "(no files)";

  const lines = [
    interactive
      ? "Interactive mode. Ask focused clarification questions only when they materially improve the process."
      : "Non-interactive mode. Do not call AskUserQuestion; infer missing details from the request and workspace state.",
    "",
    `User request: ${userPrompt}`,
    `Output path: ${outputPath}`,
  ];

  if (workspaceAssessment === "empty") {
      lines.push(
        "Workspace assessment: empty.",
        `Workspace entries: ${workspaceSummary}`,
        "Treat this as a greenfield request and move straight to authoring the process.",
        "Do not inspect unrelated directories, home-directory configs, or global skill/plugin folders.",
        "Keep the process practical for a brand-new workspace: plan, scaffold, implement, verify.",
        "Keep generated asset strings syntax-safe. If the process writes JS/HTML/CSS files, avoid raw nested template literals inside the process module; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
      );
  } else if (workspaceAssessment === "non-empty") {
    lines.push(
      `Workspace assessment: non-empty (${workspaceSummary}).`,
      "Inspect only the workspace files that are relevant to the request before finalizing the process.",
      "Do not wander through unrelated global directories or repositories.",
    );
  }

  lines.push(
    "The generated process must directly execute the user's requested work rather than write another babysitter process.",
    "Use babysitter_write_process_definition to write the file now, then call babysitter_report_process_definition exactly once.",
  );

  return lines.join("\n");
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
    "- Work in bounded host-driven turns. In each turn, call babysitter_run_iterate at most once unless the host explicitly tells you otherwise.",
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

export function buildOrchestrationBootstrapPrompt(
  processPath: string,
  userPrompt: string | undefined,
  maxIterations: number,
): string {
  return [
    "Bootstrap the babysitter orchestration session.",
    "",
    `Process path: ${processPath}`,
    `User prompt: ${userPrompt ?? ""}`,
    `Maximum iterations: ${maxIterations}`,
    "",
    "Create the run if needed, bind the session immediately, and then stop.",
    "Do not iterate the run yet unless the host explicitly asks for an iteration turn.",
  ].join("\n");
}

export function buildOrchestrationTurnPrompt(args: {
  processPath: string;
  userPrompt?: string;
  maxIterations: number;
  currentIteration: number;
  runId?: string;
  runDir?: string;
  lastStatus?: string;
  pendingEffects?: Array<{
    effectId: string;
    kind: string;
    title?: string;
    harness?: string;
  }>;
  fallbackReason?: string;
}): string {
  const lines = [
    "Continue the babysitter orchestration session for exactly one bounded host turn.",
    "",
    `Process path: ${args.processPath}`,
    `User prompt: ${args.userPrompt ?? ""}`,
    `Maximum iterations: ${args.maxIterations}`,
    `Current completed iterations: ${args.currentIteration}`,
    `Run id: ${args.runId ?? "(not created)"}`,
    `Run dir: ${args.runDir ?? "(not created)"}`,
    `Last run status: ${args.lastStatus ?? "unknown"}`,
  ];

  if (args.fallbackReason) {
    lines.push(`Fallback note: ${args.fallbackReason}`);
  }

  if (args.pendingEffects && args.pendingEffects.length > 0) {
    lines.push("");
    lines.push("Pending effects that still need resolution:");
    for (const effect of args.pendingEffects) {
      const parts = [
        effect.effectId,
        effect.kind,
        effect.title || "(untitled)",
      ];
      if (effect.harness) {
        parts.push(`harness=${effect.harness}`);
      }
      lines.push(`- ${parts.join(" | ")}`);
    }
    lines.push("");
    lines.push("Resolve every listed pending effect and post its result in this turn. Do not call babysitter_run_iterate again after posting them.");
  } else {
    lines.push("");
    lines.push("Call babysitter_run_iterate exactly once in this turn.");
    lines.push("If it returns pending effects, resolve all of them and post every result before stopping.");
    lines.push("If it returns completed or failed, stop after recording the terminal state.");
  }

  lines.push("");
  lines.push("End with a short plain-text summary of what changed in this turn.");
  return lines.join("\n");
}
