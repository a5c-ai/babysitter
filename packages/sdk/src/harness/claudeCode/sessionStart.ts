import * as path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { getSessionFilePath, sessionFileExists } from "../../session/parse";
import type { SessionState } from "../../session/types";
import { getCurrentTimestamp, writeSessionFile } from "../../session/write";
import { normalizeSessionStateDir } from "../../config";
import { loadCompressionConfig } from "../../compression/config-loader";
import {
  findLibraryFiles,
  getOrCompressFile,
} from "../../compression/library-cache";
import type { HookHandlerArgs } from "../types";
import {
  getCurrentSessionIdFilePath,
  parseHookInput,
  readStdin,
  safeStr,
  setBabysitterSessionIdInEnvFile,
  type ClaudeCodeSessionStartHookInput,
} from "./shared";

export async function handleClaudeCodeSessionStartHook(
  args: HookHandlerArgs,
): Promise<number> {
  const { verbose } = args;

  if (args.pluginRoot && !process.env.CLAUDE_PLUGIN_ROOT) {
    process.env.CLAUDE_PLUGIN_ROOT = path.resolve(args.pluginRoot);
  }
  if (args.stateDir && !process.env.BABYSITTER_STATE_DIR) {
    process.env.BABYSITTER_STATE_DIR = normalizeSessionStateDir(args.stateDir);
  }

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

  const hookInput = parseHookInput(rawInput) as ClaudeCodeSessionStartHookInput;
  const sessionId = safeStr(hookInput as Record<string, unknown>, "session_id");
  if (!sessionId) {
    process.stdout.write("{}\n");
    return 0;
  }

  let markerPersisted = false;
  let envFilePersisted = false;
  const sessionIdFile = getCurrentSessionIdFilePath();
  if (sessionIdFile) {
    try {
      mkdirSync(path.dirname(sessionIdFile), { recursive: true });
      writeFileSync(sessionIdFile, sessionId + "\n");
      markerPersisted = true;
    } catch {
      process.stderr.write("[hook:run session-start] Failed to write session ID marker file\n");
    }
  }

  const envFile = process.env.CLAUDE_ENV_FILE;
  if (envFile) {
    try {
      setBabysitterSessionIdInEnvFile(envFile, sessionId);
      envFilePersisted = true;
    } catch {
      // Non-fatal
    }
  }

  const pluginRoot = args.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT || "";
  const resolvedPluginRoot = pluginRoot ? path.resolve(pluginRoot) : "";
  const stateDir = normalizeSessionStateDir(
    args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );

  let stateFilePersisted = false;
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
          runIds: [],
          startedAt: nowTs,
          lastIterationAt: nowTs,
          iterationTimes: [],
        };
        await writeSessionFile(filePath, state, "");
        stateFilePersisted = true;
        if (verbose) {
          process.stderr.write(`[hook:run session-start] Created session state: ${filePath}\n`);
        }
      } else {
        stateFilePersisted = true;
      }
    } catch {
      process.stderr.write(`[hook:run session-start] Failed to create session state in ${stateDir}\n`);
    }
  } else {
    process.stderr.write(
      "[hook:run session-start] Cannot resolve state directory — session state will not be persisted\n",
    );
  }

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
      // Best-effort
    }
  }

  if (verbose) {
    process.stderr.write(`Babysitter session started: ${sessionId}\n`);
  }
  if (!markerPersisted && !envFilePersisted && !stateFilePersisted) {
    process.stderr.write(
      "[hook:run session-start] Session persistence failed — no marker, env file, or state file was written\n",
    );
    process.stdout.write("{}\n");
    return 1;
  }

  try {
    const { runSessionCleanup } = await import("../../session/cleanup");
    void runSessionCleanup({ harness: "claude-code", dryRun: false }).catch(() => {
      // non-fatal
    });
  } catch {
    // non-fatal
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `Your Claude Code session ID is: ${sessionId}`,
      },
    }) + "\n",
  );
  return 0;
}
