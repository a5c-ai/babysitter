import type { SessionInitResult, SessionState } from "../../../session";
import { DEFAULTS } from "../../../config";
import {
  SessionError,
  getCurrentTimestamp,
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
  writeSessionFile,
} from "../../../session";
import { emitSessionCommandError, requireSessionScope } from "./common";

export interface SessionInitArgs {
  sessionId?: string;
  stateDir?: string;
  maxIterations?: number;
  runId?: string;
  prompt?: string;
  json: boolean;
}

export async function handleSessionInit(args: SessionInitArgs): Promise<number> {
  const required = requireSessionScope(args);
  if (typeof required === "number") {
    return required;
  }

  const { sessionId, stateDir } = required;
  const maxIterations = args.maxIterations ?? DEFAULTS.maxIterations;
  const runId = args.runId ?? "";
  const prompt = args.prompt ?? "";
  const filePath = getSessionFilePath(stateDir, sessionId);

  if (await sessionFileExists(filePath)) {
    try {
      const existing = await readSessionFile(filePath);
      if (existing.state.runId) {
        return emitSessionCommandError(
          args.json,
          {
            error: "SESSION_EXISTS",
            message: `Session already associated with run: ${existing.state.runId}`,
            runId: existing.state.runId,
          },
          `Error: this session is already associated with run ${existing.state.runId}`,
        );
      }
      return emitSessionCommandError(
        args.json,
        {
          error: "SESSION_EXISTS",
          message: "A babysitter run is already active for this session",
        },
        "Error: a babysitter run is already active for this session",
      );
    } catch {
      return emitSessionCommandError(
        args.json,
        {
          error: "SESSION_EXISTS",
          message: "Session state file exists but could not be read",
        },
        "Error: session state file exists but could not be read",
      );
    }
  }

  const now = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    runIds: [],
    startedAt: now,
    lastIterationAt: now,
    iterationTimes: [],
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (error) {
    const err = error instanceof SessionError ? error : new Error(String(error));
    return emitSessionCommandError(
      args.json,
      { error: "FS_ERROR", message: err.message },
      `Error: failed to create state file: ${err.message}`,
    );
  }

  const result: SessionInitResult = {
    stateFile: filePath,
    iteration: state.iteration,
    maxIterations: state.maxIterations,
    runId: state.runId,
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("[session:init] initialized");
    console.log(`  stateFile: ${filePath}`);
    console.log(`  iteration: ${state.iteration}`);
    console.log(`  maxIterations: ${maxIterations > 0 ? maxIterations : "unlimited"}`);
    if (runId) {
      console.log(`  runId: ${runId}`);
    }
  }

  return 0;
}
