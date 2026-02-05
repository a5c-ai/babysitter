/**
 * Session management CLI commands.
 * Replaces bash logic from babysitter plugin shell scripts.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
  SessionState,
  SessionError,
  SessionErrorCode,
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  deleteSessionFile,
  getCurrentTimestamp,
  updateIterationTimes,
  isIterationTooFast,
  DEFAULT_SESSION_STATE,
} from '../../session';

/**
 * Parsed arguments for session commands.
 */
export interface SessionCommandArgs {
  sessionId?: string;
  stateDir?: string;
  maxIterations?: number;
  runId?: string;
  prompt?: string;
  iteration?: number;
  lastIterationAt?: string;
  iterationTimes?: string;
  delete?: boolean;
  json: boolean;
  runsDir?: string;
}

/**
 * Handle session:init command.
 * Initializes a new session state file.
 */
export async function handleSessionInit(args: SessionCommandArgs): Promise<number> {
  const { sessionId, stateDir, maxIterations = 256, runId = '', prompt = '', json } = args;

  if (!sessionId) {
    const error = { error: 'MISSING_SESSION_ID', message: '--session-id is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  // Check for existing state file (prevent re-entrant runs)
  if (await sessionFileExists(filePath)) {
    try {
      const existing = await readSessionFile(filePath);
      if (existing.state.runId) {
        const error = {
          error: 'SESSION_EXISTS',
          message: `Session already associated with run: ${existing.state.runId}`,
          runId: existing.state.runId,
        };
        if (json) {
          console.error(JSON.stringify(error));
        } else {
          console.error(`❌ Error: This session is already associated with a run (${existing.state.runId})`);
        }
        return 1;
      }
      const error = {
        error: 'SESSION_EXISTS',
        message: 'A babysitter run is already active for this session',
      };
      if (json) {
        console.error(JSON.stringify(error));
      } else {
        console.error('❌ Error: A babysitter run is already active for this session, but with no associated run ID.');
      }
      return 1;
    } catch (e) {
      // If we can't read it, it might be corrupted - report exists
      const error = { error: 'SESSION_EXISTS', message: 'Session state file exists but could not be read' };
      if (json) {
        console.error(JSON.stringify(error));
      } else {
        console.error('❌ Error: Session state file exists but could not be read');
      }
      return 1;
    }
  }

  const now = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    startedAt: now,
    lastIterationAt: now,
    iterationTimes: [],
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (e) {
    const err = e instanceof SessionError ? e : new Error(String(e));
    const error = { error: 'FS_ERROR', message: err.message };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: Failed to create state file: ${err.message}`);
    }
    return 1;
  }

  const result = {
    stateFile: filePath,
    iteration: state.iteration,
    maxIterations: state.maxIterations,
    runId: state.runId,
  };

  if (json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`✅ Session initialized`);
    console.log(`   State file: ${filePath}`);
    console.log(`   Iteration: ${state.iteration}`);
    console.log(`   Max iterations: ${maxIterations > 0 ? maxIterations : 'unlimited'}`);
    if (runId) console.log(`   Run ID: ${runId}`);
  }

  return 0;
}

/**
 * Handle session:associate command.
 * Associates a session with a run ID.
 */
export async function handleSessionAssociate(args: SessionCommandArgs): Promise<number> {
  const { sessionId, stateDir, runId, json } = args;

  if (!sessionId) {
    const error = { error: 'MISSING_SESSION_ID', message: '--session-id is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  if (!runId) {
    const error = { error: 'MISSING_RUN_ID', message: '--run-id is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --run-id is required');
    }
    return 1;
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  // Read existing state
  let existing;
  try {
    existing = await readSessionFile(filePath);
  } catch (e) {
    const err = e instanceof SessionError ? e : new Error(String(e));
    const error = { error: 'SESSION_NOT_FOUND', message: err.message };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: No active babysitter session found`);
      console.error(`   Expected state file: ${filePath}`);
      console.error('');
      console.error('   You must first call session:init to initialize the session.');
    }
    return 1;
  }

  // Check if already associated
  if (existing.state.runId) {
    const error = {
      error: 'RUN_ALREADY_ASSOCIATED',
      message: `Session already associated with run: ${existing.state.runId}`,
      existingRunId: existing.state.runId,
    };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: This session is already associated with run: ${existing.state.runId}`);
    }
    return 1;
  }

  // Update run ID
  const updatedState: SessionState = {
    ...existing.state,
    runId,
  };

  try {
    await writeSessionFile(filePath, updatedState, existing.prompt);
  } catch (e) {
    const err = e instanceof SessionError ? e : new Error(String(e));
    const error = { error: 'FS_ERROR', message: err.message };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: Failed to update state file: ${err.message}`);
    }
    return 1;
  }

  const result = {
    stateFile: filePath,
    runId,
  };

  if (json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`✅ Associated session with run: ${runId}`);
    console.log(`   State file: ${filePath}`);
  }

  return 0;
}

