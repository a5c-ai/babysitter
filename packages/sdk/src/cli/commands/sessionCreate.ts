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
import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";
import { Type } from "@sinclair/typebox";
import { detectCallerHarness, discoverHarnesses } from "../../harness/discovery";
import { invokeHarness } from "../../harness/invoker";
import { createPiSession, PiSessionHandle } from "../../harness/piWrapper";
import type {
  HarnessDiscoveryResult,
  PiSessionEvent,
  PiSessionOptions,
  SessionBindResult,
} from "../../harness/types";
import { loadCompressionConfig } from "../../compression/config-loader";
import { densityFilterText, estimateTokens } from "../../compression/density-filter";
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
  buildOrchestrationBootstrapPrompt,
  buildOrchestrationTurnPrompt,
  buildProcessDefinitionSystemPrompt,
  buildProcessDefinitionUserPrompt,
  type SessionCreatePromptContext,
} from "./sessionCreatePrompts";
import type { CompressionConfig } from "../../compression/config";

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
const VERBOSE_LOG_LIMIT = 4_000;
let processValidationImportNonce = 0;

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
  effectHarness?: string;
  effectStatus?: string;
  error?: string;
  output?: string;
}

type ProgressPayload = Phase1Progress | Phase2Progress;

interface ToolResultShape {
  content: Array<{ type: "text"; text: string }>;
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

interface ExternalWorkspaceAssessment {
  kind: "empty" | "non-empty";
  entries: string[];
}

function truncateForVerboseLog(text: string, maxChars: number = VERBOSE_LOG_LIMIT): string {
  const normalized = text.replace(/\r\n/g, "\n");
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars)}\n... [truncated ${normalized.length - maxChars} chars]`;
}

function stringifyForVerboseLog(value: unknown, maxChars: number = VERBOSE_LOG_LIMIT): string {
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return truncateForVerboseLog(raw, maxChars);
  } catch {
    return truncateForVerboseLog(String(value), maxChars);
  }
}

function writeVerboseLine(enabled: boolean, json: boolean, message: string): void {
  if (!json && enabled) {
    process.stderr.write(`${DIM}${message}${RESET}\n`);
  }
}

function writeVerboseBlock(
  enabled: boolean,
  json: boolean,
  label: string,
  value: unknown,
  maxChars: number = VERBOSE_LOG_LIMIT,
): void {
  if (json || !enabled) {
    return;
  }
  process.stderr.write(
    `${DIM}[${label}]${RESET}\n${DIM}${stringifyForVerboseLog(value, maxChars)}${RESET}\n`,
  );
}

function loadSessionCompressionConfig(workspace?: string): CompressionConfig | null {
  try {
    return loadCompressionConfig(workspace ?? process.cwd());
  } catch {
    return null;
  }
}

function compressInternalHarnessPrompt(
  text: string,
  compressionConfig: CompressionConfig | null | undefined,
  taskKind: "agent" | "skill" | "breakpoint" = "agent",
): string {
  if (!compressionConfig?.enabled || !compressionConfig.layers.sdkContextHook.enabled) {
    return text;
  }

  const layer = compressionConfig.layers.sdkContextHook;
  if (estimateTokens(text) <= layer.minCompressionTokens) {
    return text;
  }

  const targetReduction = layer.perTaskKind?.[taskKind] ?? layer.targetReduction;
  return densityFilterText(text, targetReduction);
}

function buildPromptContext(args: {
  workspace?: string;
  selectedHarnessName?: string;
  discovered: HarnessDiscoveryResult[];
  compressionConfig: CompressionConfig | null;
}): SessionCreatePromptContext {
  const envNames = [
    "CI",
    "BABYSITTER_COMPRESSION_ENABLED",
    "BABYSITTER_PI_SANDBOX_IMAGE",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_PROJECT_NAME",
    "AZURE_OPENAI_DEPLOYMENT",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
  ] as const;

  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: process.cwd(),
    workspace: path.resolve(args.workspace ?? process.cwd()),
    selectedHarnessName: args.selectedHarnessName,
    discoveredHarnesses: args.discovered,
    compressionEnabled: Boolean(
      args.compressionConfig?.enabled &&
      args.compressionConfig.layers.sdkContextHook.enabled,
    ),
    secureSandboxImage: process.env.BABYSITTER_PI_SANDBOX_IMAGE || "node:22-bookworm",
    piDefaultBashSandbox: "local",
    piIsolationDefault: false,
    envFlags: envNames.map((name) => ({
      name,
      value: process.env[name]
        ? (name.endsWith("_API_KEY") ? "set" : process.env[name])
        : "unset",
    })),
  };
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

  const caller = detectCallerHarness();
  if (caller) {
    const callerMatch = discovered.find((h) => h.name === caller.name && h.installed);
    if (callerMatch) return callerMatch;
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

function getGeneratedProcessPath(workDir: string): string {
  return path.join(workDir, "generated-process.mjs");
}

function looksLikeProcessDefinitionSource(source: string): boolean {
  const normalized = source.trim();
  if (!normalized) {
    return false;
  }
  return (
    normalized.includes("defineTask(") ||
    /export\s+async\s+function\s+process\s*\(/.test(normalized) ||
    /export\s+default\s+async\s+function/.test(normalized) ||
    /export\s*\{\s*process\s*\}/.test(normalized)
  );
}

function extractProcessDefinitionCodeBlock(text: string): string | null {
  const codeBlockPattern = /```(?:javascript|js|mjs|ts)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  let fallback: string | null = null;

  while ((match = codeBlockPattern.exec(text)) !== null) {
    const candidate = match[1]?.trim();
    if (!candidate) {
      continue;
    }
    if (looksLikeProcessDefinitionSource(candidate)) {
      return candidate;
    }
    fallback ??= candidate;
  }

  return fallback;
}

