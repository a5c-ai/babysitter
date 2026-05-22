/**
 * Shared session binding logic.
 *
 * Extracted from claudeCode/lifecycle.ts — this is the canonical session
 * binding implementation used by ALL harness adapters.  Each adapter
 * passes its harness name and state-dir resolution; the core logic is
 * identical.
 */

import * as path from "node:path";
import { DEFAULTS } from "../../config";
import { loadJournal } from "../../storage/journal";
import {
  countPendingEffectsFromJournal,
  deriveObservedRunState,
  isTerminalRunState,
} from "../../runtime/runLifecycleState";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  getCurrentTimestamp,
  updateSessionState,
  writeSessionFile,
} from "../../session/write";
import type {
  SessionBindOptions,
  SessionBindResult,
} from "../types";

export interface SharedBindSessionArgs {
  /** Harness name to stamp on the result. */
  harness: string;
  /** Resolved state directory for session files. */
  stateDir: string;
  /** The original bind options from the CLI. */
  opts: SessionBindOptions;
  /**
   * Whether this harness supports auto-releasing stale sessions
   * by checking terminal journal states.  Claude-code does this;
   * simpler adapters do not (they return a fatal conflict instead).
   */
  autoReleaseStale?: boolean;
  /** Extra metadata to embed in the initial SessionState. */
  extraState?: Partial<SessionState>;
}

export async function bindSession(
  args: SharedBindSessionArgs,
): Promise<SessionBindResult> {
  const { harness, stateDir, opts, autoReleaseStale = false, extraState } = args;
  const { sessionId, runId, runsDir, maxIterations = DEFAULTS.maxIterations, prompt, verbose } = opts;
  const resolvedRunDir = path.resolve(opts.runDir);
  const filePath = getSessionFilePath(stateDir, sessionId);

  if (await sessionFileExists(filePath)) {
    try {
      const existing = await readSessionFile(filePath);
      if (existing.state.runId && existing.state.runId !== runId) {
        if (autoReleaseStale) {
          const oldRunId = existing.state.runId;
          let isTerminal = false;

          if (existing.state.runDir) {
            try {
              const journal = await loadJournal(existing.state.runDir);
              isTerminal = isTerminalRunState(
                deriveObservedRunState(journal, countPendingEffectsFromJournal(journal)),
              );
            } catch {
              // Safe default
            }
          } else if (runsDir) {
            try {
              const oldRunDir = path.join(runsDir, oldRunId);
              const journal = await loadJournal(oldRunDir);
              isTerminal = isTerminalRunState(
                deriveObservedRunState(journal, countPendingEffectsFromJournal(journal)),
              );
            } catch {
              // Safe default
            }
          }

          if (isTerminal) {
            if (verbose) {
              process.stderr.write(
                `[run:create] Auto-releasing stale session ${sessionId} from terminal run ${oldRunId}\n`,
              );
            }
            await updateSessionState(
              filePath,
              {
                active: false,
                metadata: {
                  ...(existing.state.metadata ?? {}),
                  hookExitReason: "auto_release_terminal_run",
                  hookExitedAt: getCurrentTimestamp(),
                },
              },
              { state: existing.state, prompt: existing.prompt },
            );
          } else {
            return {
              harness,
              sessionId,
              stateFile: filePath,
              error: `Session bound to active run: ${oldRunId}. Complete or fail that run first, or manually remove the session state file at ${filePath}`,
              fatal: true,
            };
          }
        } else {
          return {
            harness,
            sessionId,
            stateFile: filePath,
            error: `Session already associated with run: ${existing.state.runId}`,
          };
        }
      } else {
        await updateSessionState(
          filePath,
          { runId, runDir: resolvedRunDir, active: true },
          { state: existing.state, prompt: existing.prompt },
        );
        if (verbose) {
          process.stderr.write(
            `[run:create] Updated existing session ${sessionId} with run ${runId}\n`,
          );
        }
        return { harness, sessionId, stateFile: filePath };
      }
    } catch {
      // Overwrite corrupted state file
    }
  }

  const nowTs = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    runDir: resolvedRunDir,
    runIds: [],
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
    ...extraState,
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (e) {
    return {
      harness,
      sessionId,
      error: `Failed to write session state: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (verbose) {
    process.stderr.write(
      `[run:create] Session ${sessionId} initialized and bound to run ${runId}\n`,
    );
  }
  return { harness, sessionId, stateFile: filePath };
}
