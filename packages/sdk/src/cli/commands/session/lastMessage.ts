import { existsSync, readFileSync } from "node:fs";
import { resolveInputPath } from "../../resolveInputPath";
import {
  extractPromiseTag,
  parseTranscriptLastAssistantMessage,
} from "../../../session";

export interface SessionLastMessageArgs {
  transcriptPath: string;
  json: boolean;
}

export interface SessionLastMessageResult {
  found: boolean;
  text: string | null;
  hasPromise: boolean;
  promiseValue: string | null;
  error?: string;
}

export function handleSessionLastMessage(args: SessionLastMessageArgs): number {
  const result: SessionLastMessageResult = {
    found: false,
    text: null,
    hasPromise: false,
    promiseValue: null,
  };

  const transcriptPath = resolveInputPath(args.transcriptPath);
  if (!existsSync(transcriptPath)) {
    result.error = "TRANSCRIPT_NOT_FOUND";
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`[session:last-message] error=TRANSCRIPT_NOT_FOUND path=${transcriptPath}`);
    }
    return 0;
  }

  try {
    const parsed = parseTranscriptLastAssistantMessage(readFileSync(transcriptPath, "utf8"));
    result.found = parsed.found;
    result.text = parsed.text;
    if (parsed.found && parsed.text) {
      const promiseValue = extractPromiseTag(parsed.text);
      result.hasPromise = promiseValue !== null;
      result.promiseValue = promiseValue;
    }
  } catch {
    result.error = "TRANSCRIPT_PARSE_ERROR";
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `[session:last-message] found=${result.found} hasPromise=${result.hasPromise}${result.promiseValue ? ` promiseValue=${result.promiseValue}` : ""}`,
    );
  }
  return 0;
}
