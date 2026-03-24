/**
 * session:create command handler.
 *
 * Orchestrates a full babysitter session lifecycle:
 *   Phase A — Generate a process file via a harness (skipped when --process is provided)
 *   Phase B — Create a run via the SDK runtime
 *   Phase C — Orchestration loop: iterate, resolve effects, repeat
 *
 * Supports interactive mode (default when TTY) for user interview in Phase A
 * and breakpoint approval in Phase C.  Use --no-interactive to disable.
 */

import * as path from "node:path";
import * as readline from "node:readline";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";
import { discoverHarnesses } from "../../harness/discovery";
import { invokeHarness } from "../../harness/invoker";
import { createPiSession, PiSessionHandle } from "../../harness/piWrapper";
import type { HarnessDiscoveryResult, HarnessInvokeResult, PiSessionEvent } from "../../harness/types";
import { createRun } from "../../runtime/createRun";
import { orchestrateIteration } from "../../runtime/orchestrateIteration";
import { commitEffectResult } from "../../runtime/commitEffectResult";
import type { EffectAction, IterationResult } from "../../runtime/types";
import { BabysitterRuntimeError, ErrorCategory } from "../../runtime/exceptions";

// ---------------------------------------------------------------------------
// Args interface
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ANSI helpers (for non-JSON output)
// ---------------------------------------------------------------------------

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";

// ---------------------------------------------------------------------------
// JSON progress payloads
// ---------------------------------------------------------------------------

interface PhaseAProgress {
  phase: "A";
  status: "started" | "skipped" | "completed" | "failed" | "interview";
  harness?: string;
  processPath?: string;
  error?: string;
  question?: string;
  answer?: string;
}

interface PhaseBProgress {
  phase: "B";
  status: "started" | "completed" | "failed";
  runId?: string;
  runDir?: string;
  error?: string;
}

interface PhaseCProgress {
  phase: "C";
  status: "started" | "iteration" | "effect" | "completed" | "failed";
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

type ProgressPayload = PhaseAProgress | PhaseBProgress | PhaseCProgress;

// ---------------------------------------------------------------------------
// Harness selection priority
// ---------------------------------------------------------------------------

/** Priority order for harness selection (higher index = lower priority). */
const HARNESS_PRIORITY: readonly string[] = [
  "pi",
  "oh-my-pi",
  "claude-code",
  "codex",
  "gemini-cli",
  "opencode",
] as const;

/**
 * Selects the best available harness from discovery results.
 *
 * If `preferred` is provided and that harness is installed, it wins.
 * Otherwise the first installed harness in priority order is selected.
 */
export function selectHarness(
  discovered: HarnessDiscoveryResult[],
  preferred?: string,
): HarnessDiscoveryResult | undefined {
  if (preferred) {
    const match = discovered.find(
      (h) => h.name === preferred && h.installed,
    );
    if (match) return match;
  }

  for (const name of HARNESS_PRIORITY) {
    const match = discovered.find((h) => h.name === name && h.installed);
    if (match) return match;
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Interactive I/O helpers
// ---------------------------------------------------------------------------

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr, // prompts go to stderr so stdout stays clean for JSON
    terminal: true,
  });
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${CYAN}?${RESET} ${question} `, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function askYesNo(rl: readline.Interface, question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  return new Promise((resolve) => {
    rl.question(`${CYAN}?${RESET} ${question} ${DIM}${hint}${RESET} `, (answer: string) => {
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "") resolve(defaultYes);
      else resolve(trimmed === "y" || trimmed === "yes");
    });
  });
}

// ---------------------------------------------------------------------------
// Pi event streaming (for DevX observability)
// ---------------------------------------------------------------------------

/**
 * Subscribe to a PiSessionHandle and stream events to stderr.
 * Returns an unsubscribe function.
 */
function _streamPiEvents(
  piSession: PiSessionHandle,
  label: string,
  json: boolean,
): (() => void) | null {
  if (!piSession.isInitialized) return null;

  try {
    return piSession.subscribe((event: PiSessionEvent) => {
      if (json) return; // JSON mode — don't pollute stdout

      if (event.type === "text_delta") {
        const text = (event as unknown as { text?: string }).text;
        if (text) process.stderr.write(text);
      }
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Meta-prompt for process generation (Phase A)
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";

const PROCESS_GENERATION_TEMPLATE_PATH = path.join(
  __dirname,
  "templates",
  "process-generation-prompt.md",
);

let _cachedTemplate: string | undefined;

function loadProcessGenerationTemplate(): string {
  if (_cachedTemplate === undefined) {
    _cachedTemplate = readFileSync(PROCESS_GENERATION_TEMPLATE_PATH, "utf8");
  }
  return _cachedTemplate;
}

function buildMetaPrompt(userPrompt: string, workDir: string, interviewContext?: string): string {
  let template = loadProcessGenerationTemplate();

  template = template.replace("{{USER_PROMPT}}", userPrompt);
  template = template.replace("{{OUTPUT_PATH}}", path.join(workDir, "generated-process.js"));

  if (interviewContext) {
    template = template.replace(
      "{{INTERVIEW_CONTEXT}}",
      `## Additional Context from User Interview\n\n${interviewContext}`,
    );
  } else {
    template = template.replace("{{INTERVIEW_CONTEXT}}", "");
  }

  return template;
}

