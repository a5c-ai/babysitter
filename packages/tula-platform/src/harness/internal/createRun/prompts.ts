import type { HarnessDiscoveryResult } from "../../types";
import type { SessionHistory } from "../../../session/types";
import type { ExternalAgentDiscovery, ExternalAgentInfo } from "@a5c-ai/babysitter-sdk";
import {
  createPromptContextFromCatalog,
  composeProcessCreatePrompt,
  resolveActiveProcessLibrary,
  getDefaultProcessLibrarySpec,
  renderBreakpointHandling,
  renderResultsPosting,
} from "@a5c-ai/babysitter-sdk";

export interface HarnessPromptContext {
  platform: string;
  arch: string;
  nodeVersion: string;
  cwd: string;
  workspace: string;
  selectedHarnessName?: string;
  hostAgentName?: string;
  hostAgentLabel?: string;
  hostCapabilities?: string[];
  hostTools?: unknown[];
  discoveredHarnesses: HarnessDiscoveryResult[];
  externalAgents?: ExternalAgentDiscovery;
  compressionEnabled: boolean;
  secureSandboxImage: string;
  piDefaultBashSandbox: "local" | "auto" | "secure";
  piIsolationDefault: boolean;
  envFlags: Array<{ name: string; value: string }>;
  sessionContext?: SessionHistory;
}

/** @deprecated Use HarnessPromptContext instead */
export type SessionCreatePromptContext = HarnessPromptContext;

export interface ProcessDefinitionUserPromptOptions {
  interactive: boolean;
  workspaceAssessment?: "empty" | "non-empty";
  workspaceEntries?: string[];
  preferAgentOnlyTasks?: boolean;
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

function formatAgentResponder(agent: ExternalAgentInfo): string {
  const auth = agent.authenticated ? "authenticated" : "not authenticated";
  const capabilities = agent.capabilities.length > 0
    ? ` | capabilities=${agent.capabilities.join(",")}`
    : "";
  return `- ${agent.name} (${agent.displayName}) | ${auth}${capabilities}`;
}

export function formatResponderContext(context: HarnessPromptContext): string[] {
  const installedAgents = context.externalAgents?.agents
    .filter((agent) => agent.installed)
    .sort((a, b) => a.name.localeCompare(b.name)) ?? [];
  const agentAvailability = context.externalAgents?.available === true
    ? installedAgents.length > 0
      ? installedAgents.map(formatAgentResponder)
      : ["- agent-mux is available, but no installed agent responders were discovered."]
    : ["- No agent-mux agent responders were discovered in this planning environment."];

  return [
    "Available responder context:",
    "- Supported `agent.responderType` values: internal, human, agent, tracker, auto.",
    "- Omit `agent.responderType` for the default internal agent-core worker.",
    "- Use `agent.responderType: \"agent\"` only when a task should route to an installed agent-mux adapter.",
    "- Agent responder tasks require a non-empty `agent.adapter` value. Prefer `fallbackType: \"internal\"` only when internal execution is an acceptable degradation.",
    "- Do not confuse the host agent identity with an agent responder adapter; host context describes the current planner, while adapter chooses a routed task executor.",
    "Available agent responders (agent-mux):",
    ...agentAvailability,
    "Agent responder task shape:",
    "```javascript",
    "defineTask(\"specialist-review\", (args) => ({",
    "  kind: \"agent\",",
    "  title: \"Specialist review\",",
    "  agent: {",
    "    name: \"Specialist reviewer\",",
    "    prompt: \"Review the changed files and report issues.\",",
    "    responderType: \"agent\",",
    "    adapter: \"codex\",",
    "    fallbackType: \"internal\",",
    "  },",
    "}));",
    "```",
  ];
}

function formatHostAgentContext(context: HarnessPromptContext): string[] {
  if (!context.hostAgentName && !context.hostAgentLabel) {
    return [];
  }

  const hostName = context.hostAgentName ?? "unknown";
  const hostLabel = context.hostAgentLabel ?? hostName;
  const capabilities = context.hostCapabilities && context.hostCapabilities.length > 0
    ? context.hostCapabilities.join(", ")
    : "unknown";
  const selectedHarness = context.selectedHarnessName ?? "not selected";

  return [
    "Host agent context:",
    `- Host agent running this planning session: ${hostLabel} (${hostName}).`,
    `- Host-local capabilities: ${capabilities}.`,
    "- Use the host agent for work it can perform locally; use the internal agent-core worker for default task execution and shell effects unless a task intentionally routes elsewhere.",
    `- The selected orchestration binding harness is ${selectedHarness}; this is distinct from the host agent identity.`,
    "- Discovered external harnesses are routing options, not proof that the current host can perform their native tools.",
  ];
}

function truncateSessionContextValue(value: string, maxChars = 240): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxChars
    ? `${normalized.slice(0, maxChars - 1)}…`
    : normalized;
}

