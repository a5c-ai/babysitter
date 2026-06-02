import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  type ExternalWorkspaceAssessment,
  type HarnessPromptContext as SessionCreatePromptContext,
} from "../utils";
import { formatResponderContext, formatSessionContextForPlanning } from "../prompts";

export { formatSessionContextForPlanning };

export function buildExternalProcessDefinitionPrompt(args: {
  prompt: string;
  outputDir: string;
  workspace?: string;
  promptContext: SessionCreatePromptContext;
  workspaceAssessment: ExternalWorkspaceAssessment;
  preferAgentOnlyTasks?: boolean;
}): string {
  const workspace = path.resolve(args.workspace ?? process.cwd());
  const installedHarnesses = args.promptContext.discoveredHarnesses
    .filter((h) => h.installed)
    .map((h) => h.name);
  const installedHarnessList = installedHarnesses.length > 0
    ? installedHarnesses.join(", ")
    : "(none)";
  const workspaceSummary = args.workspaceAssessment.entries.length > 0
    ? args.workspaceAssessment.entries.join(", ")
    : "(no files)";
  const preferAgentOnlyTasks = args.preferAgentOnlyTasks === true;
  const hostAgentContext = formatHostAgentContext(args.promptContext);
  const sessionPlanningContext = formatSessionContextForPlanning(args.promptContext.sessionContext);
  const responderContext = formatResponderContext(args.promptContext);
  const emptyWorkspaceAuthoringGuide = [
    "",
    "Empty-workspace authoring guide:",
    "- Do not perform extra exploration. You already know the workspace is empty.",
    "- Write a concrete greenfield process immediately.",
    "- Prefer a small process with explicit milestones such as: plan the game, scaffold the project, implement the game, verify the result.",
    preferAgentOnlyTasks
      ? "- Use `agent` or `skill` tasks for planning, implementation, and verification. Do not generate `shell` tasks for this run shape unless the user explicitly requires an existing CLI command."
      : "- Use `agent` tasks for planning and implementation. Use `shell` tasks only for concrete runnable commands such as dependency install, build, or test commands that the later orchestration can execute.",
    preferAgentOnlyTasks
      ? "- Do not generate `breakpoint` tasks for this run shape. Approval gates are process-authoring bugs unless the user explicitly asked for them."
      : "- Add `breakpoint` tasks only when the process genuinely needs user input or sign-off.",
    "- Keep the process practical for a brand-new directory: it should create the project, build the game, and verify that it runs or tests cleanly.",
  ].join("\n");

  return [
    "You are running agent-platform create-run PhasePlanProcess on an external CLI harness in non-interactive mode.",
    "Do the real process-authoring work in the workspace and write the actual process file to disk.",
    "",
    "Task:",
    `- User request: ${args.prompt}`,
    `- Workspace: ${workspace}`,
    `- Process output directory: ${path.resolve(args.outputDir)}`,
    `- Workspace assessment: ${args.workspaceAssessment.kind} (${workspaceSummary})`,
    "",
    "Requirements:",
    "- Start with one quick check of the workspace contents only if you need to confirm the assessment above.",
    args.workspaceAssessment.kind === "empty"
      ? "- The workspace is empty. Treat this as a greenfield request and move straight to authoring the process."
      : "- Only tailor the process to existing code when the workspace actually contains relevant project files.",
    "- Do not inspect paths outside the workspace unless the workspace itself points to them.",
    "- Do not use web search, browse remote repositories, or fetch external documentation for this task.",
    args.workspaceAssessment.kind === "empty"
      ? "- Do not inspect global skill/plugin directories, home-directory config, or unrelated repositories for examples. You already have enough context to write the process."
      : "- Keep research tight and relevant; do not wander through unrelated global skill/plugin directories.",
    "- Do not ask the user questions. Infer missing details from the request and repo state.",
    "- Write a complete ESM JavaScript module that can be imported from the output path.",
    '- Import `defineTask` from `@a5c-ai/babysitter-sdk`.',
    "- The module must export `async function process(inputs, ctx)`.",
    "- The process must orchestrate the work through babysitter tasks instead of doing the main implementation directly in `process(inputs, ctx)`.",
    "- Define at least one task with `defineTask(...)`, and invoke tasks from `process(inputs, ctx)` via `await ctx.task(...)`.",
    "- Use `agent` tasks for planning, implementation, analysis, and verification work.",
    preferAgentOnlyTasks
      ? "- Do not generate `shell` tasks for this run shape unless the user explicitly requires an existing CLI command. Prefer wrapped `agent` or `skill` tasks for verification too."
      : "- Use `shell` tasks only for existing CLI tools such as tests, builds, linters, git, or package managers.",
    preferAgentOnlyTasks
      ? "- Do not generate `breakpoint` tasks for this run shape. Keep the process fully autonomous unless the user explicitly asked for checkpoints."
      : "- Use `breakpoint` tasks only when the workflow truly requires user input or approval.",
    "- Never use `node` kind effects.",
    "- At least one defined task must be an `agent` task for the main work. Shell tasks are for concrete runnable commands only.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; never pass plain object task definitions or ad-hoc task objects.",
    "- Include quality gates and verification/refinement steps that fit the request.",
    "- For this request, a good default is a process that plans the game scope, scaffolds the project, implements the game loop and UI, and verifies the result with runnable checks.",
    "- Keep the module syntactically valid ESM. If you embed HTML/CSS/JS asset contents inside the process source, avoid raw nested template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- Default every task to the internal agent-core worker. If task-level harness routing is needed, only use `task.metadata.harness` for explicit overrides to installed harness names from this list: "
      + `${installedHarnessList}.`,
    args.promptContext.selectedHarnessName
      ? `- The selected orchestration harness for the session will be ${args.promptContext.selectedHarnessName}; keep ` + "`task.metadata.harness`" + " unset for default internal execution and only encode it when a task must explicitly override that default."
      : "- No orchestration harness has been preselected; keep harness routing explicit only where it materially matters.",
    "- Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction` for ordinary internal agent-core work. Leave them unset unless the task truly requires stronger guardrails or long-running compaction.",
    "- External harnesses do not provide agent-core worker guardrails for their own tool execution. Keep security-sensitive shell work on the internal agent-core worker by using shell effects without routing them to an external harness.",
    ...(hostAgentContext.length > 0 ? ["", ...hostAgentContext] : []),
    "",
    ...responderContext,
    ...(sessionPlanningContext.length > 0 ? ["", ...sessionPlanningContext] : []),
    "",
    "Output rules:",
    `- Choose a descriptive kebab-case filename (e.g. "user-auth-tdd.mjs", "data-pipeline-setup.js") and write the file to the process output directory.`,
    "- Return a short summary that confirms what you wrote and the final path.",
    "- Do not rely on AskUserQuestion or babysitter_report_process_definition. Those tools are not available here.",
    "- Do not return pseudocode, placeholders, or a plan without writing the file.",
    ...(args.workspaceAssessment.kind === "empty" ? [emptyWorkspaceAuthoringGuide] : []),
    "",
    "Minimal shape reminder:",
    "```javascript",
    'import { defineTask } from "@a5c-ai/babysitter-sdk";',
    "",
    "export async function process(inputs, ctx) {",
    "  // create and run tasks here",
    "}",
    "```",
  ].join("\n");
}

