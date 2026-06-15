import * as path from "node:path";
import { appendFileSync, mkdirSync } from "node:fs";
import { DEFAULTS, getGlobalLogDir } from "../../config";
import { appendEvent } from "../../storage/journal";
import {
  getSessionFilePath,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  getCurrentTimestamp,
  writeSessionFile,
} from "../../session/write";

export interface HookLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  setContext(key: string, value: string): void;
}

export function createHookLogger(hookName: string): HookLogger {
  const logDir = getGlobalLogDir();
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
    if (!logFile) {
      return;
    }
    const ts = new Date().toISOString();
    const ctxParts = Object.entries(context).map(([key, value]) => `${key}=${value}`);
    const ctxStr = ctxParts.length > 0 ? ` [${ctxParts.join(" ")}]` : "";
    const line = `[${level}] ${ts}${ctxStr} ${message}\n`;
    try {
      appendFileSync(logFile, line);
    } catch {
      // Best-effort
    }
  }

  return {
    info: (message: string) => write("INFO", message),
    warn: (message: string) => write("WARN", message),
    error: (message: string) => write("ERROR", message),
    setContext: (key: string, value: string) => {
      context[key] = value;
    },
  };
}

export function readStdin(): Promise<string> {
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

export function parseHookInput(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }
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

export function safeStr(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === "string" ? value : "";
}

export function countPendingByKind(
  records: Array<{ kind?: string | null }>,
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.kind ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function isOnlyBreakpoints(pendingByKind: Record<string, number>): boolean {
  const keys = Object.keys(pendingByKind);
  return keys.length === 1 && keys[0] === "breakpoint";
}

export async function appendStopHookEvent(
  runDir: string,
  data: {
    sessionId: string;
    iteration: number;
    decision: "approve" | "block";
    reason: string;
    runState: string;
    pendingKinds: string;
    hasPromise: boolean;
    effectId?: string;
    hookBackoffFireCount?: number;
    hookBackoffDelaySeconds?: number;
    hookBackoffInterrupted?: boolean;
  },
  harness?: string,
): Promise<void> {
  try {
    await appendEvent({
      runDir,
      eventType: "STOP_HOOK_INVOKED",
      event: {
        ...data,
        ...(harness ? { harness } : {}),
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Best-effort
  }
}

export async function markSessionInactive(
  filePath: string,
  state: SessionState,
  prompt: string,
  reason: string,
): Promise<void> {
  try {
    await writeSessionFile(filePath, {
      ...state,
      active: false,
      metadata: {
        ...(state.metadata ?? {}),
        hookExitReason: reason,
        hookExitedAt: getCurrentTimestamp(),
      },
    }, prompt);
  } catch {
    // Best-effort
  }
}

export async function initializeSessionState(
  sessionId: string,
  stateDir: string,
  options?: { maxIterations?: number; verbose?: boolean; log?: HookLogger },
): Promise<{ persisted: boolean; filePath: string }> {
  const filePath = getSessionFilePath(stateDir, sessionId);
  try {
    if (!(await sessionFileExists(filePath))) {
      const nowTs = getCurrentTimestamp();
      const state: SessionState = {
        active: true,
        iteration: 1,
        maxIterations: options?.maxIterations ?? DEFAULTS.maxIterations,
        runId: "",
        runIds: [],
        startedAt: nowTs,
        lastIterationAt: nowTs,
        iterationTimes: [],
      };
      await writeSessionFile(filePath, state, "");
      options?.log?.info(`Created session state: ${filePath}`);
      if (options?.verbose) {
        process.stderr.write(
          `[hook:run session-start] Created session state: ${filePath}\n`,
        );
      }
      return { persisted: true, filePath };
    }
    options?.log?.info(`Session state already exists: ${filePath}`);
    return { persisted: false, filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    options?.log?.warn(`Failed to create session state: ${message}`);
    if (options?.verbose) {
      process.stderr.write(
        `[hook:run session-start] Failed to create session state: ${message}\n`,
      );
    }
    return { persisted: false, filePath };
  }
}

export interface IterationLimitResult {
  shouldExit: boolean;
  reason?: string;
}

export function checkIterationLimits(
  state: SessionState,
  maxIterations: number,
  _options?: { minIterationMs?: number; iterationTimes?: number[] },
): IterationLimitResult {
  if (maxIterations > 0 && state.iteration >= maxIterations) {
    return { shouldExit: true, reason: "max_iterations_reached" };
  }
  return { shouldExit: false };
}

export function buildFollowupMessage(
  nextIteration: number,
  runId: string,
  completionProof: string | undefined,
  runState: string,
  pendingKinds: string,
  prompt: string,
): string {
  if (completionProof) {
    return `Babysitter iteration ${nextIteration} | Run completed! To finish: call 'babysitter run:status ${runId} --json', extract 'completionProof' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise.\n\n${prompt}`;
  } else if (runState === "waiting" && pendingKinds) {
    return `Babysitter iteration ${nextIteration} | Waiting on: ${pendingKinds}. Check if pending effects are resolved, then call 'babysitter run:iterate ${runId} --json'.\n\n${prompt}`;
  } else if (runState === "halted") {
    return `Babysitter iteration ${nextIteration} | Run halted. Inspect 'babysitter run:status ${runId} --json' for the halt reason and payload, then fix the process or inputs before continuing.\n\n${prompt}`;
  } else if (runState === "failed") {
    return `Babysitter iteration ${nextIteration} | Run failed. Inspect the run journal and fix the issue, then proceed.\n\n${prompt}`;
  }
  return `Babysitter iteration ${nextIteration} | Continue orchestration: call 'babysitter run:iterate ${runId} --json'.\n\n${prompt}`;
}
