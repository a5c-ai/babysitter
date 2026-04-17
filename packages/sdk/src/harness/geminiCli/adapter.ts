import * as path from "node:path";
import { existsSync } from "node:fs";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  getCurrentTimestamp,
  updateSessionState,
  writeSessionFile,
} from "../../session/write";
import type {
  HarnessAdapter,
  SessionBindOptions,
  SessionBindResult,
  HookHandlerArgs,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "../types";
import {
  getGeminiExtensionDir,
  installCliViaNpm,
  isGeminiPluginInstalled,
  runPackageBinaryViaNpx,
} from "../installSupport";
import type { PromptContext } from "../../prompts/types";
import { createGeminiCliContext } from "./promptContext";
import {
  handleGeminiAfterAgentHook,
  handleGeminiSessionStartHook,
  resolveGeminiCliStateDir,
  resolveGeminiSessionIdFromEnv,
} from "./hooks";

const HARNESS_NAME = "gemini-cli";
const resolveStateDirInternal = resolveGeminiCliStateDir;

async function bindSessionImpl(
  opts: SessionBindOptions,
): Promise<SessionBindResult> {
  const { sessionId, runId, maxIterations = 256, prompt, verbose } = opts;
  const stateDir = resolveStateDirInternal({
    stateDir: opts.stateDir,
    pluginRoot: opts.pluginRoot,
  });
  const filePath = getSessionFilePath(stateDir, sessionId);

  if (await sessionFileExists(filePath)) {
    try {
      const existing = await readSessionFile(filePath);
      if (existing.state.runId && existing.state.runId !== runId) {
        return {
          harness: HARNESS_NAME,
          sessionId,
          stateFile: filePath,
          error: `Session already associated with run: ${existing.state.runId}`,
        };
      }
      await updateSessionState(
        filePath,
        { runId, active: true },
        { state: existing.state, prompt: existing.prompt },
      );
      if (verbose) {
        process.stderr.write(
          `[run:create] Updated existing session ${sessionId} with run ${runId}\n`,
        );
      }
      return { harness: HARNESS_NAME, sessionId, stateFile: filePath };
    } catch {
      // Corrupted state file — overwrite
    }
  }

  const nowTs = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    runIds: [],
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (e) {
    return {
      harness: HARNESS_NAME,
      sessionId,
      error: `Failed to write session state: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (verbose) {
    process.stderr.write(
      `[run:create] Session ${sessionId} initialized and bound to run ${runId}\n`,
    );
  }

  return { harness: HARNESS_NAME, sessionId, stateFile: filePath };
}

async function installGeminiHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  return installCliViaNpm({
    harness: HARNESS_NAME,
    cliCommand: "gemini",
    packageName: "@google/gemini-cli",
    summary: "Install the Gemini CLI globally via npm.",
    options,
  });
}

async function installGeminiPlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const targetDir = getGeminiExtensionDir(options.workspace);
  if (isGeminiPluginInstalled(options.workspace)) {
    return {
      harness: HARNESS_NAME,
      warning: "The Babysitter Gemini extension is already installed at the target location; skipping reinstall.",
      location: targetDir,
    };
  }

  const packageArgs = options.workspace
    ? ["install", "--workspace", path.resolve(options.workspace)]
    : ["install", "--global"];

  return runPackageBinaryViaNpx({
    harness: HARNESS_NAME,
    packageName: "@a5c-ai/babysitter-gemini",
    packageArgs,
    summary: options.workspace
      ? "Install the published Babysitter Gemini extension into the target workspace."
      : "Install the published Babysitter Gemini extension into the user-level Gemini extension directory.",
    options,
    env: process.env,
    location: targetDir,
  });
}

export function createGeminiCliAdapter(): HarnessAdapter {
  return {
    name: HARNESS_NAME,

    isActive(): boolean {
      return !!(
        process.env.BABYSITTER_SESSION_ID ||
        process.env.GEMINI_CLI ||
        process.env.GEMINI_SESSION_ID ||
        process.env.GEMINI_PROJECT_DIR ||
        process.env.GEMINI_CWD
      );
    },

    autoResolvesSessionId(): boolean {
      return true;
    },

    resolveSessionId(parsed: { sessionId?: string }): string | undefined {
      if (parsed.sessionId) return parsed.sessionId;
      return resolveGeminiSessionIdFromEnv();
    },

    resolveStateDir(args: {
      stateDir?: string;
      pluginRoot?: string;
    }): string | undefined {
      return resolveStateDirInternal(args);
    },

    resolvePluginRoot(args: { pluginRoot?: string }): string | undefined {
      const root =
        args.pluginRoot ||
        process.env.GEMINI_EXTENSION_PATH ||
        process.env.BABYSITTER_EXTENSION_PATH;
      return root ? path.resolve(root) : undefined;
    },

    bindSession(opts: SessionBindOptions): Promise<SessionBindResult> {
      return bindSessionImpl(opts);
    },

    handleStopHook(args: HookHandlerArgs): Promise<number> {
      return handleGeminiAfterAgentHook(args);
    },

    handleSessionStartHook(args: HookHandlerArgs): Promise<number> {
      return handleGeminiSessionStartHook(args);
    },

    findHookDispatcherPath(_startCwd: string): string | null {
      const extensionPath =
        process.env.GEMINI_EXTENSION_PATH ||
        process.env.BABYSITTER_EXTENSION_PATH;
      if (extensionPath) {
        const candidate = path.join(
          path.resolve(extensionPath),
          "hooks",
          "after-agent.sh",
        );
        if (existsSync(candidate)) return candidate;
      }
      return null;
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installGeminiHarness(options);
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installGeminiPlugin(options);
    },

    getPromptContext(opts?: { interactive?: boolean | undefined }): PromptContext {
      return createGeminiCliContext(opts);
    },
  };
}