// ---------------------------------------------------------------------------
// Polling helper for process file
// ---------------------------------------------------------------------------

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
      // Not yet — keep waiting.
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

// ---------------------------------------------------------------------------
// Process file validation
// ---------------------------------------------------------------------------

// Use an indirect dynamic import so TypeScript does not downlevel to require() in CommonJS builds.
// Matches the pattern in orchestrateIteration.ts.
const dynamicImportModule: (specifier: string) => Promise<Record<string, unknown>> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<Record<string, unknown>>;
})();

/**
 * Ensure `@a5c-ai/babysitter-sdk` is resolvable from a process file
 * that lives outside the repo tree (e.g. in a temp workspace).
 *
 * We walk up from the CLI entry point to find the repo root
 * `node_modules` that already contains the SDK, then symlink it into
 * the workspace's own `node_modules` directory.
 */
async function ensureSdkResolvable(workspaceDir: string): Promise<void> {
  // Find where the SDK actually lives — walk up from __dirname
  // (__dirname at runtime = packages/sdk/dist/cli/commands
  const sdkPkg = path.resolve(__dirname, "..", "..", ".."); // packages/sdk

  const targetNodeModules = path.join(workspaceDir, "node_modules");
  const targetSdkDir = path.join(targetNodeModules, "@a5c-ai", "babysitter-sdk");

  try {
    await fs.access(targetSdkDir);
    return; // Already exists
  } catch {
    // Need to create symlink
  }

  try {
    await fs.mkdir(path.join(targetNodeModules, "@a5c-ai"), { recursive: true });
    // Use junction on Windows (no admin needed), symlink on Unix
    const linkType = process.platform === "win32" ? "junction" : "dir";
    await fs.symlink(sdkPkg, targetSdkDir, linkType);
  } catch {
    // Best-effort — validation will surface a clearer error if this fails
  }
}

