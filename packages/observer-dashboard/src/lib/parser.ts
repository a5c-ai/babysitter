import { promises as fs } from "fs";
import path from "path";

/** Return true when err represents a "file/directory not found" filesystem error. */
function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as NodeJS.ErrnoException).code;
  return code === "ENOENT" || code === "ENOTDIR" || err.message.includes("ENOENT");
}

import type {
  Run,
  RunStatus,
  JournalEvent,
  TaskEffect,
  TaskDetail,
  TaskKind,
  RunDigest,
  EffectRequestedPayload,
  EffectResolvedPayload,
  RunCreatedPayload,
} from "@/types";
import { getConfig } from "@/lib/config-loader";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    // ENOENT is expected for non-existent paths; warn on permission or other errors
    if (!isNotFoundError(err)) {
      console.warn(`[parser] Unexpected error checking existence of ${filePath}:`, err);
    }
    return false;
  }
}

async function readJsonSafe<T>(filePath: string, fallback: T | null | undefined): Promise<T | null | undefined> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    // ENOENT is expected for optional files; warn on parse errors or permission issues
    if (!isNotFoundError(err)) {
      console.warn(`[parser] Failed to read/parse JSON from ${filePath}:`, err);
    }
    return fallback;
  }
}

async function readTextSafe(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (err) {
    // ENOENT is expected for optional log files; warn on permission or other errors
    if (!isNotFoundError(err)) {
      console.warn(`[parser] Failed to read text file ${filePath}:`, err);
    }
    return undefined;
  }
}

/** Maximum concurrent filesystem operations to prevent file descriptor exhaustion. */
const BATCH_CONCURRENCY_LIMIT = 50;

/**
 * Execute an array of async factory functions with a concurrency limit.
 * Returns results in the same order as the input, using Promise.allSettled
 * semantics so that individual failures don't crash the batch.
 */
async function batchAllSettled<T>(
  factories: Array<() => Promise<T>>,
  limit: number = BATCH_CONCURRENCY_LIMIT
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(factories.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < factories.length) {
      const idx = nextIndex++;
      try {
        const value = await factories[idx]();
        results[idx] = { status: "fulfilled", value };
      } catch (reason) {
        results[idx] = { status: "rejected", reason };
      }
    }
  }

  const workerCount = Math.min(limit, factories.length);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

// Normalize raw journal entry (which uses `data` and `recordedAt`) into our JournalEvent type
function normalizeJournalEvent(raw: Record<string, unknown>, filename: string): JournalEvent | null {
  if (!raw || !raw.type) return null;

  // Parse seq and id from filename: "000001.ULID.json"
  const parts = filename.replace(/\.json$/, "").split(".");
  const seq = parseInt(parts[0], 10) || 0;
  const id = parts[1] || "";

  return {
    seq,
    id,
    ts: (raw.recordedAt as string) || (raw.ts as string) || "",
    type: raw.type as JournalEvent["type"],
    payload: (raw.data as Record<string, unknown>) || (raw.payload as Record<string, unknown>) || {},
  };
}

/** Result of an incremental journal parse. */
export interface IncrementalJournalResult {
  events: JournalEvent[];
  /** Number of JSON files in the journal directory after this parse. */
  fileCount: number;
}

export async function parseJournalDir(
  journalPath: string
): Promise<JournalEvent[]> {
  const result = await parseJournalDirIncremental(journalPath);
  return result.events;
}

/**
 * Incrementally parse a journal directory.
 *
 * When `previousEvents` and `previousFileCount` are supplied the function
 * skips files that were already parsed in a previous call.  If the
 * directory now has *fewer* files than `previousFileCount` (truncation /
 * rotation) the journal is re-read from scratch.
 *
 * @param journalPath          Path to the journal directory.
 * @param previousEvents       Events returned by a prior call (used as base for merge).
 * @param previousFileCount    Number of JSON files that existed during the prior call.
 * @returns Merged events array (sorted by seq) and the current file count.
 */
