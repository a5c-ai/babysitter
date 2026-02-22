/**
 * hook:run CLI command.
 *
 * Replaces heavy bash hook scripts with a single TypeScript command.
 * Dispatches to the appropriate handler based on --hook-type:
 *   - "stop"          → handleHookRunStop (replaces babysitter-stop-hook.sh)
 *   - "session-start" → handleHookRunSessionStart (replaces babysitter-session-start-hook.sh)
 */

import * as path from "node:path";
import { existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { loadJournal } from "../../storage/journal";
import { readRunMetadata } from "../../storage/runFiles";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { resolveCompletionProof } from "../completionProof";
import type { EffectRecord } from "../../runtime/types";
import { discoverSkillsInternal } from "./skill";
import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  deleteSessionFile,
  getCurrentTimestamp,
  updateIterationTimes,
  isIterationTooFast,
} from "../../session";
import type { SessionState } from "../../session";
import {
  parseTranscriptLastAssistantMessage,
  extractPromiseTag,
} from "./session";

// ---------------------------------------------------------------------------
// Structured file logger for hook diagnostics
// ---------------------------------------------------------------------------

interface HookLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  setContext(key: string, value: string): void;
}

function createHookLogger(hookName: string): HookLogger {
  const logDir = process.env.BABYSITTER_LOG_DIR;
  const logFile = logDir ? path.join(logDir, `${hookName}.log`) : null;
  const context: Record<string, string> = {};

  if (logFile) {
    try {
      mkdirSync(logDir!, { recursive: true });
    } catch {
      // Best-effort
    }
  }

  function write(level: string, message: string): void {
    if (!logFile) return;
    const ts = new Date().toISOString();
    const ctxParts = Object.entries(context).map(
      ([k, v]) => `${k}=${v}`,
    );
    const ctxStr = ctxParts.length > 0 ? ` [${ctxParts.join(" ")}]` : "";
    const line = `[${level}] ${ts}${ctxStr} ${message}\n`;
    try {
      appendFileSync(logFile, line);
    } catch {
      // Best-effort
    }
  }

  return {
    info: (msg: string) => write("INFO", msg),
    warn: (msg: string) => write("WARN", msg),
    error: (msg: string) => write("ERROR", msg),
    setContext: (key: string, value: string) => {
      context[key] = value;
    },
  };
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface HookRunCommandArgs {
  hookType: string;
  pluginRoot?: string;
  stateDir?: string;
  runsDir?: string;
  json: boolean;
  verbose?: boolean;
}

// ---------------------------------------------------------------------------
// Stdin reader
// ---------------------------------------------------------------------------

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Hook input parsing
// ---------------------------------------------------------------------------

interface StopHookInput {
  session_id?: string;
  transcript_path?: string;
}

interface SessionStartHookInput {
  session_id?: string;
}

function parseHookInput(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Malformed JSON — treat as empty
  }
  return {};
}

function safeStr(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === "string" ? val : "";
}

// ---------------------------------------------------------------------------
// Pending-by-kind helper (mirrors session.ts countPendingByKind)
// ---------------------------------------------------------------------------

function countPendingByKind(records: EffectRecord[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.kind ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)),
  );
}

// ---------------------------------------------------------------------------
// handleHookRunStop — replaces babysitter-stop-hook.sh (249 lines)
// ---------------------------------------------------------------------------

