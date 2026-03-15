import * as fs from 'fs';
import * as path from 'path';
import { JournalEvent, TaskEffect, TaskDetail, Run, RunStatus, EventType, TaskKind } from '../types';

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Journal filename parsing
// ---------------------------------------------------------------------------

/**
 * Parse filename pattern: 000001.01KKBHDP9KZ6RTHVRAFBYHRCFW.json -> { seq: 1, id: "01KKBHDP9KZ6RTHVRAFBYHRCFW" }
 */
function parseJournalFilename(filename: string): { seq: number; id: string } | null {
  const match = filename.match(/^(\d+)\.([A-Za-z0-9]+)\.json$/);
  if (!match) {
    return null;
  }
  return {
    seq: parseInt(match[1], 10),
    id: match[2],
  };
}

// ---------------------------------------------------------------------------
// Journal directory parsing
// ---------------------------------------------------------------------------

/**
 * Read and parse all journal events from a run's journal/ directory.
 * Sort by filename (sequential order), normalize recordedAt -> ts, data -> payload.
 */
export function parseJournalDir(journalPath: string, skipCount?: number): JournalEvent[] {
  if (!fs.existsSync(journalPath)) {
    return [];
  }

  let files: string[];
  try {
    files = fs.readdirSync(journalPath).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }

  if (skipCount !== undefined && skipCount > 0) {
    files = files.slice(skipCount);
  }

  const events: JournalEvent[] = [];
  for (const file of files) {
    const parsed = parseJournalFilename(file);
    if (!parsed) {
      continue;
    }

    try {
      const raw = fs.readFileSync(path.join(journalPath, file), 'utf-8');
      const data = JSON.parse(raw) as Record<string, unknown>;
      events.push({
        seq: parsed.seq,
        id: parsed.id,
        ts: String(data['recordedAt'] ?? data['ts'] ?? new Date().toISOString()),
        type: String(data['type'] ?? 'UNKNOWN') as EventType,
        payload: (data['data'] ?? data['payload'] ?? {}) as Record<string, unknown>,
        checksum: data['checksum'] as string | undefined,
      });
    } catch (err) {
      console.warn(`Skipping malformed journal file: ${file}`, err);
    }
  }

  return events;
}

/**
 * Incremental parsing - returns events after previousFileCount and the new total.
 */
export function parseJournalDirIncremental(
  journalPath: string,
  previousFileCount: number,
): { events: JournalEvent[]; totalFileCount: number } {
  if (!fs.existsSync(journalPath)) {
    return { events: [], totalFileCount: 0 };
  }

  let files: string[];
  try {
    files = fs.readdirSync(journalPath).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return { events: [], totalFileCount: 0 };
  }

  const totalFileCount = files.length;
  if (totalFileCount <= previousFileCount) {
    return { events: [], totalFileCount };
  }

  const newEvents = parseJournalDir(journalPath, previousFileCount);
  return { events: newEvents, totalFileCount };
}

// ---------------------------------------------------------------------------
// Run directory parsing
// ---------------------------------------------------------------------------

/**
 * Parse a single run directory into a full Run object.
 *
 * 1. Read run.json for metadata (runId, processId, createdAt, prompt)
 * 2. Parse journal events
 * 3. Build task map from EFFECT_REQUESTED and EFFECT_RESOLVED
 * 4. Read tasks/<effectId>/task.json for titles, agent info, breakpoint questions
 * 5. Derive status, duration, failedTasks, breakpointQuestion, waitingKind, isStale
 */
