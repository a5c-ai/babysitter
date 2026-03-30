/**
 * Claude Code harness adapter.
 *
 * Centralizes all Claude Code-specific behaviors:
 *   - Session ID resolution (CLAUDE_SESSION_ID, CLAUDE_ENV_FILE)
 *   - Plugin root resolution (CLAUDE_PLUGIN_ROOT)
 *   - State directory conventions (pluginRoot/skills/babysit/state)
 *   - Session binding (run:create → state file with run association)
 *   - Stop hook handler (approve/block decision)
 *   - Session-start hook handler (env file + baseline state file)
 *   - Hook dispatcher path (CLAUDE_PLUGIN_ROOT-based lookup)
 */

import * as path from "node:path";
import { existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { loadJournal, appendEvent } from "../storage/journal";
import { readRunMetadata } from "../storage/runFiles";
import { buildEffectIndex } from "../runtime/replay/effectIndex";
import { resolveCompletionProof } from "../cli/completionProof";
import { collapseDoubledA5cRuns } from "../cli/resolveInputPath";
import type { EffectRecord } from "../runtime/types";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../runtime/exceptions";
import { discoverSkillsInternal } from "../cli/commands/skill";
import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  deleteSessionFile,
  updateSessionState,
  getCurrentTimestamp,
  updateIterationTimes,
  isIterationTooFast,
} from "../session";
import type { SessionState } from "../session";
import {
  parseTranscriptLastAssistantMessage,
  extractPromiseTag,
} from "../cli/commands/session";
import type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "./types";
import { loadCompressionConfig } from "../compression/config-loader";
import { densityFilterText, estimateTokens } from "../compression/density-filter";
import { getOrCompressFile, findLibraryFiles } from "../compression/library-cache";
import {
  execFilePromise,
  getClaudeInstalledPluginsPath,
  installCliViaNpm,
  isClaudePluginInstalled,
  renderCommand,
} from "./installSupport";

// ---------------------------------------------------------------------------
// Structured file logger (moved from hookRun.ts)
// ---------------------------------------------------------------------------

interface HookLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  setContext(key: string, value: string): void;
}