export async function parseJournalDirIncremental(
  journalPath: string,
  previousEvents?: JournalEvent[],
  previousFileCount?: number
): Promise<IncrementalJournalResult> {
  if (!(await fileExists(journalPath))) return { events: [], fileCount: 0 };

  const files = await fs.readdir(journalPath);
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();
  const currentFileCount = jsonFiles.length;

  // Determine whether we can do an incremental read.
  // Incremental is possible when we have cached state AND the file count
  // has not shrunk (truncation / rotation guard).
  const canIncremental =
    previousEvents !== undefined &&
    previousFileCount !== undefined &&
    previousFileCount >= 0 &&
    currentFileCount >= previousFileCount;

  if (canIncremental) {
    const newFilesStartIdx = previousFileCount!;

    // No new files — return the previous result as-is.
    if (newFilesStartIdx >= currentFileCount) {
      return { events: previousEvents!, fileCount: currentFileCount };
    }

    const newFiles = jsonFiles.slice(newFilesStartIdx);

    // Batch-read only the new files
    const readFactories = newFiles.map(
      (file) => () =>
        readJsonSafe<Record<string, unknown>>(path.join(journalPath, file), null)
    );
    const settled = await batchAllSettled(readFactories);

    const newEvents: JournalEvent[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const result = settled[i];
      const raw = result.status === "fulfilled" ? result.value : null;
      if (raw) {
        const event = normalizeJournalEvent(raw, newFiles[i]);
        if (event) newEvents.push(event);
      }
    }

    // Merge: previousEvents is already sorted; new events are appended and
    // the full array is re-sorted to guarantee correctness.
    const merged = [...previousEvents!, ...newEvents].sort((a, b) => a.seq - b.seq);
    return { events: merged, fileCount: currentFileCount };
  }

  // Full re-read (first call, or truncation detected).
  const readFactories = jsonFiles.map(
    (file) => () =>
      readJsonSafe<Record<string, unknown>>(path.join(journalPath, file), null)
  );
  const settled = await batchAllSettled(readFactories);

  const events: JournalEvent[] = [];
  for (let i = 0; i < jsonFiles.length; i++) {
    const result = settled[i];
    const raw = result.status === "fulfilled" ? result.value : null;
    if (raw) {
      const event = normalizeJournalEvent(raw, jsonFiles[i]);
      if (event) events.push(event);
    }
  }

  return { events: events.sort((a, b) => a.seq - b.seq), fileCount: currentFileCount };
}

/** Options for incremental run parsing. */
export interface IncrementalRunOptions {
  previousEvents?: JournalEvent[];
  previousFileCount?: number;
}

/** Extended Run result that includes the journal file count for caching. */
export interface ParseRunResult extends Run {
  /** Number of journal files parsed — used by the cache layer for incremental reads. */
  _journalFileCount: number;
}