export function formatSessionContextForPlanning(context?: SessionHistory): string[] {
  if (!context) {
    return [];
  }

  const lines: string[] = [];
  const notes = context.notes.slice(-5).map((note) => truncateSessionContextValue(note));
  const sharedKnowledge = Object.entries(context.sharedKnowledge)
    .slice(-8)
    .map(([key, value]) => `${key}=${truncateSessionContextValue(value)}`);
  const decisions = context.decisions.slice(-5)
    .map((decision) => truncateSessionContextValue(
      `${decision.description}${decision.rationale ? ` (${decision.rationale})` : ""}`,
    ));
  const runSummaries = context.runSummaries.slice(-3)
    .map((summary) => truncateSessionContextValue(
      `${summary.runId}: ${summary.status}${summary.outcome ? ` - ${summary.outcome}` : ""}`,
    ));

  if (context.worktree) {
    lines.push("Worktree:");
    for (const [key, value] of Object.entries(context.worktree)) {
      if (value !== undefined && value !== null && value !== "") {
        lines.push(`- ${key}=${truncateSessionContextValue(String(value))}`);
      }
    }
  }
  if (notes.length > 0) {
    lines.push("Notes:", ...notes.map((note) => `- ${note}`));
  }
  if (sharedKnowledge.length > 0) {
    lines.push("Shared knowledge:", ...sharedKnowledge.map((entry) => `- ${entry}`));
  }
  if (decisions.length > 0) {
    lines.push("Recent decisions:", ...decisions.map((decision) => `- ${decision}`));
  }
  if (runSummaries.length > 0) {
    lines.push("Recent run summaries:", ...runSummaries.map((summary) => `- ${summary}`));
  }

  return lines.length > 0
    ? [
      "Session planning context:",
      "- Use this bounded, session-scoped context when it is relevant to the new process.",
      "- Do not treat it as a substitute for the current user request or repository state.",
      ...lines,
    ]
    : [];
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
    "- Default `agent`, legacy `node`, and `orchestrator_task` work to the internal agent-core worker. Prefer `task.execution.harness` to route a task to a specific installed harness. The legacy `task.metadata.harness` field is still supported but `execution.harness` takes precedence when both are present.",
    "- Treat `agent-core` / `oh-my-pi` as the built-in programmatic harness. Its default worker mode is native/local execution with isolation disabled unless the task opts into stronger guardrails.",
    "- Shell and legacy node effects must be executed intentionally by the orchestrating agent and then posted via `task:post`; never assume a host-side auto-executor exists.",
    "- Shell effects run through the internal agent-core worker even when orchestration is bound to an external CLI harness. Keep shell work on that worker by default.",
    "- Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction` for ordinary internal agent-core work. Leave them unset unless the task truly requires stronger guardrails or long-running compaction.",
    "- For risky shell or system-changing subtasks that truly need stronger guardrails, encode them explicitly in task metadata: `bashSandbox: \"secure\"` to opt into AgentSH, `isolated: true` to disable repo/global extensions and skills, and `enableCompaction: true` when a long-running internal worker needs compaction.",
    "- Treat external CLI harnesses (resolved via agent-mux) as text-agent harnesses. Use them only when their behavior is materially better for that task.",
    "- Tasks may include an `execution` field with `model`, `harness`, and `permissions`. `execution.model` is universal (plugins and the built-in harness). `execution.harness` and `execution.permissions` are internal harness routing/guardrail hints, not a universal plugin contract.",
    "- Do not treat `execution.permissions` as a cross-harness security boundary. Plugin targets may ignore it entirely, so route security-sensitive work through an execution path whose enforcement you actually control.",
    "- External CLI harnesses do not inherit AgentSH protection for their own internal shell or tool execution. Route security-sensitive shell work through the internal agent-core worker instead of assuming the external harness is guarded.",
    context.selectedHarnessName
      ? `- The selected orchestration binding harness for this run is ${context.selectedHarnessName}.`
      : "- No orchestration binding harness has been selected yet.",
  ];
}