async function validateProcessExport(filePath: string): Promise<void> {
  // Ensure SDK is resolvable from the process file's directory
  await ensureSdkResolvable(path.dirname(path.resolve(filePath)));

  const absPath = path.resolve(filePath);
  const moduleUrl = pathToFileURL(absPath).href;
  const mod = await dynamicImportModule(moduleUrl);

  const fn = mod.process ?? mod.default;
  if (typeof fn !== "function") {
    throw new BabysitterRuntimeError(
      "InvalidProcessExportError",
      `Process file at ${absPath} does not export a function named 'process' or 'default'`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Ensure the file exports: async function process(inputs, ctx) { ... }",
        ],
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Shell execution helper (for shell-kind effects)
// ---------------------------------------------------------------------------

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
        timeout: 300_000, // 5 minutes
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

// ---------------------------------------------------------------------------
// Agent prompt builder
// ---------------------------------------------------------------------------

function buildAgentPrompt(taskDef: Record<string, unknown>): string {
  const agent = taskDef.agent as Record<string, unknown> | undefined;
  if (!agent) return taskDef.title as string ?? "Execute task";

  const prompt = agent.prompt as Record<string, unknown> | undefined;
  if (!prompt) return taskDef.title as string ?? "Execute task";

  const parts: string[] = [];

  // Lead with an explicit instruction to PERFORM the work, not just describe it.
  parts.push(
    "You are an autonomous agent. PERFORM the task below using your available tools (bash, file read/write, etc.).",
    "Do NOT just describe what you would do — actually execute it. When done, output a brief summary of what you did.",
    "",
  );

  if (typeof prompt.role === "string") parts.push(`Role: ${prompt.role}`);
  if (typeof prompt.task === "string") parts.push(`\nTask:\n${prompt.task}`);
  if (prompt.context) parts.push(`\nContext:\n${JSON.stringify(prompt.context, null, 2)}`);
  if (Array.isArray(prompt.instructions)) {
    parts.push(`\nInstructions:\n${(prompt.instructions as string[]).map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`);
  }
  if (typeof prompt.outputFormat === "string") parts.push(`\nOutput format: ${prompt.outputFormat}`);
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Per-task harness routing
// ---------------------------------------------------------------------------

function resolveTaskHarness(
  action: EffectAction,
  defaultHarness: string,
  discovered: HarnessDiscoveryResult[],
): string {
  // Check metadata.harness override
  const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
  if (typeof meta?.harness === "string") {
    const match = discovered.find(h => h.name === meta.harness && h.installed);
    if (match) return match.name;
  }
  // Check agent.name — if it matches a harness name
  const agent = action.taskDef?.agent as Record<string, unknown> | undefined;
  if (typeof agent?.name === "string") {
    const match = discovered.find(h => h.name === agent.name && h.installed);
    if (match) return match.name;
  }
  return defaultHarness;
}

// ---------------------------------------------------------------------------
// Effect resolution
// ---------------------------------------------------------------------------

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
    // Agent-style: invoke harness with the task prompt
    const meta = action.taskDef?.metadata as Record<string, unknown> | undefined;
    const metaPrompt = typeof meta?.prompt === "string" ? meta.prompt : undefined;
    const prompt =
      metaPrompt ??
      action.taskDef?.title ??
      `Execute task ${action.taskId ?? action.effectId}`;

    const taskHarness = discovered
      ? resolveTaskHarness(action, harnessName, discovered)
      : harnessName;

    const result: HarnessInvokeResult = await invokeHarness(taskHarness, {
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
    // Shell-kind: execute command via child_process
    const shellMeta = action.taskDef?.metadata as
      | Record<string, unknown>
      | undefined;
    const command = typeof shellMeta?.command === "string" ? shellMeta.command : "echo";
    const shellArgs = Array.isArray(shellMeta?.args)
      ? (shellMeta.args as string[]).filter((a): a is string => typeof a === "string")
      : [];
    const cwd =
      typeof shellMeta?.cwd === "string" ? shellMeta.cwd : options.workspace;
    const shellResult = await execShellEffect(command, shellArgs, cwd);
    return {
      status: shellResult.exitCode === 0 ? "ok" : "error",
      value: shellResult.exitCode === 0 ? shellResult.stdout : undefined,
      error:
        shellResult.exitCode !== 0
          ? new Error(
              `Shell command exited with code ${shellResult.exitCode}: ${shellResult.stderr}`,
            )
          : undefined,
      stdout: shellResult.stdout,
      stderr: shellResult.stderr,
    };
  }

  if (kind === "breakpoint") {
    const bpQuestion =
      (action.taskDef as Record<string, unknown>)?.question as string | undefined ??
      action.taskDef?.title ??
      "Breakpoint reached. Continue?";

    // Interactive mode: ask user
    if (options.interactive && rl) {
      if (!json) {
        process.stderr.write(`\n${YELLOW}${BOLD}BREAKPOINT${RESET} ${bpQuestion}\n`);
      }
      const approved = await askYesNo(rl, bpQuestion);
      return { status: "ok", value: { approved } };
    }

    // Non-interactive: auto-approve
    return { status: "ok", value: { approved: true } };
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
    // Build comprehensive text prompt from structured agent prompt
    const textPrompt = buildAgentPrompt(action.taskDef as unknown as Record<string, unknown>);

    // Check if this task explicitly requests a specific CLI harness
    const taskHarness = discovered
      ? resolveTaskHarness(action, harnessName, discovered)
      : harnessName;

    // If the task explicitly requested a non-pi CLI harness, use subprocess
    const explicitCliRequested =
      taskHarness !== harnessName && taskHarness !== "pi" && taskHarness !== "oh-my-pi";

    if (explicitCliRequested) {
      const result: HarnessInvokeResult = await invokeHarness(taskHarness, {
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

    // Primary path: use PiSessionHandle programmatic API
    if (piSession) {
      // Stream agent output in real-time (non-JSON mode)
      let unsub: (() => void) | null = null;
      try {
        // Ensure session is initialized before subscribing
        await piSession.initialize();
        if (!json) {
          unsub = piSession.subscribe((event: PiSessionEvent) => {
            if (event.type === "text_delta") {
              const text = (event as unknown as { text?: string }).text;
              if (text) process.stderr.write(text);
            }
          });
        }

        const piResult = await piSession.prompt(textPrompt);

        if (unsub) unsub();
        if (!json) process.stderr.write("\n");

        return {
          status: piResult.success ? "ok" : "error",
          value: piResult.success ? piResult.output : undefined,
          error: piResult.success ? undefined : new Error(piResult.output),
          stdout: piResult.output,
        };
      } catch (piErr: unknown) {
        if (unsub) unsub();
        // Fall through to subprocess invocation — log for debugging
        const piErrMsg = piErr instanceof Error ? piErr.message : String(piErr);
        if (process.env.BABYSITTER_LOG_LEVEL === "debug" || process.env.BABYSITTER_VERBOSE) {
          process.stderr.write(`\n[session:create] Pi programmatic API failed, falling back to subprocess: ${piErrMsg}\n`);
        }
      }
    }

    // Fallback: invoke via CLI subprocess
    const result: HarnessInvokeResult = await invokeHarness(taskHarness, {
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

  // Unknown kind — attempt harness invocation as fallback
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

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function emitProgress(
  payload: ProgressPayload,
  json: boolean,
  _verbose: boolean,
): void {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  switch (payload.phase) {
    case "A":
      if (payload.status === "skipped") {
        process.stderr.write(`${DIM}Phase A skipped (--process provided)${RESET}\n`);
      } else if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}Phase A${RESET} ${DIM}Generating process via ${payload.harness}...${RESET}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`${GREEN}Phase A complete${RESET} ${DIM}${payload.processPath}${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`${RED}Phase A failed:${RESET} ${payload.error}\n`);
      } else if (payload.status === "interview") {
        // Handled inline
      }
      break;
    case "B":
      if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}Phase B${RESET} ${DIM}Creating run...${RESET}\n`);
      } else if (payload.status === "completed") {
        process.stderr.write(`${GREEN}Phase B complete${RESET} runId=${CYAN}${payload.runId}${RESET}\n`);
        if (_verbose) process.stderr.write(`  ${DIM}runDir: ${payload.runDir}${RESET}\n`);
      } else if (payload.status === "failed") {
        process.stderr.write(`${RED}Phase B failed:${RESET} ${payload.error}\n`);
      }
      break;
    case "C":
      if (payload.status === "started") {
        process.stderr.write(`\n${BOLD}Phase C${RESET} ${DIM}Orchestration loop${RESET}\n`);
      } else if (payload.status === "iteration") {
        process.stderr.write(`\n${DIM}── iteration ${payload.iteration} ──${RESET} status=${payload.runStatus} pending=${payload.pendingEffects}\n`);
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

// ---------------------------------------------------------------------------
// Interactive interview (Phase A)
// ---------------------------------------------------------------------------

async function conductInterview(
  rl: readline.Interface,
  initialPrompt: string,
  json: boolean,
  _verbose: boolean,
): Promise<string> {
  const context: string[] = [];

  if (!json) {
    process.stderr.write(`\n${BOLD}Interview${RESET} ${DIM}(help me understand your intent better)${RESET}\n`);
    process.stderr.write(`${DIM}Your prompt: "${initialPrompt}"${RESET}\n\n`);
  }

  // Ask clarifying questions
  const scope = await askQuestion(rl, "Any specific scope, constraints, or requirements?");
  if (scope) context.push(`Scope/constraints: ${scope}`);

  const quality = await askQuestion(rl, "What quality gates matter most? (e.g. tests, linting, manual review, e2e)");
  if (quality) context.push(`Quality gates: ${quality}`);

  const extra = await askQuestion(rl, "Anything else I should know? (press Enter to skip)");
  if (extra) context.push(`Additional context: ${extra}`);

  if (json && context.length > 0) {
    emitProgress({ phase: "A", status: "interview", answer: context.join("; ") }, json, _verbose);
  }

  return context.join("\n");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

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

  // Resolve interactive mode: explicit flag > TTY detection
  const interactive = parsed.interactive ?? (process.stdin.isTTY === true && !json);

  let processPath = providedProcessPath;
  let rl: readline.Interface | null = null;

  if (interactive) {
    rl = createReadlineInterface();
  }

  // ── Shared state ───────────────────────────────────────────────────

  // PiSessionHandle is the primary execution mechanism — pi-coding-agent
  // is a hard dependency. CLI harnesses are used as fallback or when a
  // task explicitly requests a specific harness.
  let piSession: PiSessionHandle | null = null;
  const discovered = await discoverHarnesses();
  const selected = selectHarness(discovered, preferredHarness);
  // CLI harness is optional — pi programmatic API is always available
  const selectedHarnessName = selected?.name ?? "pi";

  // ── Phase A: Process generation ─────────────────────────────────────

  if (processPath) {
    // Skip Phase A
    emitProgress({ phase: "A", status: "skipped", processPath }, json, verbose);
  } else {
    if (!prompt) {
      const error = "Either --prompt or --process must be provided";
      if (json) {
        console.error(
          JSON.stringify({ error: "MISSING_PROMPT", message: error }, null, 2),
        );
      } else {
        process.stderr.write(`${RED}Error:${RESET} ${error}\n`);
      }
      if (rl) rl.close();
      return 1;
    }

    // Interactive interview before process generation
    let interviewContext: string | undefined;
    if (interactive && rl) {
      interviewContext = await conductInterview(rl, prompt, json, verbose);
    }

    emitProgress(
      { phase: "A", status: "started", harness: "pi (programmatic)" },
      json,
      verbose,
    );

    const workDir = workspace ?? process.cwd();
    const generatedPath = path.join(workDir, "generated-process.js");

    try {
      const metaPrompt = buildMetaPrompt(prompt, workDir, interviewContext || undefined);

      // Primary path: use PiSessionHandle programmatically.
      piSession = createPiSession({ workspace: workDir, model });

      // Stream Phase A generation output
      await piSession.initialize();
      let unsubA: (() => void) | null = null;
      if (!json) {
        process.stderr.write(`${DIM}Generating process...${RESET}\n`);
        unsubA = piSession.subscribe((event: PiSessionEvent) => {
          if (event.type === "text_delta") {
            const text = (event as unknown as { text?: string }).text;
            if (text) process.stderr.write(text);
          }
        });
      }

      const piResult = await piSession.prompt(metaPrompt, 300_000); // 5 min timeout
      if (unsubA) unsubA();
      if (!json) process.stderr.write("\n");

      if (!piResult.success) {
        // Pi agent failed — fall back to CLI harness if one is available
        if (selected) {
          await invokeHarness(selected.name, {
            prompt: metaPrompt,
            workspace: workDir,
            model,
          });
        } else {
          throw new BabysitterRuntimeError(
            "ProcessGenerationFailed",
            `Pi agent failed to generate process file: ${piResult.output}`,
            { category: ErrorCategory.External },
          );
        }
      }

      await waitForProcessFile(generatedPath);
      await validateProcessExport(generatedPath);
      processPath = generatedPath;

      emitProgress(
        { phase: "A", status: "completed", processPath, harness: "pi (programmatic)" },
        json,
        verbose,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      emitProgress(
        { phase: "A", status: "failed", error: message, harness: "pi (programmatic)" },
        json,
        verbose,
      );
      if (piSession) {
        piSession.dispose();
      }
      if (rl) rl.close();
      return 1;
    }
  }

  // ── Phase B: Run creation ───────────────────────────────────────────

  emitProgress({ phase: "B", status: "started" }, json, verbose);

  const processId = path.basename(processPath, path.extname(processPath));
  let runId: string;
  let runDir: string;

  try {
    const result = await createRun({
      runsDir,
      process: {
        processId,
        importPath: path.resolve(processPath),
      },
      prompt,
      inputs: prompt ? { prompt } : undefined,
    });
    runId = result.runId;
    runDir = result.runDir;

    emitProgress(
      { phase: "B", status: "completed", runId, runDir },
      json,
      verbose,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    emitProgress(
      { phase: "B", status: "failed", error: message },
      json,
      verbose,
    );
    if (piSession) {
      piSession.dispose();
    }
    if (rl) rl.close();
    return 1;
  }

  // ── Phase C: Orchestration loop ─────────────────────────────────────

  // Ensure PiSessionHandle exists for Phase C — it is the primary
  // execution mechanism for agent tasks. If Phase A already created one,
  // reuse it; otherwise create a fresh one.
  if (!piSession) {
    piSession = createPiSession({ workspace, model });
  }

  emitProgress({ phase: "C", status: "started" }, json, verbose);

  try {
    let iteration = 0;
    while (iteration < maxIterations) {
      iteration++;

      let iterResult: IterationResult;
      try {
        iterResult = await orchestrateIteration({ runDir });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        emitProgress(
          { phase: "C", status: "failed", iteration, error: message },
          json,
          verbose,
        );
        return 1;
      }

      if (iterResult.status === "completed") {
        emitProgress(
          {
            phase: "C",
            status: "completed",
            iteration,
            runStatus: "completed",
          },
          json,
          verbose,
        );
        return 0;
      }

      if (iterResult.status === "failed") {
        const errorMessage =
          iterResult.error instanceof Error
            ? iterResult.error.message
            : typeof iterResult.error === "object" &&
                iterResult.error !== null &&
                "message" in iterResult.error
              ? String((iterResult.error as Record<string, unknown>).message)
              : String(iterResult.error);
        emitProgress(
          {
            phase: "C",
            status: "failed",
            iteration,
            runStatus: "failed",
            error: errorMessage,
          },
          json,
          verbose,
        );
        return 1;
      }

      // status === "waiting" — resolve pending effects
      const pendingActions = iterResult.nextActions;
      emitProgress(
        {
          phase: "C",
          status: "iteration",
          iteration,
          runStatus: "waiting",
          pendingEffects: pendingActions.length,
        },
        json,
        verbose,
      );

      for (const action of pendingActions) {
        const taskTitle = action.taskDef?.title;
        if (!json) {
          process.stderr.write(`\n  ${BOLD}${MAGENTA}${action.kind}${RESET} ${taskTitle ?? action.effectId}\n`);
          if (action.kind === "agent") {
            process.stderr.write(`  ${DIM}Running agent...${RESET}\n`);
          }
        }

        const startedAt = new Date().toISOString();
        try {
          const effectResult = await resolveEffect(
            action,
            selectedHarnessName,
            { workspace, model, interactive },
            piSession,
            discovered,
            rl,
            json,
          );
          const finishedAt = new Date().toISOString();

          await commitEffectResult({
            runDir,
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

          // Emit per-effect status
          emitProgress(
            {
              phase: "C",
              status: "effect",
              effectId: action.effectId,
              effectKind: action.kind,
              effectTitle: taskTitle,
              effectStatus: effectResult.status,
              error: effectResult.status === "error"
                ? (effectResult.error instanceof Error ? effectResult.error.message : String(effectResult.error))
                : undefined,
              output: typeof effectResult.value === "string"
                ? effectResult.value.substring(0, 200)
                : undefined,
            },
            json,
            verbose,
          );
        } catch (err: unknown) {
          const finishedAt = new Date().toISOString();
          const errMsg = err instanceof Error ? err.message : String(err);
          // If resolution itself fails, commit as error
          try {
            await commitEffectResult({
              runDir,
              effectId: action.effectId,
              invocationKey: action.invocationKey,
              result: {
                status: "error",
                error: err instanceof Error ? err : new Error(String(err)),
                startedAt,
                finishedAt,
              },
            });
          } catch {
            // If even the error commit fails, log and continue
            if (verbose) {
              process.stderr.write(
                `${RED}Failed to commit error for effect ${action.effectId}${RESET}\n`,
              );
            }
          }

          emitProgress(
            {
              phase: "C",
              status: "effect",
              effectId: action.effectId,
              effectKind: action.kind,
              effectTitle: taskTitle,
              effectStatus: "error",
              error: errMsg,
            },
            json,
            verbose,
          );
        }
      }
    }

    // Exhausted max iterations
    emitProgress(
      {
        phase: "C",
        status: "failed",
        iteration,
        error: `Max iterations (${maxIterations}) reached without completion`,
      },
      json,
      verbose,
    );
    return 1;
  } finally {
    if (piSession) {
      piSession.dispose();
    }
    if (rl) {
      rl.close();
    }
  }
}
