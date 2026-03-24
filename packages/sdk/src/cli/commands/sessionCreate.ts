/**
 * session:create command handler.
 *
 * Drives a full babysitter session lifecycle through two agentic phases:
 *   Phase 1 - Unbound interview / intent / process-definition
 *   Phase 2 - Bound orchestration loop with hook-style continuation semantics
 *
 * Both phases are driven through a Pi agent session and LLM-callable tools.
 * Interactive user input is exposed through an AskUserQuestion tool instead of
 * direct imperative prompts inside the host loop.
 */

import * as path from "node:path";
import * as readline from "node:readline";
import { execFile } from "node:child_process";
import { promises as fs, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Type } from "@sinclair/typebox";
import { discoverHarnesses } from "../../harness/discovery";
import { invokeHarness } from "../../harness/invoker";
import { createPiSession, PiSessionHandle } from "../../harness/piWrapper";
import type {
  HarnessDiscoveryResult,
  PiSessionEvent,
  SessionBindResult,
} from "../../harness/types";
import { getAdapterByName } from "../../harness";
import {
  createApprovalAskUserQuestion,
  createAskUserQuestionResponse,
  promptAskUserQuestionWithReadline,
  validateAskUserQuestionRequest,
  type AskUserQuestionRequest,
  type AskUserQuestionResponse,
} from "../../interaction";
import { createRun } from "../../runtime/createRun";
import { orchestrateIteration } from "../../runtime/orchestrateIteration";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import type { EffectAction, IterationResult } from "../../runtime/types";
import { BabysitterRuntimeError, ErrorCategory } from "../../runtime/exceptions";
import {
  buildOrchestrationSystemPrompt,
  buildOrchestrationUserPrompt,
  buildProcessDefinitionSystemPrompt,
} from "./sessionCreatePrompts";

export interface SessionCreateArgs {
  prompt?: string;
  harness?: string;
  processPath?: string;
  workspace?: string;
  model?: string;
  maxIterations?: number;
  runsDir: string;
  json: boolean;
  verbose: boolean;
  interactive?: boolean;
}

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";

interface Phase1Progress {
  phase: "1";
  status: "started" | "skipped" | "completed" | "failed" | "interview";
  harness?: string;
  processPath?: string;
  error?: string;
  answer?: string;
}

interface Phase2Progress {
  phase: "2";
  status: "started" | "run-created" | "bound" | "iteration" | "effect" | "completed" | "failed";
  runId?: string;
  runDir?: string;
  harness?: string;
  sessionId?: string;
  iteration?: number;
  runStatus?: string;
  pendingEffects?: number;
  effectId?: string;
  effectKind?: string;
  effectTitle?: string;
  effectStatus?: string;
  error?: string;
  output?: string;
}

type ProgressPayload = Phase1Progress | Phase2Progress;

interface ToolResultShape {
  content: string;
  details?: unknown;
}

interface ProcessDefinitionReport {
  processPath: string;
  summary?: string;
}

interface OrchestrationFinishReport {
  summary?: string;
}

interface OrchestrationState {
  runId?: string;
  runDir?: string;
  sessionBound?: SessionBindResult;
  iteration: number;
  lastIterationResult?: IterationResult;
  pendingActions: Map<string, EffectAction>;
  pendingEffectResults: Map<string, Awaited<ReturnType<typeof resolveEffect>>>;
  lastAskUserQuestionResponse?: AskUserQuestionResponse;
  finished?: OrchestrationFinishReport;
}

const HARNESS_PRIORITY: readonly string[] = [
  "pi",
  "oh-my-pi",
  "claude-code",
  "codex",
  "gemini-cli",
  "opencode",
] as const;

export function selectHarness(
  discovered: HarnessDiscoveryResult[],
  preferred?: string,
): HarnessDiscoveryResult | undefined {
  if (preferred) {
    const match = discovered.find((h) => h.name === preferred && h.installed);
    if (match) return match;
  }

  for (const name of HARNESS_PRIORITY) {
    const match = discovered.find((h) => h.name === name && h.installed);
    if (match) return match;
  }

  return undefined;
}

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true,
  });
}

const PROCESS_GENERATION_TEMPLATE_PATH = path.join(
  __dirname,
  "templates",
  "process-generation-prompt.md",
);

let cachedTemplate: string | undefined;

function loadProcessGenerationTemplate(): string {
  if (cachedTemplate === undefined) {
    cachedTemplate = readFileSync(PROCESS_GENERATION_TEMPLATE_PATH, "utf8");
  }
  return cachedTemplate;
}

function buildMetaPrompt(userPrompt: string, workDir: string): string {
  let template = loadProcessGenerationTemplate();
  template = template.replace("{{USER_PROMPT}}", userPrompt);
  template = template.replace("{{OUTPUT_PATH}}", path.join(workDir, "generated-process.js"));
  template = template.replace("{{INTERVIEW_CONTEXT}}", "");
  return template;
}

const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 60_000;

