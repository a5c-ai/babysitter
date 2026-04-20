import type { HarnessAdapter, HookHandlerArgs } from "../types";
import {
  getFirstCodexString,
  normalizeCodexHookInput,
  readStdin,
  resolveCodexPluginRoot,
  resolveCodexStateDir,
} from "./shared";
import { initializeSessionState } from "../hooks/utils";
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

  // Pipe the normalized payload directly via stdinPayload rather than
  // monkey-patching process.stdin.
  return claude.handleStopHook({
    ...args,
    pluginRoot: resolveCodexPluginRoot({ pluginRoot: args.pluginRoot }),
    stateDir: resolveCodexStateDir({
      stateDir: args.stateDir,
      pluginRoot: args.pluginRoot,
    }),
    stdinPayload: JSON.stringify(normalized),
  });
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

  await initializeSessionState(sessionId, stateDir, { verbose });

  process.stdout.write("{}\n");
  return 0;
}