/**
 * Handle session:resume command.
 * Resumes an existing run in a new session.
 */
export async function handleSessionResume(args: SessionCommandArgs): Promise<number> {
  const { sessionId, stateDir, runId, maxIterations = 256, runsDir = '.a5c/runs', json } = args;

  if (!sessionId) {
    const error = { error: 'MISSING_SESSION_ID', message: '--session-id is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  if (!runId) {
    const error = { error: 'MISSING_RUN_ID', message: '--run-id is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --run-id is required');
    }
    return 1;
  }

  // Verify run exists
  const runDir = path.join(runsDir, runId);
  try {
    await fs.access(runDir);
  } catch {
    const error = { error: 'RUN_NOT_FOUND', message: `Run not found: ${runId}`, runDir };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: Run not found: ${runId}`);
      console.error(`   Expected directory: ${runDir}`);
    }
    return 1;
  }

  // Get run status
  let runState = 'unknown';
  let processId = 'unknown';
  try {
    const runJsonPath = path.join(runDir, 'run.json');
    const runJson = JSON.parse(await fs.readFile(runJsonPath, 'utf8'));
    processId = runJson.processId ?? 'unknown';

    // Check journal for completion
    const journalDir = path.join(runDir, 'journal');
    const journalFiles = await fs.readdir(journalDir);
    const lastFile = journalFiles.filter(f => f.endsWith('.json')).sort().pop();
    if (lastFile) {
      const lastEvent = JSON.parse(await fs.readFile(path.join(journalDir, lastFile), 'utf8'));
      if (lastEvent.type === 'RUN_COMPLETED') {
        runState = 'completed';
      } else if (lastEvent.type === 'RUN_FAILED') {
        runState = 'failed';
      } else {
        runState = 'waiting';
      }
    }
  } catch {
    runState = 'unknown';
  }

  // Check if run is completed
  if (runState === 'completed') {
    const error = { error: 'RUN_COMPLETED', message: 'Run is already completed', runId };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: Run is already completed');
      console.error(`   Run ID: ${runId}`);
      console.error('   Cannot resume a completed run.');
    }
    return 1;
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  // Create prompt for resume
  const prompt = `Resume Babysitter run: ${runId}

Process: ${processId}
Current state: ${runState}

Continue orchestration using run:iterate, task:post, etc. or fix the run if it's broken/failed/unknown.`;

  const now = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    startedAt: now,
    lastIterationAt: now,
    iterationTimes: [],
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (e) {
    const err = e instanceof SessionError ? e : new Error(String(e));
    const error = { error: 'FS_ERROR', message: err.message };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: Failed to create state file: ${err.message}`);
    }
    return 1;
  }

  const result = {
    stateFile: filePath,
    runId,
    runState,
    processId,
  };

  if (json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`✅ Session resumed for run: ${runId}`);
    console.log(`   State file: ${filePath}`);
    console.log(`   Process: ${processId}`);
    console.log(`   Run state: ${runState}`);
  }

  return 0;
}

/**
 * Handle session:state command.
 * Reads and returns session state.
 */
export async function handleSessionState(args: SessionCommandArgs): Promise<number> {
  const { sessionId, stateDir, json } = args;

  if (!sessionId) {
    const error = { error: 'MISSING_SESSION_ID', message: '--session-id is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  if (!(await sessionFileExists(filePath))) {
    const result = { found: false, stateFile: filePath };
    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`[session:state] not found: ${filePath}`);
    }
    return 0;
  }

  try {
    const file = await readSessionFile(filePath);
    const result = {
      found: true,
      state: file.state,
      prompt: file.prompt,
      stateFile: filePath,
    };

    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`[session:state] found: ${filePath}`);
      console.log(`  active: ${file.state.active}`);
      console.log(`  iteration: ${file.state.iteration}`);
      console.log(`  maxIterations: ${file.state.maxIterations}`);
      console.log(`  runId: ${file.state.runId || '(none)'}`);
      console.log(`  startedAt: ${file.state.startedAt}`);
      console.log(`  lastIterationAt: ${file.state.lastIterationAt}`);
      console.log(`  iterationTimes: [${file.state.iterationTimes.join(', ')}]`);
    }
    return 0;
  } catch (e) {
    const err = e instanceof SessionError ? e : new Error(String(e));
    const error = { error: 'CORRUPTED_STATE', message: err.message, stateFile: filePath };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: Failed to read state file: ${err.message}`);
    }
    return 1;
  }
}