function createHookLogger(hookName: string): HookLogger {
  const logDir = process.env.BABYSITTER_LOG_DIR || '.a5c/logs';
  const logFile = logDir ? path.join(logDir, `${hookName}.log`) : null;
  const context: Record<string, string> = {};

  if (logFile) {
    try {
      mkdirSync(logDir, { recursive: true });
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

async function appendStopHookEvent(
  runDir: string,
  data: {
    sessionId: string;
    iteration: number;
    decision: "approve" | "block";
    reason: string;
    runState: string;
    pendingKinds: string;
    hasPromise: boolean;
  },
): Promise<void> {
  try {
    await appendEvent({
      runDir,
      eventType: "STOP_HOOK_INVOKED",
      event: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Best-effort: don't fail the hook if journal write fails
  }
}

// ---------------------------------------------------------------------------
// Stdin reader
// ---------------------------------------------------------------------------

function readStdin(): Promise<string> {
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

interface ClaudeCodeStopHookInput {
  session_id?: string;
  transcript_path?: string;
  last_assistant_message?: string;
}

interface ClaudeCodeSessionStartHookInput {
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
// Pending-by-kind helper
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

/**
 * Returns true when every pending effect is a breakpoint (human-approval gate).
 * Breakpoints require external human action, so the stop hook should allow exit
 * rather than spinning the orchestration loop uselessly.
 */
function isOnlyBreakpoints(pendingByKind: Record<string, number>): boolean {
  const keys = Object.keys(pendingByKind);
  return keys.length === 1 && keys[0] === "breakpoint";
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

/**
 * Resolve the current session ID from environment, independent of the hook
 * payload. After `/clear`, the hook payload may carry a stale session ID while
 * CLAUDE_SESSION_ID or CLAUDE_ENV_FILE reflects the actual active session.
 */
function resolveCurrentSessionIdFromEnv(): string | undefined {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  const envFile = process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      const content = readFileSync(envFile, "utf-8");
      const match = content.match(/export CLAUDE_SESSION_ID="([^"]+)"/);
      if (match?.[1]) return match[1];
    } catch {
      // Non-fatal
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Stop hook handler
// ---------------------------------------------------------------------------

async function handleStopHookImpl(args: HookHandlerArgs): Promise<number> {
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
    process.stdout.write("{}\n");
    return 0;
  }

  const hookInput = parseHookInput(rawInput) as ClaudeCodeStopHookInput;
  log.info("Hook input received");

  let sessionId = safeStr(hookInput as Record<string, unknown>, "session_id");
  if (!sessionId) {
    log.info("No session ID in hook input — allowing exit");
    if (verbose) {
      process.stderr.write("[hook:run stop] No session ID in hook input\n");
    }
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  // 2. Resolve pluginRoot and stateDir (always resolve to absolute paths)
  const pluginRoot =
    args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT || "";
  const resolvedPluginRoot = pluginRoot ? path.resolve(pluginRoot) : "";
  const stateDir =
    args.stateDir
      ? path.resolve(args.stateDir)
      : (resolvedPluginRoot ? path.resolve(resolvedPluginRoot, "skills", "babysit", "state") : "");

  if (!stateDir) {
    log.warn("Cannot determine state directory — allowing exit");
    if (verbose) {
      process.stderr.write(
        "[hook:run stop] Cannot determine state directory\n",
      );
    }
    process.stdout.write("{}\n");
    return 0;
  }

  log.info(`Resolved pluginRoot: ${resolvedPluginRoot || "(empty)"}`);
  log.info(`Resolved stateDir: ${stateDir}`);

  const runsDir = collapseDoubledA5cRuns(path.resolve(args.runsDir || ".a5c/runs"));

  // 3. Check iteration — try primary stateDir, then fallback to .a5c/state/
  let filePath = getSessionFilePath(stateDir, sessionId);
  log.info(`Checking session file at: ${filePath}`);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      // Fallback: check .a5c/state/ directory
      const fallbackStateDir = path.resolve(".a5c", "state");
      const fallbackPath = getSessionFilePath(fallbackStateDir, sessionId);
      log.info(`Primary state file not found, trying fallback: ${fallbackPath}`);
      if (await sessionFileExists(fallbackPath)) {
        filePath = fallbackPath;
        log.info(`Found session file at fallback path: ${filePath}`);
      } else {
        // Fallback: the hook payload may carry a stale session ID (e.g. after
        // /clear). Try resolving the *current* session ID from CLAUDE_SESSION_ID
        // or CLAUDE_ENV_FILE and retry the lookup if it differs.
        const envSessionId = resolveCurrentSessionIdFromEnv();
        if (envSessionId && envSessionId !== sessionId) {
          log.info(`Payload session ${sessionId} is stale; current env session is ${envSessionId} — retrying lookup`);
          const primaryRetry = getSessionFilePath(stateDir, envSessionId);
          const fallbackRetry = getSessionFilePath(fallbackStateDir, envSessionId);
          if (await sessionFileExists(primaryRetry)) {
            filePath = primaryRetry;
            sessionId = envSessionId;
            log.setContext("session", sessionId);
            log.info(`Found session file for env session at primary: ${filePath}`);
          } else if (await sessionFileExists(fallbackRetry)) {
            filePath = fallbackRetry;
            sessionId = envSessionId;
            log.setContext("session", sessionId);
            log.info(`Found session file for env session at fallback: ${filePath}`);
          } else {
            log.info(`No active loop found for payload session ${sessionId} or env session ${envSessionId} — allowing exit`);
            if (verbose) {
              process.stderr.write(
                `[hook:run stop] No active loop found for session ${sessionId} or ${envSessionId}\n`,
              );
            }
            process.stdout.write("{}\n");
            return 0;
          }
        } else {
          log.info(`No active loop found at primary (${filePath}) or fallback (${fallbackPath}) — allowing exit`);
          if (verbose) {
            process.stderr.write(
              `[hook:run stop] No active loop found for session ${sessionId}\n`,
            );
          }
          process.stdout.write("{}\n");
          return 0;
        }
      }
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    log.warn(`Session file read error at ${filePath} — allowing exit`);
    process.stdout.write("{}\n");
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
    if (state.runId) {
      await appendStopHookEvent(path.join(runsDir, state.runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "max_iterations_reached",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      });
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
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
    if (state.runId) {
      await appendStopHookEvent(path.join(runsDir, state.runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "iteration_too_fast",
        runState: "",
        pendingKinds: "",
        hasPromise: false,
      });
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

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
        log.warn(`Transcript parse error: ${resolvedTranscript}`);
      }
    } else {
      log.warn(`Transcript not found: ${resolvedTranscript}`);
    }
  }

  // Fallback: use last_assistant_message from hook input if transcript parse
  // yielded no text (e.g., last JSONL line was tool_use-only).
  if (!lastText) {
    const hookLastMsg = safeStr(hookInput as Record<string, unknown>, "last_assistant_message");
    if (hookLastMsg) {
      lastText = hookLastMsg;
      promiseValue = extractPromiseTag(hookLastMsg);
      hasPromise = promiseValue !== null;
      log.info("Using last_assistant_message from hook input (transcript had no text)");
    }
  }

  // Note: lastText may still be null if the assistant's last turn was all
  // tool_use blocks and the hook input didn't include last_assistant_message.
  // This is fine — we proceed with promise check (which will be false) and
  // continue the loop if a run is bound.

  // 4b. If no run is associated, there's nothing to iterate on — allow exit
  if (!runId) {
    log.info("No run associated with session — allowing exit");
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] No run associated with session ${sessionId} — allowing exit\n`,
      );
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  // 5. If runId is present, get run status
  let runState = "";
  let completionProof = "";
  let pendingKinds = "";
  let onlyBreakpointsPending = false;
  let entrypointImportPath: string | undefined;

  if (runId) {
    try {
      let runDir = path.isAbsolute(runId)
        ? runId
        : path.join(runsDir, runId);
      // Fallback: if run.json not found at primary path, search common
      // alternative locations (e.g. nested .a5c/.a5c/runs/ created when
      // babysit skill installs SDK in .a5c/ and runs commands from there).
      if (!existsSync(path.join(runDir, "run.json")) && !path.isAbsolute(runId)) {
        const alternatives = [
          path.join(".a5c", ".a5c", "runs", runId),
          path.join(".a5c", "runs", runId),
        ];
        for (const alt of alternatives) {
          const resolved = path.resolve(alt);
          if (resolved !== path.resolve(runDir) && existsSync(path.join(resolved, "run.json"))) {
            log.info(`Run not found at ${runDir}, using fallback: ${resolved}`);
            runDir = resolved;
            break;
          }
        }
      }
      const metadata = await readRunMetadata(runDir);
      entrypointImportPath = metadata?.entrypoint?.importPath;
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
      onlyBreakpointsPending = pendingRecords.length > 0 && isOnlyBreakpoints(pendingByKind);

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

    if (!runState) {
      log.warn(`Run state unknown for ${runId} — allowing exit but preserving session file for recovery`);
      if (verbose) {
        process.stderr.write(
          `[hook:run stop] Run state is empty for ${runId}; run may be misconfigured — preserving session file\n`,
        );
      }
      if (runId) {
        await appendStopHookEvent(path.join(runsDir, runId), {
          sessionId,
          iteration: state.iteration,
          decision: "approve",
          reason: "run_state_unknown",
          runState,
          pendingKinds,
          hasPromise,
        });
      }
      // Do NOT delete session file here — the run state may be temporarily
      // unreadable (race with run:create, disk issue, etc.). Preserving the
      // file allows session:associate or doctor to re-bind and recover.
      process.stdout.write("{}\n");
      return 0;
    }
  }

  // 5b. If the run is waiting but ONLY on breakpoints, allow exit.
  // Breakpoints require human interaction — spinning the orchestration loop
  // accomplishes nothing and wastes iterations. The user (or an external
  // system) must resolve breakpoints before the run can proceed.
  if (runState === "waiting" && onlyBreakpointsPending) {
    log.info(`Run waiting on breakpoints only (${pendingKinds}) — allowing exit`);
    if (verbose) {
      process.stderr.write(
        `[hook:run stop] Run waiting on breakpoint(s) — allowing exit for human resolution\n`,
      );
    }
    if (runId) {
      await appendStopHookEvent(path.join(runsDir, runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "breakpoint_waiting",
        runState,
        pendingKinds,
        hasPromise,
      });
    }
    process.stdout.write("{}\n");
    return 0;
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
    if (runId) {
      await appendStopHookEvent(path.join(runsDir, runId), {
        sessionId,
        iteration: state.iteration,
        decision: "approve",
        reason: "completion_proof_matched",
        runState,
        pendingKinds,
        hasPromise,
      });
    }
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  // 7. Not complete → continue loop
  // Note: prompt may be empty if session:init ran before run:create populated it.
  // This is legitimate — the session is active with a bound run, so we continue
  // the loop regardless of whether the prompt text is populated.
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
  }

  // 8. Build reason (shown to Claude) and systemMessage (shown to user)
  let iterationContext: string;

  if (completionProof) {
    iterationContext = `Babysitter iteration ${nextIteration} | Run completed! To finish: call 'run:status --json' on your run, extract 'completionProof' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise.`;
  } else if (runState === "waiting" && pendingKinds) {
    iterationContext = `Babysitter iteration ${nextIteration} | Waiting on: ${pendingKinds}. Check if pending effects are resolved, then call run:iterate.`;
  } else if (runState === "failed") {
    iterationContext = `Babysitter iteration ${nextIteration} | Run failed. Fix the run, journal or process (inspect the sdk.md if needed) and proceed.`;
  } else {
    iterationContext = `Babysitter iteration ${nextIteration} | Continue orchestration (run:iterate).`;
  }

  // Load compression config once — used for both sdkContextHook and processLibraryCache.
  // Failures are non-fatal: both hooks fall back to uncompressed content.
  let compressionCfg: ReturnType<typeof loadCompressionConfig> | null = null;
  try {
    compressionCfg = loadCompressionConfig(process.cwd());
  } catch {
    // Best-effort
  }

  // 9. Try to resolve skill/agent context relevant to the process
  let librarySection = "";
  if (resolvedPluginRoot) {
    try {
      const discoverResult = await discoverSkillsInternal({
        pluginRoot: resolvedPluginRoot,
        runId: runId || undefined,
        runsDir,
        processPath: entrypointImportPath,
      });

      // Exclude the babysit skill itself (it's the orchestrator, not a worker)
      const EXCLUDED_SKILLS = new Set(["babysit", "babysitter"]);
      const relevantSkills = (discoverResult.skills || []).filter(
        (s) => !EXCLUDED_SKILLS.has(s.name.toLowerCase()),
      );
      const relevantAgents = discoverResult.agents || [];

      // Build a compact list with full paths, capped at 10 total
      const MAX_ITEMS = 10;
      const items: string[] = [];
      for (const s of relevantSkills) {
        if (items.length >= MAX_ITEMS) break;
        items.push(`skill:${s.name}${s.file ? ` [${s.file}]` : ""}`);
      }
      for (const a of relevantAgents) {
        if (items.length >= MAX_ITEMS) break;
        items.push(`agent:${a.name}${a.file ? ` [${a.file}]` : ""}`);
      }

      if (items.length > 0) {
        iterationContext = `${iterationContext} | Discovered: ${items.join(", ")}`;
      }

      // processLibraryCache: inject compressed skill/agent content inline so
      // Claude has it without needing to read each file separately.
      const cacheLayer = compressionCfg?.layers.processLibraryCache;
      if (compressionCfg?.enabled && cacheLayer?.enabled) {
        const cacheDir = path.join(process.cwd(), ".a5c", "cache", "compression");
        const sections: string[] = [];
        const libraryItems = [
          ...relevantSkills.slice(0, 4).map((s) => ({ kind: "Skill" as const, name: s.name, file: s.file })),
          ...relevantAgents.slice(0, 2).map((a) => ({ kind: "Agent" as const, name: a.name, file: a.file })),
        ];
        for (const item of libraryItems) {
          if (!item.file) continue;
          const content = getOrCompressFile(item.file, cacheLayer.targetReduction, cacheLayer.ttlHours, cacheDir);
          if (content) {
            sections.push(`### ${item.kind}: ${item.name}\n${content}`);
          }
        }
        if (sections.length > 0) {
          librarySection = "\n\n---\n## Available Skills & Agents\n" + sections.join("\n\n---\n");
        }
      }
    } catch {
      // Skill discovery failure is non-fatal
    }
  }

  // reason = what Claude sees; combine iteration context with the original prompt.
  // sdkContextHook: compress the run prompt if enabled and long enough.
  let effectivePrompt = prompt;
  if (compressionCfg?.enabled && compressionCfg.layers.sdkContextHook.enabled) {
    const sdkLayer = compressionCfg.layers.sdkContextHook;
    if (estimateTokens(prompt) > sdkLayer.minCompressionTokens) {
      effectivePrompt = densityFilterText(prompt, sdkLayer.targetReduction);
    }
  }
  const reason = `${iterationContext}\n\n${effectivePrompt}${librarySection}`;

  // systemMessage = short user-facing status (not sent to Claude)
  let systemMessage: string;
  if (completionProof) {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} | Run completed! Extract promise tag to finish.`;
  } else if (runState === "waiting" && pendingKinds) {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} | Waiting on: ${pendingKinds}`;
  } else if (runState === "failed") {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} | Failed — check run state`;
  } else {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} [${runState}]`;
  }

  // 10. Output block decision (only documented fields: decision, reason, systemMessage)
  const output = {
    decision: "block",
    reason,
    systemMessage,
  };

  if (runId) {
    await appendStopHookEvent(path.join(runsDir, runId), {
      sessionId,
      iteration: state.iteration,
      decision: "block",
      reason: "continue_loop",
      runState,
      pendingKinds,
      hasPromise,
    });
  }

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");

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
// Session-start hook handler
// ---------------------------------------------------------------------------

async function handleSessionStartHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;

  // 1. Read hook input JSON from stdin
  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch {
    process.stdout.write("{}\n");
    return 0;
  } finally {
    // Unref stdin so it doesn't keep the event loop alive.
    // Guard: unref() may not exist in all environments (e.g. non-socket stdin).
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }

  const hookInput = parseHookInput(rawInput) as ClaudeCodeSessionStartHookInput;
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
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Failed to write to CLAUDE_ENV_FILE: ${envFile}\n`,
        );
      }
    }
  }

  // 3. Create baseline session state file so the stop hook can find it later.
  const pluginRoot =
    args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT || "";
  const resolvedPluginRoot = pluginRoot ? path.resolve(pluginRoot) : "";
  const stateDir =
    args.stateDir
      ? path.resolve(args.stateDir)
      : (resolvedPluginRoot ? path.resolve(resolvedPluginRoot, "skills", "babysit", "state") : "");

  if (stateDir) {
    const filePath = getSessionFilePath(stateDir, sessionId);
    try {
      if (!(await sessionFileExists(filePath))) {
        const nowTs = getCurrentTimestamp();
        const state: SessionState = {
          active: true,
          iteration: 1,
          maxIterations: 256,
          runId: "",
          startedAt: nowTs,
          lastIterationAt: nowTs,
          iterationTimes: [],
        };
        await writeSessionFile(filePath, state, "");
        if (verbose) {
          process.stderr.write(
            `[hook:run session-start] Created session state: ${filePath}\n`,
          );
        }
      }
    } catch {
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Failed to create session state in ${stateDir}\n`,
        );
      }
    }
  }

  // 4. Pre-warm processLibraryCache for all SKILL.md / AGENT.md files in the plugin root.
  // This runs at session start (once per TTL period) so the stop hook can serve
  // compressed content from cache at zero re-compression cost.
  if (resolvedPluginRoot) {
    try {
      const compressionCfg = loadCompressionConfig(process.cwd());
      const cacheLayer = compressionCfg.layers.processLibraryCache;
      if (compressionCfg.enabled && cacheLayer.enabled) {
        const cacheDir = path.join(process.cwd(), ".a5c", "cache", "compression");
        const libraryFiles = findLibraryFiles(resolvedPluginRoot);
        for (const file of libraryFiles) {
          getOrCompressFile(file, cacheLayer.targetReduction, cacheLayer.ttlHours, cacheDir);
        }
        if (verbose) {
          process.stderr.write(
            `[hook:run session-start] Pre-warmed processLibraryCache for ${libraryFiles.length} file(s)\n`,
          );
        }
      }
    } catch {
      // Best-effort: cache pre-warming must never break session start
    }
  }

  if (verbose) {
    process.stderr.write(
      `Babysitter session started: ${sessionId}\n`,
    );
  }

  // 5. Output empty object
  process.stdout.write("{}\n");
  return 0;
}

