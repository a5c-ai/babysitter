/**
 * Codex harness adapter.
 *
 * Codex supports lifecycle hook callbacks (SessionStart/Stop/UserPromptSubmit)
 * on hook-capable installs. This adapter keeps the implementation honest:
 * use Codex hook payload identity and project state as the continuation source
 * of truth, with explicit fallback binding only when needed.
 */

import * as path from "node:path";
import { appendFileSync, readFileSync } from "node:fs";
import { Readable } from "node:stream";
import { createClaudeCodeAdapter } from "./claudeCode";
import {
  getCurrentTimestamp,
  getSessionFilePath,
  sessionFileExists,
  writeSessionFile,
} from "../session";
import type { SessionState } from "../session";
import type {
  HarnessAdapter,
  HookHandlerArgs,
  SessionBindOptions,
  SessionBindResult,
} from "./types";

function resolveCodexPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root = args.pluginRoot || process.env.CODEX_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

function resolveCodexStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  if (args.stateDir) return path.resolve(args.stateDir);
  if (process.env.BABYSITTER_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_STATE_DIR);
  }

  const pluginRoot = resolveCodexPluginRoot(args);
  if (pluginRoot) {
    // Codex plugins conventionally live under ".codex", while state is in ".a5c".
    return path.resolve(pluginRoot, "..", ".a5c");
  }

  return path.resolve(".a5c");
}

function resolveCodexSessionId(parsed: { sessionId?: string }): string | undefined {
  if (parsed.sessionId) return parsed.sessionId;
  // Codex injects CODEX_THREAD_ID; keep CODEX_SESSION_ID as legacy fallback.
  if (process.env.CODEX_THREAD_ID) return process.env.CODEX_THREAD_ID;
  if (process.env.CODEX_SESSION_ID) return process.env.CODEX_SESSION_ID;

  const envFile = process.env.CODEX_ENV_FILE;
  if (!envFile) return undefined;

  try {
    const content = readFileSync(envFile, "utf-8");
    const match = content.match(
      /(?:^|\n)\s*(?:export\s+)?(?:CODEX_THREAD_ID|CODEX_SESSION_ID)="([^"]+)"/,
    );
    return match?.[1] || undefined;
  } catch {
    return undefined;
  }
}

function supportsCodexLifecycleHooks(): boolean {
  if (process.env.BABYSITTER_CODEX_FORCE_HOOKS === "1") return true;
  return process.platform !== "win32";
}

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

function parseHookInput(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Treat malformed JSON as empty input.
  }
  return {};
}

function firstString(
  obj: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function normalizeCodexHookInput(raw: string): Record<string, unknown> {
  const parsed = parseHookInput(raw);
  const sessionId = firstString(parsed, [
    "session_id",
    "sessionId",
    "thread_id",
    "threadId",
    "conversation_id",
    "conversationId",
  ]) || resolveCodexSessionId({});

  const transcriptPath = firstString(parsed, [
    "transcript_path",
    "transcriptPath",
  ]);
  const lastAssistantMessage = firstString(parsed, [
    "last_assistant_message",
    "lastAssistantMessage",
    "assistant_message",
    "assistantMessage",
  ]);

  return {
    ...parsed,
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(transcriptPath ? { transcript_path: transcriptPath } : {}),
    ...(lastAssistantMessage
      ? { last_assistant_message: lastAssistantMessage }
      : {}),
  };
}

async function withSyntheticStdin<T>(
  payload: string,
  fn: () => Promise<T>,
): Promise<T> {
  const originalStdin = process.stdin;
  const fakeStdin = Readable.from([payload], { encoding: "utf8" });
  (fakeStdin as Readable & { unref?: () => void }).unref = () => {};

  Object.defineProperty(process, "stdin", {
    value: fakeStdin,
    writable: true,
    configurable: true,
  });

  try {
    return await fn();
  } finally {
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
  }
}

async function handleCodexSessionStartHookImpl(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;

  let rawInput = "";
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

  const normalized = normalizeCodexHookInput(rawInput);
  const sessionId = firstString(normalized, ["session_id"]);
  if (!sessionId) {
    process.stdout.write("{}\n");
    return 0;
  }

  const envFile = process.env.CODEX_ENV_FILE;
  if (envFile) {
    try {
      appendFileSync(
        envFile,
        `export CODEX_THREAD_ID="${sessionId}"\nexport CODEX_SESSION_ID="${sessionId}"\n`,
      );
    } catch {
      if (verbose) {
        process.stderr.write(
          `[hook:run session-start] Failed to write to CODEX_ENV_FILE: ${envFile}\n`,
        );
      }
    }
  }

  const stateDir = resolveCodexStateDir({
    stateDir: args.stateDir,
    pluginRoot: args.pluginRoot,
  });
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
          `[hook:run session-start] Created Codex session state: ${filePath}\n`,
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

  process.stdout.write("{}\n");
  return 0;
}

export function createCodexAdapter(): HarnessAdapter {
  const claude = createClaudeCodeAdapter();
  const unsupportedHookMessage = (
    hookType: string,
  ): string => (
    `Codex lifecycle hook "${hookType}" is unavailable on this platform. ` +
    `Use a hook-capable Codex install on Linux, macOS, or WSL for the ` +
    `babysitter-codex plugin hook model.`
  );

  return {
    name: "codex",

    isActive(): boolean {
      return !!(
        process.env.CODEX_THREAD_ID ||
        process.env.CODEX_SESSION_ID ||
        process.env.CODEX_ENV_FILE ||
        process.env.CODEX_PLUGIN_ROOT
      );
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      return resolveCodexSessionId(parsed);
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolveCodexStateDir(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      return resolveCodexPluginRoot(args);
    },

    getMissingSessionIdHint(): string {
      return (
        "Use --session-id explicitly, or launch through a Codex hook callback " +
        "that provides a stable session/thread ID."
      );
    },

    supportsHookType(hookType: string): boolean {
      if (hookType === "stop" || hookType === "session-start") {
        return supportsCodexLifecycleHooks();
      }
      return true;
    },

    getUnsupportedHookMessage(hookType: string): string {
      return unsupportedHookMessage(hookType);
    },

    async bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      const stateDir = resolveCodexStateDir({
        stateDir: opts.stateDir,
        pluginRoot: opts.pluginRoot,
      });
      const result = await claude.bindSession({
        ...opts,
        stateDir,
      });
      return {
        ...result,
        harness: "codex",
      };
    },

    async handleStopHook(args: HookHandlerArgs): Promise<number> {
      if (!supportsCodexLifecycleHooks()) {
        process.stderr.write(`${unsupportedHookMessage("stop")}\n`);
        return 1;
      }

      let rawInput = "";
      try {
        rawInput = await readStdin();
      } catch {
        rawInput = "";
      }
      const normalized = normalizeCodexHookInput(rawInput);

      return withSyntheticStdin(
        JSON.stringify(normalized),
        () => claude.handleStopHook({
          ...args,
          pluginRoot: resolveCodexPluginRoot({ pluginRoot: args.pluginRoot }),
          stateDir: resolveCodexStateDir({
            stateDir: args.stateDir,
            pluginRoot: args.pluginRoot,
          }),
        }),
      );
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      if (!supportsCodexLifecycleHooks()) {
        process.stderr.write(`${unsupportedHookMessage("session-start")}\n`);
        return Promise.resolve(1);
      }
      return handleCodexSessionStartHookImpl(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      return null;
    },
  };
}
