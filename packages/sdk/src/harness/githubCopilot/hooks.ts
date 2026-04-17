import * as path from "node:path";
import { appendFileSync, readFileSync } from "node:fs";
import { appendEvent } from "../../storage/journal";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  deleteSessionFile,
  getCurrentTimestamp,
  writeSessionFile,
} from "../../session/write";
import { normalizeSessionStateDir } from "../../config";
import type { HookHandlerArgs } from "../types";
import {
  createHookLogger,
  parseHookInput,
  readStdin,
  safeStr,
} from "../hooks/utils";
import { readSessionMarker, writeSessionMarker } from "../../utils/sessionMarker";

const HARNESS_NAME = "github-copilot";

interface CopilotHookInput {
  cwd?: string;
  timestamp?: string;
  session_id?: string;
}

export function setBabysitterSessionIdInCopilotEnvFile(
  envFile: string,
  sessionId: string,
): void {
  appendFileSync(envFile, `export BABYSITTER_SESSION_ID="${sessionId}"\n`);
}

async function appendSessionEndEvent(
  runDir: string,
  data: {
    sessionId: string;
    iteration: number;
    reason: string;
  },
): Promise<void> {
  try {
    await appendEvent({
      runDir,
      eventType: "SESSION_END_HOOK_INVOKED",
      event: {
        ...data,
        harness: HARNESS_NAME,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Best-effort
  }
}

async function cleanupSession(filePath: string): Promise<void> {
  try {
    await deleteSessionFile(filePath);
  } catch {
    // Best-effort cleanup
  }
}

export function resolveGithubCopilotStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  return normalizeSessionStateDir(args.stateDir ?? process.env.BABYSITTER_STATE_DIR);
}

export function resolveGithubCopilotSessionId(parsed: {
  sessionId?: string;
}): string | undefined {
  if (parsed.sessionId) {
    return parsed.sessionId;
  }

  const trustEnv = process.env.BABYSITTER_TRUST_ENV_SESSION === "1";
  if (trustEnv) {
    if (process.env.BABYSITTER_SESSION_ID) {
      return process.env.BABYSITTER_SESSION_ID;
    }
    const trustedEnvFile = process.env.COPILOT_ENV_FILE || process.env.CLAUDE_ENV_FILE;
    if (trustedEnvFile) {
      try {
        const content = readFileSync(trustedEnvFile, "utf-8");
        const match = content.match(
          /(?:^|\n)\s*(?:export\s+)?BABYSITTER_SESSION_ID="([^"]+)"/,
        );
        if (match?.[1]) {
          return match[1];
        }
      } catch {
        // Fall through
      }
    }
    if (process.env.COPILOT_SESSION_ID) {
      return process.env.COPILOT_SESSION_ID;
    }
    return undefined;
  }

  const envFile = process.env.COPILOT_ENV_FILE || process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      const content = readFileSync(envFile, "utf-8");
      const matches = [
        ...content.matchAll(/export BABYSITTER_SESSION_ID="([^"]+)"/g),
      ];
      const last = matches.at(-1)?.[1];
      if (last) {
        return last;
      }
    } catch {
      // Fall through
    }
  }

  if (process.env.COPILOT_SESSION_ID) {
    return process.env.COPILOT_SESSION_ID;
  }
  if (process.env.BABYSITTER_SESSION_ID) {
    return process.env.BABYSITTER_SESSION_ID;
  }

  return readSessionMarker(HARNESS_NAME) ?? undefined;
}

export async function handleGithubCopilotSessionEndHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-copilot-session-end-hook");
  log.info("handleSessionEndHook started (github-copilot)");

  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.warn(`stdin read error: ${message}`);
    process.stdout.write("{}\n");
    return 0;
  } finally {
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }

  const hookInput = parseHookInput(rawInput) as CopilotHookInput;
  log.info("Hook input received");

  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    resolveGithubCopilotSessionId({}) ||
    "";

  if (!sessionId) {
    log.info("No session ID in hook input — allowing exit");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  const stateDir = resolveGithubCopilotStateDir(args);
  const runsDir = args.runsDir || ".a5c/runs";
  const filePath = getSessionFilePath(stateDir, sessionId);
  log.info(`Checking session file at: ${filePath}`);

  let sessionFile;
  try {
    if (!(await sessionFileExists(filePath))) {
      log.info(`No active babysitter loop for session ${sessionId} — allowing exit`);
      process.stdout.write("{}\n");
      return 0;
    }
    sessionFile = await readSessionFile(filePath);
  } catch {
    log.warn(`Session file read error at ${filePath} — allowing exit`);
    process.stdout.write("{}\n");
    return 0;
  }

  const iteration = sessionFile.state.iteration;
  const runId = sessionFile.state.runId ?? "";
  if (runId) {
    log.setContext("run", runId);
  }

  if (!runId) {
    log.info("No run associated with session — cleaning up");
    await cleanupSession(filePath);
    process.stdout.write("{}\n");
    return 0;
  }

  try {
    const runDir = path.isAbsolute(runId) ? runId : path.join(runsDir, runId);
    await appendSessionEndEvent(runDir, {
      sessionId,
      iteration,
      reason: "session_ended",
    });
  } catch {
    // Best-effort
  }

  await cleanupSession(filePath);
  log.info(`Session ended, cleanup complete (iteration=${iteration})`);
  if (verbose) {
    process.stderr.write(
      `[hook:session-end] Session ${sessionId} ended, cleanup complete\n`,
    );
  }

  process.stdout.write("{}\n");
  return 0;
}

export async function handleGithubCopilotSessionStartHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;
  const log = createHookLogger("babysitter-copilot-session-start-hook");
  log.info("handleSessionStartHook started (github-copilot)");

  let rawInput: string;
  try {
    rawInput = await readStdin();
  } catch {
    process.stdout.write("{}\n");
    return 0;
  } finally {
    if (typeof process.stdin.unref === "function") {
      process.stdin.unref();
    }
  }

  const hookInput = parseHookInput(rawInput) as CopilotHookInput;
  const sessionId =
    safeStr(hookInput as Record<string, unknown>, "session_id") ||
    resolveGithubCopilotSessionId({}) ||
    "";

  if (!sessionId) {
    log.info("No session ID in hook input — skipping state file creation");
    process.stdout.write("{}\n");
    return 0;
  }

  log.setContext("session", sessionId);
  log.info(`Session ID: ${sessionId}`);

  try {
    writeSessionMarker(HARNESS_NAME, sessionId);
  } catch {
    // Non-fatal
  }

  const envFile = process.env.COPILOT_ENV_FILE || process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      setBabysitterSessionIdInCopilotEnvFile(envFile, sessionId);
    } catch {
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Failed to write to env file: ${envFile}\n`,
        );
      }
    }
  }

  const stateDir = resolveGithubCopilotStateDir(args);
  log.info(`Resolved stateDir: ${stateDir}`);

  const filePath = getSessionFilePath(stateDir, sessionId);
  try {
    if (!(await sessionFileExists(filePath))) {
      const nowTs = getCurrentTimestamp();
      const state: SessionState = {
        active: true,
        iteration: 1,
        maxIterations: 256,
        runId: "",
        runIds: [],
        startedAt: nowTs,
        lastIterationAt: nowTs,
        iterationTimes: [],
      };
      await writeSessionFile(filePath, state, "");
      log.info(`Created session state: ${filePath}`);
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Created session state: ${filePath}\n`,
        );
      }
    } else {
      log.info(`Session state already exists: ${filePath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.warn(`Failed to create session state: ${message}`);
    if (verbose) {
      process.stderr.write(
        `[hook:run session-start] Failed to create session state: ${message}\n`,
      );
    }
  }

  process.stdout.write("{}\n");
  return 0;
}
