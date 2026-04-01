import type { HarnessDiscoveryResult } from "../../harness/types";
import { createPiContext } from "../../prompts/context";
import { composeProcessCreatePrompt, composeOrchestrationPrompt } from "../../prompts/compose";
import {
  resolveActiveProcessLibrary,
  getDefaultProcessLibrarySpec,
} from "../../processLibrary/active";

export interface HarnessPromptContext {
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

/** @deprecated Use HarnessPromptContext instead */
export type SessionCreatePromptContext = HarnessPromptContext;

export interface ProcessDefinitionUserPromptOptions {
  interactive: boolean;
  workspaceAssessment?: "empty" | "non-empty";
  workspaceEntries?: string[];
}

function formatHarnessCatalog(context: HarnessPromptContext): string[] {
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

function formatRuntimeContext(context: HarnessPromptContext): string[] {
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

function formatHarnessAssignmentGuidance(context: HarnessPromptContext): string[] {
  const installedHarnesses = context.discoveredHarnesses
    .filter((h) => h.installed)
    .map((h) => h.name);
  const installedList = installedHarnesses.length > 0
    ? installedHarnesses.join(", ")
    : "(none)";

  return [
    "Harness assignment guidance:",
    `- Only assign installed harness names. Installed harnesses: ${installedList}.`,
    "- Default `agent`, legacy `node`, and `orchestrator_task` work to the internal PI worker. Prefer `task.execution.harness` to route a task to a specific installed harness. The legacy `task.metadata.harness` field is still supported but `execution.harness` takes precedence when both are present.",
    "- Treat `pi` / `oh-my-pi` as the internal harness. Its default worker mode is native/local PI execution with isolation disabled unless the task opts into stronger guardrails.",
    "- Shell and legacy node effects must be executed intentionally by the orchestrating agent and then posted via `task:post`; never assume a host-side auto-executor exists.",
    "- Shell effects run through the internal PI worker even when orchestration is bound to an external CLI harness. Keep shell work on that worker by default.",
    "- Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction` for ordinary internal PI work. Leave them unset unless the task truly requires stronger guardrails or long-running compaction.",
    "- For risky shell or system-changing subtasks that truly need stronger guardrails, encode them explicitly in task metadata: `bashSandbox: \"secure\"` to opt into AgentSH, `isolated: true` to disable repo/global extensions and skills, and `enableCompaction: true` when a long-running internal worker needs compaction.",
    "- Treat `claude-code`, `codex`, `gemini-cli`, and other external CLIs as text-agent harnesses. Use them only when their behavior is materially better for that task.",
    "- Tasks may include an `execution` field with `model`, `harness`, and `permissions`. `execution.model` is universal (plugins and internal harness). `execution.harness` and `execution.permissions` are only used by the internal harness (`harness:create-run`) and ignored by plugins.",
    "- External CLI harnesses do not inherit AgentSH protection for their own internal shell or tool execution. Route security-sensitive shell work through the internal PI worker instead of assuming the external harness is guarded.",
    context.selectedHarnessName
      ? `- The selected orchestration binding harness for this run is ${context.selectedHarnessName}.`
      : "- No orchestration binding harness has been selected yet.",
  ];
}

function formatSharedContext(context: HarnessPromptContext): string[] {
  return [
    "",
    ...formatRuntimeContext(context),
    "",
    ...formatHarnessCatalog(context),
    "",
    ...formatHarnessAssignmentGuidance(context),
  ];
}

export async function buildProcessDefinitionSystemPrompt(
  outputDir: string,
  context: HarnessPromptContext,
  interactive?: boolean | undefined,
): Promise<string> {
  // Resolve the active process-library root for the PI context
  let processLibraryRoot: string | undefined;
  let processLibraryReferenceRoot: string | undefined;
  try {
    const resolved = await resolveActiveProcessLibrary();
    if (resolved.binding?.dir) {
      processLibraryRoot = resolved.binding.dir;
      processLibraryReferenceRoot = getDefaultProcessLibrarySpec().referenceRoot;
    }
  } catch {
    // No binding — templates will fall back to manual instructions
  }

  const piCtx = createPiContext({
    interactive,
    processLibraryRoot,
    processLibraryReferenceRoot,
  });
  const composedInstructions = composeProcessCreatePrompt(piCtx);

  return [
    "You are the babysitter harness:create-run phase 1 agent.",
    "Your job is to turn the user's intent into a concrete babysitter process definition before any run is created or bound.",
    "",
    "Rules:",
    "- This phase is unbound. Do not create a run, bind a session, iterate a run, or post task results.",
    "- In interactive mode, AskUserQuestion is the only in-loop way to ask the user for clarification. If you need missing requirements, call AskUserQuestion instead of asking in plain text.",
    "- Use the AskUserQuestion tool when clarification is useful. Ask focused, high-signal questions in batches when possible.",
    "- Whenever you call AskUserQuestion, set a generous timeout and a recommended option when safe so the turn can recover cleanly instead of stalling forever.",
    "- Before authoring the process in any mode, resolve the active shared process-library and conduct a real search against it. In this built-in PI path, use `babysitter_resolve_process_library`, `babysitter_search_process_library`, and `babysitter_read_process_library_file`; those tools are the internal `harness:create-run` harness surface for process-library work. Outside this built-in path, use `babysitter process-library:active --json`, then search the returned `binding.dir`. Do not skip this process-library search step.",
    "- Treat `binding.dir` as the active process-library root that must be searched first. If you need the cloned repo root itself for adjacent material, use `defaultSpec.cloneDir`. Treat `reference/` under the active root or `defaultSpec.referenceRoot` as the canonical reference area.",
    "- Research the workspace before finalizing the process. Use your available read/search/bash/write tools as needed.",
    "- Treat the provided workspace as the only relevant filesystem root unless the user explicitly points you somewhere else.",
    "- You may inspect local babysitter process references when they materially improve the process design. Prefer project `.a5c/processes/`, the active process-library root returned in `binding.dir`, the cloned repo root returned in `defaultSpec.cloneDir` when you need adjacent reference material, local plugin paths such as `plugins/babysitter/skills/babysit/process/`, repository `library/` materials, and local babysitter discover/profile CLI commands when available.",
    "- Use babysitter_write_process_definition to write the final JavaScript process file to the exact output path provided below.",
    "- The module must export a named `async function process(inputs, ctx)`.",
    "- The process must orchestrate the work through babysitter tasks instead of doing the main implementation directly in `process(inputs, ctx)`.",
    "- Define at least one task with `defineTask(...)`, and invoke tasks from `process(inputs, ctx)` via `await ctx.task(...)`.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; never pass plain object task definitions or ad-hoc task objects.",
    "- Inside that named `process(inputs, ctx)` export, do not reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists in runtime context. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Keep the generated module syntactically valid ESM. If you embed HTML/CSS/JS asset contents inside the process source, do not use raw nested template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- The generated process must directly execute the user's requested work. Do not generate a meta-process that writes another babysitter process unless the user explicitly asked for process authoring.",
    "- After the file is written through babysitter_write_process_definition, call babysitter_report_process_definition exactly once with the final path and a concise summary.",
    "- Do not claim completion in plain text without calling babysitter_report_process_definition.",
    "- If different tasks should run on different harnesses, encode that in the process definition rather than leaving it implicit.",
    "",
    "Process Library Activation:",
    "- You MUST call `babysitter_resolve_process_library` to bootstrap and resolve the active process-library root before authoring the process. This is non-optional.",
    "- After resolving, read `binding.dir` as the active process-library root to search. Treat `specializations/**/**/**`, `methodologies/`, `contrib/`, and `reference/` as paths relative to `binding.dir`.",
    "- If the cloned repo root is needed for adjacent reference material, use `defaultSpec.cloneDir`.",
    "- Use `babysitter_search_process_library` and `babysitter_read_process_library_file` to search the library. Do not skip the search step.",
    "",
    "--- Shared Process Creation Instructions ---",
    "",
    composedInstructions,
    "",
    `Process output directory: ${outputDir}`,
    'Choose a descriptive kebab-case filename for your process (e.g. "user-auth-tdd.mjs", "data-pipeline-setup.js"). Pass it as the `filename` parameter to babysitter_write_process_definition.',
    ...formatSharedContext(context),
  ].join("\n");
}

export function buildProcessDefinitionUserPrompt(
  userPrompt: string,
  outputDir: string,
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
      ? "Interactive mode. Run the interview step first. If material requirements are missing, use AskUserQuestion rather than plain-text questions."
      : "Non-interactive mode. Do not call AskUserQuestion; infer missing details from the request and workspace state.",
    "",
    `User request: ${userPrompt}`,
    `Process output directory: ${outputDir}`,
  ];

  if (workspaceAssessment === "empty") {
    lines.push(
      "Workspace assessment: empty.",
      `Workspace entries: ${workspaceSummary}`,
    );
    if (interactive) {
      lines.push(
        "Treat this as a greenfield request, but do not skip the interview just because the workspace is empty.",
        "If material product or delivery constraints remain ambiguous after workspace and process-library inspection, ask the next highest-signal AskUserQuestion before you finalize the process.",
      );
    } else {
      lines.push(
        "Treat this as a greenfield request and move straight to authoring the process.",
      );
    }
    lines.push(
      "You still must resolve the active shared process-library and search it before writing the process.",
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
    "Before writing the process, you MUST resolve and search the active process-library. Use babysitter_resolve_process_library, then babysitter_search_process_library to find relevant patterns.",
    "The generated process must directly execute the user's requested work rather than write another babysitter process.",
    "Use babysitter_write_process_definition to write the file now, then call babysitter_report_process_definition exactly once.",
  );

  return lines.join("\n");
}

export function buildOrchestrationSystemPrompt(
  selectedHarnessName: string,
  context: HarnessPromptContext,
  interactive?: boolean | undefined,
): string {
  const piCtx = createPiContext({ interactive });
  const composedInstructions = composeOrchestrationPrompt(piCtx);

  return [
    "You are the babysitter harness:create-run phase 2 orchestration agent.",
    "Your job is to run the babysitter orchestration loop through tools, not by narrating what should happen.",
    "Follow the babysit workflow directly: run one iteration, inspect the returned effects, perform the requested effects through the babysitter effect tools and available coding tools, post the results, and repeat until the run reaches a terminal state.",
    "",
    "Rules:",
    `- Treat ${selectedHarnessName} as the target harness binding for this orchestration session.`,
    "- You have your built-in coding tools (bash/read/write/edit/search) plus the custom babysitter tools below. Use them to do the orchestration work itself.",
    "- AskUserQuestion is the in-loop user interaction tool for this phase. In interactive mode, use it instead of asking the user in plain text.",
    "- Call babysitter_run_create to create the run if it does not already exist.",
    "- Immediately call babysitter_bind_session after run creation and before the first orchestration iteration.",
    "- Work in bounded turns. In each turn, call babysitter_run_iterate at most once unless the prompt explicitly tells you otherwise.",
    "- Do not rely on a hidden host-side effect executor. Perform or dispatch each effect intentionally based on the effect payload you received from babysitter_run_iterate.",
    "- Shell and legacy node effects are first-class pending effects. Do not skip them, narrate them, or assume the host will run them for you.",
    "- Whenever a shell or node effect is requested, execute that work intentionally through the available tools or a delegated worker, then post the outcome yourself.",
    "- If a delegated worker, tool call, or interactive question times out, adapt instead of failing the run immediately: increase the timeout when the task is still valid, recover partial progress, or narrow the next step.",
    "- When a tool or delegated worker accepts a `timeout`, use a generous budget by default for meaningful coding or verification work. Substantial delegated work should usually get at least 1800000ms rather than a short interactive default.",
    "- When choosing how to execute pending work, respect task-level harness metadata and the installed harness catalog provided below.",
    "- Stay in the orchestration loop until the run completes, fails, or reaches a hard limit reported by the tools.",
    "- When the run reaches a terminal state, call babysitter_finish_orchestration exactly once.",
    "",
    "--- Shared Orchestration Instructions ---",
    "",
    composedInstructions,
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
    lines.push("- For `shell` effects, execute the requested command intentionally, capture the outcome, then call babysitter_task_post_result with explicit status/stdout/stderr/value fields.");
    lines.push("- For legacy `node` effects, execute the requested work intentionally through the available tools or a delegated worker, capture the outcome, then call babysitter_task_post_result yourself.");
    lines.push("- For `agent` or `orchestrator_task` effects, prefer babysitter_dispatch_effect_harness unless direct coding-tool execution is clearly better for the requested effect.");
    lines.push("- If a delegated worker or tool call exposes a `timeout`, set a generous value for substantive work and retry with a longer timeout or narrower scope before giving up.");
    lines.push("- For `breakpoint` effects, use AskUserQuestion in interactive mode with explicit approval options or choose the best option non-interactively, then post the result.");
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