export function parseRunDir(runDirPath: string): Run | null {
  const runJsonPath = path.join(runDirPath, 'run.json');

  // 1. Read run.json
  let meta: Record<string, unknown>;
  try {
    const raw = fs.readFileSync(runJsonPath, 'utf-8');
    meta = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }

  const runId = String(meta['runId'] ?? path.basename(runDirPath));
  const processId = String(meta['processId'] ?? 'unknown');

  // 2. Parse journal events
  const journalPath = path.join(runDirPath, 'journal');
  const events = parseJournalDir(journalPath);

  // 3. Build task map from events
  const taskMap = new Map<string, TaskEffect>();

  for (const event of events) {
    if (event.type === 'EFFECT_REQUESTED') {
      const p = event.payload;
      const effectId = String(p['effectId'] ?? '');
      if (!effectId) {
        continue;
      }
      const kind = String(p['kind'] ?? 'node') as TaskKind;
      taskMap.set(effectId, {
        effectId,
        kind,
        title: String(p['title'] ?? p['taskId'] ?? effectId),
        label: p['label'] as string | undefined,
        status: 'requested',
        invocationKey: p['invocationKey'] as string | undefined,
        stepId: p['stepId'] as string | undefined,
        taskId: p['taskId'] as string | undefined,
        requestedAt: event.ts,
        breakpointQuestion: kind === 'breakpoint' ? String(p['question'] ?? p['title'] ?? '') : undefined,
        agent: p['agent'] as TaskEffect['agent'],
      });
    } else if (event.type === 'EFFECT_RESOLVED') {
      const p = event.payload;
      const effectId = String(p['effectId'] ?? '');
      const existing = taskMap.get(effectId);
      if (existing) {
        const hasError = p['error'] !== undefined && p['error'] !== null;
        existing.status = hasError ? 'error' : 'resolved';
        existing.resolvedAt = event.ts;
        existing.error = hasError ? String(p['error']) : undefined;
        if (existing.requestedAt) {
          existing.duration = new Date(event.ts).getTime() - new Date(existing.requestedAt).getTime();
        }
      }
    }
  }

  // 4. Enrich from task directories (task.json files)
  const tasksDir = path.join(runDirPath, 'tasks');
  if (fs.existsSync(tasksDir)) {
    try {
      const taskDirs = fs.readdirSync(tasksDir);
      for (const effectId of taskDirs) {
        const taskJsonPath = path.join(tasksDir, effectId, 'task.json');
        if (!fs.existsSync(taskJsonPath)) {
          continue;
        }

        try {
          const taskDef = JSON.parse(fs.readFileSync(taskJsonPath, 'utf-8')) as Record<string, unknown>;
          const existing = taskMap.get(effectId);

          if (existing) {
            // Enrich existing task with task.json data
            if (taskDef['title'] && !existing.title) {
              existing.title = String(taskDef['title']);
            }
            if (taskDef['agent'] && !existing.agent) {
              existing.agent = taskDef['agent'] as TaskEffect['agent'];
            }
            if (existing.kind === 'breakpoint' && taskDef['question'] && !existing.breakpointQuestion) {
              existing.breakpointQuestion = String(taskDef['question']);
            }
          } else {
            // Task not in journal events; create from task.json
            const kind = String(taskDef['kind'] ?? 'node') as TaskKind;
            const task: TaskEffect = {
              effectId,
              kind,
              title: String(taskDef['title'] ?? taskDef['taskId'] ?? effectId),
              label: taskDef['label'] as string | undefined,
              status: 'requested',
              taskId: taskDef['taskId'] as string | undefined,
              agent: taskDef['agent'] as TaskEffect['agent'],
              breakpointQuestion: kind === 'breakpoint' ? String(taskDef['question'] ?? taskDef['title'] ?? '') : undefined,
            };

            // Check for result.json
            const resultPath = path.join(tasksDir, effectId, 'result.json');
            if (fs.existsSync(resultPath)) {
              try {
                const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as Record<string, unknown>;
                task.status = result['error'] ? 'error' : 'resolved';
                task.error = result['error'] ? String(result['error']) : undefined;
              } catch {
                // skip
              }
            }

            taskMap.set(effectId, task);
          }
        } catch {
          // skip malformed task.json
        }
      }
    } catch {
      // skip
    }
  }

  const tasks = Array.from(taskMap.values());

  // 5. Derive status
  const status = deriveStatus(events, tasks);

  // Timestamps
  const createdAt = (meta['createdAt'] as string) ?? events[0]?.ts ?? new Date().toISOString();
  const updatedAt = events.length > 0 ? events[events.length - 1].ts : createdAt;

  // Task counts
  const completedTasks = tasks.filter((t) => t.status === 'resolved').length;
  const failedTasks = tasks.filter((t) => t.status === 'error').length;

  // Failure info
  const failEvent = events.find((e) => e.type === 'RUN_FAILED');
  const failureError = failEvent ? String((failEvent.payload)['error'] ?? '') : undefined;
  const failureMessage = failEvent ? String((failEvent.payload)['message'] ?? '') : undefined;

  // Breakpoint detection
  const pendingBreakpoints = tasks.filter((t) => t.kind === 'breakpoint' && t.status === 'requested');
  const breakpointTask = pendingBreakpoints[0];

  // Staleness
  const now = Date.now();
  const updatedMs = new Date(updatedAt).getTime();
  const isStale = (status === 'pending' || status === 'waiting') && (now - updatedMs) > STALE_THRESHOLD_MS;

  // Waiting kind
  const waitingKind: Run['waitingKind'] = status === 'waiting'
    ? (breakpointTask ? 'breakpoint' : 'task')
    : undefined;

  // Duration (only for terminal states)
  const duration = status === 'completed' || status === 'failed'
    ? new Date(updatedAt).getTime() - new Date(createdAt).getTime()
    : undefined;

  // Prompt from inputs.json or run.json
  let prompt: string | undefined = meta['prompt'] as string | undefined;
  if (!prompt) {
    try {
      const inputsPath = path.join(runDirPath, 'inputs.json');
      if (fs.existsSync(inputsPath)) {
        const inputs = JSON.parse(fs.readFileSync(inputsPath, 'utf-8')) as Record<string, unknown>;
        prompt = (inputs['prompt'] as string) ?? (inputs['task'] as string) ?? undefined;
      }
    } catch {
      // ignore
    }
  }

  return {
    runId,
    processId,
    status,
    createdAt,
    updatedAt,
    tasks,
    events,
    totalTasks: tasks.length,
    completedTasks,
    failedTasks,
    duration,
    failureError: failureError || undefined,
    failureMessage: failureMessage || undefined,
    breakpointQuestion: breakpointTask?.breakpointQuestion,
    breakpointEffectId: breakpointTask?.effectId,
    waitingKind,
    isStale,
    prompt,
  };
}

