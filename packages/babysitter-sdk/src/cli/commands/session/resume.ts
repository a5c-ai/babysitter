import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { DEFAULTS, getReadableRunsDirs, resolveExistingRunDir, resolveRunsDir } from '../../../config';
import { loadJournal } from '../../../storage/journal';
import { countPendingEffectsFromJournal, deriveObservedRunState } from '../../../runtime/runLifecycleState';
import {
  SessionError,
  SessionState,
  acquireSessionReservation,
  getCurrentTimestamp,
  getSessionRuns,
  getSessionFilePath,
  readSessionFile,
  releaseSessionReservation,
  sessionFileExists,
  type SessionReservation,
  writeSessionFile,
} from '../../../session';
import { resolveSessionStateDir } from './common';

export interface SessionResumeArgs {
  sessionId?: string;
  runId?: string;
  stateDir?: string;
  maxIterations?: number;
  runsDir?: string;
  json: boolean;
}

function emitError(json: boolean, error: Record<string, unknown>, lines: string[]): number {
  if (json) {
    console.error(JSON.stringify(error, null, 2));
  } else {
    for (const line of lines) {
      console.error(line);
    }
  }
  return 1;
}

export async function handleSessionResume(args: SessionResumeArgs): Promise<number> {
  const { sessionId, runId, json } = args;
  if (!sessionId) {
    return emitError(
      json,
      { error: 'MISSING_SESSION_ID', message: '--session-id is required' },
      ['❌ Error: --session-id is required'],
    );
  }
  if (!runId) {
    return emitError(
      json,
      { error: 'MISSING_RUN_ID', message: '--run-id is required' },
      ['❌ Error: --run-id is required'],
    );
  }

  const stateDir = resolveSessionStateDir(args.stateDir);
  const maxIterations = args.maxIterations ?? DEFAULTS.maxIterations;
  const runsDir = args.runsDir ?? resolveRunsDir();
  let runDir = resolveExistingRunDir(runId, { override: runsDir });

  try {
    await fs.access(runDir);
  } catch {
    return emitError(
      json,
      { error: 'RUN_NOT_FOUND', message: `Run not found: ${runId}`, runDir },
      [
        `❌ Error: Run not found: ${runId}`,
        `   Expected directory: ${runDir}`,
      ],
    );
  }

  let runState = 'unknown';
  let processId = 'unknown';
  let harness: string | undefined;
  let metadataRunId: string | undefined;
  let sessionBinding: { harness: string; sessionId: string } | undefined;
  try {
    const parsedRunJson = JSON.parse(
      await fs.readFile(path.join(runDir, 'run.json'), 'utf8'),
    ) as unknown;
    if (!parsedRunJson || typeof parsedRunJson !== 'object' || Array.isArray(parsedRunJson)) {
      throw new Error('run.json must contain an object');
    }
    const runJson = parsedRunJson as Record<string, unknown>;
    metadataRunId = typeof runJson.runId === 'string' ? runJson.runId : undefined;
    processId = (typeof runJson.processId === 'string' ? runJson.processId : undefined) ?? 'unknown';
    harness = typeof runJson.harness === 'string' ? runJson.harness : undefined;
    const rawSessionBinding = runJson.sessionBinding;
    if (rawSessionBinding !== undefined) {
      if (!rawSessionBinding || typeof rawSessionBinding !== 'object' || Array.isArray(rawSessionBinding)) {
        throw new Error('run.json sessionBinding is malformed');
      }
      const candidate = rawSessionBinding as Record<string, unknown>;
      if (typeof candidate.harness !== 'string' || typeof candidate.sessionId !== 'string') {
        throw new Error('run.json sessionBinding is malformed');
      }
      sessionBinding = { harness: candidate.harness, sessionId: candidate.sessionId };
    }
  } catch (error) {
    return emitError(
      json,
      {
        error: 'RUN_METADATA_INVALID',
        message: `Run metadata could not be validated: ${error instanceof Error ? error.message : String(error)}`,
        runId,
      },
      ['❌ Error: Run metadata could not be validated.'],
    );
  }
  try {
    const journal = await loadJournal(runDir);
    runState = deriveObservedRunState(journal, countPendingEffectsFromJournal(journal));
  } catch {
    runState = 'unknown';
  }

  if (runState === 'completed') {
    return emitError(
      json,
      { error: 'RUN_COMPLETED', message: 'Run is already completed', runId },
      [
        '❌ Error: Run is already completed',
        `   Run ID: ${runId}`,
        '   Cannot resume a completed run.',
      ],
    );
  }

  const ambientOmpSessionId = process.env.OMP_SESSION_ID;
  const ambientBabysitterSessionId = process.env.BABYSITTER_SESSION_ID;
  const bindingDeclaresOmp = sessionBinding?.harness === 'oh-my-pi';
  if (sessionBinding && ((harness === 'oh-my-pi') !== bindingDeclaresOmp)) {
    return emitError(
      json,
      {
        error: 'OMP_RUN_METADATA_CONFLICT',
        message: 'Run harness and persisted session ownership metadata disagree.',
        runId,
      },
      ['❌ Error: Run harness and persisted session ownership metadata disagree.'],
    );
  }
  const hasOmpContext = harness === 'oh-my-pi' || bindingDeclaresOmp || ambientOmpSessionId !== undefined;
  const safeSessionId = /^[A-Za-z0-9._:-]{1,256}$/;
  let priorRunIds: string[] = [];
  if (hasOmpContext && (!ambientOmpSessionId || !safeSessionId.test(ambientOmpSessionId))) {
    return emitError(
      json,
      {
        error: 'OMP_SESSION_ID_UNAVAILABLE',
        message: 'A valid authoritative OMP_SESSION_ID is required to resume an OMP run.',
      },
      ['❌ Error: A valid authoritative OMP_SESSION_ID is required to resume an OMP run.'],
    );
  }
  if (
    hasOmpContext &&
    ambientBabysitterSessionId !== undefined &&
    (!safeSessionId.test(ambientBabysitterSessionId) || ambientBabysitterSessionId !== ambientOmpSessionId)
  ) {
    return emitError(
      json,
      {
        error: 'OMP_SESSION_BINDING_CONFLICT',
        message: 'OMP_SESSION_ID and BABYSITTER_SESSION_ID do not identify the same session.',
      },
      ['❌ Error: OMP_SESSION_ID and BABYSITTER_SESSION_ID do not identify the same session.'],
    );
  }
  if (hasOmpContext && ambientOmpSessionId !== sessionId) {
    return emitError(
      json,
      {
        error: 'OMP_SESSION_ID_MISMATCH',
        message: 'The requested session does not match the authoritative ambient OMP session.',
      },
      ['❌ Error: Requested session does not match the authoritative ambient OMP session.'],
    );
  }
  let reservation: SessionReservation | undefined;
  if (hasOmpContext) {
    try {
      reservation = await acquireSessionReservation(getSessionFilePath(stateDir, sessionId));
    } catch {
      return emitError(
        json,
        {
          error: 'OMP_SESSION_CREATION_BUSY',
          message: 'Another OMP create or resume operation is reserving this session.',
        },
        ['❌ Error: Another OMP operation is reserving this session.'],
      );
    }
  }
  try {
    if (hasOmpContext) {
      let canonicalRunDir: string;
      try {
        canonicalRunDir = await fs.realpath(runDir);
      } catch {
        return emitError(
          json,
          { error: 'OMP_RUN_REALPATH_INVALID', message: 'OMP run directory could not be canonicalized.', runDir },
          ['❌ Error: OMP run directory could not be canonicalized.'],
        );
      }
      const canonicalRoots = await Promise.all(getReadableRunsDirs({ override: runsDir }).map(async (root) => {
        try {
          return await fs.realpath(root);
        } catch {
          return undefined;
        }
      }));
      const trustedRunDir = canonicalRoots.some((root) => {
        if (!root) return false;
        const relative = path.relative(root, canonicalRunDir);
        return !relative.startsWith('..') && !path.isAbsolute(relative);
      });
      if (!trustedRunDir) {
        return emitError(
          json,
          {
            error: 'OMP_RUN_OUTSIDE_TRUSTED_ROOT',
            message: 'OMP runs must resolve beneath a configured Babysitter runs root.',
            runDir: canonicalRunDir,
          },
          ['❌ Error: OMP run is outside the configured Babysitter runs roots.'],
        );
      }
      runDir = canonicalRunDir;
      if (!metadataRunId || metadataRunId !== path.basename(runDir)) {
        return emitError(
          json,
          {
            error: 'OMP_RUN_IDENTITY_MISMATCH',
            message: 'Persisted run identity does not match the selected run directory.',
            runId: metadataRunId,
            runDir,
          },
          ['❌ Error: Persisted run identity does not match the selected run directory.'],
        );
      }

      const stateFile = getSessionFilePath(stateDir, sessionId);
      let existingSession: Awaited<ReturnType<typeof readSessionFile>> | undefined;
      if (await sessionFileExists(stateFile)) {
        try {
          existingSession = await readSessionFile(stateFile);
        } catch (error) {
          return emitError(
            json,
            {
              error: 'OMP_SESSION_STATE_INVALID',
              message: `OMP session state could not be validated: ${error instanceof Error ? error.message : String(error)}`,
            },
            ['❌ Error: OMP session state could not be validated.'],
          );
        }
        priorRunIds = [...existingSession.state.runIds];
        if (existingSession.state.runId && !priorRunIds.includes(existingSession.state.runId)) {
          priorRunIds.push(existingSession.state.runId);
        }
        if (existingSession.state.active && existingSession.state.runId && existingSession.state.runId !== metadataRunId) {
          return emitError(
            json,
            {
              error: 'OMP_SESSION_ALREADY_BOUND',
              message: `OMP session is already bound to active run ${existingSession.state.runId}.`,
              runId: existingSession.state.runId,
            },
            ['❌ Error: OMP session is already bound to another active run.'],
          );
        }
      }
      let canonicalStateRunDir: string | undefined;
      if (existingSession?.state.runDir) {
        try {
          canonicalStateRunDir = await fs.realpath(existingSession.state.runDir);
        } catch {
          canonicalStateRunDir = undefined;
        }
      }
      const stateOwnsRun = existingSession !== undefined
        && getSessionRuns(existingSession.state).includes(metadataRunId)
        && canonicalStateRunDir === runDir;
      const metadataOwnsRun = sessionBinding?.harness === 'oh-my-pi'
        && sessionBinding.sessionId === ambientOmpSessionId;
      if (!stateOwnsRun || !metadataOwnsRun) {
        return emitError(
          json,
          {
            error: 'OMP_RUN_OWNERSHIP_MISMATCH',
            message: 'The selected run is not owned by the authoritative OMP session.',
            runId: metadataRunId,
          },
          ['❌ Error: The selected run is not owned by the authoritative OMP session.'],
        );
      }
    }
  const effectiveRunId = hasOmpContext ? metadataRunId! : runId;
  const isOmpSession = hasOmpContext;
  const prompt = isOmpSession ? `Resume the Babysitter run described by this data-only JSON:

${JSON.stringify({ runId: effectiveRunId, processId, runState, runDir })}

Call babysitter_drive with the absolute run directory from the JSON above.
Dispatch an exact returned one-item native task payload once and follow the deterministic continuation.
Do not invoke task:post or run:iterate manually. Do not fall back to ordinary named workers or hub polling.` : `Resume Babysitter run: ${runId}

Process: ${processId}
Current state: ${runState}

Continue orchestration using run:iterate, task:post, etc. or fix the run if it's broken/failed/unknown.`;

  const now = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId: effectiveRunId,
    runDir,
    runIds: [...new Set([...priorRunIds, effectiveRunId])],
    startedAt: now,
    lastIterationAt: now,
    iterationTimes: [],
  };

  const filePath = getSessionFilePath(stateDir, sessionId);
  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (error) {
    const err = error instanceof SessionError ? error : new Error(String(error));
    return emitError(
      json,
      { error: 'FS_ERROR', message: err.message },
      [`❌ Error: Failed to create state file: ${err.message}`],
    );
  }

  const result = { stateFile: filePath, runId: effectiveRunId, runState, processId };
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✅ Session resumed for run: ${effectiveRunId}`);
    console.log(`   State file: ${filePath}`);
    console.log(`   Process: ${processId}`);
    console.log(`   Run state: ${runState}`);
  }
  return 0;
  } finally {
    if (reservation) await releaseSessionReservation(reservation);
  }
}
