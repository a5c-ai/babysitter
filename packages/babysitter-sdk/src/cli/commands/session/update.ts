import type { SessionState, SessionUpdateResult } from "../../../session";
import {
  SessionError,
  getSessionFilePath,
  readSessionFile,
  writeSessionFile,
} from "../../../session";
import { emitSessionCommandError, requireSessionScope } from "./common";

export interface SessionUpdateArgs {
  sessionId?: string;
  stateDir?: string;
  iteration?: number;
  lastIterationAt?: string;
  iterationTimes?: string;
  json: boolean;
}

export async function handleSessionUpdate(args: SessionUpdateArgs): Promise<number> {
  const required = requireSessionScope(args);
  if (typeof required === "number") {
    return required;
  }

  const filePath = getSessionFilePath(required.stateDir, required.sessionId);
  let existing;
  try {
    existing = await readSessionFile(filePath);
  } catch (error) {
    const err = error instanceof SessionError ? error : new Error(String(error));
    return emitSessionCommandError(
      args.json,
      { error: "SESSION_NOT_FOUND", message: err.message },
      `Error: session not found: ${err.message}`,
    );
  }

  const updates: Partial<SessionState> = {};
  if (args.iteration !== undefined) {
    updates.iteration = args.iteration;
  }
  if (args.lastIterationAt !== undefined) {
    updates.lastIterationAt = args.lastIterationAt;
  }
  if (args.iterationTimes !== undefined) {
    updates.iterationTimes = args.iterationTimes
      .split(",")
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  const updatedState: SessionState = { ...existing.state, ...updates };
  try {
    await writeSessionFile(filePath, updatedState, existing.prompt);
  } catch (error) {
    const err = error instanceof SessionError ? error : new Error(String(error));
    return emitSessionCommandError(
      args.json,
      { error: "FS_ERROR", message: err.message },
      `Error: failed to update state file: ${err.message}`,
    );
  }

  const result: SessionUpdateResult = {
    success: true,
    state: updatedState,
    stateFile: filePath,
  };
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("[session:update] updated");
    console.log(`  stateFile: ${filePath}`);
  }
  return 0;
}
