/**
 * log CLI command.
 *
 * Writes a structured log entry to the appropriate contextual log file.
 * Intended to be called from shell hooks and scripts as a canonical way
 * to emit structured logs without embedding JSONL formatting inline.
 *
 * Usage:
 *   babysitter log --type <process|hook|cli> --message <msg> [--run-id <id>] [--label <label>] [--level <level>] [--source <src>] [--json]
 */

import { appendRunLog } from "../../logging/runLogger";
import type { RunLogLevel, LogType } from "../../logging/runLogger";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface LogCommandArgs {
  logType: string;
  message: string;
  runId?: string;
  processId?: string;
  label?: string;
  level?: string;
  source?: string;
  json: boolean;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_LOG_TYPES = new Set<string>(["process", "hook", "cli"]);
const VALID_LOG_LEVELS = new Set<string>(["debug", "info", "warn", "error"]);

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleLog(args: LogCommandArgs): Promise<number> {
  const { logType, message, runId, processId, label, source, json } = args;
  const level = (args.level || "info") as RunLogLevel;

  if (!logType) {
    const error = { error: "MISSING_LOG_TYPE", message: "--type is required (process, hook, cli)" };
    if (json) {
      process.stderr.write(JSON.stringify(error, null, 2) + "\n");
    } else {
      process.stderr.write("Error: --type is required (process, hook, cli)\n");
    }
    return 1;
  }

  if (!VALID_LOG_TYPES.has(logType)) {
    const error = {
      error: "INVALID_LOG_TYPE",
      message: `Invalid log type: "${logType}". Must be one of: process, hook, cli`,
    };
    if (json) {
      process.stderr.write(JSON.stringify(error, null, 2) + "\n");
    } else {
      process.stderr.write(`Error: ${error.message}\n`);
    }
    return 1;
  }

  if (!message) {
    const error = { error: "MISSING_MESSAGE", message: "--message is required" };
    if (json) {
      process.stderr.write(JSON.stringify(error, null, 2) + "\n");
    } else {
      process.stderr.write("Error: --message is required\n");
    }
    return 1;
  }

  if (!VALID_LOG_LEVELS.has(level)) {
    const error = {
      error: "INVALID_LOG_LEVEL",
      message: `Invalid log level: "${level}". Must be one of: debug, info, warn, error`,
    };
    if (json) {
      process.stderr.write(JSON.stringify(error, null, 2) + "\n");
    } else {
      process.stderr.write(`Error: ${error.message}\n`);
    }
    return 1;
  }

  try {
    const logPath = await appendRunLog({
      timestamp: new Date().toISOString(),
      level,
      type: logType as LogType,
      label: label || undefined,
      message,
      runId: runId || undefined,
      processId: processId || undefined,
      source: source || undefined,
    });

    if (json) {
      console.log(JSON.stringify({ ok: true, logPath }));
    }
    return 0;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const error = { error: "LOG_WRITE_FAILED", message: errMsg };
    if (json) {
      process.stderr.write(JSON.stringify(error, null, 2) + "\n");
    } else {
      process.stderr.write(`Error: Failed to write log: ${errMsg}\n`);
    }
    return 1;
  }
}