function formatHostAgentContext(context: SessionCreatePromptContext): string[] {
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

export function buildExternalProcessConformancePrompt(args: {
  outputPath: string;
  prompt: string;
}): string {
  return [
    "Edit one existing JavaScript workflow file so it conforms to the SDK API used by this repository.",
    `Target file: ${path.resolve(args.outputPath)}`,
    `Original user request: ${args.prompt}`,
    "",
    "Conformance requirements:",
    "- Preserve the overall task pipeline and intent.",
    "- Do not use web search or remote documentation. Fix the file using only the local file contents and the requirements in this prompt.",
    "- Every task must be defined with `defineTask(\"task-id\", (args, taskCtx) => ({ ... }))`.",
    "- Never use `defineTask({ ... })` or helper factories that hide the required signature.",
    "- The module must orchestrate real work through those tasks; do not perform the main implementation directly in `process(inputs, ctx)`.",
    "- Agent tasks must use `agent: { name, prompt, outputSchema }`.",
    "- Every task returned from `defineTask(...)` must include a top-level `kind` field.",
    "- Define at least one `agent` task for the main work. Use shell tasks only for concrete runnable commands.",
    "- Put instructions inside `agent.prompt.task`, `agent.prompt.instructions`, and related prompt fields rather than top-level `instructions` fields.",
    "- Agent tasks must use `kind: \"agent\"` with `agent: { name, prompt, outputSchema }`.",
    "- Agent responder tasks must use `kind: \"agent\"` with `agent: { name, prompt, responderType: \"agent\", adapter: \"...\" }`; `adapter` must be a non-empty installed agent-mux adapter name.",
    "- Shell tasks must use `kind: \"shell\"` with `shell: { command: \"...\" }`.",
    "- Do not introduce `kind: \"node\"` task definitions in generated or repaired processes. If logic would have been a node task, convert it to an `agent` or `skill` task instead.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; do not pass plain object task definitions or ad-hoc task objects.",
    "- The exported `process(inputs, ctx)` function must run tasks with `await ctx.task(definedTask, args)`; do not invent alternate task runners.",
    "- Inside the named `process(inputs, ctx)` export, never reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Keep the file as ESM and preserve the target path.",
    "- After editing, run `node --check` on the file.",
    "",
    "Return only a short summary of the changes and the validation result.",
  ].join("\n");
}

export function buildInternalProcessConformancePrompt(args: {
  outputPath: string;
  prompt: string;
  validationError: string;
}): string {
  return [
    "Repair the generated babysitter process file so it conforms to the SDK API expected by this repository.",
    `Target file: ${path.resolve(args.outputPath)}`,
    `Original user request: ${args.prompt}`,
    `Validation error: ${args.validationError}`,
    "",
    "Repair requirements:",
    "- Preserve the overall task pipeline and user intent.",
    "- The module must export a named `async function process(inputs, ctx)`.",
    '- Import `defineTask` from `@a5c-ai/babysitter-sdk`.',
    "- Use `defineTask(\"task-id\", (args, taskCtx) => ({ ... }))` for task definitions.",
    "- Do not use `defineTask({ ... })` or object-only process exports.",
    "- The module must orchestrate real work through defined tasks instead of doing the main implementation directly in `process(inputs, ctx)`.",
    "- Define at least one `agent` task for the main work. Use shell tasks only for concrete runnable commands.",
    "- Every task returned from `defineTask(...)` must include a top-level `kind` field.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; do not pass plain object task definitions or ad-hoc task objects.",
    "- The rewritten module must be syntactically valid ESM and pass `node --check`.",
    "- If the process writes HTML/CSS/JS assets, do not embed raw nested template literals inside outer template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- Inside the named `process(inputs, ctx)` export, do not reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Agent tasks must use `kind: \"agent\"` with `agent: { name, prompt, outputSchema }`.",
    "- Agent responder tasks must use `kind: \"agent\"` with `agent: { name, prompt, responderType: \"agent\", adapter: \"...\" }`; `adapter` must be a non-empty installed agent-mux adapter name.",
    "- Shell tasks must use `kind: \"shell\"` with `shell: { command: \"...\" }`.",
    "- Do not introduce `kind: \"node\"` task definitions in generated or repaired processes. If logic would have been a node task, convert it to an `agent` or `skill` task instead.",
    "- The exported `process(inputs, ctx)` function must call tasks with `await ctx.task(definedTask, args)`.",
    "- Use the normal file tools to rewrite the process file at the target path in the output directory.",
    "- After rewriting the file, call `babysitter_report_process_definition` exactly once with the same path.",
    "- Do not answer with plain text only.",
  ].join("\n");
}

export async function assessWorkspaceForExternalAuthoring(
  workspace?: string,
): Promise<ExternalWorkspaceAssessment> {
  const root = path.resolve(workspace ?? process.cwd());
  try {
    const entries = (await fs.readdir(root))
      .filter((entry) => entry !== "." && entry !== "..")
      .sort();
    return {
      kind: entries.length === 0 ? "empty" : "non-empty",
      entries: entries.slice(0, 12),
    };
  } catch {
    return {
      kind: "empty",
      entries: [],
    };
  }
}