async function waitForProcessFile(
  filePath: string,
  timeoutMs: number = POLL_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fs.access(filePath);
      return;
    } catch {
      // keep polling
    }
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new BabysitterRuntimeError(
    "ProcessFileTimeoutError",
    `Process file was not created within ${timeoutMs / 1_000}s: ${filePath}`,
    {
      category: ErrorCategory.External,
      nextSteps: [
        "Check harness output for errors",
        "Ensure the harness can write to the workspace directory",
      ],
    },
  );
}

const dynamicImportModule: (specifier: string) => Promise<Record<string, unknown>> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<Record<string, unknown>>;
})();

async function ensureSdkResolvable(workspaceDir: string): Promise<void> {
  const sdkPkg = path.resolve(__dirname, "..", "..", "..");
  const targetNodeModules = path.join(workspaceDir, "node_modules");
  const targetSdkDir = path.join(targetNodeModules, "@a5c-ai", "babysitter-sdk");

  try {
    await fs.access(targetSdkDir);
    return;
  } catch {
    // create below
  }

  try {
    await fs.mkdir(path.join(targetNodeModules, "@a5c-ai"), { recursive: true });
    const linkType = process.platform === "win32" ? "junction" : "dir";
    await fs.symlink(sdkPkg, targetSdkDir, linkType);
  } catch {
    // best effort
  }
}

async function validateProcessExport(filePath: string): Promise<void> {
  await ensureSdkResolvable(path.dirname(path.resolve(filePath)));
  const moduleUrl = pathToFileURL(path.resolve(filePath)).href;
  const mod = await dynamicImportModule(moduleUrl);
  const fn = mod.process ?? mod.default;
  if (typeof fn !== "function") {
    throw new BabysitterRuntimeError(
      "InvalidProcessExportError",
      `Process file at ${filePath} does not export a function named 'process' or 'default'`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Ensure the file exports: async function process(inputs, ctx) { ... }",
        ],
      },
    );
  }
}

function execShellEffect(
  command: string,
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        cwd,
        timeout: 300_000,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        let exitCode = 0;
        if (error) {
          const execError = error as NodeJS.ErrnoException & { status?: number };
          exitCode = typeof execError.status === "number" ? execError.status : 1;
        }
        resolve({
          stdout: String(stdout),
          stderr: String(stderr),
          exitCode,
        });
      },
    );
  });
}

function buildAgentPrompt(taskDef: Record<string, unknown>): string {
  const agent = taskDef.agent as Record<string, unknown> | undefined;
  if (!agent) return (taskDef.title as string) ?? "Execute task";
  const prompt = agent.prompt as Record<string, unknown> | undefined;
  if (!prompt) return (taskDef.title as string) ?? "Execute task";

  const parts: string[] = [];
  parts.push(
    "You are an autonomous agent. PERFORM the task below using your available tools.",
    "Do not just describe what you would do. Execute the work and then summarize what you changed.",
    "",
  );
  if (typeof prompt.role === "string") parts.push(`Role: ${prompt.role}`);
  if (typeof prompt.task === "string") parts.push(`\nTask:\n${prompt.task}`);
  if (prompt.context) parts.push(`\nContext:\n${JSON.stringify(prompt.context, null, 2)}`);
  if (Array.isArray(prompt.instructions)) {
    parts.push(`\nInstructions:\n${(prompt.instructions as string[]).map((item, index) => `${index + 1}. ${item}`).join("\n")}`);
  }
  if (typeof prompt.outputFormat === "string") parts.push(`\nOutput format: ${prompt.outputFormat}`);
  return parts.join("\n");
}

function resolveTaskHarness(
  action: EffectAction,
  defaultHarness: string,
  discovered: HarnessDiscoveryResult[],
): string {
  const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
  if (typeof meta?.harness === "string") {
    const match = discovered.find((h) => h.name === meta.harness && h.installed);
    if (match) return match.name;
  }

  const agent = action.taskDef?.agent as Record<string, unknown> | undefined;
  if (typeof agent?.name === "string") {
    const match = discovered.find((h) => h.name === agent.name && h.installed);
    if (match) return match.name;
  }

  return defaultHarness;
}

