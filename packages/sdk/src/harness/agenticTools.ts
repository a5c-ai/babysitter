/**
 * Reusable agentic tool definitions for Pi sessions.
 *
 * Provides a factory that builds a standard set of 16 tools (file ops,
 * execution, browser/web, user interaction, utilities) that can be
 * injected into any Pi session via `PiSessionOptions.customTools`.
 *
 * All tools return `{ content: Array<{ type: "text", text: string }> }`.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as childProcess from "node:child_process";
import { Type, type TObject } from "@sinclair/typebox";
import { getConfig, DEFAULTS, CONFIG_ENV_VARS, type BabysitterConfig } from "../config/defaults";
import { BackgroundProcessRegistry } from "./backgroundProcessRegistry";
import { DeferredToolRegistry } from "./deferredToolRegistry";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Shape of a single custom tool definition (matches Pi customTools). */
export interface CustomToolDefinition {
  name: string;
  label: string;
  description: string;
  promptSnippet?: string;
  parameters: TObject;
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: unknown,
    toolContext?: unknown,
  ) => Promise<ToolResult> | ToolResult;
}

/** Options for configuring the agentic tool set. */
export interface AgenticToolOptions {
  /** Root workspace directory — all file paths are resolved relative to this. */
  workspace: string;
  /** Whether the session is interactive (enables ask tool). */
  interactive: boolean;
  /** Handler for the ask tool — delegates to the host's question UI. */
  askUserQuestionHandler?: (...args: unknown[]) => Promise<unknown>;
  /** Optional callback fired before each tool execution. */
  onToolUse?: (toolName: string, params: unknown) => void;
  /** Callback fired when a background process completes. */
  onBackgroundComplete?: (event: unknown) => void;
  /** Maximum concurrent background processes (default 16). */
  maxBackgroundProcesses?: number;
  /** Optional deferred tool registry for tool_search/tool_fetch (GAP-TOOLS-034). */
  deferredToolRegistry?: DeferredToolRegistry;
}

/** Standard tool result shape. */
interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Names of all agentic tools produced by `createAgenticToolDefinitions`. */
export const AGENTIC_TOOL_NAMES: string[] = [
  "read",
  "write",
  "edit",
  "grep",
  "find",
  "bash",
  "python",
  "ssh",
  "browser",
  "fetch",
  "ask",
  "calc",
  "ast_grep",
  "ast_edit",
  "render_mermaid",
  "notebook",
  "config",
  "background_status",
  "background_list",
  "tool_search",
  "tool_fetch",
  "web_search",
  "fetch_process",
];

const DEFAULT_BASH_TIMEOUT = 120_000;
/** Maximum bytes to collect from a child process's stdout/stderr before truncating. */
const MAX_SPAWN_OUTPUT_BYTES = 50 * 1024 * 1024; // 50 MiB
const DEFAULT_SEARCH_TIMEOUT = 30_000;
const MAX_READ_LINES = 10_000;

// ---------------------------------------------------------------------------
// Run-scoped config state (GAP-TOOLS-033)
// ---------------------------------------------------------------------------

/** Extended config keys beyond BabysitterConfig. */
const EXTENDED_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "model",
  "provider",
  "breakpoint.autoApproveAfterN",
  "breakpoint.presentAlwaysApprove",
]);

/** All valid top-level BabysitterConfig key names. */
const BABYSITTER_CONFIG_KEYS: ReadonlySet<string> = new Set([
  "runsDir",
  "maxIterations",
  "qualityThreshold",
  "timeout",
  "logLevel",
  "allowSecretLogs",
  "hookTimeout",
  "nodeTaskTimeout",
  "clockStepMs",
  "clockStartMs",
  "layoutVersion",
  "largeResultPreviewLimit",
]);

/** Expected types for standard BabysitterConfig keys. */
const CONFIG_KEY_TYPES: Record<string, string> = {
  runsDir: "string",
  maxIterations: "number",
  qualityThreshold: "number",
  timeout: "number",
  logLevel: "string",
  allowSecretLogs: "boolean",
  hookTimeout: "number",
  nodeTaskTimeout: "number",
  clockStepMs: "number",
  clockStartMs: "number",
  layoutVersion: "string",
  largeResultPreviewLimit: "number",
  model: "string",
  provider: "string",
};

/** Valid log level values. */
const VALID_LOG_LEVELS = new Set(["debug", "info", "warn", "error", "silent"]);

/** Map of config key to its BABYSITTER_* env var name (for global scope set). */
const CONFIG_KEY_TO_ENV: Record<string, string> = {
  runsDir: CONFIG_ENV_VARS.RUNS_DIR,
  maxIterations: CONFIG_ENV_VARS.MAX_ITERATIONS,
  qualityThreshold: CONFIG_ENV_VARS.QUALITY_THRESHOLD,
  timeout: CONFIG_ENV_VARS.TIMEOUT,
  logLevel: CONFIG_ENV_VARS.LOG_LEVEL,
  allowSecretLogs: CONFIG_ENV_VARS.ALLOW_SECRET_LOGS,
  hookTimeout: CONFIG_ENV_VARS.HOOK_TIMEOUT,
  nodeTaskTimeout: CONFIG_ENV_VARS.NODE_TASK_TIMEOUT,
};

/** Run-scoped overrides — cleared on reset. */
const _runScopedConfig: Map<string, unknown> = new Map();

/** Reset run-scoped config (exported for test isolation). */
export function resetRunScopedConfig(): void {
  _runScopedConfig.clear();
}

/**
 * Check if a key is a valid config key (standard, extended, compression.*, or breakpoint.*).
 */
function isValidConfigKey(key: string): boolean {
  if (BABYSITTER_CONFIG_KEYS.has(key)) return true;
  if (EXTENDED_CONFIG_KEYS.has(key)) return true;
  if (key.startsWith("compression.")) return true;
  if (key.startsWith("breakpoint.")) return true;
  return false;
}

/**
 * Validate value type for a config key. Returns error message or null if valid.
 */
function validateConfigValue(key: string, value: unknown): string | null {
  const expectedType = CONFIG_KEY_TYPES[key];
  if (expectedType && typeof value !== expectedType) {
    return `Expected '${key}' to be ${expectedType}, got ${typeof value}.`;
  }
  // Specific validation for logLevel
  if (key === "logLevel" && typeof value === "string" && !VALID_LOG_LEVELS.has(value)) {
    return `Invalid logLevel '${value}'. Must be one of: ${[...VALID_LOG_LEVELS].join(", ")}.`;
  }
  // Number keys should be positive
  if (expectedType === "number" && typeof value === "number") {
    if (key !== "clockStartMs" && value <= 0) {
      return `'${key}' must be a positive number.`;
    }
  }
  return null;
}

/**
 * Get a single config value, merging defaults + env + run-scoped.
 */
function getConfigValue(key: string): unknown {
  if (_runScopedConfig.has(key)) return _runScopedConfig.get(key);
  if (BABYSITTER_CONFIG_KEYS.has(key)) {
    const cfg = getConfig();
    return cfg[key as keyof BabysitterConfig];
  }
  return undefined;
}

/**
 * Get the default value for a key.
 */
function getConfigDefault(key: string): unknown {
  if (BABYSITTER_CONFIG_KEYS.has(key)) {
    return DEFAULTS[key as keyof BabysitterConfig];
  }
  return undefined;
}

