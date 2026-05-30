/**
 * hook:log CLI command.
 *
 * Reads a hook payload from stdin, extracts the relevant fields for the
 * given hook type, formats a structured log line, and appends it to the
 * specified log file.  This consolidates the field-extraction logic that
 * was previously duplicated across 13 logger.sh shell scripts.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveInputPath } from "../../resolveInputPath";
import type { KnownHookType } from "../../../hooks/types";
import { BABYSITTER_SDK_VERSION } from "../../../sdkVersion";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface HookLogCommandArgs {
  hookType: string;
  logFile: string;
  json: boolean;
}

// ---------------------------------------------------------------------------
// Event label mapping (matches the label used in the original logger.sh)
// ---------------------------------------------------------------------------

const HOOK_EVENT_LABELS: Record<KnownHookType, string> = {
  "on-run-start": "RUN_START",
  "on-run-complete": "RUN_COMPLETE",
  "on-run-fail": "RUN_FAIL",
  "on-task-start": "TASK_START",
  "on-task-complete": "TASK_COMPLETE",
  "on-step-dispatch": "STEP_DISPATCH",
  "on-iteration-start": "ITERATION_START",
  "on-iteration-end": "ITERATION_END",
  "session.setup": "SESSION_SETUP",
  "turn.prompt_expansion": "TURN_PROMPT_EXPANSION",
  "turn.stop_failure": "TURN_STOP_FAILURE",
  "tool.after_failure": "TOOL_AFTER_FAILURE",
  "tool.after_batch": "TOOL_AFTER_BATCH",
  "task.created": "TASK_CREATED",
  "task.completed": "TASK_COMPLETED",
  "team.idle": "TEAM_IDLE",
  "session.instructions_loaded": "SESSION_INSTRUCTIONS_LOADED",
  "session.config_changed": "SESSION_CONFIG_CHANGED",
  "message.received": "MESSAGE_RECEIVED",
  "model.before_request": "MODEL_BEFORE_REQUEST",
  "model.after_response": "MODEL_AFTER_RESPONSE",
  "planner.before_tool_selection": "PLANNER_BEFORE_TOOL_SELECTION",
  "on-breakpoint": "BREAKPOINT",
  "on-permission-denied": "PERMISSION_DENIED",
  "pre-commit": "PRE_COMMIT",
  "pre-branch": "PRE_BRANCH",
  "post-planning": "POST_PLANNING",
  "on-score": "SCORE",
};

const KNOWN_HOOK_TYPES = new Set<string>(Object.keys(HOOK_EVENT_LABELS));

// ---------------------------------------------------------------------------
// Payload helpers
// ---------------------------------------------------------------------------

/** Safely read a string field from a parsed JSON object. */
function str(payload: Record<string, unknown>, key: string, fallback = "unknown"): string {
  const value = payload[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

/** Safely read a nested string field (e.g. ".context.runId"). */
function nestedStr(
  payload: Record<string, unknown>,
  outerKey: string,
  innerKey: string,
  fallback = "unknown",
): string {
  const outer = payload[outerKey];
  if (outer && typeof outer === "object" && !Array.isArray(outer)) {
    const inner = (outer as Record<string, unknown>)[innerKey];
    if (typeof inner === "string") return inner;
  }
  return fallback;
}

/** Safely read the length of an array field. */
function arrayLength(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (Array.isArray(value)) return String(value.length);
  return "unknown";
}

// ---------------------------------------------------------------------------
// Per-hook field extractors
//
// Each extractor returns an array of key=value pairs that mirror the fields
// the original logger.sh scripts extracted via jq.
// ---------------------------------------------------------------------------

type FieldExtractor = (payload: Record<string, unknown>) => Array<[string, string]>;

const FIELD_EXTRACTORS: Record<KnownHookType, FieldExtractor> = {
  "on-run-start": (p) => [
    ["runId", str(p, "runId")],
    ["processId", str(p, "processId")],
    ["entry", str(p, "entry")],
  ],

  "on-run-complete": (p) => [
    ["runId", str(p, "runId")],
    ["status", str(p, "status")],
    ["duration", str(p, "duration")],
  ],

  "on-run-fail": (p) => [
    ["runId", str(p, "runId")],
    ["error", str(p, "error")],
    ["duration", str(p, "duration")],
  ],

  "on-task-start": (p) => [
    ["runId", str(p, "runId")],
    ["effectId", str(p, "effectId")],
    ["taskId", str(p, "taskId")],
    ["kind", str(p, "kind")],
  ],

  "on-task-complete": (p) => [
    ["runId", str(p, "runId")],
    ["effectId", str(p, "effectId")],
    ["taskId", str(p, "taskId")],
    ["status", str(p, "status")],
    ["duration", str(p, "duration")],
  ],

  "on-step-dispatch": (p) => [
    ["runId", str(p, "runId")],
    ["stepId", str(p, "stepId")],
    ["action", str(p, "action")],
  ],

  "on-iteration-start": (p) => [
    ["runId", str(p, "runId")],
    ["iteration", str(p, "iteration")],
  ],

  "on-iteration-end": (p) => [
    ["runId", str(p, "runId")],
    ["iteration", str(p, "iteration")],
    ["status", str(p, "status")],
  ],

  "session.setup": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["trigger", str(p, "trigger")],
  ],

  "turn.prompt_expansion": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["command", str(p, "command_name")],
    ["source", str(p, "command_source")],
  ],

  "turn.stop_failure": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["errorType", str(p, "error_type")],
    ["message", str(p, "error_message", "N/A")],
  ],

  "tool.after_failure": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["tool", str(p, "tool_name")],
    ["exitCode", str(p, "exit_code", "N/A")],
  ],

  "tool.after_batch": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["batchResults", arrayLength(p, "batch_results")],
    ["toolResults", arrayLength(p, "tool_results")],
  ],

  "task.created": (p) => [
    ["runId", str(p, "runId")],
    ["effectId", str(p, "effectId", str(p, "task_id"))],
    ["taskId", str(p, "taskId", "N/A")],
    ["kind", str(p, "kind", str(p, "task_kind"))],
  ],

  "task.completed": (p) => [
    ["runId", str(p, "runId")],
    ["effectId", str(p, "effectId", str(p, "task_id"))],
    ["taskId", str(p, "taskId", "N/A")],
    ["status", str(p, "status", str(p, "task_status"))],
  ],

  "team.idle": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["agentId", str(p, "agent_id")],
    ["reason", str(p, "idle_reason", "N/A")],
  ],

  "session.instructions_loaded": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["file", str(p, "file_path")],
    ["reason", str(p, "load_reason", "N/A")],
  ],

  "session.config_changed": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["path", str(p, "config_path")],
    ["setting", str(p, "setting_key", "N/A")],
  ],

  "message.received": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["turnId", str(p, "turn_id", "N/A")],
    ["messageId", str(p, "message_id", "N/A")],
  ],

  "model.before_request": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["model", str(p, "model", "N/A")],
  ],

  "model.after_response": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["model", str(p, "model", "N/A")],
  ],

  "planner.before_tool_selection": (p) => [
    ["runId", str(p, "runId", "N/A")],
    ["planner", str(p, "planner", "N/A")],
    ["tools", arrayLength(p, "tools")],
  ],

  "on-breakpoint": (p) => [
    // The original logger.sh uses: .runId // .context.runId // "unknown"
    ["runId", typeof p.runId === "string" ? p.runId : nestedStr(p, "context", "runId")],
    ["question", str(p, "question", "N/A")],
    ["reason", str(p, "reason", "N/A")],
  ],

  "on-permission-denied": (p) => [
    ["breakpointId", str(p, "breakpointId")],
    ["kind", str(p, "kind")],
    ["runId", str(p, "runId", "N/A")],
    ["respondedBy", str(p, "respondedBy", "N/A")],
  ],

  "pre-commit": (p) => [
    ["runId", str(p, "runId")],
    ["files", arrayLength(p, "files")],
    ["message", str(p, "message")],
  ],

  "pre-branch": (p) => [
    ["runId", str(p, "runId")],
    ["branch", str(p, "branch")],
    ["base", str(p, "base")],
  ],

  "post-planning": (p) => [
    ["runId", str(p, "runId")],
    ["planFile", str(p, "planFile")],
  ],

  "on-score": (p) => [
    ["runId", str(p, "runId")],
    ["target", str(p, "target")],
    ["score", str(p, "score")],
  ],
};