async function resolveEffect(
  action: EffectAction,
  harnessName: string,
  options: { workspace?: string; model?: string; interactive?: boolean },
  piSession?: PiSessionHandle | null,
  discovered?: HarnessDiscoveryResult[],
  rl?: readline.Interface | null,
  json?: boolean,
): Promise<{
  status: "ok" | "error";
  value?: unknown;
  error?: unknown;
  stdout?: string;
  stderr?: string;
}> {
  const kind = action.kind;

  if (kind === "node" || kind === "orchestrator_task") {
    const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
    const metaPrompt = typeof meta?.prompt === "string" ? meta.prompt : undefined;
    const prompt =
      metaPrompt ??
      action.taskDef?.title ??
      `Execute task ${action.taskId ?? action.effectId}`;

    const taskHarness = discovered
      ? resolveTaskHarness(action, harnessName, discovered)
      : harnessName;

    if ((taskHarness === "pi" || taskHarness === "oh-my-pi") && piSession) {
      const piResult = await piSession.prompt(prompt);
      return {
        status: piResult.success ? "ok" : "error",
        value: piResult.success ? piResult.output : undefined,
        error: piResult.success ? undefined : new Error(piResult.output),
        stdout: piResult.output,
      };
    }

    const result = await invokeHarness(taskHarness, {
      prompt,
      workspace: options.workspace,
      model: options.model,
    });

    return {
      status: result.success ? "ok" : "error",
      value: result.success ? result.output : undefined,
      error: result.success ? undefined : new Error(result.output),
      stdout: result.output,
    };
  }

  if (kind === "shell") {
    const shellMeta = action.taskDef?.metadata as Record<string, unknown> | undefined;
    const command = typeof shellMeta?.command === "string" ? shellMeta.command : "echo";
    const shellArgs = Array.isArray(shellMeta?.args)
      ? (shellMeta.args as string[]).filter((arg): arg is string => typeof arg === "string")
      : [];
    const cwd = typeof shellMeta?.cwd === "string" ? shellMeta.cwd : options.workspace;
    const shellResult = await execShellEffect(command, shellArgs, cwd);
    return {
      status: shellResult.exitCode === 0 ? "ok" : "error",
      value: shellResult.exitCode === 0 ? shellResult.stdout : undefined,
      error: shellResult.exitCode === 0
        ? undefined
        : new Error(`Shell command exited with code ${shellResult.exitCode}: ${shellResult.stderr}`),
      stdout: shellResult.stdout,
      stderr: shellResult.stderr,
    };
  }

  if (kind === "breakpoint") {
    const bpQuestion =
      (action.taskDef as Record<string, unknown>)?.question as string | undefined ??
      action.taskDef?.title ??
      "Breakpoint reached. Continue?";
    const approvalPrompt = createApprovalAskUserQuestion(bpQuestion);
    const approvalKey = approvalPrompt.questions[0]?.header ?? "Decision";

    if (options.interactive && rl) {
      if (!json) {
        process.stderr.write(`\n${YELLOW}${BOLD}BREAKPOINT${RESET} ${bpQuestion}\n`);
      }
      const response = await promptAskUserQuestionWithReadline(rl, approvalPrompt);
      const option = response.answers[approvalKey] ?? "Reject";
      return {
        status: "ok",
        value: {
          approved: option === "Approve",
          option,
          askUserQuestion: response,
        },
      };
    }

    const response = createAskUserQuestionResponse(approvalPrompt, {
      [approvalKey]: "Approve",
    });
    return {
      status: "ok",
      value: {
        approved: true,
        option: "Approve",
        askUserQuestion: response,
      },
    };
  }

  if (kind === "sleep") {
    const targetMs = action.taskDef?.sleep?.targetEpochMs;
    if (typeof targetMs === "number") {
      const delay = Math.max(0, targetMs - Date.now());
      if (delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
    return { status: "ok", value: { sleptUntil: new Date().toISOString() } };
  }

  if (kind === "agent") {
    const textPrompt = buildAgentPrompt(action.taskDef as unknown as Record<string, unknown>);
    const taskHarness = discovered
      ? resolveTaskHarness(action, harnessName, discovered)
      : harnessName;

    const explicitCliRequested =
      taskHarness !== harnessName && taskHarness !== "pi" && taskHarness !== "oh-my-pi";

    if (explicitCliRequested) {
      const result = await invokeHarness(taskHarness, {
        prompt: textPrompt,
        workspace: options.workspace,
        model: options.model,
      });
      return {
        status: result.success ? "ok" : "error",
        value: result.success ? result.output : undefined,
        error: result.success ? undefined : new Error(result.output),
        stdout: result.output,
      };
    }

    if (piSession) {
      const piResult = await piSession.prompt(textPrompt);
      return {
        status: piResult.success ? "ok" : "error",
        value: piResult.success ? piResult.output : undefined,
        error: piResult.success ? undefined : new Error(piResult.output),
        stdout: piResult.output,
      };
    }

    const result = await invokeHarness(taskHarness, {
      prompt: textPrompt,
      workspace: options.workspace,
      model: options.model,
    });
    return {
      status: result.success ? "ok" : "error",
      value: result.success ? result.output : undefined,
      error: result.success ? undefined : new Error(result.output),
      stdout: result.output,
    };
  }

  const fallbackPrompt =
    action.taskDef?.title ?? `Handle effect ${action.effectId} (kind: ${kind})`;
  const result = await invokeHarness(harnessName, {
    prompt: fallbackPrompt,
    workspace: options.workspace,
    model: options.model,
  });
  return {
    status: result.success ? "ok" : "error",
    value: result.success ? result.output : undefined,
    error: result.success ? undefined : new Error(result.output),
    stdout: result.output,
  };
}

const ASK_OPTION_SCHEMA = Type.Object({
  label: Type.String(),
  description: Type.Optional(Type.String()),
  preview: Type.Optional(Type.String()),
});

const ASK_QUESTION_SCHEMA = Type.Object({
  question: Type.String(),
  header: Type.Optional(Type.String()),
  options: Type.Optional(Type.Array(ASK_OPTION_SCHEMA)),
  multiSelect: Type.Optional(Type.Boolean()),
  allowOther: Type.Optional(Type.Boolean()),
  required: Type.Optional(Type.Boolean()),
});

const ASK_USER_QUESTION_SCHEMA = Type.Object({
  questions: Type.Array(ASK_QUESTION_SCHEMA, { minItems: 1, maxItems: 4 }),
});

function formatToolResult(data: unknown, message?: string): ToolResultShape {
  if (typeof data === "string") {
    return { content: message ? `${message}\n${data}` : data, details: data };
  }
  const content = message
    ? `${message}\n${JSON.stringify(data, null, 2)}`
    : JSON.stringify(data, null, 2);
  return { content, details: data };
}

function isApprovalAskRequest(request: AskUserQuestionRequest): boolean {
  const question = request.questions[0];
  if (!question || request.questions.length !== 1 || !question.options) {
    return false;
  }
  const labels = question.options.map((option) => option.label);
  return labels.length === 2 &&
    labels[0] === "Approve" &&
    labels[1] === "Reject" &&
    question.allowOther === false;
}

async function askUserQuestionViaTool(
  request: AskUserQuestionRequest,
  interactive: boolean,
  rl: readline.Interface | null,
): Promise<AskUserQuestionResponse> {
  validateAskUserQuestionRequest(request);

  if (interactive && rl) {
    return promptAskUserQuestionWithReadline(rl, request);
  }

  const answers: Record<string, string> = {};
  for (const [index, question] of request.questions.entries()) {
    const key = question.header?.trim() || `Question ${index + 1}`;
    answers[key] = "";
  }
  if (isApprovalAskRequest(request)) {
    const key = request.questions[0]?.header?.trim() || "Decision";
    answers[key] = "Approve";
  }
  return createAskUserQuestionResponse(request, answers);
}

function emitProgress(
  payload: ProgressPayload,
  json: boolean,
  verbose: boolean,
): void {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  switch (payload.phase) {
    case "1":
      if (payload.status === "skipped") {
        process.stderr.write(`${DIM}Phase 1 skipped (--process provided)${RESET}\n`);
      } else if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}Phase 1${RESET} ${DIM}Interview / process definition via ${payload.harness}...${RESET}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`${GREEN}Phase 1 complete${RESET} ${DIM}${payload.processPath}${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`${RED}Phase 1 failed:${RESET} ${payload.error}\n`);
      } else if (payload.status === "interview") {
        process.stderr.write(`${DIM}Interview answers: ${payload.answer}${RESET}\n`);
      }
      break;
    case "2":
      if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}Phase 2${RESET} ${DIM}Bound orchestration loop${RESET}\n`);
      } else if (payload.status === "run-created") {
        process.stderr.write(`${GREEN}Run created${RESET} runId=${CYAN}${payload.runId}${RESET}\n`);
        if (verbose) process.stderr.write(`  ${DIM}runDir: ${payload.runDir}${RESET}\n`);
      } else if (payload.status === "bound") {
        if (payload.error) {
          process.stderr.write(`${YELLOW}Session binding warning:${RESET} ${payload.error}\n`);
        } else {
          process.stderr.write(`${DIM}session bound via ${payload.harness}: ${payload.sessionId}${RESET}\n`);
        }
      } else if (payload.status === "iteration") {
        process.stderr.write(`\n${DIM}-- iteration ${payload.iteration} --${RESET} status=${payload.runStatus} pending=${payload.pendingEffects}\n`);
      } else if (payload.status === "effect") {
        const icon = payload.effectStatus === "ok" ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
        process.stderr.write(`  ${icon} ${MAGENTA}${payload.effectKind}${RESET} ${payload.effectTitle ?? payload.effectId}${payload.effectStatus === "error" ? ` ${RED}${payload.error}${RESET}` : ""}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`\n${GREEN}${BOLD}Run completed${RESET} ${DIM}(${payload.iteration} iterations)${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`\n${RED}${BOLD}Run failed:${RESET} ${payload.error}\n`);
      }
      break;
  }
}