export async function parseRunDir(
  runPath: string,
  incremental?: IncrementalRunOptions
): Promise<ParseRunResult> {
  const runJson = await readJsonSafe<Record<string, unknown>>(
    path.join(runPath, "run.json"),
    {}
  );

  const journalResult = await parseJournalDirIncremental(
    path.join(runPath, "journal"),
    incremental?.previousEvents,
    incremental?.previousFileCount
  );
  const events = journalResult.events;

  // Extract run info from events
  const runCreated = events.find((e) => e.type === "RUN_CREATED");
  const runCompleted = events.find((e) => e.type === "RUN_COMPLETED");
  const runFailed = events.find((e) => e.type === "RUN_FAILED");

  const createdPayload = (runCreated?.payload ||
    {}) as unknown as RunCreatedPayload;

  // Build task map from events — first pass: collect all requested/resolved info
  const taskMap = new Map<string, TaskEffect>();
  const requestedPayloads: EffectRequestedPayload[] = [];

  for (const event of events) {
    if (event.type === "EFFECT_REQUESTED") {
      const p = event.payload as unknown as EffectRequestedPayload;
      requestedPayloads.push(p);
      taskMap.set(p.effectId, {
        effectId: p.effectId,
        kind: p.kind,
        title: p.label || p.taskId,
        label: p.label || p.taskId,
        status: "requested",
        invocationKey: p.invocationKey,
        stepId: p.stepId,
        taskId: p.taskId,
        requestedAt: event.ts,
      });
    }

    if (event.type === "EFFECT_RESOLVED") {
      const p = event.payload as unknown as EffectResolvedPayload;
      const task = taskMap.get(p.effectId);
      if (task) {
        task.status = p.status === "ok" ? "resolved" : "error";
        task.resolvedAt = event.ts;
        task.startedAt = p.startedAt;
        task.finishedAt = p.finishedAt;
        if (p.startedAt && p.finishedAt) {
          task.duration =
            new Date(p.finishedAt).getTime() -
            new Date(p.startedAt).getTime();
        }
        if (p.error) {
          task.error = {
            name: p.error.name,
            message: p.error.message,
            stack: p.error.stack,
          };
        }
      }
    }
  }

  // Batch-read all task.json files in parallel for EFFECT_REQUESTED tasks
  if (requestedPayloads.length > 0) {
    const taskDefFactories = requestedPayloads.map(
      (p) => () =>
        readJsonSafe<Record<string, unknown>>(
          path.join(runPath, "tasks", p.effectId, "task.json"),
          null
        )
    );
    const taskDefResults = await batchAllSettled(taskDefFactories);

    for (let i = 0; i < requestedPayloads.length; i++) {
      const p = requestedPayloads[i];
      const result = taskDefResults[i];
      const taskDef = result.status === "fulfilled" ? result.value : null;
      if (taskDef) {
        const task = taskMap.get(p.effectId)!;
        task.title = (taskDef.title as string) || task.title;
        if (taskDef.agent && typeof taskDef.agent === "object") {
          const agentDef = taskDef.agent as Record<string, unknown>;
          task.agent = {
            name: (agentDef.name as string) || "unknown",
            prompt: agentDef.prompt as NonNullable<TaskEffect["agent"]>["prompt"],
          };
        }
        // Extract breakpoint question from inputs for breakpoint tasks
        if (p.kind === "breakpoint") {
          const inputs = taskDef.inputs as Record<string, unknown> | undefined;
          if (inputs && typeof inputs.question === "string") {
            task.breakpointQuestion = inputs.question;
          }
        }
      }
    }
  }

  const tasks = Array.from(taskMap.values());
  const completedTasks = tasks.filter((t) => t.status === "resolved").length;
  const failedTasks = tasks.filter((t) => t.status === "error").length;

  // Task 1.2: Extract failed step name from the first task that resolved with error
  const firstFailedTask = tasks.find((t) => t.status === "error");
  const failedStep = firstFailedTask
    ? firstFailedTask.title || firstFailedTask.label || firstFailedTask.stepId
    : undefined;

  // Extract failure details from RUN_FAILED event or last failed EFFECT_RESOLVED
  let failureError: string | undefined;
  let failureMessage: string | undefined;

  if (runFailed) {
    const failPayload = runFailed.payload as Record<string, unknown>;
    const runError = failPayload.error as { name?: string; message?: string; stack?: string } | undefined;
    if (runError) {
      failureError = runError.name || "Error";
      failureMessage = runError.message || runError.stack || undefined;
    }
  }

  // If we still don't have a message, look at the last EFFECT_RESOLVED with error status
  if (!failureMessage) {
    const lastFailedEffect = [...events]
      .reverse()
      .find((e) => e.type === "EFFECT_RESOLVED" && (e.payload as Record<string, unknown>).status === "error");
    if (lastFailedEffect) {
      const effectPayload = lastFailedEffect.payload as Record<string, unknown>;
      const effectError = effectPayload.error as { name?: string; message?: string; stack?: string } | undefined;
      if (effectError) {
        failureError = failureError || effectError.name || "Error";
        failureMessage = effectError.message || effectError.stack || undefined;
      }
    }
  }

  let status: RunStatus = "pending";
  if (runCompleted) status = "completed";
  else if (runFailed) status = "failed";
  else if (tasks.some((t) => t.status === "requested")) status = "waiting";

  // Task 1.3: Extract breakpoint question from pending breakpoint tasks
  let breakpointQuestion: string | undefined;
  if (status === "waiting") {
    const pendingBreakpoint = tasks.find(
      (t) => t.kind === "breakpoint" && t.status === "requested"
    );
    if (pendingBreakpoint?.breakpointQuestion) {
      breakpointQuestion = pendingBreakpoint.breakpointQuestion;
    }
  }

  // Determine waitingKind: check the last requested (pending) task
  let waitingKind: 'breakpoint' | 'task' | undefined;
  if (status === "waiting") {
    const requestedTasks = tasks.filter((t) => t.status === "requested");
    const lastRequested = requestedTasks[requestedTasks.length - 1];
    if (lastRequested) {
      waitingKind = lastRequested.kind === "breakpoint" ? "breakpoint" : "task";
    }
  }

  const createdAt = runCreated?.ts || "";
  const lastEvent = events[events.length - 1];

  let duration: number | undefined;
  if (createdAt && (runCompleted || runFailed)) {
    const endTs = (runCompleted || runFailed)!.ts;
    duration = new Date(endTs).getTime() - new Date(createdAt).getTime();
  } else if (createdAt && lastEvent) {
    duration =
      new Date(lastEvent.ts).getTime() - new Date(createdAt).getTime();
  }

  // Detect staleness for waiting or pending runs
  let isStale: boolean | undefined;
  if (status === "waiting" || status === "pending") {
    const updatedAtTs = lastEvent?.ts || createdAt;
    if (updatedAtTs) {
      const config = await getConfig();
      const timeSinceUpdate = Date.now() - new Date(updatedAtTs).getTime();
      if (timeSinceUpdate > config.staleThresholdMs) {
        isStale = true;
      }
    }
  }

  // Detect orphaned runs: all tasks resolved but no terminal event
  // (process likely crashed before writing RUN_COMPLETED)
  if (status === "pending" && tasks.length > 0 && !tasks.some((t) => t.status === "requested")) {
    isStale = true;
  }

  return {
    runId: createdPayload.runId || path.basename(runPath),
    processId:
      createdPayload.processId ||
      (runJson?.processId as string) ||
      "unknown",
    status,
    createdAt,
    updatedAt: lastEvent?.ts || createdAt,
    completedAt: (runCompleted || runFailed)?.ts,
    tasks,
    events,
    totalTasks: tasks.length,
    completedTasks,
    failedTasks,
    duration,
    failedStep,
    failureError,
    failureMessage,
    breakpointQuestion,
    isStale,
    waitingKind,
    _journalFileCount: journalResult.fileCount,
  };
}

