import type { HarnessAdapter, HookHandlerArgs } from "../types";
import {
  getFirstCodexString,
  normalizeCodexHookInput,
  readStdin,
  resolveCodexPluginRoot,
  resolveCodexStateDir,
  withSyntheticStdin,
} from "./shared";
import { getSessionFilePath, sessionFileExists } from "../../session/parse";
import type { SessionState } from "../../session/types";
import { getCurrentTimestamp, writeSessionFile } from "../../session/write";
import { writeSessionMarker } from "../../utils/sessionMarker";

export async function handleCodexStopHook(
  args: HookHandlerArgs,
  claude: Pick<HarnessAdapter, "handleStopHook">,
): Promise<number> {
  let rawInput = "";
  try {
    rawInput = await readStdin();
  } catch {
    rawInput = "";
  }
  const normalized = normalizeCodexHookInput(rawInput);

  return withSyntheticStdin(JSON.stringify(normalized), () =>
    claude.handleStopHook({
      ...args,
      pluginRoot: resolveCodexPluginRoot({ pluginRoot: args.pluginRoot }),
      stateDir: resolveCodexStateDir({
        stateDir: args.stateDir,
        pluginRoot: args.pluginRoot,
      }),
    }),
  );
}

export async function handleCodexSessionStartHook(
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
  const sessionId = getFirstCodexString(normalized, ["session_id"]);
  if (!sessionId) {
    process.stdout.write("{}\n");
    return 0;
  }

  try {
    writeSessionMarker("codex", sessionId);
  } catch {
    // Non-fatal: marker is a best-effort mechanism
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
        runIds: [],
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
