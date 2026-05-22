import {
  getCurrentTimestamp,
  getSessionFilePath,
  readSessionFile,
  updateIterationTimes,
} from "../../../session";
import { requireSessionScope } from "./common";

export interface SessionCheckIterationArgs {
  sessionId?: string;
  stateDir?: string;
  json: boolean;
}

export async function handleSessionCheckIteration(
  args: SessionCheckIterationArgs,
): Promise<number> {
  const required = requireSessionScope(args);
  if (typeof required === "number") {
    return required;
  }

  const filePath = getSessionFilePath(required.stateDir, required.sessionId);
  let file;
  try {
    file = await readSessionFile(filePath);
  } catch {
    const result = {
      found: false,
      shouldContinue: false,
      reason: "session_not_found",
      iteration: 0,
      maxIterations: 0,
      runId: "",
      prompt: "",
      stopMessage: "Session not found",
    };
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("[session:check-iteration] shouldContinue=false reason=session_not_found");
    }
    return 0;
  }

  const { state } = file;
  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    const result = {
      found: true,
      shouldContinue: false,
      reason: "max_iterations_reached",
      iteration: state.iteration,
      maxIterations: state.maxIterations,
      runId: state.runId ?? "",
      prompt: file.prompt ?? "",
      stopMessage: `Max iterations (${state.maxIterations}) reached`,
    };
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(
        `[session:check-iteration] shouldContinue=false reason=max_iterations_reached iteration=${state.iteration}`,
      );
    }
    return 0;
  }

  const now = getCurrentTimestamp();
  const updatedTimes =
    state.iteration >= 5
      ? updateIterationTimes(state.iterationTimes, state.lastIterationAt, now)
      : state.iterationTimes;

  const result = {
    found: true,
    shouldContinue: true,
    nextIteration: state.iteration + 1,
    updatedIterationTimes: updatedTimes,
    iteration: state.iteration,
    maxIterations: state.maxIterations,
    runId: state.runId ?? "",
    prompt: file.prompt ?? "",
  };
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `[session:check-iteration] shouldContinue=true nextIteration=${state.iteration + 1}`,
    );
  }
  return 0;
}