/**
 * Handle session:update command.
 * Updates session state fields.
 */
export async function handleSessionUpdate(args: SessionCommandArgs): Promise<number> {
  const { sessionId, stateDir, iteration, lastIterationAt, iterationTimes, json } = args;
  const shouldDelete = args.delete;

  if (!sessionId) {
    const error = { error: 'MISSING_SESSION_ID', message: '--session-id is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  // Handle delete
  if (shouldDelete) {
    const deleted = await deleteSessionFile(filePath);
    const result = { success: true, deleted, stateFile: filePath };
    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`✅ Session state file ${deleted ? 'deleted' : 'not found (already deleted)'}`);
    }
    return 0;
  }

  // Read existing state
  let existing;
  try {
    existing = await readSessionFile(filePath);
  } catch (e) {
    const err = e instanceof SessionError ? e : new Error(String(e));
    const error = { error: 'SESSION_NOT_FOUND', message: err.message };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: Session not found: ${err.message}`);
    }
    return 1;
  }

  // Build updates
  const updates: Partial<SessionState> = {};
  if (iteration !== undefined) {
    updates.iteration = iteration;
  }
  if (lastIterationAt !== undefined) {
    updates.lastIterationAt = lastIterationAt;
  }
  if (iterationTimes !== undefined) {
    updates.iterationTimes = iterationTimes
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0);
  }

  // Apply updates
  const updatedState: SessionState = {
    ...existing.state,
    ...updates,
  };

  try {
    await writeSessionFile(filePath, updatedState, existing.prompt);
  } catch (e) {
    const err = e instanceof SessionError ? e : new Error(String(e));
    const error = { error: 'FS_ERROR', message: err.message };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error(`❌ Error: Failed to update state file: ${err.message}`);
    }
    return 1;
  }

  const result = {
    success: true,
    state: updatedState,
    stateFile: filePath,
  };

  if (json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`✅ Session state updated`);
    console.log(`   State file: ${filePath}`);
    if (iteration !== undefined) console.log(`   iteration: ${iteration}`);
    if (lastIterationAt !== undefined) console.log(`   lastIterationAt: ${lastIterationAt}`);
    if (iterationTimes !== undefined) console.log(`   iterationTimes: [${updatedState.iterationTimes.join(', ')}]`);
  }

  return 0;
}

/**
 * Handle session:check-iteration command.
 * Checks if iteration should continue based on timing and limits.
 */
export async function handleSessionCheckIteration(args: SessionCommandArgs): Promise<number> {
  const { sessionId, stateDir, json } = args;

  if (!sessionId || !stateDir) {
    const error = { error: 'MISSING_ARGS', message: '--session-id and --state-dir are required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --session-id and --state-dir are required');
    }
    return 1;
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  let file;
  try {
    file = await readSessionFile(filePath);
  } catch {
    const result = { shouldContinue: false, reason: 'session_not_found' };
    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log('[session:check-iteration] shouldContinue=false reason=session_not_found');
    }
    return 0;
  }

  const { state } = file;

  // Check max iterations
  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    const result = {
      shouldContinue: false,
      reason: 'max_iterations_reached',
      iteration: state.iteration,
      maxIterations: state.maxIterations,
    };
    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`[session:check-iteration] shouldContinue=false reason=max_iterations_reached iteration=${state.iteration}`);
    }
    return 0;
  }

  // Check iteration timing (runaway loop detection)
  const now = getCurrentTimestamp();
  const updatedTimes = state.iteration >= 5
    ? updateIterationTimes(state.iterationTimes, state.lastIterationAt, now)
    : state.iterationTimes;

  if (isIterationTooFast(updatedTimes)) {
    const avg = updatedTimes.reduce((a, b) => a + b, 0) / updatedTimes.length;
    const result = {
      shouldContinue: false,
      reason: 'iteration_too_fast',
      averageTime: avg,
      threshold: 15,
    };
    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`[session:check-iteration] shouldContinue=false reason=iteration_too_fast avg=${avg}s`);
    }
    return 0;
  }

  const result = {
    shouldContinue: true,
    nextIteration: state.iteration + 1,
    updatedIterationTimes: updatedTimes,
  };

  if (json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`[session:check-iteration] shouldContinue=true nextIteration=${state.iteration + 1}`);
  }

  return 0;
}