async function runProcessDefinitionPhase(args: {
  prompt: string;
  outputPath: string;
  workspace?: string;
  model?: string;
  interactive: boolean;
  rl: readline.Interface | null;
  json: boolean;
  verbose: boolean;
}): Promise<string> {
  const state: { report?: ProcessDefinitionReport } = {};
  const customTools: unknown[] = [
    {
      name: "AskUserQuestion",
      label: "Ask User Question",
      description: "Ask the user one to four structured clarification questions and receive structured answers.",
      promptSnippet: "Ask the user focused clarification questions when you need missing requirements.",
      parameters: ASK_USER_QUESTION_SCHEMA,
      execute: async (
        _toolCallId: string,
        params: AskUserQuestionRequest,
      ): Promise<ToolResultShape> => {
        const response = await askUserQuestionViaTool(params, args.interactive, args.rl);
        emitProgress(
          {
            phase: "1",
            status: "interview",
            answer: JSON.stringify(response.answers),
          },
          args.json,
          args.verbose,
        );
        return formatToolResult(response, "AskUserQuestion completed.");
      },
    },
    {
      name: "babysitter_report_process_definition",
      label: "Report Process Definition",
      description: "Report that the process-definition phase is complete after the process file has been written.",
      parameters: Type.Object({
        processPath: Type.String(),
        summary: Type.Optional(Type.String()),
      }),
      execute: (
        _toolCallId: string,
        params: { processPath: string; summary?: string },
      ): ToolResultShape => {
        state.report = {
          processPath: params.processPath,
          summary: params.summary,
        };
        return formatToolResult(state.report, "Process definition reported.");
      },
    },
  ];

  emitProgress(
    { phase: "1", status: "started", harness: "pi (agentic)" },
    args.json,
    args.verbose,
  );

  const session = createPiSession({
    workspace: args.workspace,
    model: args.model,
    toolsMode: "coding",
    customTools,
    appendSystemPrompt: [buildProcessDefinitionSystemPrompt(args.outputPath)],
    isolated: true,
    ephemeral: true,
  });

  try {
    await session.initialize();
    let unsubscribe: (() => void) | null = null;
    if (!args.json) {
      process.stderr.write(`${DIM}Phase 1 agent is defining the process...${RESET}\n`);
      unsubscribe = session.subscribe((event: PiSessionEvent) => {
        if (event.type === "text_delta") {
          const text = (event as { text?: string }).text;
          if (text) process.stderr.write(text);
        }
      });
    }

    const result = await session.prompt(
      buildMetaPrompt(args.prompt, args.workspace ?? process.cwd()),
      300_000,
    );

    if (unsubscribe) unsubscribe();
    if (!args.json) process.stderr.write("\n");

    if (!result.success) {
      throw new BabysitterRuntimeError(
        "ProcessDefinitionFailed",
        result.output,
        { category: ErrorCategory.External },
      );
    }

    if (!state.report?.processPath) {
      throw new BabysitterRuntimeError(
        "ProcessDefinitionReportMissing",
        "The process-definition agent finished without calling babysitter_report_process_definition.",
        { category: ErrorCategory.Runtime },
      );
    }

    await waitForProcessFile(state.report.processPath);
    await validateProcessExport(state.report.processPath);

    emitProgress(
      {
        phase: "1",
        status: "completed",
        processPath: state.report.processPath,
        harness: "pi (agentic)",
      },
      args.json,
      args.verbose,
    );

    return state.report.processPath;
  } catch (error: unknown) {
    emitProgress(
      {
        phase: "1",
        status: "failed",
        harness: "pi (agentic)",
        error: error instanceof Error ? error.message : String(error),
      },
      args.json,
      args.verbose,
    );
    throw error;
  } finally {
    session.dispose();
  }
}