async function handleHookRunStop(args: HookRunCommandArgs): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-stop-hook");
  log.info("handleHookRunStop started");

  // 1. Read hook input JSON from stdin
  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn(`stdin read error: ${msg}`);
    if (verbose) {
      process.stderr.write(`[hook:run stop] stdin read error: ${msg}\n`);
    }
    // Allow exit on error
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  const hookInput = parseHookInput(rawInput) as StopHookInput;
  log.info("Hook input received");

  const sessionId = safeStr(hookInput as Record<string, unknown>, "session_id");
  if (!sessionId) {
    // No session ID — allow exit
    log.info("No session ID in hook input — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] No session ID in hook input\n");
    }
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  // 2. Resolve pluginRoot and stateDir
  const pluginRoot =
    args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT || "";
  const stateDir =
    args.stateDir ||
    (pluginRoot ? path.join(pluginRoot, "skills", "babysit", "state") : "");

  if (!stateDir) {
    log.warn("Cannot determine state directory — allowing exit");
    if (verbose) {
      process.stderr.write(
        "[hook:run stop] Cannot determine state directory\n",
      );
    }
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  const runsDir = args.runsDir || ".a5c/runs";

  // 3. Check iteration (replaces session:check-iteration CLI call)
  const filePath = getSessionFilePath(stateDir, sessionId);
  log.info(`Checking session at: ${filePath}`);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      // No active loop
      log.info("No active loop found — allowing exit");
      if (verbose) {
        process.stderr.write(
          `[hook:run stop] No active loop found for session ${sessionId}\n`,
        );
      }
      process.stdout.write('{"decision":"allow"}\n');
      return 0;
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    // Cannot read session — allow exit
    log.warn("Session file read error — allowing exit");
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  const { state } = sessionFile;
  const prompt = sessionFile.prompt ?? "";

  // Check max iterations
  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] Max iterations (${state.maxIterations}) reached\n`,
      );
    }
    await cleanupSession(filePath);
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  // Check iteration timing (runaway loop detection)
  const now = getCurrentTimestamp();
  const updatedTimes =
    state.iteration >= 5
      ? updateIterationTimes(state.iterationTimes, state.lastIterationAt, now)
      : state.iterationTimes;

  if (isIterationTooFast(updatedTimes)) {
    if (verbose) {
      const avg =
        updatedTimes.reduce((a, b) => a + b, 0) / updatedTimes.length;
      process.stderr.write(
        `[hook:run stop] Iteration too fast (avg ${avg}s)\n`,
      );
    }
    await cleanupSession(filePath);
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  // shouldContinue=true at this point
  const iteration = state.iteration;
  const maxIterations = state.maxIterations;
  const runId = state.runId ?? "";
  if (runId) {
    log.setContext("run", runId);
  }

  // 4. Parse transcript for last assistant message
  const transcriptPath = safeStr(
    hookInput as Record<string, unknown>,
    "transcript_path",
  );

  let lastText: string | null = null;
  let hasPromise = false;
  let promiseValue: string | null = null;

  if (transcriptPath) {
    const resolvedTranscript = path.resolve(transcriptPath);
    if (existsSync(resolvedTranscript)) {
      try {
        const content = readFileSync(resolvedTranscript, "utf-8");
        const parsed = parseTranscriptLastAssistantMessage(content);
        lastText = parsed.text;
        if (parsed.found && parsed.text) {
          promiseValue = extractPromiseTag(parsed.text);
          hasPromise = promiseValue !== null;
        }
      } catch {
        // Transcript parse error — cleanup and allow exit
        if (verbose) {
          process.stderr.write(
            `[hook:run stop] Transcript parse error: ${resolvedTranscript}\n`,
          );
        }
        await cleanupSession(filePath);
        process.stdout.write('{"decision":"allow"}\n');
        return 0;
      }
    } else {
      if (verbose) {
        process.stderr.write(
          `[hook:run stop] Transcript not found: ${resolvedTranscript}\n`,
        );
      }
      await cleanupSession(filePath);
      process.stdout.write('{"decision":"allow"}\n');
      return 0;
    }
  }

  if (!lastText) {
    if (verbose) {
      process.stderr.write(
        "[hook:run stop] No assistant text content found in transcript\n",
      );
    }
    await cleanupSession(filePath);
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  // 5. If runId is present, get run status
  let runState = "";
  let completionProof = "";
  let pendingKinds = "";

  if (runId) {
    try {
      const runDir = path.isAbsolute(runId)
        ? runId
        : path.join(runsDir, runId);
      const metadata = await readRunMetadata(runDir);
      const journal = await loadJournal(runDir);
      const index = await buildEffectIndex({ runDir, events: journal });

      const hasCompleted = journal.some((e) => e.type === "RUN_COMPLETED");
      const hasFailed = journal.some((e) => e.type === "RUN_FAILED");

      const pendingRecords = index.listPendingEffects();
      const pendingByKind = countPendingByKind(pendingRecords);
      const kindKeys = Object.keys(pendingByKind);
      if (kindKeys.length > 0) {
        pendingKinds = kindKeys.join(", ");
      }

      if (hasCompleted) {
        runState = "completed";
        completionProof = resolveCompletionProof(metadata);
      } else if (hasFailed) {
        runState = "failed";
      } else if (pendingRecords.length > 0) {
        runState = "waiting";
      } else {
        runState = "created";
      }
    } catch {
      runState = "";
    }

    log.info(`Run state: ${runState || "unknown"}`);
    if (completionProof) {
      log.info("Completion proof available");
    }

    // If state is empty (couldn't determine) → cleanup and allow
    if (!runState) {
      if (verbose) {
        process.stderr.write(
          `[hook:run stop] Run state is empty for ${runId}; run may be misconfigured\n`,
        );
      }
      await cleanupSession(filePath);
      process.stdout.write('{"decision":"allow"}\n');
      return 0;
    }
  }

  // 6. If completionProof matches promiseValue → complete
  if (hasPromise) {
    log.info("Detected valid promise tag");
  }
  if (completionProof && hasPromise && promiseValue === completionProof) {
    log.info("Promise matches completion proof — allowing exit");
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] Valid promise tag detected - run complete\n`,
      );
    }
    await cleanupSession(filePath);
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  // 7. Not complete → continue loop
  if (!prompt) {
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] State file corrupted - no prompt text\n`,
      );
    }
    await cleanupSession(filePath);
    process.stdout.write('{"decision":"allow"}\n');
    return 0;
  }

  const nextIteration = iteration + 1;
  const currentTime = getCurrentTimestamp();

  // Update session state
  const updatedState: SessionState = {
    ...state,
    iteration: nextIteration,
    lastIterationAt: currentTime,
    iterationTimes: updatedTimes,
  };

  try {
    await writeSessionFile(filePath, updatedState, prompt);
  } catch {
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] Failed to update session state\n`,
      );
    }
    // Continue anyway — state might be stale but loop should work
  }

  // 8. Build system message
  let systemMessage: string;

  if (completionProof) {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration} | Run completed! To finish: agent must call 'run:status --json' on your run, extract 'completionProof' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise.`;
  } else if (runState === "waiting" && pendingKinds) {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration} | Waiting on: ${pendingKinds}. Check if pending effects are resolved, then call run:iterate.`;
  } else if (runState === "failed") {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration} | Failed. agent must fix the run, journal or process (inspect the sdk.md if needed) and proceed.`;
  } else {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration} | Agent should continue orchestration (run:iterate)`;
  }

  // 9. Try to resolve skill context
  if (pluginRoot) {
    try {
      const discoverResult = await discoverSkillsInternal({
        pluginRoot,
        runId: runId || undefined,
        runsDir,
      });
      if (discoverResult.summary) {
        systemMessage = `${systemMessage} | Available skills for this task: ${discoverResult.summary}. Use the Skill tool or skill-discovery to load any of these.`;
      }
    } catch {
      // Skill discovery failure is non-fatal
    }
  }

  // Cap system message at 1200 chars
  if (systemMessage.length > 1200) {
    systemMessage = systemMessage.slice(0, 1197) + "...";
  }

  // 10. Output block decision
  const output = {
    decision: "block",
    instructions:
      "use the babysitter skill to advance the orchestration to the next state (run:iterate) or perform the pending effects (task:list --pending --json), or fix the run if it failed.",
    reason: prompt,
    systemMessage,
  };

  process.stdout.write(JSON.stringify(output) + "\n");

  log.info(
    `Decision: block (iteration=${nextIteration}, maxIterations=${maxIterations})`,
  );

  if (verbose) {
    process.stderr.write(
      `[hook:run stop] Blocking stop, iteration=${nextIteration} maxIterations=${maxIterations}\n`,
    );
  }

  return 0;
}