/**
 * Resolve the ripgrep binary path.
 * Prefers the @vscode/ripgrep package (optionalDependency) so that `rg` is
 * reliably available even on machines without a system-level install.
 * Falls back to the bare `rg` command (relies on PATH).
 */
let _rgPath: string | undefined;
function getRgPath(): string {
  if (_rgPath !== undefined) return _rgPath;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vscodeRg = require("@vscode/ripgrep") as { rgPath: string };
    if (vscodeRg.rgPath && fs.existsSync(vscodeRg.rgPath)) {
      _rgPath = vscodeRg.rgPath;
      return _rgPath;
    }
  } catch {
    // @vscode/ripgrep not installed — fall through
  }
  _rgPath = "rg";
  return _rgPath;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

function jsonResult(data: unknown): ToolResult {
  return ok(JSON.stringify(data, null, 2));
}

function errorResult(message: string): ToolResult {
  return ok(`Error: ${message}`);
}

/**
 * Validate that `target` lives inside `workspace`.
 * Prevents path-traversal attacks (e.g. `../../etc/passwd`).
 */
function assertInsideWorkspace(target: string, workspace: string): void {
  const resolved = path.resolve(workspace, target);
  const normalizedWorkspace = path.resolve(workspace) + path.sep;
  const normalizedTarget = path.resolve(resolved);
  if (
    normalizedTarget !== path.resolve(workspace) &&
    !normalizedTarget.startsWith(normalizedWorkspace)
  ) {
    throw new Error(
      `Path "${target}" resolves outside the workspace boundary.`,
    );
  }
}

function resolveSafe(workspace: string, filePath: string): string {
  const resolved = path.resolve(workspace, filePath);
  assertInsideWorkspace(resolved, workspace);
  return resolved;
}

function spawnAsync(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    shell?: boolean;
  },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = childProcess.spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      timeout: options.timeout ?? DEFAULT_BASH_TIMEOUT,
      shell: options.shell ?? false,
      windowsHide: true,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let stdoutTruncated = false;
    let stderrTruncated = false;

    proc.stdout?.on("data", (chunk: Buffer) => {
      if (stdoutTruncated) return;
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_SPAWN_OUTPUT_BYTES) {
        stdoutTruncated = true;
        return;
      }
      stdoutChunks.push(chunk);
    });
    proc.stderr?.on("data", (chunk: Buffer) => {
      if (stderrTruncated) return;
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_SPAWN_OUTPUT_BYTES) {
        stderrTruncated = true;
        return;
      }
      stderrChunks.push(chunk);
    });

    const concatSafe = (chunks: Buffer[], truncated: boolean, totalBytes: number): string => {
      const text = Buffer.concat(chunks).toString("utf8");
      return truncated
        ? text + `\n... [truncated: ${totalBytes} bytes total, limit ${MAX_SPAWN_OUTPUT_BYTES}]`
        : text;
    };

    proc.on("close", (code) => {
      resolve({
        stdout: concatSafe(stdoutChunks, stdoutTruncated, stdoutBytes),
        stderr: concatSafe(stderrChunks, stderrTruncated, stderrBytes),
        exitCode: code ?? 1,
      });
    });

    proc.on("error", (err) => {
      resolve({
        stdout: concatSafe(stdoutChunks, stdoutTruncated, stdoutBytes),
        stderr: err.message,
        exitCode: 1,
      });
    });
  });
}

/**
 * Simple glob match (supports `*`, `**`, `?`).
 * Avoids external dependency on minimatch.
 */
function globToRegex(pattern: string): RegExp {
  let regexStr = "^";
  let i = 0;
  while (i < pattern.length) {
    const char = pattern[i];
    if (char === "*" && pattern[i + 1] === "*") {
      // ** matches any number of path segments
      regexStr += ".*";
      i += 2;
      if (pattern[i] === "/" || pattern[i] === "\\") {
        i += 1; // skip separator after **
      }
    } else if (char === "*") {
      regexStr += "[^/\\\\]*";
      i += 1;
    } else if (char === "?") {
      regexStr += "[^/\\\\]";
      i += 1;
    } else if (".+^${}()|[]\\".includes(char)) {
      regexStr += "\\" + char;
      i += 1;
    } else {
      regexStr += char;
      i += 1;
    }
  }
  regexStr += "$";
  return new RegExp(regexStr, "i");
}