// ---------------------------------------------------------------------------
// Log line formatting
// ---------------------------------------------------------------------------

function formatLogLine(
  hookType: string,
  eventLabel: string,
  fields: Array<[string, string]>,
): string {
  const timestamp = new Date().toISOString();
  const kvPairs = [...fields, ["sdkVersion", BABYSITTER_SDK_VERSION]]
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  return `[${timestamp}] [${eventLabel}] hook=${hookType} ${kvPairs}`;
}

// ---------------------------------------------------------------------------
// Stdin reader (reusable)
// ---------------------------------------------------------------------------

function readStdinUtf8(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function handleHookLog(args: HookLogCommandArgs): Promise<number> {
  const { hookType, logFile, json } = args;

  // Validate --hook-type
  if (!hookType) {
    const error = { error: "MISSING_HOOK_TYPE", message: "--hook-type is required" };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error("Error: --hook-type is required for hook:log");
    }
    return 1;
  }

  // Validate --log-file
  if (!logFile) {
    const error = { error: "MISSING_LOG_FILE", message: "--log-file is required" };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error("Error: --log-file is required for hook:log");
    }
    return 1;
  }

  // Read payload from stdin
  let rawPayload: string;
  try {
    rawPayload = await readStdinUtf8();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const error = { error: "STDIN_READ_ERROR", message: msg };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error(`Error: Failed to read stdin: ${msg}`);
    }
    return 1;
  }

  // Parse JSON payload
  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawPayload.trim() || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Payload must be a JSON object");
    }
    payload = parsed as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const error = { error: "INVALID_PAYLOAD", message: msg };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error(`Error: Failed to parse JSON payload: ${msg}`);
    }
    return 1;
  }

  // Determine event label and field extractor
  const isKnown = KNOWN_HOOK_TYPES.has(hookType);
  const eventLabel = isKnown
    ? HOOK_EVENT_LABELS[hookType as KnownHookType]
    : hookType.toUpperCase().replace(/-/g, "_");

  const fields: Array<[string, string]> = isKnown
    ? FIELD_EXTRACTORS[hookType as KnownHookType](payload)
    : [["runId", str(payload, "runId")]];

  // Format log line
  const logLine = formatLogLine(hookType, eventLabel, fields);

  // Ensure log directory exists and append
  try {
    const resolvedLogFile = resolveInputPath(logFile);
    const logDir = path.dirname(resolvedLogFile);
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(resolvedLogFile, logLine + "\n", "utf8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const error = { error: "LOG_WRITE_ERROR", message: msg };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error(`Error: Failed to write to log file: ${msg}`);
    }
    return 1;
  }

  // Output confirmation
  if (json) {
    console.log(
      JSON.stringify({
        hookType,
        eventLabel,
        logFile: resolveInputPath(logFile),
        logLine,
      }),
    );
  } else {
    console.log(logLine);
  }

  return 0;
}
