import type { SessionStateResult } from "../../../session";
import {
  SessionError,
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../../session";
import { emitSessionCommandError, requireSessionScope } from "./common";

export interface SessionStateArgs {
  sessionId?: string;
  stateDir?: string;
  json: boolean;
}

export async function handleSessionState(args: SessionStateArgs): Promise<number> {
  const required = requireSessionScope(args);
  if (typeof required === "number") {
    return required;
  }

  const filePath = getSessionFilePath(required.stateDir, required.sessionId);
  if (!(await sessionFileExists(filePath))) {
    const result: SessionStateResult = { found: false, stateFile: filePath };
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`[session:state] not found: ${filePath}`);
    }
    return 0;
  }

  try {
    const file = await readSessionFile(filePath);
    const result: SessionStateResult = {
      found: true,
      state: file.state,
      prompt: file.prompt,
      stateFile: filePath,
    };
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`[session:state] found: ${filePath}`);
      console.log(`  active: ${file.state.active}`);
      console.log(`  iteration: ${file.state.iteration}`);
      console.log(`  maxIterations: ${file.state.maxIterations}`);
      console.log(`  runId: ${file.state.runId || "(none)"}`);
      console.log(`  startedAt: ${file.state.startedAt}`);
      console.log(`  lastIterationAt: ${file.state.lastIterationAt}`);
      console.log(`  iterationTimes: [${file.state.iterationTimes.join(", ")}]`);
    }
    return 0;
  } catch (error) {
    const err = error instanceof SessionError ? error : new Error(String(error));
    return emitSessionCommandError(
      args.json,
      { error: "CORRUPTED_STATE", message: err.message, stateFile: filePath },
      `Error: failed to read state file: ${err.message}`,
    );
  }
}
