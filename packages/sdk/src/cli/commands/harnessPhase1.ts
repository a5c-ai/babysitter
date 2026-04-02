/**
 * Phase 1: Process definition — interview + process creation.
 *
 * Drives an agentic Pi session (or headless external harness) to author a
 * babysitter process definition file from a user prompt.
 */

import * as path from "node:path";
import * as readline from "node:readline";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";
import { Type } from "@sinclair/typebox";
import { invokeHarness } from "../../harness/invoker";
import { createAgenticToolDefinitions } from "../../harness/agenticTools";
import { resetGlobalTaskRegistry } from "../../tasks/registry";
import { ensureActiveProcessLibrary } from "../../processLibrary/active";
import {
  buildProcessDefinitionSystemPrompt,
  buildProcessDefinitionUserPrompt,
} from "./harnessPrompts";
import {
  // Types
  type ProcessDefinitionReport,
  type ToolResultShape,
  type ExternalWorkspaceAssessment,
  type AskUserQuestionToolContext,
  type CompressionConfig,
  type PiSessionOptions,
  type AskUserQuestionRequest,
  type HarnessPromptContext as SessionCreatePromptContext,
  // Constants
  DIM,
  RESET,
  GREEN,
  CYAN,
  PROCESS_LIBRARY_READ_MAX_CHARS,
  PROCESS_LIBRARY_SEARCH_DEFAULT_LIMIT,
  ASK_USER_QUESTION_SCHEMA,
  PI_DEFAULT_PROMPT_TIMEOUT_MS,
  // Functions
  truncateForVerboseLog,
  writeVerboseLine,
  writeVerboseBlock,
  emitProgress,
  formatToolResult,
  askUserQuestionViaTool,
  promptPiWithRetry,
  // Re-exports
  BabysitterRuntimeError,
  ErrorCategory,
  createPiSession,
  PiSessionHandle,
  createReadlineAskUserQuestionUiContext,
  type PiSessionEvent,
} from "./harnessUtils";

// ── Module-level mutable state ───────────────────────────────────────

let processValidationImportNonce = 0;

// ── Dynamic Import ───────────────────────────────────────────────────

const dynamicImportModule: (specifier: string) => Promise<Record<string, unknown>> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<Record<string, unknown>>;
})();

// ── Process File Utilities ───────────────────────────────────────────

export function getProcessOutputDir(workDir: string): string {
  return path.join(workDir, ".a5c", "processes");
}