// ---------------------------------------------------------------------------
// Task detail
// ---------------------------------------------------------------------------

/**
 * Get full task detail by reading task.json, result.json, stdout.txt, stderr.txt.
 */
export function getTaskDetail(runDirPath: string, effectId: string): TaskDetail | null {
  const taskDir = path.join(runDirPath, 'tasks', effectId);
  if (!fs.existsSync(taskDir)) {
    return null;
  }

  // Read task.json for base info
  let taskDef: Record<string, unknown> | undefined;
  const taskJsonPath = path.join(taskDir, 'task.json');
  if (fs.existsSync(taskJsonPath)) {
    try {
      taskDef = JSON.parse(fs.readFileSync(taskJsonPath, 'utf-8')) as Record<string, unknown>;
    } catch {
      // skip
    }
  }

  const kind = String(taskDef?.['kind'] ?? 'node') as TaskKind;

  // Build base TaskEffect
  const detail: TaskDetail = {
    effectId,
    kind,
    title: String(taskDef?.['title'] ?? taskDef?.['taskId'] ?? effectId),
    label: taskDef?.['label'] as string | undefined,
    status: 'requested',
    taskId: taskDef?.['taskId'] as string | undefined,
    invocationKey: taskDef?.['invocationKey'] as string | undefined,
    stepId: taskDef?.['stepId'] as string | undefined,
    agent: taskDef?.['agent'] as TaskEffect['agent'],
    breakpointQuestion: kind === 'breakpoint'
      ? String(taskDef?.['question'] ?? taskDef?.['title'] ?? '')
      : undefined,
    input: taskDef?.['input'] as Record<string, unknown> | undefined,
    taskDef,
  };

  // Read result.json
  const resultPath = path.join(taskDir, 'result.json');
  if (fs.existsSync(resultPath)) {
    try {
      const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as Record<string, unknown>;
      const hasError = result['error'] !== undefined && result['error'] !== null;
      detail.status = hasError ? 'error' : 'resolved';
      detail.error = hasError ? String(result['error']) : undefined;
      detail.result = result;
      if (result['resolvedAt']) {
        detail.resolvedAt = String(result['resolvedAt']);
      }
    } catch {
      // skip
    }
  }

  // Read stdout.txt
  const stdoutPath = path.join(taskDir, 'stdout.txt');
  if (fs.existsSync(stdoutPath)) {
    try {
      detail.stdout = fs.readFileSync(stdoutPath, 'utf-8');
    } catch {
      // skip
    }
  }

  // Read stderr.txt
  const stderrPath = path.join(taskDir, 'stderr.txt');
  if (fs.existsSync(stderrPath)) {
    try {
      detail.stderr = fs.readFileSync(stderrPath, 'utf-8');
    } catch {
      // skip
    }
  }

  return detail;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deriveStatus(events: JournalEvent[], tasks: TaskEffect[]): RunStatus {
  // Check terminal events (scan from end for efficiency)
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === 'RUN_COMPLETED') {
      return 'completed';
    }
    if (e.type === 'RUN_FAILED') {
      return 'failed';
    }
  }

  // Check for unresolved tasks
  const hasUnresolved = tasks.some((t) => t.status === 'requested');
  if (hasUnresolved) {
    return 'waiting';
  }

  return 'pending';
}
