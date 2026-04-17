import * as path from "node:path";
import { Readable } from "node:stream";
import { normalizeSessionStateDir } from "../../config";
import { resolveSessionIdWithMarker } from "../../utils/sessionMarker";

export function resolveCodexPluginRoot(
  args: { pluginRoot?: string } = {},
): string | undefined {
  const root = args.pluginRoot || process.env.CODEX_PLUGIN_ROOT;
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

export async function withSyntheticStdin<T>(
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