function formatSharedContext(context: HarnessPromptContext): string[] {
  const hostAgentContext = formatHostAgentContext(context);
  const sessionContext = formatSessionContextForPlanning(context.sessionContext);

  return [
    "",
    ...formatRuntimeContext(context),
    ...(hostAgentContext.length > 0
      ? ["", ...hostAgentContext]
      : []),
    "",
    ...formatHarnessCatalog(context),
    "",
    ...formatResponderContext(context),
    ...(sessionContext.length > 0
      ? ["", ...sessionContext]
      : []),
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

  const piCtx = createPromptContextFromCatalog('pi', {
    interactive,
    processLibraryRoot,
    processLibraryReferenceRoot,
  });
  const composedInstructions = composeProcessCreatePrompt(piCtx);

  return [
    "You are the agent-platform create-run PhasePlanProcess agent.",
    "Your job is to turn the user's intent into a concrete babysitter process definition and establish the run context for the later orchestration phase.",
    "",
    "Rules:",
    "- This phase uses the common coding tools plus AskUserQuestion, task, skill, and babysitter_report_process_definition.",
    "- Do not use dedicated create/bind/iterate/post-result babysitter tools in this phase. babysitter_report_process_definition is the only phase-specific babysitter tool here.",
    "- In interactive mode, AskUserQuestion is the only in-loop way to ask the user for clarification. If you need missing requirements, call AskUserQuestion instead of asking in plain text.",
    "- AskUserQuestion is a common tool whose response is conditioned by the interactive setting. Use it when clarification is useful, and ask focused high-signal questions in batches when possible.",
    "- Whenever you call AskUserQuestion, set a generous timeout and a recommended option when safe so the turn can recover cleanly instead of stalling forever.",
    "- Before you author anything, resolve the active shared process-library and search it with the normal file/search tools.",
    "- Before authoring the process in any mode, conduct a real search against the active shared process-library using the normal file/search tools (`read`, `find`, `grep`, `bash`). Do not skip this process-library search step.",
    "- Treat the active process-library root provided in the prompt context as the first place to search. If you need adjacent material, inspect the cloned repo root or reference area using the normal file/search tools.",
    "- Research the workspace before finalizing the process. Use your available read/search/bash/write tools as needed.",
    "- Treat the provided workspace as the only relevant filesystem root unless the user explicitly points you somewhere else.",
    "- You may inspect local babysitter process references when they materially improve the process design. Prefer project `.a5c/processes/`, the active process-library root returned in `binding.dir`, the cloned repo root returned in `defaultSpec.cloneDir` when you need adjacent reference material, local plugin paths such as `plugins/babysitter/skills/babysit/process/`, repository `library/` materials, and local babysitter discover/profile CLI commands when available.",
    "- Use the normal file tools to write the final JavaScript process file to the exact output path provided below. Do not rely on a babysitter-specific write tool.",
    "- The module must export a named `async function process(inputs, ctx)`.",
    "- The process must orchestrate the work through babysitter tasks instead of doing the main implementation directly in `process(inputs, ctx)`.",
    "- Define at least one task with `defineTask(...)`, and invoke tasks from `process(inputs, ctx)` via `await ctx.task(...)`.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; never pass plain object task definitions or ad-hoc task objects.",
    "- When defining task IO paths, use `inputs.json` for task inputs and `result.json` for task outputs. Do not emit `input.json`.",
    "- Inside that named `process(inputs, ctx)` export, do not reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists in runtime context. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Keep the generated module syntactically valid ESM. If you embed HTML/CSS/JS asset contents inside the process source, do not use raw nested template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- The generated process must directly execute the user's requested work. Do not generate a meta-process that writes another babysitter process unless the user explicitly asked for process authoring.",
    "- After the file is written, call babysitter_report_process_definition exactly once with the final path and a concise summary.",
    "- babysitter_report_process_definition creates the babysitter run and binds the session when possible. Do not try to create or bind the run yourself in this phase.",
    "- Do not claim completion in plain text without calling babysitter_report_process_definition.",
    "- If different tasks should run on different harnesses, encode that in the process definition rather than leaving it implicit.",
    "",
    "Process Library Activation:",
    "- The active process-library root is already available in the prompt context. Search it with the normal file/search tools before authoring the process.",
    "",
    "--- Shared Process Creation Instructions ---",
    "",
    composedInstructions,
    "",
    `Process output directory: ${outputDir}`,
    'Choose a descriptive kebab-case filename for your process (e.g. "user-auth-tdd.mjs", "data-pipeline-setup.js"), write it with the normal file tools, and then report the final path.',
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
  const preferAgentOnlyTasks = options?.preferAgentOnlyTasks === true;
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
      preferAgentOnlyTasks
        ? "Put all implementation and verification in `agent` or `skill` tasks. Do not generate `shell` tasks for this run shape unless the user explicitly required an existing CLI command."
        : "Put the main implementation in one or more `agent` tasks. Use `shell` tasks only for concrete runnable verification or tooling commands.",
      preferAgentOnlyTasks
        ? "Do not add `breakpoint` tasks for this run shape. Treat approval gates as process-authoring bugs unless the user explicitly asked for them."
        : "Use `breakpoint` tasks only when user input or approval is materially required.",
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
    "Before writing the process, you MUST search the active process-library with the normal file/search tools to find relevant patterns.",
    "The generated process must directly execute the user's requested work rather than write another babysitter process.",
    preferAgentOnlyTasks
      ? "For this `/babysitter:call`-style flow, keep the process fully agent/skill driven: no `shell` tasks unless explicitly required, and no `breakpoint` tasks."
      : "Keep breakpoints and shell tasks proportionate to real workflow needs.",
    "Write the process with the normal file tools now, then call babysitter_report_process_definition exactly once.",
  );

  return lines.join("\n");
}

export function buildOrchestrationSystemPrompt(
  selectedHarnessName: string,
  context: HarnessPromptContext,
  interactive?: boolean | undefined,
  preferAgentOnlyTasks?: boolean | undefined,
): string {
  const piCtx = createPromptContextFromCatalog('pi', { interactive });
  const sharedGuidance = [
    renderBreakpointHandling(piCtx),
    renderResultsPosting(piCtx),
  ].filter((section) => section.trim().length > 0).join("\n\n---\n\n");

  return [
    "You are the agent-platform create-run PhaseOrchestration agent.",
    "Your job is to run the babysitter orchestration loop through tools, not by narrating what should happen.",
    "Follow the babysit workflow directly: run one iteration, inspect the returned effects, perform the requested effects through `bash`, `task`, `skill`, and the available coding tools, post the results, and repeat until the run reaches a terminal state.",
    "",
    "Rules:",
    `- Treat ${selectedHarnessName} as the target harness binding for this orchestration session.`,
    "- You have your built-in coding tools (bash/read/write/edit/search) plus the custom babysitter tools below. Use them to do the orchestration work itself.",
    "- AskUserQuestion, task, and skill are common tools in this phase. In interactive mode, use AskUserQuestion instead of asking the user in plain text.",
    "- Work in bounded turns. In each turn, call babysitter_run_iterate at most once unless the prompt explicitly tells you otherwise.",
    "- Never drive the orchestration loop through raw `babysitter` CLI commands inside `bash`. Use the custom babysitter tools (`babysitter_run_iterate`, `babysitter_task_post_result`, `babysitter_finish_orchestration`) for loop control.",
    "- Never import or call babysitter SDK/runtime helpers such as `orchestrateIteration`, `commitEffectResult`, or `readTaskResult` from ad-hoc `bash`/`node` scripts. Use the exposed custom babysitter tools instead.",
    "- `bash` is only for actual workspace commands and requested shell effects. It is not a substitute for babysitter loop-control tools.",
    "- Do not implement the user's requested workspace deliverable directly before the bound run yields pending effects or a terminal result. First drive the run through `babysitter_run_iterate`.",
    "- Do not rely on a hidden host-side effect executor. Perform or dispatch each effect intentionally based on the effect payload you received from babysitter_run_iterate.",
    "- Shell and legacy node effects are first-class pending effects. Do not skip them, narrate them, or assume the host will run them for you.",
    "- Do not create, copy, rename, delete, or hand-edit sibling run directories/files inside `.a5c/runs/` (for example debug clones like `TESTCOPY`). The bound run storage is owned by the host and may only be mutated through the custom babysitter tools.",
    preferAgentOnlyTasks
      ? "- Prefer wrapped `agent`, `skill`, and delegated-task resolution paths. Treat `shell` effects as exceptional compatibility cases, not the normal plan shape for `/babysitter:call` flows."
      : "- Whenever a shell effect is requested, execute it through `bash` or another intentional worker path, then post the outcome yourself.",
    preferAgentOnlyTasks
      ? "- `/babysitter:call` flows should not emit breakpoint effects. If one appears, treat it as a process-authoring regression and repair the process instead of normalizing more approval gates into the run."
      : "- Breakpoint effects are legitimate when the process truly needs user input or approval.",
    "- For delegated or fresh-context work, prefer `task`. For skill-guided execution, prefer `skill`. Use the normal coding tools directly when that is the simplest correct path.",
    "- If a delegated worker, tool call, or interactive question times out, adapt instead of failing the run immediately: increase the timeout when the task is still valid, recover partial progress, or narrow the next step.",
    "- When a tool or delegated worker accepts a `timeout`, use a generous budget by default for meaningful coding or verification work. Substantial delegated work should usually get at least 1800000ms rather than a short interactive default.",
    "- When choosing how to execute pending work, respect task-level harness metadata and the installed harness catalog provided below.",
    "- Stay in the orchestration loop until the run completes, fails, or reaches a hard limit reported by the tools.",
    "- When the run reaches a terminal state, call babysitter_finish_orchestration exactly once.",
    "",
    "--- Shared Orchestration Instructions ---",
    "",
    sharedGuidance,
    "",
    "This phase is the bound internal orchestration phase. External stop-hook and raw CLI loop instructions do not control this session; keep the loop inside the custom babysitter tools exposed here.",
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
  planningConversationSummary?: string;
  maxIterations: number;
  currentIteration: number;
  runId?: string;
  runDir?: string;
  lastStatus?: string;
  lastError?: string;
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
    args.planningConversationSummary
      ? `Planning conversation summary:\n${args.planningConversationSummary}`
      : undefined,
    `Maximum iterations: ${args.maxIterations}`,
    `Current completed iterations: ${args.currentIteration}`,
    `Run id: ${args.runId ?? "(not created)"}`,
    `Run dir: ${args.runDir ?? "(not created)"}`,
    `Last run status: ${args.lastStatus ?? "unknown"}`,
  ];

  if (args.fallbackReason) {
    lines.push(`Fallback note: ${args.fallbackReason}`);
  }

  // When recovering from a process-error, instruct the agent to fix the
  // process code before retrying the iteration.
  if (args.lastStatus === "process-error" && args.lastError) {
    lines.push("");
    lines.push("IMPORTANT: The last iteration returned a recoverable process-error.");
    lines.push(`Error: ${args.lastError}`);
    lines.push("");
    lines.push("The process code has a bug. Read the process file, fix the error, save it, and then call babysitter_run_iterate to retry.");
    lines.push("Do NOT call babysitter_finish_orchestration — the run has NOT failed. The journal is clean and the iteration can be retried after the fix.");
    lines.push("");
    lines.push("End with a short plain-text summary of what you fixed.");
    return lines.join("\n");
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
    lines.push("Resolve every listed pending effect and post its result in this turn.");
    lines.push("After every listed effect is posted, the run must be advanced out of waiting before it can complete. Call babysitter_run_iterate exactly once after the last post if you are the one driving the loop.");
    lines.push("Do not use `task:list`, plain narration, or a completion claim as a substitute for that follow-up babysitter_run_iterate call.");
    lines.push("Handling rules:");
    lines.push("- For `shell` effects, execute the requested command intentionally with `bash`, capture the outcome, then call babysitter_task_post_result with explicit status/stdout/stderr/value fields.");
    lines.push("- For legacy `node`, `agent`, or `orchestrator_task` effects, use `task` for delegated fresh-context execution, `skill` for agentic skill-guided execution, or the available coding tools directly, then call babysitter_task_post_result yourself.");
    lines.push("- Never debug by cloning or editing `.a5c/runs/*` entries directly. Do not create ad-hoc copies like `TESTCOPY`; keep the bound run storage untouched except through the custom babysitter tools.");
    lines.push("- If a delegated worker or tool call exposes a `timeout`, set a generous value for substantive work and retry with a longer timeout or narrower scope before giving up.");
    lines.push("- For `breakpoint` effects, use AskUserQuestion in interactive mode with explicit approval options or choose the best option non-interactively, then post the result.");
  } else {
    lines.push("");
    lines.push("Call babysitter_run_iterate exactly once in this turn.");
    lines.push("If the run is freshly created or has not yielded effects yet, do not implement the workspace deliverable directly before that iterate call returns.");
    lines.push("If it returns pending effects, resolve all of them and post every result before stopping.");
    lines.push("If it returns completed or failed, stop after recording the terminal state.");
  }

  lines.push("");
  lines.push("End with a short plain-text summary of what changed in this turn.");
  return lines.filter((line): line is string => typeof line === "string").join("\n");
}