function walkDir(
  dir: string,
  includeHidden: boolean,
  limit: number,
  results: string[],
): void {
  if (results.length >= limit) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (results.length >= limit) return;
    if (!includeHidden && entry.name.startsWith(".")) continue;
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, includeHidden, limit, results);
    } else {
      results.push(full);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Build the standard set of agentic tool definitions.
 *
 * The returned array can be passed directly to `PiSessionOptions.customTools`.
 */
export function createAgenticToolDefinitions(
  options: AgenticToolOptions,
): CustomToolDefinition[] {
  const { workspace, onToolUse } = options;

  function wrap(
    def: CustomToolDefinition,
  ): CustomToolDefinition {
    const originalExecute = def.execute;
    def.execute = (
      toolCallId: string,
      params: Record<string, unknown>,
      signal?: AbortSignal,
      onUpdate?: unknown,
      toolContext?: unknown,
    ) => {
      if (onToolUse) {
        onToolUse(def.name, params);
      }
      try {
        return originalExecute(toolCallId, params, signal, onUpdate, toolContext);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return errorResult(msg);
      }
    };
    return def;
  }

  const tools: CustomToolDefinition[] = [
    // -----------------------------------------------------------------
    // FILE OPERATIONS
    // -----------------------------------------------------------------
    wrap({
      name: "read",
      label: "Read File",
      description:
        "Read a file from the workspace. Returns numbered lines. Supports offset and limit for partial reads.",
      parameters: Type.Object({
        path: Type.String({ description: "File path relative to workspace" }),
        offset: Type.Optional(
          Type.Number({ description: "1-based line to start reading from" }),
        ),
        limit: Type.Optional(
          Type.Number({ description: "Max number of lines to return" }),
        ),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const filePath = resolveSafe(workspace, String(params.path));
        const raw = fs.readFileSync(filePath, "utf8");
        const lines = raw.split("\n");
        const start = Math.max(0, ((params.offset as number) ?? 1) - 1);
        const count = Math.min(
          (params.limit as number) ?? MAX_READ_LINES,
          MAX_READ_LINES,
        );
        const slice = lines.slice(start, start + count);
        const numbered = slice
          .map((line, i) => `${start + i + 1}\t${line}`)
          .join("\n");
        return ok(numbered);
      },
    }),

    wrap({
      name: "write",
      label: "Write File",
      description:
        "Write content to a file in the workspace. Creates parent directories if needed.",
      parameters: Type.Object({
        path: Type.String({ description: "File path relative to workspace" }),
        content: Type.String({ description: "File content to write" }),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const filePath = resolveSafe(workspace, String(params.path));
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, String(params.content), "utf8");
        return ok(`File written: ${filePath}`);
      },
    }),

    wrap({
      name: "edit",
      label: "Edit File",
      description:
        "Replace a string in a file. Reads the file, replaces old_string with new_string, and writes it back.",
      parameters: Type.Object({
        path: Type.String({ description: "File path relative to workspace" }),
        old_string: Type.String({ description: "Exact string to find" }),
        new_string: Type.String({ description: "Replacement string" }),
        replace_all: Type.Optional(
          Type.Boolean({
            description: "Replace all occurrences (default: false)",
          }),
        ),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const filePath = resolveSafe(workspace, String(params.path));
        const content = fs.readFileSync(filePath, "utf8");
        const oldStr = String(params.old_string);
        const newStr = String(params.new_string);

        if (!content.includes(oldStr)) {
          return errorResult(
            `old_string not found in ${params.path as string}. Ensure it matches exactly.`,
          );
        }

        let updated: string;
        if (params.replace_all) {
          updated = content.split(oldStr).join(newStr);
        } else {
          const index = content.indexOf(oldStr);
          updated =
            content.slice(0, index) + newStr + content.slice(index + oldStr.length);
        }

        fs.writeFileSync(filePath, updated, "utf8");
        return ok(`File edited: ${filePath}`);
      },
    }),

    wrap({
      name: "grep",
      label: "Search Files",
      description:
        "Search file contents using ripgrep. Returns matching lines with context.",
      parameters: Type.Object({
        pattern: Type.String({ description: "Regex pattern to search for" }),
        path: Type.Optional(
          Type.String({ description: "Directory or file to search (default: workspace)" }),
        ),
        glob: Type.Optional(
          Type.String({ description: "Glob filter (e.g. '*.ts')" }),
        ),
        type: Type.Optional(
          Type.String({ description: "File type filter (e.g. 'ts', 'py')" }),
        ),
        i: Type.Optional(
          Type.Boolean({ description: "Case-insensitive search" }),
        ),
        context: Type.Optional(
          Type.Number({ description: "Context lines around matches" }),
        ),
        limit: Type.Optional(
          Type.Number({ description: "Max results" }),
        ),
        offset: Type.Optional(
          Type.Number({ description: "Skip first N results" }),
        ),
        multiline: Type.Optional(
          Type.Boolean({ description: "Enable multiline mode" }),
        ),
        output_mode: Type.Optional(
          Type.Union([
            Type.Literal("content"),
            Type.Literal("files_with_matches"),
            Type.Literal("count"),
          ], { description: "Output mode: 'content' (matching lines), 'files_with_matches' (file paths, default), 'count' (match counts)" }),
        ),
        before_context: Type.Optional(
          Type.Number({ description: "Lines before each match (rg -B)" }),
        ),
        after_context: Type.Optional(
          Type.Number({ description: "Lines after each match (rg -A)" }),
        ),
        line_numbers: Type.Optional(
          Type.Boolean({ description: "Show line numbers in content mode (default true)" }),
        ),
        head_limit: Type.Optional(
          Type.Number({ description: "Max output lines (default 250)" }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const searchPath = params.path
          ? resolveSafe(workspace, String(params.path))
          : workspace;
        const mode = (params.output_mode as string) ?? "files_with_matches";
        const args: string[] = ["--color", "never"];

        if (mode === "files_with_matches") {
          args.push("-l");
        } else if (mode === "count") {
          args.push("-c");
        } else {
          // content mode
          args.push("--no-heading");
          if (params.line_numbers === false) {
            args.push("--no-line-number");
          } else {
            args.push("--line-number");
          }
          if (params.before_context != null) args.push("-B", String(params.before_context));
          if (params.after_context != null) args.push("-A", String(params.after_context));
        }

        if (params.i) args.push("-i");
        if (params.multiline) args.push("-U", "--multiline-dotall");
        const hasSplitContext =
          params.before_context != null || params.after_context != null;
        if (mode === "content" && params.context != null && !hasSplitContext) {
          args.push("-C", String(params.context));
        }
        if (params.glob) args.push("--glob", String(params.glob));
        if (params.type) args.push("--type", String(params.type));
        args.push("--", String(params.pattern), searchPath);

        const result = await spawnAsync(getRgPath(), args, {
          cwd: workspace,
          timeout: DEFAULT_SEARCH_TIMEOUT,
        });
        let output = result.stdout;

        // Apply head_limit (default 250, 0 = unlimited) before offset/limit
        const rawHeadLimit = params.head_limit as number | undefined;
        const headLimit = rawHeadLimit === 0 ? Infinity : (rawHeadLimit ?? 250);
        const lines = output.split("\n");
        const headLimited = lines.slice(0, headLimit);

        if (params.offset || params.limit) {
          const off = (params.offset as number) ?? 0;
          const lim = (params.limit as number) ?? 250;
          output = headLimited.slice(off, off + lim).join("\n");
        } else {
          output = headLimited.join("\n");
        }

        if (!output.trim() && result.exitCode !== 0 && result.stderr) {
          return errorResult(result.stderr.trim());
        }
        return ok(output || "(no matches)");
      },
    }),

    wrap({
      name: "find",
      label: "Find Files",
      description:
        "Discover files matching a glob pattern in the workspace.",
      parameters: Type.Object({
        pattern: Type.String({ description: "Glob pattern (e.g. '**/*.ts')" }),
        hidden: Type.Optional(
          Type.Boolean({ description: "Include hidden files/dirs" }),
        ),
        limit: Type.Optional(
          Type.Number({ description: "Max results (default: 500)" }),
        ),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const maxResults = Math.min((params.limit as number) ?? 500, 5000);
        const includeHidden = Boolean(params.hidden);
        const allFiles: string[] = [];
        walkDir(workspace, includeHidden, maxResults * 5, allFiles);

        const regex = globToRegex(String(params.pattern));
        const matches: string[] = [];
        for (const filePath of allFiles) {
          if (matches.length >= maxResults) break;
          const rel = path.relative(workspace, filePath).replace(/\\/g, "/");
          if (regex.test(rel)) {
            matches.push(rel);
          }
        }
        return ok(matches.join("\n") || "(no matches)");
      },
    }),

    // -----------------------------------------------------------------
    // EXECUTION
    // -----------------------------------------------------------------
    wrap({
      name: "bash",
      label: "Shell Execute",
      description:
        "Execute a shell command in the workspace. Returns stdout, stderr, and exit code.",
      parameters: Type.Object({
        command: Type.String({ description: "Shell command to execute" }),
        env: Type.Optional(
          Type.Record(Type.String(), Type.String(), {
            description: "Extra environment variables",
          }),
        ),
        timeout: Type.Optional(
          Type.Number({
            description: "Timeout in ms (default: 120000)",
          }),
        ),
        cwd: Type.Optional(
          Type.String({ description: "Working directory (relative to workspace)" }),
        ),
        run_in_background: Type.Optional(
          Type.Boolean({
            description:
              "Set to true to run the command in the background. Returns immediately with a backgroundTaskId.",
          }),
        ),
        description: Type.Optional(
          Type.String({
            description:
              "Human-readable description of the background task. Only used when run_in_background is true.",
          }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const cwd = params.cwd
          ? resolveSafe(workspace, String(params.cwd))
          : workspace;

        // --- Background execution path ---
        if (params.run_in_background === true) {
          const registry = getBackgroundRegistry(options.maxBackgroundProcesses);
          const record = registry.spawn({
            command: String(params.command),
            cwd,
            env: (params.env as Record<string, string>) ?? undefined,
            description: params.description ? String(params.description) : undefined,
            onComplete: options.onBackgroundComplete
              ? (evt) => options.onBackgroundComplete!(evt)
              : undefined,
          });
          return jsonResult({
            backgroundTaskId: record.backgroundTaskId,
            status: record.status,
            pid: record.pid,
            command: record.command,
            description: record.description,
          });
        }

        // --- Synchronous execution path (unchanged) ---
        const timeout =
          (params.timeout as number) ?? DEFAULT_BASH_TIMEOUT;
        const shell = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
        const shellArgs =
          process.platform === "win32"
            ? ["/c", String(params.command)]
            : ["-c", String(params.command)];

        const result = await spawnAsync(shell, shellArgs, {
          cwd,
          env: (params.env as Record<string, string>) ?? undefined,
          timeout,
        });
        const combined = [result.stdout, result.stderr]
          .filter(Boolean)
          .join("\n");
        return jsonResult({
          output: combined,
          exitCode: result.exitCode,
        });
      },
    }),

    wrap({
      name: "python",
      label: "Python Execute",
      description:
        "Execute Python code cells sequentially.",
      parameters: Type.Object({
        cells: Type.Array(
          Type.Object({
            code: Type.String({ description: "Python code to execute" }),
          }),
          { description: "Code cells to run" },
        ),
        timeout: Type.Optional(
          Type.Number({ description: "Timeout in ms (default: 120000)" }),
        ),
        cwd: Type.Optional(
          Type.String({ description: "Working directory (relative to workspace)" }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const cwd = params.cwd
          ? resolveSafe(workspace, String(params.cwd))
          : workspace;
        const timeout =
          (params.timeout as number) ?? DEFAULT_BASH_TIMEOUT;
        const cells = params.cells as Array<{ code: string }>;
        const combinedCode = cells.map((c) => c.code).join("\n");
        const pythonCmd =
          process.platform === "win32" ? "python" : "python3";

        const result = await spawnAsync(pythonCmd, ["-c", combinedCode], {
          cwd,
          timeout,
        });
        const combined = [result.stdout, result.stderr]
          .filter(Boolean)
          .join("\n");
        return jsonResult({
          output: combined,
          exitCode: result.exitCode,
        });
      },
    }),

    wrap({
      name: "ssh",
      label: "SSH Execute",
      description:
        "Execute a command on a remote host via SSH.",
      parameters: Type.Object({
        host: Type.String({ description: "SSH host (user@host)" }),
        command: Type.String({ description: "Command to execute remotely" }),
        cwd: Type.Optional(
          Type.String({ description: "Remote working directory" }),
        ),
        timeout: Type.Optional(
          Type.Number({ description: "Timeout in ms (default: 120000)" }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const timeout =
          (params.timeout as number) ?? DEFAULT_BASH_TIMEOUT;
        const remoteCmd = params.cwd
          ? `cd ${String(params.cwd)} && ${String(params.command)}`
          : String(params.command);
        const result = await spawnAsync(
          "ssh",
          [
            "-o",
            "StrictHostKeyChecking=no",
            "-o",
            "BatchMode=yes",
            String(params.host),
            remoteCmd,
          ],
          { cwd: workspace, timeout },
        );
        const combined = [result.stdout, result.stderr]
          .filter(Boolean)
          .join("\n");
        return jsonResult({
          output: combined,
          exitCode: result.exitCode,
        });
      },
    }),

    // -----------------------------------------------------------------
    // BROWSER / WEB
    // -----------------------------------------------------------------
    wrap({
      name: "browser",
      label: "Headless Browser",
      description:
        "Interact with a headless browser. Actions: navigate, click, type, evaluate, screenshot, close.",
      parameters: Type.Object({
        action: Type.String({
          description:
            "Action: navigate | click | type | evaluate | screenshot | close",
        }),
        url: Type.Optional(Type.String({ description: "URL to navigate to" })),
        selector: Type.Optional(
          Type.String({ description: "CSS selector for click/type" }),
        ),
        text: Type.Optional(
          Type.String({ description: "Text to type" }),
        ),
        script: Type.Optional(
          Type.String({ description: "JavaScript to evaluate in page" }),
        ),
        options: Type.Optional(
          Type.Object({}, { additionalProperties: true }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        // Lazy import — puppeteer is optional.
        // Use indirect dynamic import to avoid TypeScript resolving the module
        // at compile time (same pattern as piWrapper.ts).
        let puppeteer: {
          launch: (opts?: Record<string, unknown>) => Promise<PuppeteerBrowser>;
        };
        try {
          // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-assignment
          puppeteer = await (new Function("id", "return import(id)") as (id: string) => Promise<typeof puppeteer>)("puppeteer");
        } catch {
          return errorResult(
            "puppeteer is not installed. Install it with: npm install puppeteer",
          );
        }

        const action = String(params.action);

        // Reuse a module-level browser instance across calls
        if (!browserInstance) {
          browserInstance = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });
        }
        const browser = browserInstance;
        const pages = await browser.pages();
        const page = pages[0] ?? (await browser.newPage());

        switch (action) {
          case "navigate": {
            await page.goto(String(params.url), { waitUntil: "domcontentloaded" });
            const title = await page.title();
            return ok(`Navigated to ${String(params.url)} — title: ${title}`);
          }
          case "click": {
            await page.click(String(params.selector));
            return ok(`Clicked ${String(params.selector)}`);
          }
          case "type": {
            await page.type(String(params.selector), String(params.text));
            return ok(`Typed into ${String(params.selector)}`);
          }
          case "evaluate": {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result = await page.evaluate(String(params.script));
            return jsonResult(result);
          }
          case "screenshot": {
            const buf = await page.screenshot({ encoding: "base64" }) as string;
            return ok(`Screenshot captured (${buf.length} base64 chars).`);
          }
          case "close": {
            await browser.close();
            browserInstance = null;
            return ok("Browser closed.");
          }
          default:
            return errorResult(`Unknown browser action: ${action}`);
        }
      },
    }),

    wrap({
      name: "fetch",
      label: "HTTP Fetch",
      description:
        "Make an HTTP request and return the response body.",
      parameters: Type.Object({
        url: Type.String({ description: "URL to fetch" }),
        timeout: Type.Optional(
          Type.Number({ description: "Timeout in ms (default: 30000)" }),
        ),
        raw: Type.Optional(
          Type.Boolean({ description: "Return raw response without truncation" }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const timeout = (params.timeout as number) ?? DEFAULT_SEARCH_TIMEOUT;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await globalThis.fetch(String(params.url), {
            signal: controller.signal,
          });
          const text = await response.text();
          const maxLen = params.raw ? Infinity : 50_000;
          const body =
            text.length > maxLen
              ? text.slice(0, maxLen) + "\n... (truncated)"
              : text;
          return jsonResult({
            status: response.status,
            statusText: response.statusText,
            body,
          });
        } finally {
          clearTimeout(timer);
        }
      },
    }),

    // -----------------------------------------------------------------
    // USER INTERACTION
    // -----------------------------------------------------------------
    wrap({
      name: "ask",
      label: "Ask User Question",
      description:
        "Ask the user one or more structured questions. Delegates to the injected askUserQuestionHandler.",
      promptSnippet:
        "Ask the user focused clarification questions when you need missing requirements.",
      parameters: Type.Object({
        mode: Type.Optional(
          Type.Union([Type.Literal("simple"), Type.Literal("structured")], {
            description: "Interaction mode: 'simple' (single question, free-text) or 'structured' (multi-question with options). Default: 'structured'",
          }),
        ),
        question: Type.Optional(
          Type.String({ description: "Single question text (required for simple mode)" }),
        ),
        questions: Type.Optional(
          Type.Array(
            Type.Object({
              id: Type.String({ description: "Unique question identifier" }),
              question: Type.String({ description: "Question text" }),
              options: Type.Optional(
                Type.Array(
                  Type.Object({
                    label: Type.String({ description: "Option label" }),
                  }),
                ),
              ),
              multi: Type.Optional(
                Type.Boolean({ description: "Allow multiple selections" }),
              ),
              recommended: Type.Optional(
                Type.Number({ description: "Index of recommended option" }),
              ),
            }),
            { description: "Questions to ask the user (required for structured mode)" },
          ),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        if (!options.interactive || !options.askUserQuestionHandler) {
          return errorResult(
            "Not in interactive mode or no askUserQuestionHandler provided.",
          );
        }
        const mode = (params.mode as string) ?? "structured";

        if (mode === "simple") {
          const questionText = params.question as string | undefined;
          if (!questionText) {
            return errorResult("Error: 'question' param is required when mode='simple'.");
          }
          const mapped = {
            questions: [{
              id: "_simple",
              text: questionText,
              options: undefined,
              allowMultiple: false,
              recommendedIndex: undefined,
            }],
          };
          const response = await options.askUserQuestionHandler(mapped);
          const answers = (response as { answers?: Array<{ answer?: string }> })?.answers;
          const answer = answers?.[0]?.answer ?? "";
          return ok(answer);
        }

        // Structured mode
        const questions = params.questions as Array<{
          id: string;
          question: string;
          options?: Array<{ label: string }>;
          multi?: boolean;
          recommended?: number;
        }> | undefined;
        if (!questions) {
          return errorResult("Error: 'questions' param is required when mode='structured'.");
        }
        // Map to AskUserQuestion schema
        const mapped = {
          questions: questions.map((q) => ({
            id: q.id,
            text: q.question,
            options: q.options?.map((o) => ({ value: o.label, label: o.label })),
            allowMultiple: q.multi,
            recommendedIndex: q.recommended,
          })),
        };
        const response = await options.askUserQuestionHandler(mapped);
        return jsonResult(response);
      },
    }),

    // -----------------------------------------------------------------
    // UTILITIES
    // -----------------------------------------------------------------
    wrap({
      name: "calc",
      label: "Calculator",
      description:
        "Evaluate mathematical expressions. Has access to all Math.* functions.",
      parameters: Type.Object({
        calculations: Type.Array(
          Type.Object({
            expression: Type.String({ description: "Math expression to evaluate" }),
            prefix: Type.Optional(Type.String({ description: "Label prefix" })),
            suffix: Type.Optional(Type.String({ description: "Label suffix" })),
          }),
          { description: "Calculations to perform" },
        ),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const calculations = params.calculations as Array<{
          expression: string;
          prefix?: string;
          suffix?: string;
        }>;
        const results = calculations.map((calc) => {
          try {
            // Build a safe math evaluator using Function constructor with Math.*
            const mathFns = Object.getOwnPropertyNames(Math)
              .map((name) => `const ${name} = Math.${name};`)
              .join(" ");
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            const fn = new Function(
              `${mathFns} return (${calc.expression});`,
            );
            const value = fn() as unknown;
            const prefix = calc.prefix ? `${calc.prefix} ` : "";
            const suffix = calc.suffix ? ` ${calc.suffix}` : "";
            return `${prefix}${String(value)}${suffix}`;
          } catch (err) {
            return `Error evaluating "${calc.expression}": ${err instanceof Error ? err.message : String(err)}`;
          }
        });
        return ok(results.join("\n"));
      },
    }),

    wrap({
      name: "ast_grep",
      label: "AST Search",
      description:
        "Search code using AST patterns via ast-grep (sg). Falls back to text grep if sg is unavailable.",
      parameters: Type.Object({
        pat: Type.Array(Type.String(), {
          description: "AST patterns to search for",
        }),
        lang: Type.String({ description: "Language (e.g. 'typescript', 'python')" }),
        path: Type.Optional(
          Type.String({ description: "Search path relative to workspace" }),
        ),
        glob: Type.Optional(
          Type.String({ description: "File glob filter" }),
        ),
        limit: Type.Optional(Type.Number({ description: "Max results" })),
        offset: Type.Optional(
          Type.Number({ description: "Skip first N results" }),
        ),
        context: Type.Optional(
          Type.Number({ description: "Context lines around matches" }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const patterns = params.pat as string[];
        const lang = String(params.lang);
        const searchPath = params.path
          ? resolveSafe(workspace, String(params.path))
          : workspace;

        const allResults: string[] = [];
        for (const pattern of patterns) {
          const sgArgs = [
            "run",
            "--pattern",
            pattern,
            "--lang",
            lang,
          ];
          if (params.context) sgArgs.push("--context", String(params.context));
          sgArgs.push(searchPath);

          const result = await spawnAsync("sg", sgArgs, {
            cwd: workspace,
            timeout: DEFAULT_SEARCH_TIMEOUT,
          });

          if (result.exitCode === 0 && result.stdout.trim()) {
            allResults.push(result.stdout.trim());
          } else if (result.exitCode !== 0) {
            // Fallback to ripgrep text search
            const rgArgs = [
              "--no-heading",
              "--line-number",
              "--color",
              "never",
            ];
            if (params.glob) rgArgs.push("--glob", String(params.glob));
            rgArgs.push("--", pattern, searchPath);
            const rgResult = await spawnAsync(getRgPath(), rgArgs, {
              cwd: workspace,
              timeout: DEFAULT_SEARCH_TIMEOUT,
            });
            if (rgResult.stdout.trim()) {
              allResults.push(rgResult.stdout.trim());
            }
          }
        }

        let output = allResults.join("\n---\n");
        if (params.offset || params.limit) {
          const lines = output.split("\n");
          const off = (params.offset as number) ?? 0;
          const lim = (params.limit as number) ?? 250;
          output = lines.slice(off, off + lim).join("\n");
        }
        return ok(output || "(no matches)");
      },
    }),

    wrap({
      name: "ast_edit",
      label: "AST Transform",
      description:
        "Apply AST-based rewrite operations via ast-grep (sg --rewrite).",
      parameters: Type.Object({
        ops: Type.Array(
          Type.Object({
            pat: Type.String({ description: "AST pattern to match" }),
            rewrite: Type.String({ description: "Replacement pattern" }),
          }),
          { description: "Rewrite operations" },
        ),
        lang: Type.String({ description: "Language (e.g. 'typescript')" }),
        path: Type.Optional(
          Type.String({ description: "Target path relative to workspace" }),
        ),
        glob: Type.Optional(Type.String({ description: "File glob filter" })),
        limit: Type.Optional(
          Type.Number({ description: "Max files to modify" }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const ops = params.ops as Array<{ pat: string; rewrite: string }>;
        const lang = String(params.lang);
        const targetPath = params.path
          ? resolveSafe(workspace, String(params.path))
          : workspace;

        const results: string[] = [];
        for (const op of ops) {
          const sgArgs = [
            "run",
            "--pattern",
            op.pat,
            "--rewrite",
            op.rewrite,
            "--lang",
            lang,
            "--update-all",
          ];
          sgArgs.push(targetPath);

          const result = await spawnAsync("sg", sgArgs, {
            cwd: workspace,
            timeout: DEFAULT_SEARCH_TIMEOUT,
          });
          const output = [result.stdout, result.stderr]
            .filter(Boolean)
            .join("\n")
            .trim();
          results.push(
            `Pattern "${op.pat}" -> "${op.rewrite}": ${result.exitCode === 0 ? "applied" : "failed"}${output ? `\n${output}` : ""}`,
          );
        }
        return ok(results.join("\n"));
      },
    }),

    wrap({
      name: "render_mermaid",
      label: "Render Mermaid Diagram",
      description:
        "Render a Mermaid diagram. Tries mmdc CLI; falls back to returning source.",
      parameters: Type.Object({
        mermaid: Type.String({ description: "Mermaid diagram source" }),
        config: Type.Optional(
          Type.Object({
            useAscii: Type.Optional(
              Type.Boolean({ description: "Use ASCII art fallback" }),
            ),
          }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const source = String(params.mermaid);

        // Try mmdc
        const tmpInput = path.join(
          workspace,
          `.mermaid-tmp-${Date.now()}.mmd`,
        );
        const tmpOutput = path.join(
          workspace,
          `.mermaid-tmp-${Date.now()}.svg`,
        );
        try {
          fs.writeFileSync(tmpInput, source, "utf8");
          const result = await spawnAsync(
            "mmdc",
            ["-i", tmpInput, "-o", tmpOutput],
            { cwd: workspace, timeout: DEFAULT_SEARCH_TIMEOUT },
          );
          if (result.exitCode === 0 && fs.existsSync(tmpOutput)) {
            const svg = fs.readFileSync(tmpOutput, "utf8");
            return ok(svg);
          }
        } catch {
          // mmdc not available — fall through
        } finally {
          try { fs.unlinkSync(tmpInput); } catch { /* ignore */ }
          try { fs.unlinkSync(tmpOutput); } catch { /* ignore */ }
        }

        // Fallback: return source
        return ok(
          `(mmdc not available — returning source)\n\n\`\`\`mermaid\n${source}\n\`\`\``,
        );
      },
    }),

    wrap({
      name: "notebook",
      label: "Jupyter Notebook",
      description:
        "Read or modify Jupyter notebook cells. Actions: read, insert, replace, delete.",
      parameters: Type.Object({
        action: Type.String({
          description: "Action: read | insert | replace | delete",
        }),
        notebook_path: Type.String({
          description: "Notebook file path relative to workspace",
        }),
        cell_index: Type.Number({
          description: "0-based cell index",
        }),
        content: Type.Optional(
          Type.String({ description: "Cell content (for insert/replace)" }),
        ),
        cell_type: Type.Optional(
          Type.String({ description: "Cell type: code | markdown (default: code)" }),
        ),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const nbPath = resolveSafe(
          workspace,
          String(params.notebook_path),
        );
        const action = String(params.action);
        const cellIndex = params.cell_index as number;

        const raw = fs.readFileSync(nbPath, "utf8");
        const notebook = JSON.parse(raw) as NotebookJson;
        if (!Array.isArray(notebook.cells)) {
          return errorResult("Invalid notebook format: no cells array.");
        }

        switch (action) {
          case "read": {
            if (cellIndex < 0 || cellIndex >= notebook.cells.length) {
              return errorResult(
                `Cell index ${cellIndex} out of range (0-${notebook.cells.length - 1}).`,
              );
            }
            const cell = notebook.cells[cellIndex];
            const source = Array.isArray(cell.source)
              ? cell.source.join("")
              : String(cell.source);
            return jsonResult({
              cell_type: cell.cell_type,
              source,
              index: cellIndex,
            });
          }
          case "insert": {
            const newCell: NotebookCell = {
              cell_type: (params.cell_type as string) ?? "code",
              source: [String(params.content ?? "")],
              metadata: {},
              outputs: [],
            };
            notebook.cells.splice(cellIndex, 0, newCell);
            fs.writeFileSync(nbPath, JSON.stringify(notebook, null, 1), "utf8");
            return ok(
              `Inserted ${newCell.cell_type} cell at index ${cellIndex}.`,
            );
          }
          case "replace": {
            if (cellIndex < 0 || cellIndex >= notebook.cells.length) {
              return errorResult(
                `Cell index ${cellIndex} out of range.`,
              );
            }
            notebook.cells[cellIndex].source = [String(params.content ?? "")];
            if (params.cell_type) {
              notebook.cells[cellIndex].cell_type = String(params.cell_type);
            }
            fs.writeFileSync(nbPath, JSON.stringify(notebook, null, 1), "utf8");
            return ok(`Replaced cell at index ${cellIndex}.`);
          }
          case "delete": {
            if (cellIndex < 0 || cellIndex >= notebook.cells.length) {
              return errorResult(
                `Cell index ${cellIndex} out of range.`,
              );
            }
            notebook.cells.splice(cellIndex, 1);
            fs.writeFileSync(nbPath, JSON.stringify(notebook, null, 1), "utf8");
            return ok(`Deleted cell at index ${cellIndex}.`);
          }
          default:
            return errorResult(`Unknown notebook action: ${action}`);
        }
      },
    }),

    // -----------------------------------------------------------------------
    // config — runtime configuration tool (GAP-TOOLS-033)
    // -----------------------------------------------------------------------
    wrap({
      name: "config",
      label: "Runtime Config",
      description:
        "Read and modify babysitter configuration at runtime. " +
        "Supports get/set/list/reset actions for standard config keys " +
        "(maxIterations, timeout, logLevel, etc.), model/provider selection, " +
        "and compression settings. Changes are run-scoped by default.",
      parameters: Type.Object({
        action: Type.Union([
          Type.Literal("get"),
          Type.Literal("set"),
          Type.Literal("list"),
          Type.Literal("reset"),
        ], { description: "Action to perform: get, set, list, or reset" }),
        key: Type.Optional(
          Type.String({ description: "Config key path (dot notation for nested, e.g. 'compression.enabled')" }),
        ),
        value: Type.Optional(
          Type.Unknown({ description: "New value for set action" }),
        ),
        scope: Type.Optional(
          Type.Union([Type.Literal("run"), Type.Literal("global")], {
            description: "Scope: 'run' (default, in-memory) or 'global' (env vars)",
          }),
        ),
      }),
      execute: (_toolCallId, params) => {
        const action = params.action as string | undefined;
        if (!action) {
          return errorResult("'action' parameter is required (get, set, list, reset).");
        }

        const key = params.key as string | undefined;
        const value = params.value;
        const scope = (params.scope as string) ?? "run";

        switch (action) {
          case "get": {
            if (!key) {
              // Return full merged config
              const cfg = getConfig();
              const merged: Record<string, unknown> = { ...cfg };
              // Add extended keys
              for (const ek of EXTENDED_CONFIG_KEYS) {
                merged[ek] = getConfigValue(ek);
              }
              // Add run-scoped overrides
              for (const [k, v] of _runScopedConfig) {
                merged[k] = v;
              }
              return jsonResult(merged);
            }
            if (!isValidConfigKey(key)) {
              return errorResult(`Error: Unknown config key '${key}'.`);
            }
            return jsonResult({ key, value: getConfigValue(key) });
          }

          case "set": {
            if (!key) {
              return errorResult("Error: 'key' parameter is required for set action.");
            }
            if (value === undefined) {
              return errorResult("Error: 'value' parameter is required for set action.");
            }
            if (!isValidConfigKey(key)) {
              return errorResult(`Error: Unknown config key '${key}'.`);
            }
            // Type validation
            const typeError = validateConfigValue(key, value);
            if (typeError) {
              return errorResult(`Error: ${typeError}`);
            }

            if (scope === "global") {
              // Set env var for standard keys
              const envKey = CONFIG_KEY_TO_ENV[key];
              if (envKey) {
                process.env[envKey] = String(value);
              } else {
                // For extended/compression keys, store as BABYSITTER_ env var
                const envName = "BABYSITTER_" + key.replace(/\./g, "_").toUpperCase();
                process.env[envName] = String(value);
              }
            }

            // Always store in run-scoped map too
            _runScopedConfig.set(key, value);
            return ok(`Set '${key}' to ${JSON.stringify(value)} (scope: ${scope}).`);
          }

          case "list": {
            const entries: Record<string, { current: unknown; default: unknown }> = {};
            // Standard keys
            for (const k of BABYSITTER_CONFIG_KEYS) {
              entries[k] = {
                current: getConfigValue(k),
                default: getConfigDefault(k),
              };
            }
            // Extended keys
            for (const k of EXTENDED_CONFIG_KEYS) {
              entries[k] = {
                current: getConfigValue(k),
                default: getConfigDefault(k),
              };
            }
            // Include any run-scoped keys (compression.*, breakpoint.*) that have been set
            for (const [k, v] of _runScopedConfig) {
              if (!entries[k]) {
                entries[k] = { current: v, default: undefined };
              }
            }
            return jsonResult(entries);
          }

          case "reset": {
            if (key) {
              _runScopedConfig.delete(key);
              return ok(`Reset '${key}' to default.`);
            }
            _runScopedConfig.clear();
            return ok("Reset all config to defaults.");
          }

          default:
            return errorResult(`Error: Unknown action '${action}'. Use get, set, list, or reset.`);
        }
      },
    }),

    // -----------------------------------------------------------------
    // BACKGROUND PROCESS TOOLS (GAP-TOOLS-036)
    // -----------------------------------------------------------------
    wrap({
      name: "background_status",
      label: "Background Task Status",
      description:
        "Query the status of a background task by its backgroundTaskId. Returns the task record including status, stdout, stderr, and exit code.",
      parameters: Type.Object({
        backgroundTaskId: Type.String({
          description: "The backgroundTaskId returned when launching a background task",
        }),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const registry = getBackgroundRegistry(options.maxBackgroundProcesses);
        const id = String(params.backgroundTaskId);
        const record = registry.get(id);
        if (!record) {
          return errorResult(`Background task not found: ${id}`);
        }
        return jsonResult(record);
      },
    }),

    wrap({
      name: "background_list",
      label: "List Background Tasks",
      description:
        "List all tracked background tasks with their current status.",
      parameters: Type.Object({}),
      execute: (
        _toolCallId: string,
        _params: Record<string, unknown>,
      ): ToolResult => {
        const registry = getBackgroundRegistry(options.maxBackgroundProcesses);
        const all = registry.list();
        return jsonResult({ tasks: all });
      },
    }),

    // -----------------------------------------------------------------
    // TOOL DISCOVERY (GAP-TOOLS-034)
    // -----------------------------------------------------------------
    wrap({
      name: "tool_search",
      label: "Search Tools",
      description:
        "Search available tools by name or description. Returns lightweight tier-1 entries (name, description, source). Use tool_fetch to get full schema for a specific tool.",
      parameters: Type.Object({
        query: Type.String({ description: "Search query (matched against tool names and descriptions)" }),
        max_results: Type.Optional(Type.Number({ description: "Maximum results to return (default 20)" })),
      }),
      execute: (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): ToolResult => {
        const registry = options.deferredToolRegistry;
        if (!registry) {
          return errorResult("Tool search is not available — no deferred tool registry configured.");
        }
        const query = String(params.query ?? "");
        const maxResults = typeof params.max_results === "number" ? params.max_results : 20;
        const results = registry.searchTools(query, maxResults);
        return jsonResult({
          query,
          resultCount: results.length,
          tools: results.map((t) => ({
            name: t.name,
            description: t.description,
            source: t.source,
            sourceQualifier: t.sourceQualifier,
          })),
        });
      },
    }),
    wrap({
      name: "tool_fetch",
      label: "Fetch Tool Schema",
      description:
        "Fetch the full JSON Schema for a tool by name. Returns the complete input/output schema needed to invoke the tool.",
      parameters: Type.Object({
        name: Type.String({ description: "Tool name to fetch schema for" }),
        source: Type.Optional(Type.String({ description: "Source filter: builtin, mcp, plugin, custom" })),
        source_qualifier: Type.Optional(Type.String({ description: "Source qualifier (e.g. MCP server name)" })),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const registry = options.deferredToolRegistry;
        if (!registry) {
          return errorResult("Tool fetch is not available — no deferred tool registry configured.");
        }
        const toolName = String(params.name ?? "");
        const VALID_SOURCES = new Set(["builtin", "mcp", "plugin", "custom"]);
        const rawSource = typeof params.source === "string" ? params.source : undefined;
        if (rawSource && !VALID_SOURCES.has(rawSource)) {
          return errorResult(`Invalid source "${rawSource}". Valid sources: builtin, mcp, plugin, custom.`);
        }
        const source = rawSource as "builtin" | "mcp" | "plugin" | "custom" | undefined;
        const sourceQualifier = typeof params.source_qualifier === "string" ? params.source_qualifier : undefined;
        const resolved = await registry.fetchSchema(
          toolName,
          source,
          sourceQualifier,
        );
        if (!resolved) {
          return errorResult(`Tool "${toolName}" not found or schema could not be loaded.`);
        }
        return jsonResult({
          name: resolved.name,
          description: resolved.description,
          source: resolved.source,
          sourceQualifier: resolved.sourceQualifier,
          inputSchema: resolved.schema.inputSchema,
          outputSchema: resolved.schema.outputSchema,
        });
      },
    }),

    // -----------------------------------------------------------------
    // WEB SEARCH (GAP-TOOLS-008)
    // -----------------------------------------------------------------
    wrap({
      name: "web_search",
      label: "Web Search",
      description:
        "Search the web using a query string. Returns search result snippets. Supports domain whitelisting/blacklisting.",
      parameters: Type.Object({
        query: Type.String({ description: "Search query" }),
        max_results: Type.Optional(Type.Number({ description: "Maximum results to return (default 10)" })),
        domains: Type.Optional(Type.Array(Type.String(), { description: "Domain whitelist (only return results from these domains)" })),
        exclude_domains: Type.Optional(Type.Array(Type.String(), { description: "Domain blacklist (exclude results from these domains)" })),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const query = String(params.query ?? "");
        if (!query.trim()) {
          return errorResult("Search query is required.");
        }
        const maxResults = typeof params.max_results === "number" ? params.max_results : 10;
        const domains = Array.isArray(params.domains) ? params.domains.filter((d): d is string => typeof d === "string") : undefined;
        const excludeDomains = Array.isArray(params.exclude_domains) ? params.exclude_domains.filter((d): d is string => typeof d === "string") : undefined;

        // Build search URL with domain filters
        let searchQuery = query;
        if (domains && domains.length > 0) {
          searchQuery += " " + domains.map(d => `site:${d}`).join(" OR ");
        }
        if (excludeDomains && excludeDomains.length > 0) {
          searchQuery += " " + excludeDomains.map(d => `-site:${d}`).join(" ");
        }

        try {
          // Use DuckDuckGo HTML API for search (no API key needed)
          const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), DEFAULT_SEARCH_TIMEOUT);
          try {
            const response = await globalThis.fetch(searchUrl, {
              signal: controller.signal,
              headers: { "User-Agent": "babysitter-sdk/web-search" },
            });
            const html = await response.text();
            const results = parseSearchResults(html, maxResults);
            return jsonResult({ query, resultCount: results.length, results });
          } finally {
            clearTimeout(timer);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return errorResult(`Web search failed: ${message}`);
        }
      },
    }),

    // -----------------------------------------------------------------
    // FETCH CONTENT PROCESSING (GAP-TOOLS-037)
    // -----------------------------------------------------------------
    wrap({
      name: "fetch_process",
      label: "Fetch and Process Content",
      description:
        "Fetch a URL and process the content to extract relevant information, reducing token usage. Extracts text content, removes boilerplate, and optionally filters by a prompt.",
      parameters: Type.Object({
        url: Type.String({ description: "URL to fetch and process" }),
        prompt: Type.Optional(Type.String({ description: "Focus prompt — extract only content relevant to this query" })),
        max_length: Type.Optional(Type.Number({ description: "Maximum output length in characters (default 10000)" })),
        format: Type.Optional(Type.Union([Type.Literal("text"), Type.Literal("markdown"), Type.Literal("summary")], {
          description: "Output format: text (plain extracted text), markdown (preserve structure), summary (key points only). Default: text",
        })),
      }),
      execute: async (
        _toolCallId: string,
        params: Record<string, unknown>,
      ): Promise<ToolResult> => {
        const url = String(params.url ?? "");
        if (!url.trim()) {
          return errorResult("URL is required.");
        }
        const maxLength = typeof params.max_length === "number" ? params.max_length : 10_000;
        const format = typeof params.format === "string" ? params.format : "text";
        const prompt = typeof params.prompt === "string" ? params.prompt : undefined;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), DEFAULT_SEARCH_TIMEOUT);
          try {
            const response = await globalThis.fetch(url, {
              signal: controller.signal,
              headers: { "User-Agent": "babysitter-sdk/fetch-process" },
            });
            const contentType = response.headers.get("content-type") ?? "";
            const rawText = await response.text();

            let processed: string;
            if (contentType.includes("text/html")) {
              processed = extractTextFromHtml(rawText, format);
            } else {
              processed = rawText;
            }

            // Apply prompt-based filtering if provided
            if (prompt) {
              processed = filterByRelevance(processed, prompt);
            }

            // Truncate to max length
            if (processed.length > maxLength) {
              processed = processed.slice(0, maxLength) + "\n... (truncated)";
            }

            return jsonResult({
              url,
              contentType,
              format,
              length: processed.length,
              content: processed,
            });
          } finally {
            clearTimeout(timer);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return errorResult(`Fetch processing failed: ${message}`);
        }
      },
    }),
  ];

  return tools;
}

// ---------------------------------------------------------------------------
// Module-level state for browser tool
// ---------------------------------------------------------------------------

/** Minimal puppeteer browser interface for the browser tool. */
interface PuppeteerPage {
  goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
  title(): Promise<string>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  evaluate(script: string): Promise<unknown>;
  screenshot(options?: Record<string, unknown>): Promise<unknown>;
}

interface PuppeteerBrowser {
  pages(): Promise<PuppeteerPage[]>;
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
}

let browserInstance: PuppeteerBrowser | null = null;

/** Module-level background process registry (shared across tool invocations). */
let _backgroundRegistry: BackgroundProcessRegistry | null = null;

function getBackgroundRegistry(maxConcurrent?: number): BackgroundProcessRegistry {
  if (!_backgroundRegistry) {
    _backgroundRegistry = new BackgroundProcessRegistry({ maxConcurrent });
  }
  return _backgroundRegistry;
}

/** Minimal Jupyter notebook JSON structure. */
interface NotebookJson {
  cells: NotebookCell[];
  [key: string]: unknown;
}

interface NotebookCell {
  cell_type: string;
  source: string | string[];
  metadata: Record<string, unknown>;
  outputs?: unknown[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Web search helpers (GAP-TOOLS-008)
// ---------------------------------------------------------------------------

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** Parse DuckDuckGo HTML search results into structured results. Exported for testing. */
export function parseSearchResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];
  // DuckDuckGo HTML results are in <a class="result__a"> with <a class="result__snippet">
  const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetPattern = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const urls: string[] = [];
  const titles: string[] = [];
  const snippets: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = resultPattern.exec(html)) !== null) {
    try {
      const rawUrl = match[1].replace(/.*uddg=/, "").split("&")[0] ?? match[1];
      urls.push(decodeURIComponent(rawUrl));
    } catch {
      urls.push(match[1]);
    }
    titles.push(stripHtmlTags(match[2]).trim());
  }

  while ((match = snippetPattern.exec(html)) !== null) {
    snippets.push(stripHtmlTags(match[1]).trim());
  }

  for (let i = 0; i < Math.min(urls.length, maxResults); i++) {
    results.push({
      title: titles[i] ?? "",
      url: urls[i] ?? "",
      snippet: snippets[i] ?? "",
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Fetch content processing helpers (GAP-TOOLS-037)
// ---------------------------------------------------------------------------

/** Strip HTML tags and decode common entities. Exported for testing. */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&copy;/g, "\u00A9")
    .replace(/&#(\d+);/g, (_m: string, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

/** Extract meaningful text from HTML, removing boilerplate. Exported for testing. */
export function extractTextFromHtml(html: string, format: string): string {
  // Remove scripts, styles, nav, footer, header elements
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  if (format === "markdown") {
    // Convert headings
    cleaned = cleaned.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m: string, level: string, content: string) => {
      return "\n" + "#".repeat(Number(level)) + " " + stripHtmlTags(content).trim() + "\n";
    });
    // Convert paragraphs
    cleaned = cleaned.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m: string, content: string) => {
      return "\n" + stripHtmlTags(content).trim() + "\n";
    });
    // Convert list items
    cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m: string, content: string) => {
      return "- " + stripHtmlTags(content).trim() + "\n";
    });
    // Convert code blocks
    cleaned = cleaned.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m: string, content: string) => {
      return "\n```\n" + stripHtmlTags(content).trim() + "\n```\n";
    });
    // Convert inline code
    cleaned = cleaned.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m: string, content: string) => {
      return "`" + stripHtmlTags(content).trim() + "`";
    });
    // Strip remaining tags
    cleaned = stripHtmlTags(cleaned);
  } else {
    cleaned = stripHtmlTags(cleaned);
  }

  // Normalize whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
  return cleaned;
}

/**
 * Filter content by relevance to a prompt.
 * Splits content into paragraphs and keeps those containing query terms.
 */
export function filterByRelevance(content: string, prompt: string): string {
  const terms = prompt.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (terms.length === 0) return content;

  const paragraphs = content.split(/\n\n+/);
  const scored = paragraphs.map(p => {
    const lower = p.toLowerCase();
    const score = terms.reduce((s, t) => s + (lower.includes(t) ? 1 : 0), 0);
    return { text: p, score };
  });

  const relevant = scored.filter((p) => p.score > 0);

  // If nothing matched, return original content (query terms may be too specific)
  if (relevant.length === 0) return content;

  return relevant.map(p => p.text).join("\n\n");
}
