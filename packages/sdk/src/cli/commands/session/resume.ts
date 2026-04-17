import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { getGlobalStateDir } from '../../../config';
import {
  SessionError,
  SessionState,
  getCurrentTimestamp,
  getSessionFilePath,
  writeSessionFile,
} from '../../../session';

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

  const stateDir = args.stateDir ?? getGlobalStateDir();
  const maxIterations = args.maxIterations ?? 256;
  const runsDir = args.runsDir ?? '.a5c/runs';
  const runDir = path.join(runsDir, runId);

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
  try {
    const runJson = JSON.parse(
      await fs.readFile(path.join(runDir, 'run.json'), 'utf8'),
    ) as Record<string, unknown>;
    processId = (typeof runJson.processId === 'string' ? runJson.processId : undefined) ?? 'unknown';

    const journalFiles = await fs.readdir(path.join(runDir, 'journal'));
    const lastFile = journalFiles.filter((file) => file.endsWith('.json')).sort().pop();
    if (lastFile) {
      const lastEvent = JSON.parse(
        await fs.readFile(path.join(runDir, 'journal', lastFile), 'utf8'),
      ) as Record<string, unknown>;
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
    runIds: [],
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

  const result = { stateFile: filePath, runId, runState, processId };
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