export async function parseTaskDetail(
  runPath: string,
  effectId: string
): Promise<TaskDetail | null> {
  const taskDir = path.join(runPath, "tasks", effectId);
  if (!(await fileExists(taskDir))) return null;

  // Read all 5 task files + journal in parallel with Promise.allSettled
  const [
    taskDefResult,
    inputResult,
    resultResult,
    stdoutResult,
    stderrResult,
    journalEventsResult,
  ] = await Promise.allSettled([
    readJsonSafe<Record<string, unknown>>(path.join(taskDir, "task.json"), null),
    readJsonSafe<Record<string, unknown>>(path.join(taskDir, "input.json"), undefined),
    readJsonSafe<Record<string, unknown>>(path.join(taskDir, "result.json"), undefined),
    readTextSafe(path.join(taskDir, "stdout.log")),
    readTextSafe(path.join(taskDir, "stderr.log")),
    parseJournalDir(path.join(runPath, "journal")),
  ]);

  const taskDef = taskDefResult.status === "fulfilled" ? taskDefResult.value : null;
  const input = inputResult.status === "fulfilled" ? inputResult.value : undefined;
  const result = resultResult.status === "fulfilled" ? resultResult.value : undefined;
  const stdout = stdoutResult.status === "fulfilled" ? stdoutResult.value : undefined;
  const stderr = stderrResult.status === "fulfilled" ? stderrResult.value : undefined;
  const journalEvents = journalEventsResult.status === "fulfilled" ? journalEventsResult.value : [];

  // Extract timing from result.json
  const resultStartedAt = result?.startedAt as string | undefined;
  const resultFinishedAt = result?.finishedAt as string | undefined;
  const requestedEvent = journalEvents.find(
    (e) => e.type === "EFFECT_REQUESTED" && (e.payload as Record<string, unknown>).effectId === effectId
  );
  const resolvedEvent = journalEvents.find(
    (e) => e.type === "EFFECT_RESOLVED" && (e.payload as Record<string, unknown>).effectId === effectId
  );

  const requestedAt = requestedEvent?.ts || "";
  const resolvedAt = resolvedEvent?.ts;

  // Compute duration: prefer wall-clock time (requestedAt → resolvedAt) over
  // startedAt/finishedAt which are often identical when set by task:post
  let duration: number | undefined;
  if (resultStartedAt && resultFinishedAt) {
    const resultDuration = new Date(resultFinishedAt).getTime() - new Date(resultStartedAt).getTime();
    // If result timestamps differ, use them; otherwise fall back to journal wall-clock
    if (resultDuration > 0) {
      duration = resultDuration;
    } else if (requestedAt && resolvedAt) {
      duration = new Date(resolvedAt).getTime() - new Date(requestedAt).getTime();
    } else {
      duration = 0;
    }
  } else if (requestedAt && resolvedAt) {
    duration = new Date(resolvedAt).getTime() - new Date(requestedAt).getTime();
  }

  // Use inputs from task.json if separate input.json doesn't exist
  const resolvedInput = input ?? (taskDef?.inputs as Record<string, unknown> | undefined);

  // Extract breakpoint payload for breakpoint tasks
  const kind = (taskDef?.kind as TaskKind) || "agent";
  let breakpointPayload: import("@/types").BreakpointPayload | undefined;
  if (kind === "breakpoint" && resolvedInput) {
    breakpointPayload = {
      question: (resolvedInput.question as string) || "Approval required",
      title: (resolvedInput.title as string) || (taskDef?.title as string) || "Breakpoint",
      options: Array.isArray(resolvedInput.options) ? (resolvedInput.options as string[]) : undefined,
      context: resolvedInput.context as import("@/types").BreakpointPayload["context"],
    };
  }

  // Determine error status from result or journal
  const resolvedPayload = resolvedEvent?.payload as Record<string, unknown> | undefined;
  const isError = result
    ? (result.status === "error")
    : (resolvedPayload?.status === "error");

  return {
    effectId,
    kind,
    title: (taskDef?.title as string) || effectId,
    label: (taskDef?.title as string) || effectId,
    status: resolvedEvent ? (isError ? "error" : "resolved") : "requested",
    invocationKey: (taskDef?.invocationKey as string) || "",
    stepId: (taskDef?.stepId as string) || "",
    taskId: (taskDef?.taskId as string) || "",
    requestedAt,
    resolvedAt,
    startedAt: resultStartedAt,
    finishedAt: resultFinishedAt,
    duration,
    input: resolvedInput,
    result: result ?? undefined,
    stdout,
    stderr,
    taskDef: taskDef ?? undefined,
    breakpoint: breakpointPayload,
    breakpointQuestion: breakpointPayload?.question,
  };
}