// ---------------------------------------------------------------------------
// Session binding (run:create flow)
// ---------------------------------------------------------------------------

async function bindSessionImpl(
  opts: SessionBindOptions,
): Promise<SessionBindResult> {
  const { sessionId, runId, pluginRoot, runsDir, maxIterations = 256, prompt, verbose } = opts;

  // Resolve state directory (always resolve to absolute paths)
  const resolvedPluginRoot = pluginRoot ? path.resolve(pluginRoot) : "";
  let stateDir = opts.stateDir ? path.resolve(opts.stateDir) : "";
  if (!stateDir && resolvedPluginRoot) {
    stateDir = path.resolve(resolvedPluginRoot, "skills", "babysit", "state");
  }
  if (!stateDir) {
    return {
      harness: "claude-code",
      sessionId,
      error: "Cannot bind session: --state-dir or --plugin-root required for claude-code harness",
    };
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  // Check for existing session (prevent re-entrant runs)
  if (await sessionFileExists(filePath)) {
    try {
      const existing = await readSessionFile(filePath);
      if (existing.state.runId && existing.state.runId !== runId) {
        const oldRunId = existing.state.runId;
        let isTerminal = false;

        // If runsDir is provided, check whether the old run is in a terminal state
        if (runsDir) {
          try {
            const oldRunDir = path.join(runsDir, oldRunId);
            const journal = await loadJournal(oldRunDir);
            const hasCompleted = journal.some((e) => e.type === "RUN_COMPLETED");
            const hasFailed = journal.some((e) => e.type === "RUN_FAILED");
            isTerminal = hasCompleted || hasFailed;
          } catch {
            // Journal unreadable — treat as non-terminal (safe default)
          }
        }

        if (isTerminal) {
          // Auto-release: old run is finished, delete stale session and proceed
          if (verbose) {
            process.stderr.write(
              `[run:create] Auto-releasing stale session ${sessionId} from terminal run ${oldRunId}\n`,
            );
          }
          await deleteSessionFile(filePath);
          // Fall through to create new session file below (skip update block)
        } else {
          return {
            harness: "claude-code",
            sessionId,
            stateFile: filePath,
            error: `Session bound to active run: ${oldRunId}. Complete or fail that run first, or manually remove the session state file at ${filePath}`,
            fatal: true,
          };
        }
      } else {
        // Session exists but has no run or same run — update it
        await updateSessionState(filePath, { runId, active: true }, {
          state: existing.state,
          prompt: existing.prompt,
        });
        if (verbose) {
          process.stderr.write(
            `[run:create] Updated existing session ${sessionId} with run ${runId}\n`,
          );
        }
        return { harness: "claude-code", sessionId, stateFile: filePath };
      }
    } catch {
      // Corrupted state file — overwrite it
    }
  }

  // Create new session state file with run already associated
  const nowTs = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (e) {
    return {
      harness: "claude-code",
      sessionId,
      error: `Failed to write session state: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (verbose) {
    process.stderr.write(
      `[run:create] Session ${sessionId} initialized and bound to run ${runId}\n`,
    );
  }

  return { harness: "claude-code", sessionId, stateFile: filePath };
}

async function installClaudeCodeHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  return installCliViaNpm({
    harness: "claude-code",
    cliCommand: "claude",
    packageName: "@anthropic-ai/claude-code",
    summary: "Install the Claude Code CLI globally via npm.",
    options,
  });
}

async function installClaudeCodePlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  if (isClaudePluginInstalled()) {
    return {
      harness: "claude-code",
      warning: "The Claude Code Babysitter plugin already appears in installed_plugins.json; skipping reinstall.",
      location: getClaudeInstalledPluginsPath(),
    };
  }

  if (options.dryRun) {
    return {
      harness: "claude-code",
      dryRun: true,
      summary: "Add the published Babysitter Claude Code plugin to the marketplace and install it at user scope.",
      command: [
        renderCommand("claude", ["plugin", "marketplace", "add", "a5c-ai/babysitter"]),
        renderCommand("claude", ["plugin", "install", "--scope", "user", "babysitter@a5c.ai"]),
      ].join(" && "),
    };
  }

  const marketplaceResult = await execFilePromise("claude", [
    "plugin",
    "marketplace",
    "add",
    "a5c-ai/babysitter",
  ]);
  if (marketplaceResult.exitCode !== 0) {
    throw new BabysitterRuntimeError(
      "ClaudePluginMarketplaceAddFailed",
      "claude plugin marketplace add a5c-ai/babysitter failed",
      {
        category: ErrorCategory.External,
        details: {
          stdout: marketplaceResult.stdout,
          stderr: marketplaceResult.stderr,
          exitCode: marketplaceResult.exitCode,
        },
      },
    );
  }

  const installArgs = ["plugin", "install", "--scope", "user", "babysitter@a5c.ai"];
  const installResult = await execFilePromise("claude", installArgs);
  if (installResult.exitCode !== 0) {
    throw new BabysitterRuntimeError(
      "ClaudePluginInstallFailed",
      `${renderCommand("claude", installArgs)} failed`,
      {
        category: ErrorCategory.External,
        details: {
          stdout: installResult.stdout,
          stderr: installResult.stderr,
          exitCode: installResult.exitCode,
        },
      },
    );
  }

  return {
    harness: "claude-code",
    summary: "Added the published Babysitter Claude Code plugin to the marketplace and installed it at user scope.",
    command: [
      renderCommand("claude", ["plugin", "marketplace", "add", "a5c-ai/babysitter"]),
      renderCommand("claude", installArgs),
    ].join(" && "),
    output: [
      marketplaceResult.stdout.trim(),
      marketplaceResult.stderr.trim(),
      installResult.stdout.trim(),
      installResult.stderr.trim(),
    ].filter(Boolean).join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createClaudeCodeAdapter(): HarnessAdapter {
  return {
    name: "claude-code",

    isActive(): boolean {
      return !!(process.env.CLAUDE_SESSION_ID || process.env.CLAUDE_ENV_FILE);
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      if (parsed.sessionId) return parsed.sessionId;
      if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;

      // Fallback: read from CLAUDE_ENV_FILE (written by session-start hook)
      const envFile = process.env.CLAUDE_ENV_FILE;
      if (envFile) {
        try {
          const content = readFileSync(envFile, "utf-8");
          const match = content.match(/export CLAUDE_SESSION_ID="([^"]+)"/);
          if (match?.[1]) return match[1];
        } catch {
          // Non-fatal
        }
      }

      return undefined;
    },

    resolveStateDir(args: { stateDir?: string; pluginRoot?: string }): string | undefined {
      if (args.stateDir) return path.resolve(args.stateDir);
      const root = args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT;
      if (root) return path.resolve(root, "skills", "babysit", "state");
      return undefined;
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      const root = args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT;
      return root ? path.resolve(root) : undefined;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      return handleStopHookImpl(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleSessionStartHookImpl(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      const claudePluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
      if (claudePluginRoot) {
        const candidate = path.join(path.resolve(claudePluginRoot), "hooks", "hook-dispatcher.sh");
        if (existsSync(candidate)) return candidate;
      }
      return null;
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installClaudeCodeHarness(options);
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installClaudeCodePlugin(options);
    },
  };
}
