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
    "- Default `agent`, `node`, and `orchestrator_task` work to the internal PI worker. Set `task.metadata.harness` only when a task must explicitly override that default to a specific installed harness.",
    "- Treat `pi` / `oh-my-pi` as the internal harness. Its default worker mode is native/local PI execution with isolation disabled unless the task opts into stronger guardrails.",
    "- Shell effects run through the internal PI worker even when orchestration is bound to an external CLI harness. Keep shell work on that worker by default.",
    "- Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction` for ordinary internal PI work. Leave them unset unless the task truly requires stronger guardrails or long-running compaction.",
    "- For risky shell or system-changing subtasks that truly need stronger guardrails, encode them explicitly in task metadata: `bashSandbox: \"secure\"` to opt into AgentSH, `isolated: true` to disable repo/global extensions and skills, and `enableCompaction: true` when a long-running internal worker needs compaction.",
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
    "- In interactive mode, follow a real interview phase: inspect the repo/workspace state first, then inspect the most relevant local babysitter process references, then ask only the next highest-signal question. Do not plan more than one interview step ahead.",
    "- In non-interactive mode, skip user questions but still parse the request, inspect the repo/workspace structure, resolve the active process-library root with `babysitter process-library:active --json`, and search that active library for the most relevant specialization or methodology before authoring the process. Do not skip the process-library search step.",
    "- Research the workspace before finalizing the process. Use your available read/search/bash/write tools as needed.",
    "- Treat the provided workspace as the only relevant filesystem root unless the user explicitly points you somewhere else.",
    "- You may inspect local babysitter process references when they materially improve the process design. Prefer project `.a5c/processes/`, the active process-library root returned in `binding.dir` by `babysitter process-library:active --json`, the cloned repo root returned in `defaultSpec.cloneDir` when you need adjacent reference material, local plugin paths such as `plugins/babysitter/skills/babysit/process/`, repository `library/` materials, and local babysitter discover/profile CLI commands when available.",
    "- If you use user profile context, read it through the babysitter CLI only, for example `babysitter profile:read --user --json`. Never import or call SDK profile helpers directly from generated processes or task instructions.",
    "- Use babysitter_write_process_definition to write the final JavaScript process file to the exact output path provided below.",
    "- The module must export a named `async function process(inputs, ctx)`.",
    "- The process must orchestrate the work through babysitter tasks instead of doing the main implementation directly in `process(inputs, ctx)`.",
    "- Define at least one task with `defineTask(...)`, and invoke tasks from `process(inputs, ctx)` via `await ctx.task(...)`.",
    "- Default every task to the internal PI worker. Omit `task.metadata.harness` unless a task must explicitly override that default.",
    "- If you define tasks with `defineTask(...)`, every returned TaskDef must include a top-level `kind` field.",
    "- Agent tasks must use `kind: \"agent\"` with `agent: { name, prompt, outputSchema }`; shell tasks must use `kind: \"shell\"` with `shell: { command: \"...\" }`; node tasks must use `kind: \"node\"` with `node: { entry, args? }`.",
    "- Call defined tasks with `await ctx.task(definedTask, args)`; do not invent alternate task runners.",
    "- At least one defined task must be an `agent` task for the main work. Shell tasks are for concrete runnable commands only.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; never pass plain object task definitions or ad-hoc task objects.",
    "- Inside that named `process(inputs, ctx)` export, do not reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists in runtime context. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Keep the generated module syntactically valid ESM. If you embed HTML/CSS/JS asset contents inside the process source, do not use raw nested template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- The generated process must directly execute the user's requested work. Do not generate a meta-process that writes another babysitter process unless the user explicitly asked for process authoring.",
    "- Prefer modular, reusable process composition when possible. Reference relevant methodologies, skills, agents, or prior processes before inventing a process structure from scratch.",
    "- Prefer processes with explicit milestones, quality gates, verification loops, and convergence on the actual user request.",
    "- After the file is written through babysitter_write_process_definition, call babysitter_report_process_definition exactly once with the final path and a concise summary.",
    "- Do not claim completion in plain text without calling babysitter_report_process_definition.",
    "- If different tasks should run on different harnesses, encode that in the process definition rather than leaving it implicit.",
    "- Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction` for ordinary internal PI tasks. Leave them unset unless the task truly requires stronger guardrails or long-running compaction.",
    "- If a task truly needs stronger internal guardrails, encode them explicitly in task metadata instead of assuming every internal task is secure or isolated by default.",
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
        "Start with the repo/workspace state, then inspect only the most relevant local babysitter process references or discover output before you author the process.",
        "Do not inspect unrelated directories, home-directory configs, or irrelevant global skill/plugin folders.",
        "Keep the process practical for a brand-new workspace: plan, scaffold, implement, verify.",
        "Write a real babysitter process, not a direct one-shot script. The top-level `process()` should orchestrate work through `defineTask(...)` and `ctx.task(...)`.",
        "Put the main implementation in one or more `agent` tasks. Use `shell` tasks only for concrete runnable verification or tooling commands.",
        "Do not add internal worker guardrail metadata such as `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction` unless the task truly requires them.",
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
    "Follow the babysit workflow directly: run one iteration, inspect the returned effects, perform the requested effects with tools or harness dispatch, post the results, and repeat until the run reaches a terminal state.",
    "",
    "Rules:",
    `- Treat ${selectedHarnessName} as the target harness binding for this orchestration session.`,
    "- You have your built-in coding tools (bash/read/write/edit/search) plus the custom babysitter tools below. Use them to do the orchestration work itself.",
    "- Call babysitter_run_create to create the run if it does not already exist.",
    "- Immediately call babysitter_bind_session after run creation and before the first orchestration iteration.",
    "- Work in bounded turns. In each turn, call babysitter_run_iterate at most once unless the prompt explicitly tells you otherwise.",
    "- When babysitter_run_iterate reports pending effects, resolve each effect through tools.",
    "- For breakpoint effects, use AskUserQuestion in interactive mode. In non-interactive mode, select the best option according to the user intent and current context. Then call babysitter_task_post_result.",
    "- For `shell` effects, inspect the effect payload and either run the command yourself with your bash/coding tools or call babysitter_run_shell_effect so the command executes on an internal PI worker that respects task metadata. Then call babysitter_task_post_result with the explicit outcome.",
    "- For `agent`, `node`, and `orchestrator_task` effects, prefer babysitter_dispatch_effect_harness when the work should run on a harness wrapper. If you fulfill an effect directly with your own coding tools, you must still call babysitter_task_post_result with the explicit outcome.",
    "- Do not rely on a hidden host-side effect executor. Perform or dispatch each effect intentionally based on the effect payload you received from babysitter_run_iterate.",
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
    "Do not iterate the run yet unless a later prompt explicitly asks for an iteration turn.",
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
    "Continue the babysitter orchestration session for exactly one bounded turn.",
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
    lines.push("Handling rules:");
    lines.push("- For `shell` effects, either run the requested command with your bash/coding tools from the correct workspace or call babysitter_run_shell_effect, then call babysitter_task_post_result with explicit status/stdout/stderr/value fields.");
    lines.push("- For `agent`, `node`, or `orchestrator_task` effects, prefer babysitter_dispatch_effect_harness unless direct coding-tool execution is clearly better.");
    lines.push("- For `breakpoint` effects, use AskUserQuestion in interactive mode or choose the best option non-interactively, then post the result.");
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
