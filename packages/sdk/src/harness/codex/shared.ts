import * as path from "node:path";
import { normalizeSessionStateDir } from "../../config";
import { resolveSessionIdWithMarker } from "../../utils/sessionMarker";
import { parseHookInput } from "../hooks/utils";

// Re-export for consumers
export { readStdin } from "../hooks/utils";

export function resolveCodexPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root = args.pluginRoot
    || process.env.CODEX_PLUGIN_ROOT
    || process.env.AGENT_PLUGIN_ROOT;
  return root ? path.resolve(root) : undefined;
}

export function resolveCodexStateDir(args: {
  stateDir?: string;
  pluginRoot?: string;
}): string {
  return normalizeSessionStateDir(
    args.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );
}

export function resolveCodexSessionId(parsed: {
  sessionId?: string;
}): string | undefined {
  return resolveSessionIdWithMarker("codex", parsed, [
    "CODEX_THREAD_ID",
    "CODEX_SESSION_ID",
  ]);
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

export function normalizeCodexHookInput(
  raw: string,
): Record<string, unknown> {
  const parsed = parseHookInput(raw);
  const allowAmbientFallback = Object.keys(parsed).length > 0;
  const sessionId =
    firstString(parsed, [
      "session_id",
      "sessionId",
      "thread_id",
      "threadId",
      "conversation_id",
      "conversationId",
    ]) || (allowAmbientFallback ? resolveCodexSessionId({}) : undefined);

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

export function getFirstCodexString(
  obj: Record<string, unknown>,
  keys: string[],
): string | undefined {
  return firstString(obj, keys);
}
