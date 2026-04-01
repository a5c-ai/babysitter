/**
 * Session management CLI commands.
 * Replaces bash logic from babysitter plugin shell scripts.
 */

import { promises as fs, existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { resolveInputPath } from '../resolveInputPath';
import { loadJournal } from '../../storage/journal';
import { readRunMetadata } from '../../storage/runFiles';
import { buildEffectIndex } from '../../runtime/replay/effectIndex';
import { resolveCompletionProof } from '../completionProof';
import type { EffectRecord } from '../../runtime/types';
import { discoverSkillsInternal } from './skill';
import {
  SessionState,
  SessionError,
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  deleteSessionFile,
  getCurrentTimestamp,
  updateIterationTimes,
  isIterationTooFast,
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
  force?: boolean;
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
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
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
          console.error(JSON.stringify(error, null, 2));
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
        console.error(JSON.stringify(error, null, 2));
      } else {
        console.error('❌ Error: A babysitter run is already active for this session, but with no associated run ID.');
      }
      return 1;
    } catch (e) {
      // If we can't read it, it might be corrupted - report exists
      const error = { error: 'SESSION_EXISTS', message: 'Session state file exists but could not be read' };
      if (json) {
        console.error(JSON.stringify(error, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
    console.log(JSON.stringify(result, null, 2));
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
  const { sessionId, stateDir, runId, force, runsDir, json } = args;

  if (!sessionId) {
    const error = { error: 'MISSING_SESSION_ID', message: '--session-id is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  if (!runId) {
    const error = { error: 'MISSING_RUN_ID', message: '--run-id is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
    if (!force) {
      const error = {
        error: 'RUN_ALREADY_ASSOCIATED',
        message: `Session already associated with run: ${existing.state.runId}. Use --force to rebind if the existing run is completed or failed.`,
        existingRunId: existing.state.runId,
      };
      if (json) {
        console.error(JSON.stringify(error, null, 2));
      } else {
        console.error(`❌ Error: This session is already associated with run: ${existing.state.runId}`);
        console.error('');
        console.error('   If the existing run is completed or failed, use --force to rebind:');
        console.error(`   babysitter session:associate --session-id <id> --state-dir <dir> --run-id ${runId} --force`);
      }
      return 1;
    }

    // --force: check if old run is in a terminal state before allowing rebind
    const oldRunId = existing.state.runId;
    let isTerminal = false;

    if (runsDir) {
      try {
        const oldRunDir = path.join(runsDir, oldRunId);
        const journal = await loadJournal(oldRunDir);
        const hasCompleted = journal.some((e: { type: string }) => e.type === 'RUN_COMPLETED');
        const hasFailed = journal.some((e: { type: string }) => e.type === 'RUN_FAILED');
        isTerminal = hasCompleted || hasFailed;
      } catch {
        // Journal unreadable — treat as terminal (force was explicit)
        isTerminal = true;
      }
    } else {
      // No runsDir to verify — trust the user's --force intent
      isTerminal = true;
    }

    if (!isTerminal) {
      const error = {
        error: 'RUN_STILL_ACTIVE',
        message: `Cannot rebind: run ${oldRunId} is still active. Complete or fail the run first.`,
        existingRunId: oldRunId,
      };
      if (json) {
        console.error(JSON.stringify(error, null, 2));
      } else {
        console.error(`❌ Error: Cannot rebind — run ${oldRunId} is still active.`);
        console.error('   Complete or fail the existing run before rebinding.');
      }
      return 1;
    }
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
      console.error(JSON.stringify(error, null, 2));
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
    console.log(JSON.stringify(result, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  if (!runId) {
    const error = { error: 'MISSING_RUN_ID', message: '--run-id is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
    const runJson = JSON.parse(await fs.readFile(runJsonPath, 'utf8')) as Record<string, unknown>;
    processId = (typeof runJson.processId === 'string' ? runJson.processId : undefined) ?? 'unknown';

    // Check journal for completion
    const journalDir = path.join(runDir, 'journal');
    const journalFiles = await fs.readdir(journalDir);
    const lastFile = journalFiles.filter(f => f.endsWith('.json')).sort().pop();
    if (lastFile) {
      const lastEvent = JSON.parse(await fs.readFile(path.join(journalDir, lastFile), 'utf8')) as Record<string, unknown>;
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
      console.error(JSON.stringify(error, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
    console.log(JSON.stringify(result, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --state-dir is required');
    }
    return 1;
  }

  const filePath = getSessionFilePath(stateDir, sessionId);

  if (!(await sessionFileExists(filePath))) {
    const result = { found: false, stateFile: filePath };
    if (json) {
      console.log(JSON.stringify(result, null, 2));
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
      console.log(JSON.stringify(result, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('❌ Error: --session-id is required');
    }
    return 1;
  }

  if (!stateDir) {
    const error = { error: 'MISSING_STATE_DIR', message: '--state-dir is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
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
      console.log(JSON.stringify(result, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
    console.log(JSON.stringify(result, null, 2));
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
      console.error(JSON.stringify(error, null, 2));
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
    const result = {
      found: false,
      shouldContinue: false,
      reason: 'session_not_found',
      iteration: 0,
      maxIterations: 0,
      runId: '',
      prompt: '',
      stopMessage: 'Session not found',
    };
    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('[session:check-iteration] shouldContinue=false reason=session_not_found');
    }
    return 0;
  }

  const { state } = file;

  // Check max iterations
  if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
    const result = {
      found: true,
      shouldContinue: false,
      reason: 'max_iterations_reached',
      iteration: state.iteration,
      maxIterations: state.maxIterations,
      runId: state.runId ?? '',
      prompt: file.prompt ?? '',
      stopMessage: `Max iterations (${state.maxIterations}) reached`,
    };
    if (json) {
      console.log(JSON.stringify(result, null, 2));
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
      found: true,
      shouldContinue: false,
      reason: 'iteration_too_fast',
      averageTime: avg,
      threshold: 15,
      iteration: state.iteration,
      maxIterations: state.maxIterations,
      runId: state.runId ?? '',
      prompt: file.prompt ?? '',
      stopMessage: `Average iteration time too fast (${avg}s <= 15s)`,
    };
    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`[session:check-iteration] shouldContinue=false reason=iteration_too_fast avg=${avg}s`);
    }
    return 0;
  }

  const result = {
    found: true,
    shouldContinue: true,
    nextIteration: state.iteration + 1,
    updatedIterationTimes: updatedTimes,
    iteration: state.iteration,
    maxIterations: state.maxIterations,
    runId: state.runId ?? '',
    prompt: file.prompt ?? '',
  };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[session:check-iteration] shouldContinue=true nextIteration=${state.iteration + 1}`);
  }

  return 0;
}

// ── session:last-message ─────────────────────────────────────────────

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

/**
 * Parse a JSONL transcript file and extract the last assistant text message.
 * Also detects <promise>...</promise> tags in the text.
 */
export function parseTranscriptLastAssistantMessage(content: string): {
  found: boolean;
  text: string | null;
} {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  let lastAssistant: unknown = null;

  for (const line of lines) {
    try {
      const parsed: unknown = JSON.parse(line) as unknown;
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        // Match assistant entries in multiple transcript formats:
        // 1. Top-level role: "assistant" (test/simple format)
        // 2. Top-level type: "assistant" with message.role: "assistant" (real Claude Code JSONL)
        // 3. message.role: "assistant" regardless of top-level fields (general fallback)
        const isAssistant =
          obj.role === 'assistant' ||
          obj.type === 'assistant' ||
          (obj.message &&
            typeof obj.message === 'object' &&
            (obj.message as Record<string, unknown>).role === 'assistant');
        if (isAssistant) {
          lastAssistant = parsed;
        }
      }
    } catch {
      // Skip malformed lines
    }
  }

  if (!lastAssistant) {
    return { found: false, text: null };
  }

  const msg = lastAssistant as Record<string, unknown>;
  // Handle message.content array structure (Claude API format)
  // or content array directly
  const contentArr = (msg.message && typeof msg.message === 'object'
    ? (msg.message as Record<string, unknown>).content
    : msg.content) as Array<Record<string, unknown>> | undefined;

  if (!Array.isArray(contentArr)) {
    return { found: false, text: null };
  }

  const textParts = contentArr
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string);

  if (textParts.length === 0) {
    return { found: false, text: null };
  }

  return { found: true, text: textParts.join('\n') };
}

/**
 * Extract content from first <promise>...</promise> tag.
 * Trims whitespace and collapses internal whitespace to single spaces.
 */
export function extractPromiseTag(text: string): string | null {
  const match = text.match(/<promise>([\s\S]*?)<\/promise>/);
  if (!match) return null;
  return match[1].trim().replace(/\s+/g, ' ');
}

export function handleSessionLastMessage(
  args: SessionLastMessageArgs
): number {
  const result: SessionLastMessageResult = {
    found: false,
    text: null,
    hasPromise: false,
    promiseValue: null,
  };

  const transcriptPath = resolveInputPath(args.transcriptPath);

  if (!existsSync(transcriptPath)) {
    result.error = 'TRANSCRIPT_NOT_FOUND';
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(
        `[session:last-message] error=TRANSCRIPT_NOT_FOUND path=${transcriptPath}`
      );
    }
    return 0;
  }

  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const parsed = parseTranscriptLastAssistantMessage(content);

    result.found = parsed.found;
    result.text = parsed.text;

    if (parsed.found && parsed.text) {
      const promiseValue = extractPromiseTag(parsed.text);
      result.hasPromise = promiseValue !== null;
      result.promiseValue = promiseValue;
    }
  } catch {
    result.error = 'TRANSCRIPT_PARSE_ERROR';
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `[session:last-message] found=${result.found} hasPromise=${result.hasPromise}${result.promiseValue ? ` promiseValue=${result.promiseValue}` : ''}`
    );
  }

  return 0;
}

// ── session:iteration-message ─────────────────────────────────────────

export interface SessionIterationMessageArgs {
  runId?: string;
  iteration?: number;
  runsDir: string;
  pluginRoot?: string;
  json: boolean;
}

export interface SessionIterationMessageResult {
  systemMessage: string;
  runState: string | null;
  completionProof: string | null;
  pendingKinds: string | null;
  skillContext: string | null;
  iteration: number;
}

/**
 * Count pending effects grouped by kind, returning a record of kind -> count.
 */
function countPendingByKind(records: EffectRecord[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.kind ?? 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Handle session:iteration-message command.
 * Generates the formatted system message for the next babysitter iteration.
 * Replaces ~22 lines of bash branching + skill-context-resolver call in babysitter-stop-hook.sh.
 */
export async function handleSessionIterationMessage(
  args: SessionIterationMessageArgs
): Promise<number> {
  const { iteration, runId, runsDir, pluginRoot, json } = args;

  // Validate --iteration is provided
  if (iteration === undefined) {
    const error = { error: 'MISSING_ITERATION', message: '--iteration is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('Error: --iteration is required for session:iteration-message');
    }
    return 1;
  }

  let runState: string | null = null;
  let completionProof: string | null = null;
  let pendingKinds: string | null = null;
  let entrypointImportPath: string | undefined;

  // If --run-id is provided, resolve run state from SDK internals
  if (runId) {
    const runDir = path.isAbsolute(runId) ? runId : path.join(runsDir, runId);
    try {
      const metadata = await readRunMetadata(runDir);
      entrypointImportPath = metadata?.entrypoint?.importPath;
      const journal = await loadJournal(runDir);
      const index = await buildEffectIndex({ runDir, events: journal });

      // Check for completion proof
      const hasCompleted = journal.some((e) => e.type === 'RUN_COMPLETED');
      const hasFailed = journal.some((e) => e.type === 'RUN_FAILED');

      if (hasCompleted) {
        completionProof = resolveCompletionProof(metadata);
      }

      // Determine pending effects
      const pendingRecords = index.listPendingEffects();
      const pendingByKind = countPendingByKind(pendingRecords);
      const kindKeys = Object.keys(pendingByKind);
      if (kindKeys.length > 0) {
        pendingKinds = kindKeys.join(', ');
      }

      // Derive run state
      if (completionProof) {
        runState = 'completed';
      } else if (hasFailed) {
        runState = 'failed';
      } else if (pendingRecords.length > 0) {
        runState = 'waiting';
      } else {
        runState = 'created';
      }
    } catch {
      // If we can't read run state, continue without it
      runState = null;
    }
  }

  // Build system message using 4-branch logic
  let systemMessage: string;

  if (completionProof) {
    systemMessage =
      `\u{1F504} Babysitter iteration ${iteration} | Run completed! To finish: agent must call 'run:status --json' on your run, extract 'completionProof' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise.`;
  } else if (runState === 'waiting' && pendingKinds) {
    systemMessage =
      `\u{1F504} Babysitter iteration ${iteration} | Waiting on: ${pendingKinds}. Check if pending effects are resolved, then call run:iterate.`;
  } else if (runState === 'failed') {
    systemMessage =
      `\u{1F504} Babysitter iteration ${iteration} | Failed. agent must fix the run, journal or process (inspect the sdk.md if needed) and proceed.`;
  } else {
    systemMessage =
      `\u{1F504} Babysitter iteration ${iteration} | Agent should continue orchestration (run:iterate)`;
  }

  // Resolve skill context via CLI skill discovery when pluginRoot is provided
  let skillContext: string | null = null;
  if (pluginRoot) {
    try {
      const discoverResult = await discoverSkillsInternal({
        pluginRoot,
        runId,
        runsDir,
        processPath: entrypointImportPath,
      });
      skillContext = discoverResult.summary || null;
    } catch {
      // Skill discovery failure is non-fatal
      skillContext = null;
    }
  }

  const result: SessionIterationMessageResult = {
    systemMessage,
    runState,
    completionProof,
    pendingKinds,
    skillContext,
    iteration,
  };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[session:iteration-message] iteration=${iteration} runState=${runState ?? 'none'}`);
    console.log(`  systemMessage: ${systemMessage}`);
  }

  return 0;
}