async function runOrchestrationPhase(args: {
  processPath: string;
  prompt?: string;
  workspace?: string;
  model?: string;
  runsDir: string;
  maxIterations: number;
  json: boolean;
  verbose: boolean;
  interactive: boolean;
  rl: readline.Interface | null;
  selectedHarnessName: string;
  discovered: HarnessDiscoveryResult[];
}): Promise<number> {
  const processId = path.basename(args.processPath, path.extname(args.processPath));
  const state: OrchestrationState = {
    iteration: 0,
    pendingActions: new Map(),
    pendingEffectResults: new Map(),
  };

  let orchestrationSession: PiSessionHandle | null = null;
  const customTools: unknown[] = [
    {
      name: "AskUserQuestion",
      label: "Ask User Question",
      description: "Ask the user one to four structured questions and receive structured answers.",
      promptSnippet: "Use this for breakpoint approvals and required user clarification.",
      parameters: ASK_USER_QUESTION_SCHEMA,
      execute: async (
        _toolCallId: string,
        params: AskUserQuestionRequest,
      ): Promise<ToolResultShape> => {
        const response = await askUserQuestionViaTool(params, args.interactive, args.rl);
        state.lastAskUserQuestionResponse = response;
        return formatToolResult(response, "AskUserQuestion completed.");
      },
    },
    {
      name: "babysitter_run_create",
      label: "Babysitter Run Create",
      description: "Create the babysitter run for the current process definition.",
      parameters: Type.Object({
        prompt: Type.Optional(Type.String()),
      }),
      execute: async (
        _toolCallId: string,
        params: { prompt?: string },
      ): Promise<ToolResultShape> => {
        if (state.runId && state.runDir) {
          return formatToolResult({ runId: state.runId, runDir: state.runDir }, "Run already exists.");
        }
        const result = await createRun({
          runsDir: args.runsDir,
          process: {
            processId,
            importPath: path.resolve(args.processPath),
          },
          prompt: params.prompt ?? args.prompt,
          inputs: (params.prompt ?? args.prompt)
            ? { prompt: params.prompt ?? args.prompt }
            : undefined,
        });
        state.runId = result.runId;
        state.runDir = result.runDir;
        emitProgress(
          {
            phase: "2",
            status: "run-created",
            runId: result.runId,
            runDir: result.runDir,
          },
          args.json,
          args.verbose,
        );
        return formatToolResult(result, "Run created.");
      },
    },
    {
      name: "babysitter_bind_session",
      label: "Babysitter Bind Session",
      description: "Bind the orchestration run to the current harness session.",
      parameters: Type.Object({}),
      execute: async (): Promise<ToolResultShape> => {
        if (!state.runId || !state.runDir) {
          throw new BabysitterRuntimeError(
            "RunNotCreated",
            "Create the run before binding the orchestration session.",
            { category: ErrorCategory.Validation },
          );
        }
        if (state.sessionBound) {
          return formatToolResult(state.sessionBound, "Session is already bound.");
        }
        const adapter = getAdapterByName(args.selectedHarnessName);
        if (!adapter) {
          throw new BabysitterRuntimeError(
            "HarnessAdapterMissing",
            `No harness adapter is registered for ${args.selectedHarnessName}.`,
            { category: ErrorCategory.Configuration },
          );
        }
        if (
          (args.selectedHarnessName === "pi" || args.selectedHarnessName === "oh-my-pi") &&
          orchestrationSession?.sessionId
        ) {
          process.env.PI_SESSION_ID = process.env.PI_SESSION_ID || orchestrationSession.sessionId;
          process.env.OMP_SESSION_ID = process.env.OMP_SESSION_ID || orchestrationSession.sessionId;
        }
        const sessionId = adapter.resolveSessionId({}) || orchestrationSession?.sessionId;
        if (!sessionId) {
          throw new BabysitterRuntimeError(
            "MissingHarnessSessionId",
            `Cannot resolve a session ID for harness ${args.selectedHarnessName}.`,
            { category: ErrorCategory.Configuration },
          );
        }
        state.sessionBound = await adapter.bindSession({
          sessionId,
          runId: state.runId,
          runDir: state.runDir,
          pluginRoot: adapter.resolvePluginRoot({}),
          stateDir: path.resolve(args.workspace ?? process.cwd(), ".a5c"),
          runsDir: args.runsDir,
          maxIterations: args.maxIterations,
          prompt: args.prompt ?? "",
          verbose: args.verbose,
          json: args.json,
        });
        if (state.sessionBound.fatal) {
          throw new BabysitterRuntimeError(
            "SessionBindFatal",
            state.sessionBound.error ?? "Session binding failed fatally.",
            { category: ErrorCategory.External },
          );
        }
        emitProgress(
          {
            phase: "2",
            status: "bound",
            runId: state.runId,
            runDir: state.runDir,
            harness: state.sessionBound.harness,
            sessionId: state.sessionBound.sessionId,
            error: state.sessionBound.error,
          },
          args.json,
          args.verbose,
        );
        return formatToolResult(state.sessionBound, "Session bound.");
      },
    },
    {
      name: "babysitter_run_iterate",
      label: "Babysitter Run Iterate",
      description: "Run the next orchestration iteration and return pending effects or a terminal result.",
      parameters: Type.Object({}),
      execute: async (): Promise<ToolResultShape> => {
        if (!state.runDir) {
          throw new BabysitterRuntimeError(
            "RunNotCreated",
            "Create the run before iterating it.",
            { category: ErrorCategory.Validation },
          );
        }
        if (state.iteration >= args.maxIterations) {
          state.lastIterationResult = {
            status: "failed",
            error: { message: `Max iterations (${args.maxIterations}) reached without completion` },
          };
          emitProgress(
            {
              phase: "2",
              status: "failed",
              iteration: state.iteration,
              runStatus: "failed",
              error: `Max iterations (${args.maxIterations}) reached without completion`,
            },
            args.json,
            args.verbose,
          );
          return formatToolResult(state.lastIterationResult, "Iteration limit reached.");
        }

        state.iteration += 1;
        state.pendingActions.clear();
        state.pendingEffectResults.clear();
        const result = await orchestrateIteration({ runDir: state.runDir });
        state.lastIterationResult = result;

        if (result.status === "waiting") {
          for (const action of result.nextActions) {
            state.pendingActions.set(action.effectId, action);
          }
          emitProgress(
            {
              phase: "2",
              status: "iteration",
              iteration: state.iteration,
              runStatus: "waiting",
              pendingEffects: result.nextActions.length,
            },
            args.json,
            args.verbose,
          );
        } else if (result.status === "completed") {
          emitProgress(
            {
              phase: "2",
              status: "completed",
              iteration: state.iteration,
              runStatus: "completed",
            },
            args.json,
            args.verbose,
          );
        } else {
          const errorMessage =
            result.error instanceof Error
              ? result.error.message
              : typeof result.error === "object" &&
                  result.error !== null &&
                  "message" in result.error
                ? String((result.error as Record<string, unknown>).message)
                : String(result.error);
          emitProgress(
            {
              phase: "2",
              status: "failed",
              iteration: state.iteration,
              runStatus: "failed",
              error: errorMessage,
            },
            args.json,
            args.verbose,
          );
        }

        return formatToolResult(
          {
            iteration: state.iteration,
            ...result,
          },
          "Iteration completed.",
        );
      },
    },
    {
      name: "babysitter_execute_effect",
      label: "Babysitter Execute Effect",
      description: "Execute a non-breakpoint pending effect and stage the result for task posting.",
      parameters: Type.Object({
        effectId: Type.String(),
      }),
      execute: async (
        _toolCallId: string,
        params: { effectId: string },
      ): Promise<ToolResultShape> => {
        const action = state.pendingActions.get(params.effectId);
        if (!action) {
          throw new BabysitterRuntimeError(
            "PendingEffectNotFound",
            `No pending effect found for ${params.effectId}.`,
            { category: ErrorCategory.Validation },
          );
        }
        if (action.kind === "breakpoint") {
          return formatToolResult(
            {
              effectId: params.effectId,
              kind: action.kind,
              message: "Use AskUserQuestion followed by babysitter_task_post_result for breakpoint effects.",
            },
            "Breakpoint effects require explicit AskUserQuestion handling.",
          );
        }

        const taskHarness = resolveTaskHarness(action, args.selectedHarnessName, args.discovered);
        let workerSession: PiSessionHandle | null = null;
        if (taskHarness === "pi" || taskHarness === "oh-my-pi") {
          workerSession = createPiSession({
            workspace: args.workspace,
            model: args.model,
            toolsMode: "coding",
            isolated: true,
            ephemeral: true,
          });
        }

        try {
          const effectResult = await resolveEffect(
            action,
            args.selectedHarnessName,
            {
              workspace: args.workspace,
              model: args.model,
              interactive: false,
            },
            workerSession,
            args.discovered,
            null,
            args.json,
          );
          state.pendingEffectResults.set(params.effectId, effectResult);
          return formatToolResult(
            { effectId: params.effectId, effectResult },
            "Effect executed and staged for task posting.",
          );
        } finally {
          workerSession?.dispose();
        }
      },
    },
    {
      name: "babysitter_task_post_result",
      label: "Babysitter Task Post Result",
      description: "Persist the staged effect result, or post a breakpoint decision after AskUserQuestion.",
      parameters: Type.Object({
        effectId: Type.String(),
      }),
      execute: async (
        _toolCallId: string,
        params: { effectId: string },
      ): Promise<ToolResultShape> => {
        if (!state.runDir) {
          throw new BabysitterRuntimeError(
            "RunNotCreated",
            "Create the run before posting task results.",
            { category: ErrorCategory.Validation },
          );
        }
        const action = state.pendingActions.get(params.effectId);
        if (!action) {
          throw new BabysitterRuntimeError(
            "PendingEffectNotFound",
            `No pending effect found for ${params.effectId}.`,
            { category: ErrorCategory.Validation },
          );
        }

        const startedAt = new Date().toISOString();
        let effectResult = state.pendingEffectResults.get(params.effectId);

        if (!effectResult && action.kind === "breakpoint") {
          const question =
            (action.taskDef as Record<string, unknown>)?.question as string | undefined ??
            action.taskDef?.title ??
            "Breakpoint reached. Continue?";
          const defaultResponse = createAskUserQuestionResponse(
            createApprovalAskUserQuestion(question),
            { Decision: "Approve" },
          );
          const askResponse = state.lastAskUserQuestionResponse ?? defaultResponse;
          const option = askResponse.answers.Decision ?? "Approve";
          effectResult = {
            status: "ok",
            value: {
              approved: option === "Approve",
              option,
              askUserQuestion: askResponse,
            },
          };
        }

        if (!effectResult) {
          throw new BabysitterRuntimeError(
            "EffectResultMissing",
            `No staged effect result exists for ${params.effectId}.`,
            { category: ErrorCategory.Runtime },
          );
        }

        const finishedAt = new Date().toISOString();
        await commitEffectResult({
          runDir: state.runDir,
          effectId: action.effectId,
          invocationKey: action.invocationKey,
          result: {
            status: effectResult.status,
            value: effectResult.value,
            error: effectResult.error,
            stdout: effectResult.stdout,
            stderr: effectResult.stderr,
            startedAt,
            finishedAt,
          },
        });

        emitProgress(
          {
            phase: "2",
            status: "effect",
            effectId: action.effectId,
            effectKind: action.kind,
            effectTitle: action.taskDef?.title,
            effectStatus: effectResult.status,
            error: effectResult.status === "error"
              ? (effectResult.error instanceof Error
                ? effectResult.error.message
                : String(effectResult.error))
              : undefined,
            output: typeof effectResult.value === "string"
              ? effectResult.value.slice(0, 200)
              : undefined,
          },
          args.json,
          args.verbose,
        );

        state.pendingActions.delete(params.effectId);
        state.pendingEffectResults.delete(params.effectId);
        if (action.kind === "breakpoint") {
          state.lastAskUserQuestionResponse = undefined;
        }

        return formatToolResult(
          {
            effectId: params.effectId,
            status: effectResult.status,
          },
          "Task result posted.",
        );
      },
    },
    {
      name: "babysitter_finish_orchestration",
      label: "Finish Orchestration",
      description: "Report that the orchestration phase has reached a terminal state.",
      parameters: Type.Object({
        summary: Type.Optional(Type.String()),
      }),
      execute: (
        _toolCallId: string,
        params: { summary?: string },
      ): ToolResultShape => {
        state.finished = { summary: params.summary };
        return formatToolResult(state.finished, "Orchestration finish recorded.");
      },
    },
  ];

  orchestrationSession = createPiSession({
    workspace: args.workspace,
    model: args.model,
    toolsMode: "readonly",
    customTools,
    appendSystemPrompt: [buildOrchestrationSystemPrompt(args.selectedHarnessName)],
    isolated: true,
    ephemeral: true,
  });

  emitProgress(
    { phase: "2", status: "started", harness: args.selectedHarnessName },
    args.json,
    args.verbose,
  );

  try {
    await orchestrationSession.initialize();
    let unsubscribe: (() => void) | null = null;
    if (!args.json) {
      unsubscribe = orchestrationSession.subscribe((event: PiSessionEvent) => {
        if (event.type === "text_delta") {
          const text = (event as { text?: string }).text;
          if (text) process.stderr.write(text);
        }
      });
    }

    const result = await orchestrationSession.prompt(
      buildOrchestrationUserPrompt(
        path.resolve(args.processPath),
        args.prompt,
        args.maxIterations,
      ),
      900_000,
    );

    if (unsubscribe) unsubscribe();
    if (!args.json) process.stderr.write("\n");

    if (!result.success) {
      throw new BabysitterRuntimeError(
        "OrchestrationAgentFailed",
        result.output,
        { category: ErrorCategory.External },
      );
    }

    if (!state.runId || !state.runDir) {
      throw new BabysitterRuntimeError(
        "RunNotCreated",
        "The orchestration agent exited without creating a run.",
        { category: ErrorCategory.Runtime },
      );
    }

    if (!state.finished) {
      throw new BabysitterRuntimeError(
        "OrchestrationFinishMissing",
        "The orchestration agent exited without calling babysitter_finish_orchestration.",
        { category: ErrorCategory.Runtime },
      );
    }

    if (state.lastIterationResult?.status === "completed") {
      return 0;
    }

    if (state.lastIterationResult?.status === "failed") {
      return 1;
    }

    throw new BabysitterRuntimeError(
      "OrchestrationIncomplete",
      "The orchestration agent exited before the run reached a terminal state.",
      { category: ErrorCategory.Runtime },
    );
  } catch (error: unknown) {
    emitProgress(
      {
        phase: "2",
        status: "failed",
        runId: state.runId,
        runDir: state.runDir,
        iteration: state.iteration,
        error: error instanceof Error ? error.message : String(error),
      },
      args.json,
      args.verbose,
    );
    return 1;
  } finally {
    orchestrationSession?.dispose();
  }
}