function normalizeReportedPath(candidate: string, workspace?: string): string {
  const trimmed = candidate.trim().replace(/^['"`]|['"`]$/g, "");
  if (path.isAbsolute(trimmed)) {
    return path.resolve(trimmed);
  }
  return path.resolve(workspace ?? process.cwd(), trimmed);
}

function extractMentionedProcessPaths(text: string, workspace?: string): string[] {
  const patterns = [
    /([A-Za-z]:[\\/][^\r\n"'`]+?\.m?js)\b/g,
    /((?:\.{0,2}[\\/]|\/)[^\r\n"'`]+?\.m?js)\b/g,
    /\b([A-Za-z0-9_.\-\\/]+generated-process\.m?js)\b/g,
  ];

  const matches = new Set<string>();
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1];
      if (raw) {
        matches.add(normalizeReportedPath(raw, workspace));
      }
    }
  }

  return [...matches];
}

async function recoverProcessDefinitionFromOutputs(args: {
  outputPath: string;
  workspace?: string;
  outputs: string[];
}): Promise<ProcessDefinitionReport | null> {
  const expectedPath = path.resolve(args.outputPath);

  try {
    await waitForProcessFile(expectedPath, 1_000);
    return {
      processPath: expectedPath,
      summary: "Recovered from missing process-definition tool report by using the expected output path.",
    };
  } catch {
    // continue to other recovery strategies
  }

  for (const output of args.outputs) {
    for (const candidatePath of extractMentionedProcessPaths(output, args.workspace)) {
      try {
        await waitForProcessFile(candidatePath, 1_000);
        return {
          processPath: candidatePath,
          summary: "Recovered process-definition output by using a path mentioned by the agent.",
        };
      } catch {
        // keep trying
      }
    }
  }

  for (const output of args.outputs) {
    const extracted = extractProcessDefinitionCodeBlock(output);
    if (!extracted || !looksLikeProcessDefinitionSource(extracted)) {
      continue;
    }
    await fs.mkdir(path.dirname(expectedPath), { recursive: true });
    await fs.writeFile(expectedPath, extracted, "utf8");
    return {
      processPath: expectedPath,
      summary: "Recovered process-definition output by writing a JavaScript code block returned by the agent.",
    };
  }

  for (const output of args.outputs) {
    if (!looksLikeProcessDefinitionSource(output)) {
      continue;
    }
    await fs.mkdir(path.dirname(expectedPath), { recursive: true });
    await fs.writeFile(expectedPath, output.trim(), "utf8");
    return {
      processPath: expectedPath,
      summary: "Recovered process-definition output by writing the agent's direct JavaScript response.",
    };
  }

  return null;
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

function hasNamedProcessGlobalReferenceConflict(source: string): boolean {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!/export\s+async\s+function\s+process\s*\(/.test(normalized)) {
    return false;
  }
  return /(^|[^.\w$])process\./m.test(normalized);
}

function assumesRuntimeWorkspacePathWithoutModuleFallback(source: string): boolean {
  const normalized = source.replace(/\r\n/g, "\n");
  const usesContextWorkspacePath =
    /\bctx\??\.workspaceDir\b/.test(normalized) ||
    /\bctx\??\.cwd\b/.test(normalized);
  if (!usesContextWorkspacePath) {
    return false;
  }
  return !/\bimport\.meta\.url\b/.test(normalized);
}

function getDefineTaskBlocks(source: string): Array<{ id: string; body: string }> {
  const normalized = source.replace(/\r\n/g, "\n");
  const pattern =
    /defineTask\(\s*(['"`])([^'"`]+)\1\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\(\{([\s\S]*?)\}\)\s*(?:,\s*\{[\s\S]*?\}\s*)?\)/g;
  const blocks: Array<{ id: string; body: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalized)) !== null) {
    blocks.push({
      id: match[2],
      body: match[3] ?? "",
    });
  }
  return blocks;
}

function getDefineTaskIdsMissingKind(source: string): string[] {
  return getDefineTaskBlocks(source)
    .filter((block) => !/\bkind\s*:/.test(block.body))
    .map((block) => block.id);
}

function getDefineTaskKindShapeMismatches(source: string): Array<{ id: string; expectedKind: string }> {
  const mismatches: Array<{ id: string; expectedKind: string }> = [];
  for (const block of getDefineTaskBlocks(source)) {
    if (/\bagent\s*:/.test(block.body) && !/\bkind\s*:\s*["']agent["']/.test(block.body)) {
      mismatches.push({ id: block.id, expectedKind: "agent" });
    }
    if (/\bshell\s*:/.test(block.body) && !/\bkind\s*:\s*["']shell["']/.test(block.body)) {
      mismatches.push({ id: block.id, expectedKind: "shell" });
    }
    if (/\bnode\s*:/.test(block.body) && !/\bkind\s*:\s*["']node["']/.test(block.body)) {
      mismatches.push({ id: block.id, expectedKind: "node" });
    }
  }
  return mismatches;
}

function getInvalidCtxTaskTargets(source: string): string[] {
  const normalized = source.replace(/\r\n/g, "\n");
  const definedTaskBindings = new Set<string>();
  const defineTaskBindingPattern = /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*defineTask\s*\(/g;
  let defineTaskBindingMatch: RegExpExecArray | null;
  while ((defineTaskBindingMatch = defineTaskBindingPattern.exec(normalized)) !== null) {
    definedTaskBindings.add(defineTaskBindingMatch[1]);
  }

  const invalidTargets = new Set<string>();
  const ctxTaskPattern = /\bctx\.task\s*\(\s*([^,\n]+?)\s*,/g;
  let ctxTaskMatch: RegExpExecArray | null;
  while ((ctxTaskMatch = ctxTaskPattern.exec(normalized)) !== null) {
    const target = (ctxTaskMatch[1] ?? "").trim();
    if (!target) {
      continue;
    }
    if (/^[A-Za-z_$][\w$]*$/.test(target) && definedTaskBindings.has(target)) {
      continue;
    }
    invalidTargets.add(target.replace(/\s+/g, " ").slice(0, 80));
  }

  return Array.from(invalidTargets);
}

async function validateProcessExport(filePath: string): Promise<void> {
  const source = await fs.readFile(path.resolve(filePath), "utf8");
  const syntaxCheck = await execShellEffect(process.execPath, ["--check", path.resolve(filePath)]);
  if (syntaxCheck.exitCode !== 0) {
    const diagnostic = [syntaxCheck.stdout, syntaxCheck.stderr]
      .map((value) => value.trim())
      .filter(Boolean)
      .join("\n");
    throw new BabysitterRuntimeError(
      "InvalidProcessSyntaxError",
      diagnostic
        ? `Process file at ${filePath} failed \`node --check\`.\n${diagnostic}`
        : `Process file at ${filePath} failed \`node --check\`.`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Rewrite the file so it is syntactically valid ESM before runtime import",
          "If the process writes HTML/CSS/JS assets, do not embed raw nested template literals inside outer template literals",
          "Prefer String.raw, arrays joined with \"\\n\", or escaped inner backticks and \\${...} sequences when embedding source files",
        ],
      },
    );
  }
  if (hasNamedProcessGlobalReferenceConflict(source)) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} references \`process.\` inside the named 'process' export, which shadows Node's global process object`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "If the process needs the workspace root, resolve it from the module location with import.meta.url",
          "If you need Node's global process object, use globalThis.process or import it under another name such as nodeProcess",
        ],
      },
    );
  }
  if (assumesRuntimeWorkspacePathWithoutModuleFallback(source)) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} assumes ctx.workspaceDir or ctx.cwd exists, but the runtime process context does not provide workspace paths`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "When the process needs the workspace root, derive it from the module location with import.meta.url",
          "For a generated process in the workspace root, use path.dirname(fileURLToPath(import.meta.url)) or an equivalent import.meta.url-based approach",
        ],
      },
    );
  }
  const taskIdsMissingKind = getDefineTaskIdsMissingKind(source);
  if (taskIdsMissingKind.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} defines task(s) without a top-level kind: ${taskIdsMissingKind.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Every TaskDef returned from defineTask(...) must include a top-level kind string",
          "Use kind: \"agent\" with agent: { ... }, kind: \"shell\" with shell: { command: ... }, or kind: \"node\" with node: { entry, args? } as appropriate",
        ],
      },
    );
  }
  const taskKindShapeMismatches = getDefineTaskKindShapeMismatches(source);
  if (taskKindShapeMismatches.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} has task definition kind mismatches: ${taskKindShapeMismatches
        .map((mismatch) => `${mismatch.id} should use kind "${mismatch.expectedKind}"`)
        .join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Match each task's kind to its body shape",
          "Agent tasks must use kind: \"agent\", shell tasks must use kind: \"shell\", and node tasks must use kind: \"node\"",
        ],
      },
    );
  }
  const invalidCtxTaskTargets = getInvalidCtxTaskTargets(source);
  if (invalidCtxTaskTargets.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} calls ctx.task(...) with values that are not DefinedTask bindings created via defineTask(...): ${invalidCtxTaskTargets.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Define each task with const taskName = defineTask(\"task-id\", (args, taskCtx) => ({ ... }))",
          "Pass only those DefinedTask bindings to await ctx.task(taskName, args)",
          "Do not pass plain object task definitions, inline literals, or ad-hoc task objects to ctx.task(...)",
        ],
      },
    );
  }
  await ensureSdkResolvable(path.dirname(path.resolve(filePath)));
  const moduleUrl = `${pathToFileURL(path.resolve(filePath)).href}?t=${Date.now()}-${++processValidationImportNonce}`;
  const mod = await dynamicImportModule(moduleUrl);
  const fn = mod.process;
  if (typeof fn !== "function") {
    throw new BabysitterRuntimeError(
      "InvalidProcessExportError",
      `Process file at ${filePath} does not export a function named 'process'`,
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

function shellQuoteArg(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
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

  return defaultHarness;
}

function isPiHarness(harnessName: string): boolean {
  return harnessName === "pi" || harnessName === "oh-my-pi";
}

function usesExternalHarness(harnessName: string): boolean {
  return !isPiHarness(harnessName);
}

function shouldUseExternalHarness(harnessName: string): boolean {
  if (!usesExternalHarness(harnessName)) {
    return false;
  }
  return detectCallerHarness()?.name === harnessName;
}

function readBooleanMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
): boolean | undefined {
  const value = metadata?.[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

function readBashSandboxMetadata(
  metadata: Record<string, unknown> | undefined,
): PiSessionOptions["bashSandbox"] | undefined {
  const value = metadata?.bashSandbox;
  return value === "auto" || value === "secure" || value === "local"
    ? value
    : undefined;
}

function buildPiWorkerSessionOptions(args: {
  action: EffectAction;
  workspace?: string;
  model?: string;
}): PiSessionOptions {
  const metadata = args.action.taskDef?.metadata as Record<string, unknown> | undefined;
  const isolated = readBooleanMetadata(metadata, "isolated");
  const enableCompaction = readBooleanMetadata(metadata, "enableCompaction");
  const bashSandbox = readBashSandboxMetadata(metadata);

  return {
    workspace: args.workspace,
    model: args.model,
    toolsMode: "coding",
    ephemeral: true,
    ...(isolated !== undefined ? { isolated } : {}),
    ...(enableCompaction !== undefined ? { enableCompaction } : {}),
    ...(bashSandbox ? { bashSandbox } : {}),
  };
}

async function resolveEffect(
  action: EffectAction,
  harnessName: string,
  options: {
    workspace?: string;
    model?: string;
    interactive?: boolean;
    compressionConfig?: CompressionConfig | null;
  },
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
    const effectivePrompt = compressInternalHarnessPrompt(
      prompt,
      options.compressionConfig,
      "skill",
    );

    const taskHarness = discovered
      ? resolveTaskHarness(action, harnessName, discovered)
      : harnessName;

    if ((taskHarness === "pi" || taskHarness === "oh-my-pi") && piSession) {
      const piResult = await piSession.prompt(effectivePrompt);
      return {
        status: piResult.success ? "ok" : "error",
        value: piResult.success ? piResult.output : undefined,
        error: piResult.success ? undefined : new Error(piResult.output),
        stdout: piResult.output,
      };
    }

    const result = await invokeHarness(taskHarness, {
      prompt: effectivePrompt,
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
    if (piSession) {
      const bashCommand = [command, ...shellArgs.map(shellQuoteArg)].join(" ");
      const bashResult = await piSession.executeBash(bashCommand);
      return {
        status: bashResult.exitCode === 0 ? "ok" : "error",
        value: bashResult.exitCode === 0 ? bashResult.output : undefined,
        error: bashResult.exitCode === 0
          ? undefined
          : new Error(`Shell command exited with code ${bashResult.exitCode ?? "null"}: ${bashResult.output}`),
        stdout: bashResult.output,
      };
    }
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
    const textPrompt = compressInternalHarnessPrompt(
      buildAgentPrompt(action.taskDef as unknown as Record<string, unknown>),
      options.compressionConfig,
      "agent",
    );
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
  const effectiveFallbackPrompt = compressInternalHarnessPrompt(
    fallbackPrompt,
    options.compressionConfig,
    "skill",
  );
  const result = await invokeHarness(harnessName, {
    prompt: effectiveFallbackPrompt,
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
    return {
      content: [{
        type: "text",
        text: message ? `${message}\n${data}` : data,
      }],
      details: data,
    };
  }
  const content = message
    ? `${message}\n${JSON.stringify(data, null, 2)}`
    : JSON.stringify(data, null, 2);
  return {
    content: [{
      type: "text",
      text: content,
    }],
    details: data,
  };
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

function writeVerboseProcessDefinitionRecovery(json: boolean): void {
  if (!json) {
    process.stderr.write(`${DIM}Phase 1 recovery: the agent did not report the process file, retrying with an explicit write-and-report instruction...${RESET}\n`);
  }
}

function isIgnorablePiPromptFailure(output: string): boolean {
  return output.includes("msg.content.filter is not a function");
}

function normalizeProcessDefinitionSource(source: string): string {
  const trimmed = source.trim();
  const fenced = trimmed.match(/^```(?:javascript|js|ts)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  if (fenced?.[1]) {
    return fenced[1];
  }
  return source;
}

async function recoverReportedProcessDefinition(args: {
  state: { report?: ProcessDefinitionReport };
  outputPath: string;
  workspace?: string;
  outputs: string[];
  verbose: boolean;
  json: boolean;
}): Promise<ProcessDefinitionReport | undefined> {
  if (args.state.report?.processPath) {
    return args.state.report;
  }

  const recovered = await recoverProcessDefinitionFromOutputs({
    outputPath: args.outputPath,
    workspace: args.workspace,
    outputs: args.outputs,
  });
  if (recovered) {
    args.state.report = recovered;
    writeVerboseBlock(args.verbose, args.json, "phase1 recovered report", recovered);
  }
  return recovered ?? undefined;
}

function buildExternalProcessDefinitionPrompt(args: {
  prompt: string;
  outputPath: string;
  workspace?: string;
  promptContext: SessionCreatePromptContext;
  workspaceAssessment: ExternalWorkspaceAssessment;
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
  const emptyWorkspaceAuthoringGuide = [
    "",
    "Empty-workspace authoring guide:",
    "- Do not perform extra exploration. You already know the workspace is empty.",
    "- Write a concrete greenfield process immediately.",
    "- Prefer a small process with explicit milestones such as: plan the game, scaffold the project, implement the game, verify the result.",
    "- Use `agent` tasks for planning and implementation. Use `shell` tasks only for concrete runnable commands such as dependency install, build, or test commands that the later orchestration can execute.",
    "- Keep the process practical for a brand-new directory: it should create the project, build the game, and verify that it runs or tests cleanly.",
  ].join("\n");

  return [
    "You are running babysitter session:create phase 1 on an external CLI harness in non-interactive mode.",
    "Do the real process-authoring work in the workspace and write the actual process file to disk.",
    "",
    "Task:",
    `- User request: ${args.prompt}`,
    `- Workspace: ${workspace}`,
    `- Output path: ${path.resolve(args.outputPath)}`,
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
    "- Use `agent` tasks for planning, implementation, analysis, and verification work.",
    "- Use `shell` tasks only for existing CLI tools such as tests, builds, linters, git, or package managers.",
    "- Never use `node` kind effects.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; never pass plain object task definitions or ad-hoc task objects.",
    "- Include quality gates and verification/refinement steps that fit the request.",
    "- For this request, a good default is a process that plans the game scope, scaffolds the project, implements the game loop and UI, and verifies the result with runnable checks.",
    "- Keep the module syntactically valid ESM. If you embed HTML/CSS/JS asset contents inside the process source, avoid raw nested template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- If task-level harness routing is needed, only use installed harness names from this list: "
      + `${installedHarnessList}.`,
    args.promptContext.selectedHarnessName
      ? `- The selected orchestration harness for the session will be ${args.promptContext.selectedHarnessName}; encode task.metadata.harness only when a task should explicitly target a different harness or the selected one.`
      : "- No orchestration harness has been preselected; keep harness routing explicit only where it materially matters.",
    "- External harnesses do not provide PI sandbox guardrails for their own tool execution. Keep security-sensitive shell work on the internal PI worker by using shell effects without routing them to an external harness.",
    "",
    "Output rules:",
    "- Write the file now to the exact output path.",
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

function buildExternalProcessConformancePrompt(args: {
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
    "- Agent tasks must use `agent: { name, prompt, outputSchema }`.",
    "- Every task returned from `defineTask(...)` must include a top-level `kind` field.",
    "- Put instructions inside `agent.prompt.task`, `agent.prompt.instructions`, and related prompt fields rather than top-level `instructions` fields.",
    "- Agent tasks must use `kind: \"agent\"` with `agent: { name, prompt, outputSchema }`.",
    "- Shell tasks must use `kind: \"shell\"` with `shell: { command: \"...\" }`.",
    "- Node tasks must use `kind: \"node\"` with `node: { entry, args? }`.",
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

function buildInternalProcessConformancePrompt(args: {
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
    "- Every task returned from `defineTask(...)` must include a top-level `kind` field.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; do not pass plain object task definitions or ad-hoc task objects.",
    "- The rewritten module must be syntactically valid ESM and pass `node --check`.",
    "- If the process writes HTML/CSS/JS assets, do not embed raw nested template literals inside outer template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- Inside the named `process(inputs, ctx)` export, do not reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Agent tasks must use `kind: \"agent\"` with `agent: { name, prompt, outputSchema }`.",
    "- Shell tasks must use `kind: \"shell\"` with `shell: { command: \"...\" }`.",
    "- Node tasks must use `kind: \"node\"` with `node: { entry, args? }`.",
    "- The exported `process(inputs, ctx)` function must call tasks with `await ctx.task(definedTask, args)`.",
    "- Use `babysitter_write_process_definition` to rewrite the full file to the exact target path.",
    "- After rewriting the file, call `babysitter_report_process_definition` exactly once with the same path.",
    "- Do not answer with plain text only.",
  ].join("\n");
}

async function assessWorkspaceForExternalAuthoring(
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

async function runExternalProcessDefinitionPhase(args: {
  prompt: string;
  outputPath: string;
  workspace?: string;
  model?: string;
  json: boolean;
  verbose: boolean;
  selectedHarnessName: string;
  promptContext: SessionCreatePromptContext;
}): Promise<string> {
  const phaseOutputs: string[] = [];
  const writeVerbose = (message: string): void => {
    writeVerboseLine(args.verbose, args.json, message);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(args.verbose, args.json, label, value, maxChars);
  };

  emitProgress(
    { phase: "1", status: "started", harness: `${args.selectedHarnessName} (headless)` },
    args.json,
    args.verbose,
  );

  writeVerbose(
    `[phase1 setup] workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} outputPath=${path.resolve(args.outputPath)} harness=${args.selectedHarnessName}`,
  );

  const workspaceAssessment = await assessWorkspaceForExternalAuthoring(args.workspace);
  writeVerboseData("phase1 workspace assessment", workspaceAssessment);

  const invokeProcessAuthor = async (label: string, prompt: string, timeout: number): Promise<void> => {
    writeVerboseData(`${label} prompt`, prompt);
    const result = await invokeHarness(args.selectedHarnessName, {
      prompt,
      workspace: args.workspace,
      model: args.model,
      timeout,
    });
    if (!result.success) {
      writeVerboseData(`${label} failure output`, result.output);
      throw new BabysitterRuntimeError(
        "ProcessDefinitionFailed",
        result.output,
        { category: ErrorCategory.External },
      );
    }
    phaseOutputs.push(result.output);
    writeVerboseData(`${label} output`, result.output);
  };

  await invokeProcessAuthor(
    "phase1 initial",
    buildExternalProcessDefinitionPrompt({
      prompt: args.prompt,
      outputPath: args.outputPath,
      workspace: args.workspace,
      promptContext: args.promptContext,
      workspaceAssessment,
    }),
    900_000,
  );

  let report = await recoverProcessDefinitionFromOutputs({
    outputPath: args.outputPath,
    workspace: args.workspace,
    outputs: phaseOutputs,
  });
  if (report) {
    writeVerboseData("phase1 recovered report", report);
  }

  if (!report) {
    await invokeProcessAuthor(
      "phase1 recovery",
      [
        `Write the full process file now to ${args.outputPath}.`,
        "Do not describe the plan only; materialize the file in the workspace.",
        "After writing it, return either a concise summary or the full file in a ```javascript fenced block.",
      ].join("\n"),
      300_000,
    );
    report = await recoverProcessDefinitionFromOutputs({
      outputPath: args.outputPath,
      workspace: args.workspace,
      outputs: phaseOutputs,
    });
    if (report) {
      writeVerboseData("phase1 recovered report", report);
    }
  }

  if (!report) {
    await invokeProcessAuthor(
      "phase1 final recovery",
      [
        `Final recovery step: write the complete JavaScript process file to ${args.outputPath}.`,
        "Return the full file in a ```javascript fenced block after it exists on disk.",
        "Do not omit the file write.",
      ].join("\n"),
      300_000,
    );
    report = await recoverProcessDefinitionFromOutputs({
      outputPath: args.outputPath,
      workspace: args.workspace,
      outputs: phaseOutputs,
    });
    if (report) {
      writeVerboseData("phase1 recovered report", report);
    }
  }

  if (!report?.processPath) {
    writeVerboseData("phase1 unrecoverable outputs", phaseOutputs);
    throw new BabysitterRuntimeError(
      "ProcessDefinitionReportMissing",
      "The process-definition harness did not produce a valid process file or recoverable JavaScript output.",
      { category: ErrorCategory.Runtime },
    );
  }

  await invokeProcessAuthor(
    "phase1 sdk conformance",
    buildExternalProcessConformancePrompt({
      outputPath: report.processPath,
      prompt: args.prompt,
    }),
    300_000,
  );

  await validateProcessExport(report.processPath);
  emitProgress(
    {
      phase: "1",
      status: "completed",
      harness: `${args.selectedHarnessName} (headless)`,
      processPath: report.processPath,
    },
    args.json,
    args.verbose,
  );
  if (!args.json) {
    process.stderr.write(`${GREEN}Phase 1 complete:${RESET} process=${CYAN}${report.processPath}${RESET}\n`);
  }
  return report.processPath;
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
  compressionConfig: CompressionConfig | null;
  promptContext: SessionCreatePromptContext;
  selectedHarnessName: string;
}): Promise<string> {
  const state: { report?: ProcessDefinitionReport } = {};
  const phaseOutputs: string[] = [];
  let session: PiSessionHandle | null = null;
  const writeVerbose = (message: string): void => {
    writeVerboseLine(args.verbose, args.json, message);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(args.verbose, args.json, label, value, maxChars);
  };
  const customTools: unknown[] = [
    {
      name: "babysitter_write_process_definition",
      label: "Write Process Definition",
      description: "Write the final JavaScript process file to the exact required output path.",
      parameters: Type.Object({
        source: Type.String(),
        processPath: Type.Optional(Type.String()),
      }),
      execute: async (
        _toolCallId: string,
        params: { source: string; processPath?: string },
      ): Promise<ToolResultShape> => {
        const resolvedOutputPath = path.resolve(args.outputPath);
        const requestedPath = params.processPath
          ? path.resolve(params.processPath)
          : resolvedOutputPath;
        if (requestedPath !== resolvedOutputPath) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionPathMismatch",
            `Process definitions must be written to ${resolvedOutputPath}.`,
            { category: ErrorCategory.Runtime },
          );
        }

        const normalizedSource = normalizeProcessDefinitionSource(params.source);
        writeVerboseData("phase1 tool babysitter_write_process_definition", {
          processPath: requestedPath,
          sourcePreview: truncateForVerboseLog(normalizedSource, 600),
        });
        await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });
        await fs.writeFile(resolvedOutputPath, normalizedSource, "utf8");
        return formatToolResult(
          { processPath: resolvedOutputPath },
          "Process definition written.",
        );
      },
    },
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
        writeVerboseData("phase1 tool AskUserQuestion request", params);
        const response = await askUserQuestionViaTool(params, args.interactive, args.rl);
        writeVerboseData("phase1 tool AskUserQuestion response", response);
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
        writeVerboseData("phase1 tool babysitter_report_process_definition", params);
        state.report = {
          processPath: params.processPath,
          summary: params.summary,
        };
        // Phase 1 is complete as soon as the process file is written and reported.
        // Abort the live turn so the host can validate the file instead of waiting
        // for PI to continue streaming after completion.
        setTimeout(() => {
          if (session?.isStreaming) {
            void session.abort().catch(() => {});
          }
        }, 0);
        return formatToolResult(state.report, "Process definition reported.");
      },
    },
  ];

  emitProgress(
    { phase: "1", status: "started", harness: "pi (agentic)" },
    args.json,
    args.verbose,
  );

  writeVerbose(
    `[phase1 setup] workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} outputPath=${path.resolve(args.outputPath)}`,
  );
  writeVerboseData(
    "phase1 tools",
    (customTools as Array<{ name?: string; label?: string }>).map((tool) => ({
      name: tool.name,
      label: tool.label,
    })),
  );
  const workspaceAssessment = await assessWorkspaceForExternalAuthoring(args.workspace);
  writeVerboseData("phase1 workspace assessment", workspaceAssessment);

  const processDefinitionSystemPrompt = buildProcessDefinitionSystemPrompt(
    args.outputPath,
    args.promptContext,
  );
  const initialMetaPrompt = buildProcessDefinitionUserPrompt(
    args.prompt,
    args.outputPath,
    {
      interactive: args.interactive,
      workspaceAssessment: workspaceAssessment.kind,
      workspaceEntries: workspaceAssessment.entries,
    },
  );
  writeVerboseData("phase1 system prompt", processDefinitionSystemPrompt);
  writeVerboseData("phase1 initial prompt", initialMetaPrompt);
  const phase1ToolsMode: PiSessionOptions["toolsMode"] =
    workspaceAssessment.kind === "empty"
      ? "default"
      : "readonly";

  session = createPiSession({
    workspace: args.workspace,
    model: args.model,
    thinkingLevel: "low",
    toolsMode: phase1ToolsMode,
    customTools,
    systemPrompt: processDefinitionSystemPrompt,
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
      initialMetaPrompt,
      300_000,
    );
    phaseOutputs.push(result.output);

    if (unsubscribe) unsubscribe();
    if (!args.json) process.stderr.write("\n");

    if (!result.success) {
      writeVerboseData("phase1 agent failure output", result.output);
      const recovered = await recoverReportedProcessDefinition({
        state,
        outputPath: args.outputPath,
        workspace: args.workspace,
        outputs: phaseOutputs,
        verbose: args.verbose,
        json: args.json,
      });
      if (!recovered?.processPath) {
        throw new BabysitterRuntimeError(
          "ProcessDefinitionFailed",
          result.output,
          { category: ErrorCategory.External },
        );
      }
      writeVerbose(
        "[phase1 recovery] proceeding with the reported process file after a late PI prompt failure",
      );
    } else {
      writeVerboseData("phase1 agent output", result.output);
    }

    if (!state.report?.processPath) {
      writeVerboseProcessDefinitionRecovery(args.json);
      const recoveryPrompt = [
        "Recovery step:",
        `- Write the full process file now to ${args.outputPath}`,
        "- Then call babysitter_report_process_definition exactly once.",
        "- Do not just describe the process in plain text.",
      ].join("\n");
      writeVerboseData("phase1 recovery prompt", recoveryPrompt);
      const recovery = await session.prompt(
        recoveryPrompt,
        180_000,
      );
      phaseOutputs.push(recovery.output);
      if (!recovery.success) {
        writeVerboseData("phase1 recovery failure output", recovery.output);
        const recovered = await recoverReportedProcessDefinition({
          state,
          outputPath: args.outputPath,
          workspace: args.workspace,
          outputs: phaseOutputs,
          verbose: args.verbose,
          json: args.json,
        });
        if (!recovered?.processPath) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionFailed",
            recovery.output,
            { category: ErrorCategory.External },
          );
        }
        writeVerbose(
          "[phase1 recovery] using the reported process file after the recovery prompt failed late",
        );
      } else {
        writeVerboseData("phase1 recovery output", recovery.output);
      }
    }

    if (!state.report?.processPath) {
      writeVerbose("[phase1 recovery] attempting host-side recovery from agent outputs");
      await recoverReportedProcessDefinition({
        state,
        outputPath: args.outputPath,
        workspace: args.workspace,
        outputs: phaseOutputs,
        verbose: args.verbose,
        json: args.json,
      });
    }

    if (!state.report?.processPath) {
      const finalRecoveryPrompt = [
        "Final recovery step:",
        `- Write the complete JavaScript process file to ${args.outputPath}.`,
        "- If you already wrote it, do not rewrite unnecessarily.",
        "- Call babysitter_report_process_definition exactly once after the file exists.",
        "- Do not answer with plain text only.",
        "- If helpful, return the full JavaScript in a ```javascript fenced block, but the file must still be written and reported.",
      ].join("\n");
      writeVerboseData("phase1 final recovery prompt", finalRecoveryPrompt);
      const finalRecovery = await session.prompt(
        finalRecoveryPrompt,
        180_000,
      );
      phaseOutputs.push(finalRecovery.output);
      if (!finalRecovery.success) {
        writeVerboseData("phase1 final recovery failure output", finalRecovery.output);
        const recovered = await recoverReportedProcessDefinition({
          state,
          outputPath: args.outputPath,
          workspace: args.workspace,
          outputs: phaseOutputs,
          verbose: args.verbose,
          json: args.json,
        });
        if (!recovered?.processPath) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionFailed",
            finalRecovery.output,
            { category: ErrorCategory.External },
          );
        }
        writeVerbose(
          "[phase1 recovery] using the reported process file after the final recovery prompt failed late",
        );
      } else {
        writeVerboseData("phase1 final recovery output", finalRecovery.output);
      }
      await recoverReportedProcessDefinition({
        state,
        outputPath: args.outputPath,
        workspace: args.workspace,
        outputs: phaseOutputs,
        verbose: args.verbose,
        json: args.json,
      });
    }

    if (!state.report?.processPath) {
      writeVerboseData("phase1 unrecoverable outputs", phaseOutputs);
      if (!args.interactive) {
        throw new BabysitterRuntimeError(
          "ProcessDefinitionReportMissing",
          "The process-definition agent finished without calling babysitter_report_process_definition, and no recoverable process file or code output was produced.",
          { category: ErrorCategory.Runtime },
        );
      } else {
        throw new BabysitterRuntimeError(
          "ProcessDefinitionReportMissing",
          "The process-definition agent finished without calling babysitter_report_process_definition, and no recoverable process file or code output was produced.",
          { category: ErrorCategory.Runtime },
        );
      }
    }

    await waitForProcessFile(state.report.processPath);
    writeVerbose(`[phase1 validate] validating process export from ${path.resolve(state.report.processPath)}`);
    for (let repairAttempt = 0; repairAttempt < 3; repairAttempt += 1) {
      try {
        await validateProcessExport(state.report.processPath);
        break;
      } catch (validationError: unknown) {
        if (repairAttempt === 2) {
          throw validationError;
        }
        const validationMessage = validationError instanceof Error
          ? validationError.message
          : String(validationError);
        writeVerboseData("phase1 validate error", {
          attempt: repairAttempt + 1,
          message: validationMessage,
        });
        const conformancePrompt = buildInternalProcessConformancePrompt({
          outputPath: state.report.processPath,
          prompt: args.prompt,
          validationError: validationMessage,
        });
        writeVerboseData("phase1 conformance repair prompt", conformancePrompt);
        const repair = await session.prompt(
          conformancePrompt,
          180_000,
        );
        phaseOutputs.push(repair.output);
        if (!repair.success) {
          writeVerboseData("phase1 conformance repair failure output", repair.output);
        } else {
          writeVerboseData("phase1 conformance repair output", repair.output);
        }
        await waitForProcessFile(state.report.processPath);
      }
    }

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
    writeVerboseData(
      "phase1 error",
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    );
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
  compressionConfig: CompressionConfig | null;
  promptContext: SessionCreatePromptContext;
}): Promise<number> {
  const processId = path.basename(args.processPath, path.extname(args.processPath));
  const state: OrchestrationState = {
    iteration: 0,
    pendingActions: new Map(),
    pendingEffectResults: new Map(),
  };

  let orchestrationSession: PiSessionHandle | null = null;
  const writeVerbose = (message: string): void => {
    writeVerboseLine(args.verbose, args.json, message);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(args.verbose, args.json, label, value, maxChars);
  };

  if (shouldUseExternalHarness(args.selectedHarnessName)) {
    emitProgress(
      { phase: "2", status: "started", harness: args.selectedHarnessName },
      args.json,
      args.verbose,
    );

    writeVerbose(
      `[phase2 host setup] harness=${args.selectedHarnessName} workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} processPath=${path.resolve(args.processPath)}`,
    );

    const created = await createRun({
      runsDir: args.runsDir,
      process: {
        processId,
        importPath: path.resolve(args.processPath),
      },
      prompt: args.prompt,
      inputs: args.prompt ? { prompt: args.prompt } : undefined,
    });
    state.runId = created.runId;
    state.runDir = created.runDir;
    emitProgress(
      {
        phase: "2",
        status: "run-created",
        runId: created.runId,
        runDir: created.runDir,
      },
      args.json,
      args.verbose,
    );
    writeVerboseData("phase2 host run_create result", created);

    const adapter = getAdapterByName(args.selectedHarnessName);
    if (!adapter) {
      throw new BabysitterRuntimeError(
        "HarnessAdapterMissing",
        `No harness adapter is registered for ${args.selectedHarnessName}.`,
        { category: ErrorCategory.Configuration },
      );
    }
    const sessionId = adapter.resolveSessionId({}) || process.env.CODEX_THREAD_ID || process.env.CODEX_SESSION_ID;
    if (!sessionId) {
      throw new BabysitterRuntimeError(
        "MissingHarnessSessionId",
        `Cannot resolve a session ID for harness ${args.selectedHarnessName}.`,
        { category: ErrorCategory.Configuration },
      );
    }
    state.sessionBound = await adapter.bindSession({
      sessionId,
      runId: created.runId,
      runDir: created.runDir,
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
        runId: created.runId,
        runDir: created.runDir,
        harness: state.sessionBound.harness,
        sessionId: state.sessionBound.sessionId,
        error: state.sessionBound.error,
      },
      args.json,
      args.verbose,
    );
    writeVerboseData("phase2 host bind result", state.sessionBound);

    while (state.iteration < args.maxIterations) {
      state.iteration += 1;
      const result = await orchestrateIteration({ runDir: created.runDir });
      state.lastIterationResult = result;
      writeVerboseData("phase2 host iterate result", {
        iteration: state.iteration,
        status: result.status,
        nextActions: result.status === "waiting" ? result.nextActions : undefined,
        output: result.status === "completed" ? result.output : undefined,
        error: result.status === "failed" ? result.error : undefined,
      });

      if (result.status === "waiting") {
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

        for (const action of result.nextActions) {
          const taskHarness = resolveTaskHarness(action, args.selectedHarnessName, args.discovered);
          let workerSession: PiSessionHandle | null = null;
          if (action.kind === "shell" || isPiHarness(taskHarness)) {
            workerSession = createPiSession(buildPiWorkerSessionOptions({
              action,
              workspace: args.workspace,
              model: args.model,
            }));
          }
          try {
            const effectResult = await resolveEffect(
              action,
              args.selectedHarnessName,
              {
                workspace: args.workspace,
                model: args.model,
                interactive: args.interactive,
                compressionConfig: args.compressionConfig,
              },
              workerSession,
              args.discovered,
              args.rl,
              args.json,
            );
            await commitEffectResult({
              runDir: created.runDir,
              effectId: action.effectId,
              invocationKey: action.invocationKey,
              result: {
                status: effectResult.status,
                value: effectResult.value,
                error: effectResult.error,
                stdout: effectResult.stdout,
                stderr: effectResult.stderr,
                startedAt: new Date().toISOString(),
                finishedAt: new Date().toISOString(),
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
          } finally {
            workerSession?.dispose();
          }
        }
        continue;
      }

      if (result.status === "completed") {
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
        return 0;
      }

      emitProgress(
        {
          phase: "2",
          status: "failed",
          iteration: state.iteration,
          runStatus: "failed",
          error: result.error instanceof Error
            ? result.error.message
            : typeof result.error === "object" && result.error !== null && "message" in result.error
              ? String((result.error as Record<string, unknown>).message)
              : String(result.error),
        },
        args.json,
        args.verbose,
      );
      return 1;
    }

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
    return 1;
  }

  const summarizeAgentText = (text: string): string => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return "(no summary emitted)";
    }
    return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
  };

  const describePendingActions = (): Array<{
    effectId: string;
    kind: string;
    title?: string;
    harness?: string;
  }> => Array.from(state.pendingActions.values()).map((action) => ({
    effectId: action.effectId,
    kind: action.kind,
    title: action.taskDef?.title,
    harness: resolveTaskHarness(action, args.selectedHarnessName, args.discovered),
  }));

  const ensureTerminalResult = (): number | null => {
    if (state.lastIterationResult?.status === "completed") {
      return 0;
    }
    if (state.lastIterationResult?.status === "failed") {
      return 1;
    }
    return null;
  };

  const captureOrchestrationProgressSnapshot = () => ({
    runId: state.runId,
    runDir: state.runDir,
    sessionBound: Boolean(state.sessionBound),
    iteration: state.iteration,
    pendingActionIds: Array.from(state.pendingActions.keys()).sort().join(","),
    pendingResultIds: Array.from(state.pendingEffectResults.keys()).sort().join(","),
    lastStatus: state.lastIterationResult?.status,
    hasAskUserQuestionResponse: Boolean(state.lastAskUserQuestionResponse),
    finished: Boolean(state.finished),
  });

  const orchestrationStateAdvanced = (
    before: ReturnType<typeof captureOrchestrationProgressSnapshot>,
  ): boolean => {
    const after = captureOrchestrationProgressSnapshot();
    return (
      after.runId !== before.runId ||
      after.runDir !== before.runDir ||
      after.sessionBound !== before.sessionBound ||
      after.iteration !== before.iteration ||
      after.pendingActionIds !== before.pendingActionIds ||
      after.pendingResultIds !== before.pendingResultIds ||
      after.lastStatus !== before.lastStatus ||
      after.hasAskUserQuestionResponse !== before.hasAskUserQuestionResponse ||
      after.finished !== before.finished
    );
  };

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
        writeVerboseData("phase2 tool AskUserQuestion request", params);
        const response = await askUserQuestionViaTool(params, args.interactive, args.rl);
        state.lastAskUserQuestionResponse = response;
        writeVerboseData("phase2 tool AskUserQuestion response", response);
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
        writeVerboseData("phase2 tool babysitter_run_create request", params);
        if (state.runId && state.runDir) {
          writeVerboseData("phase2 tool babysitter_run_create result", { runId: state.runId, runDir: state.runDir });
          return formatToolResult({ runId: state.runId, runDir: state.runDir }, "Run already exists.");
        }
        const effectivePrompt = args.prompt ?? params.prompt;
        const result = await createRun({
          runsDir: args.runsDir,
          process: {
            processId,
            importPath: path.resolve(args.processPath),
          },
          prompt: effectivePrompt,
          inputs: effectivePrompt
            ? { prompt: effectivePrompt }
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
        writeVerboseData("phase2 tool babysitter_run_create result", result);
        return formatToolResult(result, "Run created.");
      },
    },
    {
      name: "babysitter_bind_session",
      label: "Babysitter Bind Session",
      description: "Bind the orchestration run to the current harness session.",
      parameters: Type.Object({}),
      execute: async (): Promise<ToolResultShape> => {
        writeVerbose("[phase2 tool babysitter_bind_session request]");
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
        writeVerboseData("phase2 tool babysitter_bind_session result", state.sessionBound);
        return formatToolResult(state.sessionBound, "Session bound.");
      },
    },
    {
      name: "babysitter_run_iterate",
      label: "Babysitter Run Iterate",
      description: "Run the next orchestration iteration and return pending effects or a terminal result.",
      parameters: Type.Object({}),
      execute: async (): Promise<ToolResultShape> => {
        writeVerbose(
          `[phase2 tool babysitter_run_iterate request] runDir=${state.runDir ?? "(missing)"} nextIteration=${state.iteration + 1}`,
        );
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
        writeVerboseData("phase2 tool babysitter_run_iterate result", {
          iteration: state.iteration,
          status: result.status,
          nextActions: result.status === "waiting" ? result.nextActions : undefined,
          output: result.status === "completed" ? result.output : undefined,
          error: result.status === "failed" ? result.error : undefined,
        });

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
        writeVerboseData("phase2 tool babysitter_execute_effect request", params);
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
        writeVerboseData("phase2 effect execution plan", {
          effectId: params.effectId,
          kind: action.kind,
          title: action.taskDef?.title,
          resolvedHarness: taskHarness,
          selectedHarness: args.selectedHarnessName,
          metadata: (action.taskDef?.metadata as Record<string, unknown> | undefined) ?? undefined,
        });
        let workerSession: PiSessionHandle | null = null;
        if (action.kind === "shell" || isPiHarness(taskHarness)) {
          workerSession = createPiSession(buildPiWorkerSessionOptions({
            action,
            workspace: args.workspace,
            model: args.model,
          }));
          writeVerboseData("phase2 worker session options", buildPiWorkerSessionOptions({
            action,
            workspace: args.workspace,
            model: args.model,
          }));
        }

        try {
          const effectResult = await resolveEffect(
            action,
            args.selectedHarnessName,
            {
              workspace: args.workspace,
              model: args.model,
              interactive: false,
              compressionConfig: args.compressionConfig,
            },
            workerSession,
            args.discovered,
            null,
            args.json,
          );
          state.pendingEffectResults.set(params.effectId, effectResult);
          writeVerboseData("phase2 tool babysitter_execute_effect result", {
            effectId: params.effectId,
            effectResult,
          });
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
        writeVerboseData("phase2 tool babysitter_task_post_result request", params);
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
        writeVerboseData("phase2 tool babysitter_task_post_result result", {
          effectId: params.effectId,
          status: effectResult.status,
          startedAt,
          finishedAt,
          valuePreview: effectResult.value,
          error: effectResult.error,
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
        writeVerboseData("phase2 tool babysitter_finish_orchestration", params);
        state.finished = { summary: params.summary };
        return formatToolResult(state.finished, "Orchestration finish recorded.");
      },
    },
  ];

  const tools = customTools as Array<{
    name: string;
    execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<ToolResultShape> | ToolResultShape;
  }>;
  const getTool = (name: string) => tools.find((tool) => tool.name === name);
  const runCreateTool = getTool("babysitter_run_create");
  const bindSessionTool = getTool("babysitter_bind_session");
  const runIterateTool = getTool("babysitter_run_iterate");
  const executeEffectTool = getTool("babysitter_execute_effect");
  const taskPostTool = getTool("babysitter_task_post_result");
  const finishTool = getTool("babysitter_finish_orchestration");

  const invokeTool = async (
    tool: { execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<ToolResultShape> | ToolResultShape } | undefined,
    name: string,
    params: Record<string, unknown> = {},
  ): Promise<ToolResultShape> => {
    if (!tool?.execute) {
      throw new BabysitterRuntimeError(
        "MissingSessionCreateTool",
        `Required orchestration tool is unavailable: ${name}`,
        { category: ErrorCategory.Internal },
      );
    }
    writeVerboseData(`phase2 host invoke ${name} request`, params);
    const result = tool.execute(`host-${name}`, params);
    const resolved = await Promise.resolve(result);
    writeVerboseData(`phase2 host invoke ${name} result`, resolved);
    return resolved;
  };

  const runDeterministicPendingEffects = async (reason: string): Promise<void> => {
    const pending = describePendingActions();
    if (pending.length === 0) {
      return;
    }
    writeVerbose(`[phase2 fallback] ${reason}`);
    for (const effect of pending) {
      writeVerbose(
        `[phase2 fallback] resolving ${effect.effectId} (${effect.kind}) via ${effect.harness ?? args.selectedHarnessName}`,
      );
      const action = state.pendingActions.get(effect.effectId);
      if (!action) {
        continue;
      }
      if (action.kind !== "breakpoint") {
        await invokeTool(
          executeEffectTool,
          "babysitter_execute_effect",
          { effectId: effect.effectId },
        );
      }
      await invokeTool(
        taskPostTool,
        "babysitter_task_post_result",
        { effectId: effect.effectId },
      );
    }
  };

  const promptOrchestrationAgent = async (
    message: string,
    options?: { label?: string; fallbackReason?: string },
  ): Promise<void> => {
    if (!orchestrationSession) {
      throw new BabysitterRuntimeError(
        "OrchestrationSessionMissing",
        "The orchestration PI session has not been created.",
        { category: ErrorCategory.Runtime },
      );
    }

    if (!args.json && args.verbose) {
      const label = options?.label ?? "phase2";
      process.stderr.write(`\n${DIM}[${label}] agent turn${RESET}\n`);
    }
    writeVerboseData(`${options?.label ?? "phase2"} prompt`, message);
    const progressSnapshot = captureOrchestrationProgressSnapshot();

    const result = await orchestrationSession.prompt(
      compressInternalHarnessPrompt(
        message,
        args.compressionConfig,
        "agent",
      ),
      900_000,
    );

    if (!result.success) {
      writeVerboseData(`${options?.label ?? "phase2"} agent failure output`, result.output);
      if (!orchestrationStateAdvanced(progressSnapshot)) {
        if (!isIgnorablePiPromptFailure(result.output)) {
          throw new BabysitterRuntimeError(
            "OrchestrationAgentFailed",
            result.output,
            { category: ErrorCategory.External },
          );
        }
        writeVerbose(
          `[phase2 recovery] ignoring PI prompt failure and continuing with host-driven orchestration: ${result.output}`,
        );
        return;
      }
      writeVerbose(
        `[phase2 recovery] continuing after a late PI prompt failure because orchestration state advanced: ${result.output}`,
      );
      return;
    }

    writeVerbose(
      `[phase2 agent] ${summarizeAgentText(result.output)}`,
    );

    if (options?.fallbackReason && state.pendingActions.size > 0) {
      await runDeterministicPendingEffects(options.fallbackReason);
    }
  };

  orchestrationSession = createPiSession({
    workspace: args.workspace,
    model: args.model,
    toolsMode: "readonly",
    customTools,
    appendSystemPrompt: [buildOrchestrationSystemPrompt(args.selectedHarnessName, args.promptContext)],
    ephemeral: true,
  });

  writeVerbose(
    `[phase2 setup] harness=${args.selectedHarnessName} workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} processPath=${path.resolve(args.processPath)}`,
  );
  writeVerboseData(
    "phase2 tools",
    (customTools as Array<{ name?: string; label?: string }>).map((tool) => ({
      name: tool.name,
      label: tool.label,
    })),
  );
  writeVerboseData(
    "phase2 system prompt",
    buildOrchestrationSystemPrompt(args.selectedHarnessName, args.promptContext),
  );

  emitProgress(
    { phase: "2", status: "started", harness: args.selectedHarnessName },
    args.json,
    args.verbose,
  );

  let unsubscribe: (() => void) | null = null;
  try {
    await orchestrationSession.initialize();
    if (!args.json && args.verbose) {
      unsubscribe = orchestrationSession.subscribe((event: PiSessionEvent) => {
        if (event.type === "text_delta") {
          const text = (event as { text?: string }).text;
          if (text) process.stderr.write(text);
        }
      });
    }

    await promptOrchestrationAgent(
      buildOrchestrationBootstrapPrompt(
        path.resolve(args.processPath),
        args.prompt,
        args.maxIterations,
      ),
      { label: "phase2 bootstrap" },
    );

    if (!state.runId || !state.runDir) {
      writeVerbose("[phase2 fallback] agent did not create a run; creating it in the host");
      await invokeTool(
        runCreateTool,
        "babysitter_run_create",
        args.prompt ? { prompt: args.prompt } : {},
      );
    }
    if (!state.sessionBound) {
      writeVerbose("[phase2 fallback] agent did not bind the session; binding in the host");
      await invokeTool(bindSessionTool, "babysitter_bind_session");
    }

    if (!state.runId || !state.runDir) {
      throw new BabysitterRuntimeError(
        "RunNotCreated",
        "The orchestration session could not establish a run after bootstrap.",
        { category: ErrorCategory.Runtime },
      );
    }

    while (state.iteration < args.maxIterations) {
      const terminal = ensureTerminalResult();
      if (terminal !== null) {
        break;
      }

      if (!args.interactive) {
        writeVerbose("[phase2 deterministic] running a host-driven non-interactive iteration turn");
        await invokeTool(runIterateTool, "babysitter_run_iterate");

        if (state.lastIterationResult?.status === "waiting" && state.pendingActions.size > 0) {
          await runDeterministicPendingEffects(
            "Host-driven non-interactive phase 2 resolved pending effects deterministically.",
          );
        }

        const deterministicTerminal = ensureTerminalResult();
        if (deterministicTerminal !== null) {
          break;
        }
        continue;
      }

      const iterationBeforeTurn = state.iteration;
      await promptOrchestrationAgent(
        buildOrchestrationTurnPrompt({
          processPath: path.resolve(args.processPath),
          userPrompt: args.prompt,
          maxIterations: args.maxIterations,
          currentIteration: state.iteration,
          runId: state.runId,
          runDir: state.runDir,
          lastStatus: state.lastIterationResult?.status,
          pendingEffects: describePendingActions(),
        }),
        {
          label: `phase2 iteration ${state.iteration + 1}`,
          fallbackReason: "Agent left pending effects unresolved; the host resolved and posted them to keep the orchestration loop moving.",
        },
      );

      if (ensureTerminalResult() !== null) {
        break;
      }

      if (state.iteration === iterationBeforeTurn && state.pendingActions.size === 0) {
        writeVerbose("[phase2 fallback] agent did not advance the run; executing one iteration in the host");
        await invokeTool(runIterateTool, "babysitter_run_iterate");
      }

      if (state.lastIterationResult?.status === "waiting" && state.pendingActions.size > 0) {
        await runDeterministicPendingEffects(
          "Agent left pending effects unresolved after the turn; the host completed them deterministically.",
        );
      }

      const postTurnTerminal = ensureTerminalResult();
      if (postTurnTerminal !== null) {
        break;
      }
    }

    if (state.lastIterationResult?.status !== "completed" && state.lastIterationResult?.status !== "failed") {
      state.lastIterationResult = {
        status: "failed",
        error: { message: `Max iterations (${args.maxIterations}) reached without completion` },
      };
      emitProgress(
        {
          phase: "2",
          status: "failed",
          runId: state.runId,
          runDir: state.runDir,
          iteration: state.iteration,
          runStatus: "failed",
          error: `Max iterations (${args.maxIterations}) reached without completion`,
        },
        args.json,
        args.verbose,
      );
    }

    if (state.lastIterationResult?.status === "completed" || state.lastIterationResult?.status === "failed") {
      await invokeTool(
        finishTool,
        "babysitter_finish_orchestration",
        {
          summary: state.lastIterationResult.status === "completed"
            ? `Run ${state.runId} completed after ${state.iteration} iterations.`
            : `Run ${state.runId} failed after ${state.iteration} iterations.`,
        },
      );
    }

    const exitCode = ensureTerminalResult();
    if (exitCode !== null) {
      return exitCode;
    }

    throw new BabysitterRuntimeError(
      "OrchestrationIncomplete",
      "The orchestration phase ended without a terminal run state.",
      { category: ErrorCategory.Runtime },
    );
  } catch (error: unknown) {
    writeVerboseData(
      "phase2 error",
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            runId: state.runId,
            runDir: state.runDir,
            iteration: state.iteration,
            pendingEffects: describePendingActions(),
            lastIterationResult: state.lastIterationResult,
          }
        : error,
    );
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
    if (unsubscribe) unsubscribe();
    if (!args.json && args.verbose) process.stderr.write("\n");
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
    const selectedHarnessName = preferredHarness === "oh-my-pi"
      ? "oh-my-pi"
      : "pi";
    const compressionConfig = loadSessionCompressionConfig(workspace);
    const promptContext = buildPromptContext({
      workspace,
      selectedHarnessName,
      discovered,
      compressionConfig,
    });

    let processPath = providedProcessPath;
    if (processPath) {
      emitProgress({ phase: "1", status: "skipped", processPath }, json, verbose);
    } else {
      const workDir = workspace ?? process.cwd();
      processPath = await runProcessDefinitionPhase({
        prompt: prompt!,
        outputPath: getGeneratedProcessPath(workDir),
        workspace: workDir,
        model,
        interactive,
        rl,
        json,
        verbose,
        compressionConfig,
        promptContext,
        selectedHarnessName,
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
      compressionConfig,
      promptContext,
    });
  } finally {
    rl?.close();
  }
}
