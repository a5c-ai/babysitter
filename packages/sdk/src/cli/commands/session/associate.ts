import { resolveExistingRunDir, resolveRunsDir } from "../../../config";
import type { SessionAssociateResult } from "../../../session";
import {
  SessionError,
  getSessionFilePath,
  readSessionFile,
  writeSessionFile,
} from "../../../session";
import { loadJournal } from "../../../storage/journal";
import { emitSessionCommandError, requireSessionScope } from "./common";

export interface SessionAssociateArgs {
  sessionId?: string;
  runId?: string;
  stateDir?: string;
  force?: boolean;
  runsDir?: string;
  json: boolean;
}

export async function handleSessionAssociate(args: SessionAssociateArgs): Promise<number> {
  const required = requireSessionScope(args, { requireRunId: true });
  if (typeof required === "number") {
    return required;
  }

  const { sessionId, runId, stateDir } = required;
  const filePath = getSessionFilePath(stateDir, sessionId);

  let existing;
  try {
    existing = await readSessionFile(filePath);
  } catch (error) {
    const err = error instanceof SessionError ? error : new Error(String(error));
    return emitSessionCommandError(
      args.json,
      { error: "SESSION_NOT_FOUND", message: err.message },
      [
        "Error: no active babysitter session found",
        `  expected state file: ${filePath}`,
        "  run session:init first.",
      ],
    );
  }

  if (existing.state.runId) {
    if (!args.force) {
      return emitSessionCommandError(
        args.json,
        {
          error: "RUN_ALREADY_ASSOCIATED",
          message: `Session already associated with run: ${existing.state.runId}. Use --force to rebind if the existing run is completed or failed.`,
          existingRunId: existing.state.runId,
        },
        [
          `Error: this session is already associated with run ${existing.state.runId}`,
          `  use --force to rebind to ${runId}`,
        ],
      );
    }

    const oldRunId = existing.state.runId;
    let isTerminal = true;
    if (args.runsDir || oldRunId) {
      try {
        const runDir = resolveExistingRunDir(oldRunId, { override: args.runsDir ?? resolveRunsDir() });
        const journal = await loadJournal(runDir);
        isTerminal = journal.some(
          (event) => event.type === "RUN_COMPLETED" || event.type === "RUN_FAILED",
        );
      } catch {
        isTerminal = true;
      }
    }

    if (!isTerminal) {
      return emitSessionCommandError(
        args.json,
        {
          error: "RUN_STILL_ACTIVE",
          message: `Cannot rebind: run ${oldRunId} is still active. Complete or fail the run first.`,
          existingRunId: oldRunId,
        },
        `Error: cannot rebind while run ${oldRunId} is still active`,
      );
    }
  }

  try {
    await writeSessionFile(filePath, { ...existing.state, runId: runId ?? "" }, existing.prompt);
  } catch (error) {
    const err = error instanceof SessionError ? error : new Error(String(error));
    return emitSessionCommandError(
      args.json,
      { error: "FS_ERROR", message: err.message },
      `Error: failed to update state file: ${err.message}`,
    );
  }

  const result: SessionAssociateResult = {
    stateFile: filePath,
    runId: runId ?? "",
  };
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[session:associate] runId=${runId}`);
    console.log(`  stateFile: ${filePath}`);
  }
  return 0;
}