// ---------------------------------------------------------------------------
// handleHookRunSessionStart — replaces babysitter-session-start-hook.sh
// ---------------------------------------------------------------------------

async function handleHookRunSessionStart(
  args: HookRunCommandArgs,
): Promise<number> {
  const { verbose } = args;

  // 1. Read hook input JSON from stdin
  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch {
    process.stdout.write("{}\n");
    return 0;
  }

  const hookInput = parseHookInput(rawInput) as SessionStartHookInput;
  const sessionId = safeStr(
    hookInput as Record<string, unknown>,
    "session_id",
  );

  if (!sessionId) {
    process.stdout.write("{}\n");
    return 0;
  }

  // 2. If CLAUDE_ENV_FILE is set, append session ID export
  const envFile = process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      appendFileSync(envFile, `export CLAUDE_SESSION_ID="${sessionId}"\n`);
    } catch {
      // Non-fatal — env file write failure
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Failed to write to CLAUDE_ENV_FILE: ${envFile}\n`,
        );
      }
    }
  }

  if (verbose) {
    process.stderr.write(
      `Babysitter session started: ${sessionId}\n`,
    );
  }

  // 3. Output empty object
  process.stdout.write("{}\n");
  return 0;
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------

async function cleanupSession(filePath: string): Promise<void> {
  try {
    await deleteSessionFile(filePath);
  } catch {
    // Best-effort cleanup
  }
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function handleHookRun(args: HookRunCommandArgs): Promise<number> {
  const { hookType, json } = args;

  if (!hookType) {
    const error = {
      error: "MISSING_HOOK_TYPE",
      message: "--hook-type is required for hook:run",
    };
    if (json) {
      process.stderr.write(JSON.stringify(error) + "\n");
    } else {
      process.stderr.write("Error: --hook-type is required for hook:run\n");
    }
    return 1;
  }

  switch (hookType) {
    case "stop":
      return await handleHookRunStop(args);
    case "session-start":
      return await handleHookRunSessionStart(args);
    default: {
      const error = {
        error: "UNKNOWN_HOOK_TYPE",
        message: `Unknown hook type: ${hookType}. Supported: stop, session-start`,
      };
      if (json) {
        process.stderr.write(JSON.stringify(error) + "\n");
      } else {
        process.stderr.write(
          `Error: Unknown hook type: ${hookType}. Supported: stop, session-start\n`,
        );
      }
      return 1;
    }
  }
}