/** @deprecated Use getProcessOutputDir instead */
export function getGeneratedProcessPath(workDir: string): string {
  return getProcessOutputDir(workDir);
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
    /\b(\.a5c[\\/]processes[\\/][A-Za-z0-9_.-]+\.m?js)\b/g,
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

// ── Process File Polling ─────────────────────────────────────────────

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

// ── SDK Resolvable ───────────────────────────────────────────────────

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

// ── Shell Effect (used by validateProcessExport) ─────────────────────

export function execShellEffect(
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

// ── JavaScript Source Analysis ────────────────────────────────────────

function sanitizeJavaScriptForStructuralChecks(source: string): string {
  const normalized = source.replace(/\r\n/g, "\n");
  let result = "";
  let i = 0;
  let state:
    | "normal"
    | "single"
    | "double"
    | "template"
    | "line-comment"
    | "block-comment" = "normal";
  const templateExpressionBraceStack: number[] = [];

  const mask = (ch: string): string => (ch === "\n" ? "\n" : " ");

  while (i < normalized.length) {
    const ch = normalized[i] ?? "";
    const next = normalized[i + 1] ?? "";

    if (state === "line-comment") {
      result += mask(ch);
      if (ch === "\n") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (state === "block-comment") {
      result += mask(ch);
      if (ch === "*" && next === "/") {
        result += " ";
        i += 2;
        state = "normal";
        continue;
      }
      i += 1;
      continue;
    }

    if (state === "single") {
      result += mask(ch);
      if (ch === "\\") {
        result += mask(next);
        i += 2;
        continue;
      }
      if (ch === "'") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (state === "double") {
      result += mask(ch);
      if (ch === "\\") {
        result += mask(next);
        i += 2;
        continue;
      }
      if (ch === "\"") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (state === "template") {
      if (ch === "$" && next === "{") {
        result += "${";
        templateExpressionBraceStack.push(0);
        i += 2;
        state = "normal";
        continue;
      }
      result += mask(ch);
      if (ch === "\\") {
        result += mask(next);
        i += 2;
        continue;
      }
      if (ch === "`") {
        state = "normal";
      }
      i += 1;
      continue;
    }

    if (ch === "/" && next === "/") {
      result += "  ";
      i += 2;
      state = "line-comment";
      continue;
    }

    if (ch === "/" && next === "*") {
      result += "  ";
      i += 2;
      state = "block-comment";
      continue;
    }

    if (ch === "'") {
      result += " ";
      i += 1;
      state = "single";
      continue;
    }

    if (ch === "\"") {
      result += " ";
      i += 1;
      state = "double";
      continue;
    }

    if (ch === "`") {
      result += " ";
      i += 1;
      state = "template";
      continue;
    }

    result += ch;

    if (templateExpressionBraceStack.length > 0) {
      const topIndex = templateExpressionBraceStack.length - 1;
      if (ch === "{") {
        templateExpressionBraceStack[topIndex] += 1;
      } else if (ch === "}") {
        if (templateExpressionBraceStack[topIndex] === 0) {
          templateExpressionBraceStack.pop();
          state = "template";
        } else {
          templateExpressionBraceStack[topIndex] -= 1;
        }
      }
    }

    i += 1;
  }

  return result;
}

function hasNamedProcessGlobalReferenceConflict(source: string): boolean {
  const normalized = sanitizeJavaScriptForStructuralChecks(source).replace(/\r\n/g, "\n");
  if (!/export\s+async\s+function\s+process\s*\(/.test(normalized)) {
    return false;
  }
  return /(^|[^.\w$])process\./m.test(normalized);
}

function assumesRuntimeWorkspacePathWithoutModuleFallback(source: string): boolean {
  const normalized = sanitizeJavaScriptForStructuralChecks(source).replace(/\r\n/g, "\n");
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
    .filter((block) => !getTopLevelTaskProperties(block.body).has("kind"))
    .map((block) => block.id);
}

function getDefineTaskKindShapeMismatches(source: string): Array<{ id: string; expectedKind: string }> {
  const mismatches: Array<{ id: string; expectedKind: string }> = [];
  for (const block of getDefineTaskBlocks(source)) {
    const properties = getTopLevelTaskProperties(block.body);
    const kindValue = properties.get("kind")?.trim();
    if (properties.has("agent") && kindValue !== "\"agent\"" && kindValue !== "'agent'" && kindValue !== "`agent`") {
      mismatches.push({ id: block.id, expectedKind: "agent" });
    }
    if (properties.has("shell") && kindValue !== "\"shell\"" && kindValue !== "'shell'" && kindValue !== "`shell`") {
      mismatches.push({ id: block.id, expectedKind: "shell" });
    }
    if (properties.has("node") && kindValue !== "\"node\"" && kindValue !== "'node'" && kindValue !== "`node`") {
      mismatches.push({ id: block.id, expectedKind: "node" });
    }
  }
  return mismatches;
}

function getTopLevelTaskProperties(body: string): Map<string, string> {
  const normalized = body.replace(/\r\n/g, "\n");
  const properties = new Map<string, string>();
  let index = 0;

  while (index < normalized.length) {
    index = skipWhitespaceAndComments(normalized, index);
    if (index >= normalized.length) {
      break;
    }
    if (normalized[index] === ",") {
      index += 1;
      continue;
    }
    if (normalized.startsWith("...", index)) {
      index = scanTopLevelValueEnd(normalized, index + 3);
      continue;
    }

    const key = readTopLevelPropertyKey(normalized, index);
    if (!key) {
      index = scanTopLevelValueEnd(normalized, index);
      if (normalized[index] === ",") {
        index += 1;
      }
      continue;
    }

    index = key.nextIndex;
    index = skipWhitespaceAndComments(normalized, index);
    if (normalized[index] !== ":") {
      index = scanTopLevelValueEnd(normalized, index);
      if (normalized[index] === ",") {
        index += 1;
      }
      continue;
    }

    const valueStart = index + 1;
    const valueEnd = scanTopLevelValueEnd(normalized, valueStart);
    properties.set(key.name, normalized.slice(valueStart, valueEnd).trim());
    index = valueEnd;
    if (normalized[index] === ",") {
      index += 1;
    }
  }

  return properties;
}

function readTopLevelPropertyKey(
  source: string,
  index: number,
): { name: string; nextIndex: number } | null {
  const ch = source[index] ?? "";
  if (/[A-Za-z_$]/.test(ch)) {
    let nextIndex = index + 1;
    while (/[\w$]/.test(source[nextIndex] ?? "")) {
      nextIndex += 1;
    }
    return {
      name: source.slice(index, nextIndex),
      nextIndex,
    };
  }

  if (ch === "\"" || ch === "'" || ch === "`") {
    let nextIndex = index + 1;
    let name = "";
    while (nextIndex < source.length) {
      const current = source[nextIndex] ?? "";
      if (current === "\\") {
        name += current;
        nextIndex += 1;
        if (nextIndex < source.length) {
          name += source[nextIndex] ?? "";
          nextIndex += 1;
        }
        continue;
      }
      if (current === ch) {
        return { name, nextIndex: nextIndex + 1 };
      }
      name += current;
      nextIndex += 1;
    }
  }

  return null;
}

function skipWhitespaceAndComments(source: string, start: number): number {
  let index = start;
  while (index < source.length) {
    const ch = source[index] ?? "";
    const next = source[index + 1] ?? "";
    if (/\s/.test(ch)) {
      index += 1;
      continue;
    }
    if (ch === "/" && next === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index = Math.min(index + 2, source.length);
      continue;
    }
    break;
  }
  return index;
}

function scanTopLevelValueEnd(source: string, start: number): number {
  let index = start;
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let state:
    | "normal"
    | "single"
    | "double"
    | "template"
    | "line-comment"
    | "block-comment" = "normal";
  const templateExpressionBraceStack: number[] = [];

  while (index < source.length) {
    const ch = source[index] ?? "";
    const next = source[index + 1] ?? "";

    if (state === "line-comment") {
      if (ch === "\n") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (state === "block-comment") {
      if (ch === "*" && next === "/") {
        index += 2;
        state = "normal";
        continue;
      }
      index += 1;
      continue;
    }

    if (state === "single") {
      if (ch === "\\") {
        index += 2;
        continue;
      }
      if (ch === "'") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (state === "double") {
      if (ch === "\\") {
        index += 2;
        continue;
      }
      if (ch === "\"") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (state === "template") {
      if (ch === "\\") {
        index += 2;
        continue;
      }
      if (ch === "$" && next === "{") {
        templateExpressionBraceStack.push(0);
        index += 2;
        state = "normal";
        continue;
      }
      if (ch === "`") {
        state = "normal";
      }
      index += 1;
      continue;
    }

    if (ch === "/" && next === "/") {
      index += 2;
      state = "line-comment";
      continue;
    }
    if (ch === "/" && next === "*") {
      index += 2;
      state = "block-comment";
      continue;
    }
    if (ch === "'") {
      index += 1;
      state = "single";
      continue;
    }
    if (ch === "\"") {
      index += 1;
      state = "double";
      continue;
    }
    if (ch === "`") {
      index += 1;
      state = "template";
      continue;
    }

    if (ch === "," && depthParen === 0 && depthBracket === 0 && depthBrace === 0 && templateExpressionBraceStack.length === 0) {
      return index;
    }

    if (ch === "(") {
      depthParen += 1;
    } else if (ch === ")") {
      depthParen = Math.max(0, depthParen - 1);
    } else if (ch === "[") {
      depthBracket += 1;
    } else if (ch === "]") {
      depthBracket = Math.max(0, depthBracket - 1);
    } else if (ch === "{") {
      depthBrace += 1;
      if (templateExpressionBraceStack.length > 0) {
        templateExpressionBraceStack[templateExpressionBraceStack.length - 1] += 1;
      }
    } else if (ch === "}") {
      if (templateExpressionBraceStack.length > 0) {
        const templateDepthIndex = templateExpressionBraceStack.length - 1;
        if (templateExpressionBraceStack[templateDepthIndex] === 0) {
          templateExpressionBraceStack.pop();
          state = "template";
          index += 1;
          continue;
        }
        templateExpressionBraceStack[templateDepthIndex] -= 1;
        depthBrace = Math.max(0, depthBrace - 1);
      } else {
        depthBrace = Math.max(0, depthBrace - 1);
      }
    }

    index += 1;
  }

  return index;
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

function hasCtxTaskInvocation(source: string): boolean {
  return /\bctx\.task\s*\(/.test(source.replace(/\r\n/g, "\n"));
}

function getUnresolvedTemplatePlaceholders(source: string): string[] {
  const normalized = source.replace(/\r\n/g, "\n");
  const matches = normalized.match(/\{\{\s*[A-Za-z_$][\w$.]*\s*\}\}/g) ?? [];
  const unique = new Set<string>();
  for (const match of matches) {
    unique.add(match.replace(/\s+/g, ""));
  }
  return Array.from(unique).slice(0, 8);
}

function getDefineTaskIdsByKind(source: string, kind: "agent" | "shell" | "node"): string[] {
  return getDefineTaskBlocks(source)
    .filter((block) => {
      const kindValue = getTopLevelTaskProperties(block.body).get("kind")?.trim();
      return kindValue === `"${kind}"` || kindValue === `'${kind}'` || kindValue === `\`${kind}\``;
    })
    .map((block) => block.id);
}

// ── Process Validation ───────────────────────────────────────────────

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
  const unresolvedPlaceholders = getUnresolvedTemplatePlaceholders(source);
  if (unresolvedPlaceholders.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} contains unresolved template placeholders: ${unresolvedPlaceholders.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Do not leave {{workspaceDir}}, {{gameRequest}}, or similar template placeholders in task prompts, shell commands, or node args",
          "Build concrete prompt text and shell commands from defineTask(args, taskCtx) inputs when returning each TaskDef",
          "If a task needs workspaceDir or request text, interpolate the actual args value into the returned TaskDef before runtime",
        ],
      },
    );
  }
  await ensureSdkResolvable(path.dirname(path.resolve(filePath)));
  const moduleUrl = `${pathToFileURL(path.resolve(filePath)).href}?t=${Date.now()}-${++processValidationImportNonce}`;
  resetGlobalTaskRegistry();
  let mod: Record<string, unknown>;
  try {
    mod = await dynamicImportModule(moduleUrl);
  } finally {
    resetGlobalTaskRegistry();
  }
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
  const defineTaskBlocks = getDefineTaskBlocks(source);
  if (defineTaskBlocks.length === 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} does not define any babysitter tasks via defineTask(...)`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Create at least one task with const taskName = defineTask(\"task-id\", (args, taskCtx) => ({ ... }))",
          "Move the main implementation and verification work into those tasks instead of doing it directly in process(inputs, ctx)",
          "Have process(inputs, ctx) orchestrate the work by awaiting ctx.task(taskName, args)",
        ],
      },
    );
  }
  if (!hasCtxTaskInvocation(source)) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} does not invoke any babysitter tasks through ctx.task(...)`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "After defining tasks with defineTask(...), run them from process(inputs, ctx) via await ctx.task(taskName, args)",
          "Do not perform the main implementation directly in process(inputs, ctx)",
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
          "Use kind: \"agent\" with agent: { ... }, kind: \"shell\" with shell: { command: ... }, or another supported effect kind that the agent will execute and post manually",
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
          "Agent tasks must use kind: \"agent\" and shell tasks must use kind: \"shell\". Do not generate node task definitions in authored processes",
        ],
      },
    );
  }
  const agentTaskIds = getDefineTaskIdsByKind(source, "agent");
  if (agentTaskIds.length === 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} does not define any agent tasks`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Define at least one agent task with kind: \"agent\" for the main planning, implementation, or refinement work",
          "Use shell tasks only for concrete runnable commands such as tests, builds, package installs, or linters",
        ],
      },
    );
  }
  const nodeTaskIds = getDefineTaskIdsByKind(source, "node");
  if (nodeTaskIds.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} defines forbidden node tasks: ${nodeTaskIds.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Replace each node task with an agent or skill task",
          "If the work is a concrete existing CLI command, use a shell task and have the orchestrating agent execute it and post the result",
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
}

// ── Process Library ──────────────────────────────────────────────────

type ProcessLibraryToolScope = "binding" | "clone" | "reference";

function isPathWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function resolvePhase1ProcessLibraryRoot(
  scope: ProcessLibraryToolScope = "binding",
): Promise<{
  scope: ProcessLibraryToolScope;
  root: string;
  active: Awaited<ReturnType<typeof ensureActiveProcessLibrary>>;
}> {
  const active = await ensureActiveProcessLibrary();
  const bindingRoot = active.binding?.dir;
  if (!bindingRoot) {
    throw new BabysitterRuntimeError(
      "ProcessLibraryNotResolved",
      "No active process library binding is available.",
      { category: ErrorCategory.Runtime },
    );
  }

  const root =
    scope === "clone"
      ? active.defaultSpec.cloneDir
      : scope === "reference"
        ? active.defaultSpec.referenceRoot
        : bindingRoot;

  return {
    scope,
    root,
    active,
  };
}

function parseRipgrepMatchLine(
  line: string,
  root: string,
): { path: string; line: number; excerpt: string } | null {
  const match = line.match(/^(.*):([0-9]+):(.*)$/);
  if (!match) {
    return null;
  }
  const absolutePath = path.resolve(match[1] ?? "");
  if (!isPathWithinRoot(root, absolutePath)) {
    return null;
  }
  return {
    path: path.relative(root, absolutePath) || path.basename(absolutePath),
    line: Number(match[2] ?? "0"),
    excerpt: (match[3] ?? "").trim(),
  };
}

async function searchProcessLibrary(
  query: string,
  scope: ProcessLibraryToolScope = "binding",
  limit = PROCESS_LIBRARY_SEARCH_DEFAULT_LIMIT,
): Promise<{
  scope: ProcessLibraryToolScope;
  root: string;
  query: string;
  matches: Array<{
    kind: "content" | "path";
    path: string;
    line?: number;
    excerpt?: string;
  }>;
}> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    throw new BabysitterRuntimeError(
      "ProcessLibrarySearchQueryMissing",
      "Process-library search query must not be empty.",
      { category: ErrorCategory.Validation },
    );
  }

  const normalizedLimit = Math.max(1, Math.min(limit, 40));
  const { root } = await resolvePhase1ProcessLibraryRoot(scope);
  const matches: Array<{
    kind: "content" | "path";
    path: string;
    line?: number;
    excerpt?: string;
  }> = [];
  const seen = new Set<string>();

  const contentResult = await execShellEffect(
    "rg",
    [
      "-n",
      "--no-heading",
      "--color",
      "never",
      "--max-count",
      "2",
      "--max-filesize",
      "256K",
      "-S",
      trimmedQuery,
      root,
    ],
    root,
  );
  if (contentResult.exitCode === 0 || contentResult.exitCode === 1) {
    for (const line of contentResult.stdout.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }
      const parsed = parseRipgrepMatchLine(line, root);
      if (!parsed) {
        continue;
      }
      const key = `content:${parsed.path}:${parsed.line}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      matches.push({
        kind: "content",
        path: parsed.path,
        line: parsed.line,
        excerpt: parsed.excerpt,
      });
      if (matches.length >= normalizedLimit) {
        break;
      }
    }
  }

  if (matches.length < normalizedLimit) {
    const filesResult = await execShellEffect("rg", ["--files", root], root);
    if (filesResult.exitCode === 0 || filesResult.exitCode === 1) {
      const loweredQuery = trimmedQuery.toLowerCase();
      for (const entry of filesResult.stdout.split(/\r?\n/)) {
        const relativePath = entry.trim();
        if (!relativePath) {
          continue;
        }
        if (!relativePath.toLowerCase().includes(loweredQuery)) {
          continue;
        }
        const key = `path:${relativePath}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        matches.push({
          kind: "path",
          path: relativePath,
        });
        if (matches.length >= normalizedLimit) {
          break;
        }
      }
    }
  }

  return {
    scope,
    root,
    query: trimmedQuery,
    matches,
  };
}

async function readProcessLibraryFile(
  relativePath: string,
  scope: ProcessLibraryToolScope = "binding",
): Promise<{
  scope: ProcessLibraryToolScope;
  root: string;
  relativePath: string;
  absolutePath: string;
  content: string;
  truncated: boolean;
}> {
  const trimmedPath = relativePath.trim();
  if (!trimmedPath) {
    throw new BabysitterRuntimeError(
      "ProcessLibraryReadPathMissing",
      "Process-library file path must not be empty.",
      { category: ErrorCategory.Validation },
    );
  }

  const { root } = await resolvePhase1ProcessLibraryRoot(scope);
  const absolutePath = path.resolve(root, trimmedPath);
  if (!isPathWithinRoot(root, absolutePath)) {
    throw new BabysitterRuntimeError(
      "ProcessLibraryReadPathOutsideRoot",
      `Process-library file must stay under ${root}.`,
      { category: ErrorCategory.Validation },
    );
  }

  const content = await fs.readFile(absolutePath, "utf8");
  return {
    scope,
    root,
    relativePath: trimmedPath,
    absolutePath,
    content: content.slice(0, PROCESS_LIBRARY_READ_MAX_CHARS),
    truncated: content.length > PROCESS_LIBRARY_READ_MAX_CHARS,
  };
}

// ── Agent Prompt Building ────────────────────────────────────────────

export function buildAgentPrompt(taskDef: Record<string, unknown>): string {
  const agent = taskDef.agent as Record<string, unknown> | undefined;
  if (!agent) return (taskDef.title as string) ?? "Execute task";
  const structuredOutputInstructions = buildStructuredAgentOutputInstructions(agent);
  const rawPrompt = agent.prompt;
  if (typeof rawPrompt === "string" && rawPrompt.trim()) {
    return [
      "You are an autonomous agent. PERFORM the task below using your available tools.",
      "Do not just describe what you would do. Execute the work and then summarize what you changed.",
      ...structuredOutputInstructions,
      "",
      "Task:",
      rawPrompt.trim(),
    ].join("\n");
  }
  if (Array.isArray(rawPrompt) && rawPrompt.length > 0) {
    const lines = rawPrompt
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .map((entry) => entry.trim());
    if (lines.length > 0) {
      return [
        "You are an autonomous agent. PERFORM the task below using your available tools.",
        "Do not just describe what you would do. Execute the work and then summarize what you changed.",
        ...structuredOutputInstructions,
        "",
        "Task:",
        ...lines,
      ].join("\n");
    }
  }

  const prompt = rawPrompt as Record<string, unknown> | undefined;
  if (!prompt || typeof prompt !== "object") return (taskDef.title as string) ?? "Execute task";

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
  if (structuredOutputInstructions.length > 0) {
    parts.push(`\n${structuredOutputInstructions.join("\n")}`);
  }
  return parts.join("\n");
}

export function buildStructuredAgentOutputInstructions(agent: Record<string, unknown>): string[] {
  const outputSchema = agent.outputSchema;
  if (!outputSchema || typeof outputSchema !== "object") {
    return [];
  }
  return [
    "Return ONLY a JSON object that matches the declared output schema.",
    "Do not wrap the JSON in markdown fences, and do not prepend or append prose.",
    `Output schema: ${JSON.stringify(outputSchema, null, 2)}`,
  ];
}

export function extractJsonObjectFromText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return trimmed;
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

export function coerceAgentResultValue(taskDef: Record<string, unknown>, output: string): unknown {
  const agent = taskDef.agent as Record<string, unknown> | undefined;
  if (!agent?.outputSchema || typeof agent.outputSchema !== "object") {
    return output;
  }
  const candidate = extractJsonObjectFromText(output);
  if (!candidate) {
    throw new BabysitterRuntimeError(
      "AgentOutputSchemaMismatch",
      "Agent task declared outputSchema but did not return JSON output",
      { category: ErrorCategory.External },
    );
  }
  try {
    return JSON.parse(candidate) as unknown;
  } catch (error: unknown) {
    throw new BabysitterRuntimeError(
      "AgentOutputSchemaMismatch",
      error instanceof Error
        ? `Agent task declared outputSchema but returned invalid JSON: ${error.message}`
        : "Agent task declared outputSchema but returned invalid JSON",
      { category: ErrorCategory.External },
    );
  }
}

// ── Process Recovery ─────────────────────────────────────────────────

async function recoverProcessDefinitionFromOutputs(args: {
  outputDir: string;
  workspace?: string;
  outputs: string[];
}): Promise<ProcessDefinitionReport | null> {
  const resolvedDir = path.resolve(args.outputDir);

  // Check if any .js/.mjs files already exist in the output directory
  try {
    const entries = await fs.readdir(resolvedDir);
    const processFiles = entries.filter((e) => /\.m?js$/.test(e));
    if (processFiles.length > 0) {
      const candidatePath = path.join(resolvedDir, processFiles[0]);
      return {
        processPath: candidatePath,
        summary: "Recovered from missing process-definition tool report by scanning the output directory.",
      };
    }
  } catch {
    // directory may not exist yet
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
    const recoveredName = `recovered-process-${Date.now()}.mjs`;
    const recoveredPath = path.join(resolvedDir, recoveredName);
    await fs.mkdir(resolvedDir, { recursive: true });
    await fs.writeFile(recoveredPath, extracted, "utf8");
    return {
      processPath: recoveredPath,
      summary: "Recovered process-definition output by writing a JavaScript code block returned by the agent.",
    };
  }

  for (const output of args.outputs) {
    if (!looksLikeProcessDefinitionSource(output)) {
      continue;
    }
    const recoveredName = `recovered-process-${Date.now()}.mjs`;
    const recoveredPath = path.join(resolvedDir, recoveredName);
    await fs.mkdir(resolvedDir, { recursive: true });
    await fs.writeFile(recoveredPath, output.trim(), "utf8");
    return {
      processPath: recoveredPath,
      summary: "Recovered process-definition output by writing the agent's direct JavaScript response.",
    };
  }

  return null;
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
  outputDir: string;
  workspace?: string;
  outputs: string[];
  verbose: boolean;
  json: boolean;
}): Promise<ProcessDefinitionReport | undefined> {
  if (args.state.report?.processPath) {
    return args.state.report;
  }

  const recovered = await recoverProcessDefinitionFromOutputs({
    outputDir: args.outputDir,
    workspace: args.workspace,
    outputs: args.outputs,
  });
  if (recovered) {
    args.state.report = recovered;
    writeVerboseBlock(args.verbose, args.json, "phase1 recovered report", recovered);
  }
  return recovered ?? undefined;
}

function writeVerboseProcessDefinitionRecovery(json: boolean): void {
  if (!json) {
    process.stderr.write(`${DIM}Phase 1 recovery: the agent did not report the process file, retrying with an explicit write-and-report instruction...${RESET}\n`);
  }
}

// ── External Process Definition Prompts ──────────────────────────────

export function buildExternalProcessDefinitionPrompt(args: {
  prompt: string;
  outputDir: string;
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
    "You are running babysitter harness:create-run phase 1 on an external CLI harness in non-interactive mode.",
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
    "- Use `shell` tasks only for existing CLI tools such as tests, builds, linters, git, or package managers.",
    "- Never use `node` kind effects.",
    "- At least one defined task must be an `agent` task for the main work. Shell tasks are for concrete runnable commands only.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; never pass plain object task definitions or ad-hoc task objects.",
    "- Include quality gates and verification/refinement steps that fit the request.",
    "- For this request, a good default is a process that plans the game scope, scaffolds the project, implements the game loop and UI, and verifies the result with runnable checks.",
    "- Keep the module syntactically valid ESM. If you embed HTML/CSS/JS asset contents inside the process source, avoid raw nested template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- Default every task to the internal PI worker. If task-level harness routing is needed, only use `task.metadata.harness` for explicit overrides to installed harness names from this list: "
      + `${installedHarnessList}.`,
    args.promptContext.selectedHarnessName
      ? `- The selected orchestration harness for the session will be ${args.promptContext.selectedHarnessName}; keep ` + "`task.metadata.harness`" + " unset for default internal execution and only encode it when a task must explicitly override that default."
      : "- No orchestration harness has been preselected; keep harness routing explicit only where it materially matters.",
    "- Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction` for ordinary internal PI work. Leave them unset unless the task truly requires stronger guardrails or long-running compaction.",
    "- External harnesses do not provide PI sandbox guardrails for their own tool execution. Keep security-sensitive shell work on the internal PI worker by using shell effects without routing them to an external harness.",
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

export function buildExternalProcessConformancePrompt(args: {
  outputPath: string; // full path to the actual written process file
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
    "- The module must orchestrate real work through defined tasks instead of doing the main implementation directly in `process(inputs, ctx)`.",
    "- Define at least one `agent` task for the main work. Use shell tasks only for concrete runnable commands.",
    "- Every task returned from `defineTask(...)` must include a top-level `kind` field.",
    "- Any task passed to `ctx.task(...)` must be a DefinedTask created via `defineTask(...)`; do not pass plain object task definitions or ad-hoc task objects.",
    "- The rewritten module must be syntactically valid ESM and pass `node --check`.",
    "- If the process writes HTML/CSS/JS assets, do not embed raw nested template literals inside outer template literals; prefer arrays joined with \"\\n\", String.raw, or escaped inner backticks and \\${...} sequences.",
    "- Inside the named `process(inputs, ctx)` export, do not reference Node's global process object as `process.*`; use `globalThis.process` or an imported alias like `nodeProcess` instead.",
    "- If the process needs the workspace root, do not assume `ctx.workspaceDir` or `ctx.cwd` exists. Resolve it from the module location using `import.meta.url`, for example with `path.dirname(fileURLToPath(import.meta.url))`.",
    "- Agent tasks must use `kind: \"agent\"` with `agent: { name, prompt, outputSchema }`.",
    "- Shell tasks must use `kind: \"shell\"` with `shell: { command: \"...\" }`.",
    "- Do not introduce `kind: \"node\"` task definitions in generated or repaired processes. If logic would have been a node task, convert it to an `agent` or `skill` task instead.",
    "- The exported `process(inputs, ctx)` function must call tasks with `await ctx.task(definedTask, args)`.",
    "- Use `babysitter_write_process_definition` with the `filename` parameter to rewrite the process file in the output directory.",
    "- After rewriting the file, call `babysitter_report_process_definition` exactly once with the same path.",
    "- Do not answer with plain text only.",
  ].join("\n");
}

// ── Workspace Assessment ─────────────────────────────────────────────

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

// ── External Process Definition Phase ────────────────────────────────

async function _runExternalProcessDefinitionPhase(args: {
  prompt: string;
  outputDir: string;
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
    `[phase1 setup] workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} outputDir=${path.resolve(args.outputDir)} harness=${args.selectedHarnessName}`,
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
      outputDir: args.outputDir,
      workspace: args.workspace,
      promptContext: args.promptContext,
      workspaceAssessment,
    }),
    900_000,
  );

  let report = await recoverProcessDefinitionFromOutputs({
    outputDir: args.outputDir,
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
        `Write the full process file now to the output directory ${args.outputDir}.`,
        "Choose a descriptive kebab-case filename (e.g. recovered-process.mjs).",
        "Do not describe the plan only; materialize the file in the workspace.",
        "After writing it, return either a concise summary or the full file in a ```javascript fenced block.",
      ].join("\n"),
      300_000,
    );
    report = await recoverProcessDefinitionFromOutputs({
      outputDir: args.outputDir,
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
        `Final recovery step: write the complete JavaScript process file to the output directory ${args.outputDir}.`,
        "Return the full file in a ```javascript fenced block after it exists on disk.",
        "Do not omit the file write.",
      ].join("\n"),
      300_000,
    );
    report = await recoverProcessDefinitionFromOutputs({
      outputDir: args.outputDir,
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

// ── Main Phase 1 Entry Point ─────────────────────────────────────────

export async function runProcessDefinitionPhase(args: {
  prompt: string;
  outputDir: string;
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
  const interactiveUiContext = args.interactive && args.rl
    ? createReadlineAskUserQuestionUiContext(args.rl)
    : undefined;
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
      description: "Write the final JavaScript process file to the process output directory with a descriptive filename.",
      parameters: Type.Object({
        source: Type.String(),
        filename: Type.String(),
      }),
      execute: async (
        _toolCallId: string,
        params: { source: string; filename: string },
      ): Promise<ToolResultShape> => {
        const filename = params.filename;
        if (!/\.m?js$/.test(filename)) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionInvalidFilename",
            `Filename must end in .js or .mjs, got: ${filename}`,
            { category: ErrorCategory.Validation },
          );
        }
        if (/[/\\]/.test(filename) || filename.includes("..")) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionInvalidFilename",
            `Filename must be a simple name without path separators or '..', got: ${filename}`,
            { category: ErrorCategory.Validation },
          );
        }
        const resolvedDir = path.resolve(args.outputDir);
        const resolvedPath = path.join(resolvedDir, filename);

        const normalizedSource = normalizeProcessDefinitionSource(params.source);
        writeVerboseData("phase1 tool babysitter_write_process_definition", {
          processPath: resolvedPath,
          sourcePreview: truncateForVerboseLog(normalizedSource, 600),
        });
        await fs.mkdir(resolvedDir, { recursive: true });
        await fs.writeFile(resolvedPath, normalizedSource, "utf8");
        return formatToolResult(
          { processPath: resolvedPath },
          "Process definition written.",
        );
      },
    },
    {
      name: "babysitter_resolve_process_library",
      label: "Resolve Process Library",
      description:
        "Resolve the active shared process-library binding, bootstrapping it if needed, and return the active roots that phase 1 must inspect.",
      parameters: Type.Object({}),
      execute: async (): Promise<ToolResultShape> => {
        const active = await ensureActiveProcessLibrary();
        writeVerboseData("phase1 tool babysitter_resolve_process_library", active, 1200);
        return formatToolResult(
          active,
          "Active shared process library resolved.",
        );
      },
    },
    {
      name: "babysitter_search_process_library",
      label: "Search Process Library",
      description:
        "Search the active shared process library by content and path before authoring a process.",
      parameters: Type.Object({
        query: Type.String(),
        scope: Type.Optional(Type.Union([
          Type.Literal("binding"),
          Type.Literal("clone"),
          Type.Literal("reference"),
        ])),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 40 })),
      }),
      execute: async (
        _toolCallId: string,
        params: {
          query: string;
          scope?: ProcessLibraryToolScope;
          limit?: number;
        },
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase1 tool babysitter_search_process_library request", params);
        const result = await searchProcessLibrary(
          params.query,
          params.scope ?? "binding",
          params.limit,
        );
        writeVerboseData("phase1 tool babysitter_search_process_library result", result, 2000);
        return formatToolResult(
          result,
          "Process-library search completed.",
        );
      },
    },
    {
      name: "babysitter_read_process_library_file",
      label: "Read Process Library File",
      description:
        "Read a specific file from the active shared process library after you identify it via search.",
      parameters: Type.Object({
        relativePath: Type.String(),
        scope: Type.Optional(Type.Union([
          Type.Literal("binding"),
          Type.Literal("clone"),
          Type.Literal("reference"),
        ])),
      }),
      execute: async (
        _toolCallId: string,
        params: {
          relativePath: string;
          scope?: ProcessLibraryToolScope;
        },
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase1 tool babysitter_read_process_library_file request", params);
        const result = await readProcessLibraryFile(
          params.relativePath,
          params.scope ?? "binding",
        );
        writeVerboseData(
          "phase1 tool babysitter_read_process_library_file result",
          {
            ...result,
            contentPreview: truncateForVerboseLog(result.content, 1200),
          },
          2000,
        );
        return formatToolResult(
          result,
          "Process-library file read completed.",
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
        _signal?: AbortSignal,
        _onUpdate?: unknown,
        toolContext?: AskUserQuestionToolContext,
      ): Promise<ToolResultShape> => {
        writeVerboseData("phase1 tool AskUserQuestion request", params);
        const response = await askUserQuestionViaTool(
          params,
          args.interactive,
          args.rl,
          toolContext,
        );
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

  const agenticTools = createAgenticToolDefinitions({
    workspace: args.workspace ?? process.cwd(),
    interactive: args.interactive ?? false,
    askUserQuestionHandler: async (params: unknown) => {
      return askUserQuestionViaTool(
        params as AskUserQuestionRequest,
        args.interactive,
        args.rl,
        undefined,
      );
    },
  });
  const mergedCustomTools: unknown[] = [...customTools, ...agenticTools];

  emitProgress(
    { phase: "1", status: "started", harness: "internal (agentic)" },
    args.json,
    args.verbose,
  );

  writeVerbose(
    `[phase1 setup] workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} outputDir=${path.resolve(args.outputDir)}`,
  );
  writeVerboseData(
    "phase1 tools",
    (mergedCustomTools as Array<{ name?: string; label?: string }>).map((tool) => ({
      name: tool.name,
      label: tool.label,
    })),
  );
  const workspaceAssessment = await assessWorkspaceForExternalAuthoring(args.workspace);
  writeVerboseData("phase1 workspace assessment", workspaceAssessment);

  const processDefinitionSystemPrompt = await buildProcessDefinitionSystemPrompt(
    args.outputDir,
    args.promptContext,
    args.interactive,
  );
  const initialMetaPrompt = buildProcessDefinitionUserPrompt(
    args.prompt,
    args.outputDir,
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
      : "coding";

  session = createPiSession({
    workspace: args.workspace,
    model: args.model,
    thinkingLevel: "low",
    toolsMode: phase1ToolsMode,
    customTools: mergedCustomTools,
    uiContext: interactiveUiContext,
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

    const result = await promptPiWithRetry({
      session,
      message: initialMetaPrompt,
      timeout: PI_DEFAULT_PROMPT_TIMEOUT_MS,
      label: "phase1 initial",
      writeVerbose,
      writeVerboseData,
    }).catch((err: unknown) => {
      const isTimeout =
        err instanceof BabysitterRuntimeError &&
        (err.name === "PiTimeoutError" || (err.message ?? "").includes("timed out"));
      if (isTimeout) {
        writeVerbose("[phase1] Pi prompt timed out, converting to failure result");
        return { success: false as const, output: `Pi prompt timed out: ${err instanceof Error ? err.message : String(err)}` };
      }
      throw err;
    });
    phaseOutputs.push(result.output);

    if (unsubscribe) unsubscribe();
    if (!args.json) process.stderr.write("\n");

    if (!result.success) {
      writeVerboseData("phase1 agent failure output", result.output);
      const recovered = await recoverReportedProcessDefinition({
        state,
        outputDir: args.outputDir,
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
        `- Write the process file now to the output directory ${args.outputDir} using babysitter_write_process_definition with a descriptive filename.`,
        "- Then call babysitter_report_process_definition exactly once.",
        "- Do not just describe the process in plain text.",
      ].join("\n");
      writeVerboseData("phase1 recovery prompt", recoveryPrompt);
      const recovery = await promptPiWithRetry({
        session,
        message: recoveryPrompt,
        timeout: 180_000,
        label: "phase1 recovery",
        writeVerbose,
        writeVerboseData,
      }).catch((err: unknown) => {
        const isTimeout =
          err instanceof BabysitterRuntimeError &&
          (err.name === "PiTimeoutError" || (err.message ?? "").includes("timed out"));
        if (isTimeout) {
          writeVerbose("[phase1 recovery] Pi prompt timed out, converting to failure result");
          return { success: false as const, output: `Pi prompt timed out: ${err instanceof Error ? err.message : String(err)}` };
        }
        throw err;
      });
      phaseOutputs.push(recovery.output);
      if (!recovery.success) {
        writeVerboseData("phase1 recovery failure output", recovery.output);
        const recovered = await recoverReportedProcessDefinition({
          state,
          outputDir: args.outputDir,
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
        outputDir: args.outputDir,
        workspace: args.workspace,
        outputs: phaseOutputs,
        verbose: args.verbose,
        json: args.json,
      });
    }

    if (!state.report?.processPath) {
      const finalRecoveryPrompt = [
        "Final recovery step:",
        `- Write the process file to the output directory ${args.outputDir} using babysitter_write_process_definition with a descriptive filename.`,
        "- If you already wrote it, do not rewrite unnecessarily.",
        "- Call babysitter_report_process_definition exactly once after the file exists.",
        "- Do not answer with plain text only.",
        "- If helpful, return the full JavaScript in a ```javascript fenced block, but the file must still be written and reported.",
      ].join("\n");
      writeVerboseData("phase1 final recovery prompt", finalRecoveryPrompt);
      const finalRecovery = await promptPiWithRetry({
        session,
        message: finalRecoveryPrompt,
        timeout: 180_000,
        label: "phase1 final recovery",
        writeVerbose,
        writeVerboseData,
      }).catch((err: unknown) => {
        const isTimeout =
          err instanceof BabysitterRuntimeError &&
          (err.name === "PiTimeoutError" || (err.message ?? "").includes("timed out"));
        if (isTimeout) {
          writeVerbose("[phase1 final recovery] Pi prompt timed out, converting to failure result");
          return { success: false as const, output: `Pi prompt timed out: ${err instanceof Error ? err.message : String(err)}` };
        }
        throw err;
      });
      phaseOutputs.push(finalRecovery.output);
      if (!finalRecovery.success) {
        writeVerboseData("phase1 final recovery failure output", finalRecovery.output);
        const recovered = await recoverReportedProcessDefinition({
          state,
          outputDir: args.outputDir,
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
        outputDir: args.outputDir,
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
        const repair = await promptPiWithRetry({
          session,
          message: conformancePrompt,
          timeout: 180_000,
          label: "phase1 conformance repair",
          writeVerbose,
          writeVerboseData,
        }).catch((err: unknown) => {
          const isTimeout =
            err instanceof BabysitterRuntimeError &&
            (err.name === "PiTimeoutError" || (err.message ?? "").includes("timed out"));
          if (isTimeout) {
            writeVerbose("[phase1 conformance repair] Pi prompt timed out, converting to failure result");
            return { success: false as const, output: `Pi prompt timed out: ${err instanceof Error ? err.message : String(err)}` };
          }
          throw err;
        });
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
        harness: "internal (agentic)",
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
        harness: "internal (agentic)",
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