export async function getRunDigest(runPath: string): Promise<RunDigest> {
  const journalPath = path.join(runPath, "journal");
  let latestSeq = 0;
  let status: RunStatus = "pending";
  let taskCount = 0;
  let completedTasks = 0;
  let updatedAt = "";

  const requestedBreakpoints = new Set<string>();
  const resolvedEffects = new Set<string>();
  const breakpointEffectIds = new Set<string>();
  // Track requested effects and their kinds for waitingKind determination
  const requestedEffects: Array<{ effectId: string; kind: string }> = [];

  if (await fileExists(journalPath)) {
    const files = await fs.readdir(journalPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();
    latestSeq = jsonFiles.length;

    // Batch-read all journal files in parallel with concurrency limit
    const readFactories = jsonFiles.map(
      (file) => () =>
        readJsonSafe<Record<string, unknown>>(path.join(journalPath, file), null)
    );
    const settled = await batchAllSettled(readFactories);

    // Process results sequentially to maintain event ordering for updatedAt
    for (let i = 0; i < jsonFiles.length; i++) {
      const result = settled[i];
      const raw = result.status === "fulfilled" ? result.value : null;
      if (!raw) continue;
      const event = normalizeJournalEvent(raw, jsonFiles[i]);
      if (!event) continue;
      updatedAt = event.ts;
      if (event.type === "EFFECT_REQUESTED") {
        taskCount++;
        const data = event.payload as Record<string, unknown>;
        const effectId = data.effectId as string;
        const kind = (data.kind as string) || "agent";
        requestedEffects.push({ effectId, kind });
        if (data.kind === "breakpoint") {
          requestedBreakpoints.add(effectId);
          breakpointEffectIds.add(effectId);
        }
      }
      if (event.type === "EFFECT_RESOLVED") {
        completedTasks++;
        const data = event.payload as Record<string, unknown>;
        resolvedEffects.add(data.effectId as string);
      }
      if (event.type === "RUN_COMPLETED") status = "completed";
      if (event.type === "RUN_FAILED") status = "failed";
    }

    if (status === "pending" && taskCount > 0) status = "waiting";
  }

  // Count pending breakpoints (requested but not yet resolved).
  // Also check result.json — the dashboard writes it on approve but can't
  // write journal events, so the journal alone may lag behind.
  let pendingBreakpoints = 0;
  if (requestedBreakpoints.size > 0) {
    const unresolvedBps = [...requestedBreakpoints].filter(
      (id) => !resolvedEffects.has(id)
    );
    if (unresolvedBps.length > 0) {
      const resultChecks = await Promise.all(
        unresolvedBps.map((id) =>
          readJsonSafe<Record<string, unknown>>(
            path.join(runPath, "tasks", id, "result.json"),
            null
          )
        )
      );
      for (let i = 0; i < unresolvedBps.length; i++) {
        if (resultChecks[i] && resultChecks[i]!.status === "ok") {
          resolvedEffects.add(unresolvedBps[i]);
        } else {
          pendingBreakpoints++;
        }
      }
    }
  }

  // Extract breakpoint question and effectId from pending breakpoint tasks — batch-read all at once
  let breakpointQuestion: string | undefined;
  let breakpointEffectId: string | undefined;
  if (status === "waiting" && breakpointEffectIds.size > 0) {
    const pendingBpIds = [...breakpointEffectIds].filter(
      (id) => !resolvedEffects.has(id)
    );
    if (pendingBpIds.length > 0) {
      // Store the first pending breakpoint effectId regardless of question
      breakpointEffectId = pendingBpIds[0];

      const bpFactories = pendingBpIds.map(
        (effectId) => () =>
          readJsonSafe<Record<string, unknown>>(
            path.join(runPath, "tasks", effectId, "task.json"),
            null
          )
      );
      const bpResults = await batchAllSettled(bpFactories);

      // Use the first pending breakpoint question found
      for (let i = 0; i < pendingBpIds.length; i++) {
        const result = bpResults[i];
        const taskDef = result.status === "fulfilled" ? result.value : null;
        if (taskDef) {
          const inputs = taskDef.inputs as Record<string, unknown> | undefined;
          if (inputs && typeof inputs.question === "string") {
            breakpointQuestion = inputs.question;
            breakpointEffectId = pendingBpIds[i];
            break;
          }
        }
      }
    }
  }

  // Determine waitingKind from the last requested (pending) effect
  let waitingKind: 'breakpoint' | 'task' | undefined;
  if (status === "waiting") {
    // Find the last requested effect that hasn't been resolved
    const pendingEffects = requestedEffects.filter(
      (e) => !resolvedEffects.has(e.effectId)
    );
    const lastPending = pendingEffects[pendingEffects.length - 1];
    if (lastPending) {
      waitingKind = lastPending.kind === "breakpoint" ? "breakpoint" : "task";
    }
  }

  // Detect staleness for waiting or pending runs
  let isStale: boolean | undefined;
  if (status === "waiting" || status === "pending") {
    if (updatedAt) {
      const config = await getConfig();
      const timeSinceUpdate = Date.now() - new Date(updatedAt).getTime();
      if (timeSinceUpdate > config.staleThresholdMs) {
        isStale = true;
      }
    }
  }

  // Detect orphaned runs: all effects resolved but no terminal event
  if (status === "waiting" && taskCount > 0 && completedTasks >= taskCount) {
    isStale = true;
  }

  return {
    runId: path.basename(runPath),
    latestSeq,
    status,
    taskCount,
    completedTasks,
    updatedAt,
    pendingBreakpoints,
    breakpointQuestion,
    breakpointEffectId,
    isStale,
    waitingKind,
  };
}

export async function getRunIds(runsPath: string): Promise<string[]> {
  if (!(await fileExists(runsPath))) return [];
  const entries = await fs.readdir(runsPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse();
}
