/**
 * Structured run logger.
 *
 * Provides a common logging facility that writes structured log lines to
 * contextual log files under `~/.a5c/logs/`.  Each log type maps to a
 * specific file name within the run directory or the global log root:
 *
 *   - `process` → `<runId>/process.log`   (ctx.log in process definitions)
 *   - `hook`    → `<runId>/hooks.log`     (hook execution, per-run)
 *   - `hook`    → `hooks.log`             (hook execution, no runId)
 *   - `cli`     → `cli.log`              (CLI command operations)
 *
 * Log lines are append-only, one JSON object per line (JSONL), making them
 * easy to parse, grep, and stream.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RunLogLevel = "debug" | "info" | "warn" | "error";

/** Determines which log file receives the entry. */
export type LogType = "process" | "hook" | "cli";

export interface RunLogEntry {
  timestamp: string;
  level: RunLogLevel;
  /** Log type — controls which file the entry is written to. */
  type?: LogType;
  label?: string;
  message: string;
  runId?: string;
  processId?: string;
  source?: string;
  context?: Record<string, unknown>;
}

export interface RunLoggerOptions {
  runId: string;
  processId?: string;
  /** Override the default log root (`~/.a5c/logs`). */
  logDir?: string;
  /** Source tag (e.g. "ctx.log", "hook:run", "hook:stop"). */
  source?: string;
  /** Default log type for all entries from this logger. */
  type?: LogType;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const LOG_DIR_ENV = "BABYSITTER_LOG_DIR";

export function getDefaultLogDir(): string {
  return process.env[LOG_DIR_ENV] || path.join(os.homedir(), ".a5c", "logs");
}

/** Log file names by type. */
const LOG_FILE_NAMES: Record<LogType, string> = {
  process: "process.log",
  hook: "hooks.log",
  cli: "cli.log",
};

/**
 * Resolve the log file path for a given entry.
 *
 * - With `runId`: `<logDir>/<runId>/<typeName>.log`
 * - Without `runId`: `<logDir>/<typeName>.log`
 */
export function resolveLogPath(logDir: string, logType: LogType, runId?: string): string {
  const fileName = LOG_FILE_NAMES[logType];
  if (runId) {
    return path.join(logDir, runId, fileName);
  }
  return path.join(logDir, fileName);
}

/** @deprecated Use resolveLogPath instead. Kept for backwards compat. */
export function getRunLogPath(logDir: string, runId: string): string {
  return resolveLogPath(logDir, "process", runId);
}

/** @deprecated Use resolveLogPath instead. Kept for backwards compat. */
export function getGlobalLogPath(logDir: string): string {
  return path.join(logDir, "hooks.log");
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatLogLine(entry: RunLogEntry): string {
  const record: Record<string, unknown> = {
    ts: entry.timestamp,
    level: entry.level,
  };
  if (entry.type) record.type = entry.type;
  if (entry.label) record.label = entry.label;
  record.msg = entry.message;
  if (entry.runId) record.runId = entry.runId;
  if (entry.processId) record.processId = entry.processId;
  if (entry.source) record.source = entry.source;
  if (entry.context && Object.keys(entry.context).length > 0) {
    record.ctx = entry.context;
  }
  return JSON.stringify(record) + "\n";
}

// ---------------------------------------------------------------------------
// Core append
// ---------------------------------------------------------------------------

/**
 * Append a single structured log entry to the appropriate log file.
 *
 * File selection uses the entry's `type` field (defaults to "process"):
 * - With `runId`: `<logDir>/<runId>/<type>.log`
 * - Without `runId`: `<logDir>/<type>.log`
 *
 * Creates parent directories on first write.  Returns the resolved log
 * file path.
 */
export async function appendRunLog(
  entry: RunLogEntry,
  options?: { logDir?: string },
): Promise<string> {
  const logDir = options?.logDir || getDefaultLogDir();
  const logType = entry.type || "process";
  const logPath = resolveLogPath(logDir, logType, entry.runId);
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  const line = formatLogLine(entry);
  await fs.appendFile(logPath, line, "utf8");
  return logPath;
}

// ---------------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------------

/**
 * Create a bound logger for a specific run.
 *
 * The returned object provides level-specific methods (`info`, `warn`, etc.)
 * that automatically populate `runId`, `processId`, `source`, and `type` on
 * every entry.  Each method is fire-and-forget: errors are swallowed so
 * logging never breaks orchestration.
 */
export function createRunLogger(options: RunLoggerOptions) {
  const { runId, processId, logDir, source, type: defaultType } = options;

  function write(level: RunLogLevel, label: string, message: string, context?: Record<string, unknown>): void {
    void appendRunLog(
      {
        timestamp: new Date().toISOString(),
        level,
        type: defaultType,
        label: label || undefined,
        message,
        runId,
        processId,
        source,
        context,
      },
      { logDir },
    ).catch(() => {
      // Never let logging break orchestration.
    });
  }

  return {
    debug: (label: string, message: string, context?: Record<string, unknown>) =>
      write("debug", label, message, context),
    info: (label: string, message: string, context?: Record<string, unknown>) =>
      write("info", label, message, context),
    warn: (label: string, message: string, context?: Record<string, unknown>) =>
      write("warn", label, message, context),
    error: (label: string, message: string, context?: Record<string, unknown>) =>
      write("error", label, message, context),
    /** Raw write — lets callers specify the level explicitly. */
    log: write,
  };
}