export async function handleSessionCreate(
  parsed: SessionCreateArgs,
): Promise<number> {
  const {
    prompt,
    harness: preferredHarness,
    processPath: providedProcessPath,
    workspace,
    model,
    maxIterations = 256,
    runsDir,
    json,
    verbose,
  } = parsed;

  const interactive = parsed.interactive ?? (process.stdin.isTTY === true && !json);
  const rl = interactive ? createReadlineInterface() : null;

  try {
    if (!prompt && !providedProcessPath) {
      const error = "Either --prompt or --process must be provided";
      if (json) {
        console.error(
          JSON.stringify({ error: "MISSING_PROMPT", message: error }, null, 2),
        );
      } else {
        process.stderr.write(`${RED}Error:${RESET} ${error}\n`);
      }
      return 1;
    }

    const discovered = await discoverHarnesses();
    const selected = selectHarness(discovered, preferredHarness);
    const selectedHarnessName = selected?.name ?? "pi";

    let processPath = providedProcessPath;
    if (processPath) {
      emitProgress({ phase: "1", status: "skipped", processPath }, json, verbose);
    } else {
      const workDir = workspace ?? process.cwd();
      processPath = await runProcessDefinitionPhase({
        prompt: prompt!,
        outputPath: path.join(workDir, "generated-process.js"),
        workspace: workDir,
        model,
        interactive,
        rl,
        json,
        verbose,
      });
    }

    return await runOrchestrationPhase({
      processPath,
      prompt,
      workspace,
      model,
      runsDir,
      maxIterations,
      json,
      verbose,
      interactive,
      rl,
      selectedHarnessName,
      discovered,
    });
  } finally {
    rl?.close();
  }
}
