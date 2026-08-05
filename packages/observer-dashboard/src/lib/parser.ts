import { promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";
import {
  getDriverLiveness,
  deriveLivenessFromActivity,
  deriveScheduledLiveness,
  isSleepingScheduled,
  parseSleepWakeAt,
  type DriverLiveness,
} from "./liveness";

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
  BabysitterCheckpoint,
} from "@/types";
import { getConfig } from "@/lib/config-loader";
import { resolveBreakpointPayload } from "@/lib/breakpoint-payload";

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

const OMP_DRIVER_SCHEMA_VERSION = "2026.07.omp-driver-v1";
const SAFE_AGENT_REF = /^agent:\/\/([A-Za-z0-9][A-Za-z0-9._:-]{0,127})$/;

function isAllocatedOwnerName(agentId: string, requestedName: string): boolean {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(agentId)) return false;
  if (agentId === requestedName) return true;
  if (!agentId.startsWith(`${requestedName}-`)) return false;
  const suffix = agentId.slice(requestedName.length);
  return /^-[2-9]\d*$/.test(suffix);
}

interface ArtifactRead {
  exists: boolean;
  malformed: boolean;
  value?: Record<string, unknown>;
}

async function readArtifact(filePath: string): Promise<ArtifactRead> {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { exists: true, malformed: true };
    }
    return { exists: true, malformed: false, value: parsed as Record<string, unknown> };
  } catch (error) {
    if (isNotFoundError(error)) return { exists: false, malformed: false };
    return { exists: true, malformed: true };
  }
}

function checkpointAttention(attention: string): BabysitterCheckpoint {
  return { state: "failed/attention", attention };
}

export async function parseBabysitterCheckpoint(
  runPath: string,
  task: Pick<TaskEffect, "effectId" | "invocationKey" | "kind" | "status">,
): Promise<BabysitterCheckpoint> {
  if (task.status !== "requested") return { state: "committed" };

  const taskDir = path.join(runPath, "tasks", task.effectId);
  const executionArtifact = await readArtifact(path.join(taskDir, "execution.json"));
  if (!executionArtifact.exists) return { state: "requested" };
  if (executionArtifact.malformed || !executionArtifact.value) {
    return checkpointAttention("Malformed execution checkpoint");
  }

  const checkpoint = executionArtifact.value;
  const expectedKind = task.kind === "skill" ? "agent" : task.kind;
  if (
    checkpoint.schemaVersion !== OMP_DRIVER_SCHEMA_VERSION ||
    checkpoint.effectId !== task.effectId ||
    checkpoint.invocationKey !== task.invocationKey ||
    checkpoint.kind !== expectedKind ||
    (checkpoint.state !== "in_progress" && checkpoint.state !== "completed")
  ) {
    return checkpointAttention("Execution checkpoint identity or version mismatch");
  }

  const attempt = typeof checkpoint.attempt === "number" && Number.isInteger(checkpoint.attempt) && checkpoint.attempt > 0
    ? checkpoint.attempt
    : undefined;
  if (checkpoint.state === "completed") {
    const expectedOutputRef = `tasks/${task.effectId}/output.json`;
    const outputPath = path.join(runPath, expectedOutputRef);
    if (checkpoint.outputRef !== expectedOutputRef || !(await fileExists(outputPath))) {
      return checkpointAttention("Durable output checkpoint is incomplete");
    }
    if (checkpoint.outputSha256 !== undefined) {
      if (typeof checkpoint.outputSha256 !== "string" || !/^[a-f0-9]{64}$/.test(checkpoint.outputSha256)) {
        return checkpointAttention("Durable output checksum is malformed");
      }
      try {
        const outputBytes = await fs.readFile(outputPath);
        const actualSha256 = createHash("sha256").update(outputBytes).digest("hex");
        if (actualSha256 !== checkpoint.outputSha256) {
          return checkpointAttention("Durable output checksum mismatch");
        }
      } catch {
        return checkpointAttention("Durable output checkpoint is incomplete");
      }
    }
    return { state: "durable-output-uncommitted", ...(attempt ? { attempt } : {}) };
  }

  if (checkpoint.kind === "shell") return { state: "shell-running" };
  if (checkpoint.kind !== "agent") return checkpointAttention("Unsupported checkpoint kind");

  const attemptState = checkpoint.attemptState;
  if (attemptState === undefined || attemptState === "prepared" || attemptState === "retry_authorized") {
    return { state: "requested", ...(attempt ? { attempt } : {}) };
  }
  if (attemptState === "failed" || attemptState === "aborted" || attemptState === "cancelled") {
    return checkpointAttention(`Agent attempt ${attemptState}`);
  }

  const ownerArtifact = await readArtifact(path.join(taskDir, "agent-owner.json"));
  if (!ownerArtifact.exists || ownerArtifact.malformed || !ownerArtifact.value) {
    return checkpointAttention("Owning agent checkpoint is missing or malformed");
  }
  const owner = ownerArtifact.value;
  if (
    owner.schemaVersion !== OMP_DRIVER_SCHEMA_VERSION ||
    owner.effectId !== task.effectId ||
    owner.invocationKey !== task.invocationKey ||
    owner.ownerName !== checkpoint.ownerName ||
    owner.dispatchToken !== checkpoint.dispatchToken ||
    owner.attempt !== (attempt ?? 1) ||
    typeof owner.toolCallId !== "string" ||
    owner.toolCallId.length === 0
  ) {
    return checkpointAttention("Owning agent identity mismatch");
  }

  let agentRef: `agent://${string}` | undefined;
  if (owner.agentRef !== undefined) {
    const match = typeof owner.agentRef === "string" ? SAFE_AGENT_REF.exec(owner.agentRef) : null;
    if (!match || !isAllocatedOwnerName(match[1], owner.ownerName as string)) {
      return checkpointAttention("Forged or non-owner agent reference");
    }
    agentRef = owner.agentRef as `agent://${string}`;
  }

  if (attemptState === "awaiting_late_owner") {
    return { state: "awaiting-late-owner", ...(attempt ? { attempt } : {}), ...(agentRef ? { agentRef } : {}) };
  }
  if (attemptState === "claimed") {
    return { state: "agent-owned", ...(attempt ? { attempt } : {}), ...(agentRef ? { agentRef } : {}) };
  }
  return checkpointAttention("Unknown agent checkpoint state");
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

  // Batch-read all task.json files in parallel for EFFECT_REQUESTED tasks.
  // For breakpoints, also read input.json — it is the highest-precedence
  // question source (UX-R2 §13.1: input.json > taskDef.inputs > metadata.payload).
  if (requestedPayloads.length > 0) {
    const taskFileFactories = requestedPayloads.map(
      (p) => async () => ({
        taskDef: await readJsonSafe<Record<string, unknown>>(
          path.join(runPath, "tasks", p.effectId, "task.json"),
          null
        ),
        input:
          p.kind === "breakpoint"
            ? await readJsonSafe<Record<string, unknown>>(
                path.join(runPath, "tasks", p.effectId, "input.json"),
                undefined
              )
            : undefined,
      })
    );
    const taskFileResults = await batchAllSettled(taskFileFactories);

    for (let i = 0; i < requestedPayloads.length; i++) {
      const p = requestedPayloads[i];
      const result = taskFileResults[i];
      const files = result.status === "fulfilled" ? result.value : null;
      const taskDef = files?.taskDef ?? null;
      const task = taskMap.get(p.effectId)!;
      if (taskDef) {
        task.title = (taskDef.title as string) || task.title;
        if (taskDef.agent && typeof taskDef.agent === "object") {
          const agentDef = taskDef.agent as Record<string, unknown>;
          task.agent = {
            name: (agentDef.name as string) || "unknown",
            prompt: agentDef.prompt as NonNullable<TaskEffect["agent"]>["prompt"],
          };
        }
      }
      // Extract the breakpoint question via the shared §13.1 resolver
      // (input.json > taskDef.inputs > metadata.payload). Only a REAL
      // on-disk question is stored — the honest fallback copy is a
      // display-level concern (BreakpointPayload.questionSource).
      if (p.kind === "breakpoint") {
        const resolved = resolveBreakpointPayload(taskDef, files?.input);
        if (resolved.questionSource !== "fallback") {
          task.breakpointQuestion = resolved.question;
        }
      }
    }
  }

  const tasks = Array.from(taskMap.values());
  const checkpointResults = await batchAllSettled(
    tasks.map((task) => () => parseBabysitterCheckpoint(runPath, task))
  );
  for (let index = 0; index < tasks.length; index += 1) {
    const checkpointResult = checkpointResults[index];
    if (checkpointResult.status === "fulfilled") {
      tasks[index].babysitterCheckpoint = checkpointResult.value;
    }
  }
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

  // Count pending breakpoints (requested but not yet resolved). Mirror the
  // digest logic (parseRunDigest): also check result.json. The approve action
  // delegates to SDK commitEffectResult, which writes result.json AND appends
  // EFFECT_RESOLVED — but those two writes are not atomic, and runs answered
  // by older dashboard builds may have result.json without the journal event,
  // so the journal alone may lag behind an already-answered breakpoint.
  let pendingBreakpoints = 0;
  const requestedBreakpointIds = tasks
    .filter((t) => t.kind === "breakpoint" && t.status === "requested")
    .map((t) => t.effectId);
  if (requestedBreakpointIds.length > 0) {
    const resultChecks = await Promise.all(
      requestedBreakpointIds.map((id) =>
        readJsonSafe<Record<string, unknown>>(
          path.join(runPath, "tasks", id, "result.json"),
          null
        )
      )
    );
    for (let i = 0; i < requestedBreakpointIds.length; i++) {
      const r = resultChecks[i];
      if (!(r && r.status === "ok")) pendingBreakpoints++;
    }
  }

  // createdAt / lastEvent / updatedAt — feed staleness, in-progress liveness,
  // and duration (declared once here; do not re-declare below).
  const createdAt = runCreated?.ts || "";
  const lastEvent = events[events.length - 1];
  const updatedAt = lastEvent?.ts || createdAt;

  const runNonTerminal = !runCompleted && !runFailed;

  // §15.1 (AC-83): sleeping forever-run detection. A never-ending run parks
  // between ticks by REQUESTING a `sleep` effect and not resolving it, so its
  // NEWEST journal event is that unresolved sleep — the on-disk signal for a
  // first-class idle-healthy "scheduled" state (not orphaned/stale). The wake
  // time is encoded in the effect's label/stepId as `sleep:<ISO>`.
  const newestPayload = (lastEvent?.payload ?? {}) as Record<string, unknown>;
  const newestEvent = {
    type: lastEvent?.type,
    kind: newestPayload.kind as string | undefined,
  };
  const scheduledDetected = runNonTerminal && isSleepingScheduled(newestEvent);
  const sleepWakeAt = scheduledDetected
    ? parseSleepWakeAt(
        newestPayload.label as string | undefined,
        newestPayload.stepId as string | undefined
      ) ?? undefined
    : undefined;

  // Load config once — its staleThresholdMs bounds BOTH staleness and the
  // in-progress liveness window (one documented, env-overridable source).
  const config = await getConfig();

  // Detect staleness for waiting or pending runs. §15.1 (AC-84): a scheduled
  // (sleeping) run is idle-HEALTHY — never flag it stale, so it can never
  // inflate the stale/orphaned counts nor land in the Stalled column.
  let isStale: boolean | undefined;
  if (runNonTerminal && updatedAt && !scheduledDetected) {
    const timeSinceUpdate = Date.now() - new Date(updatedAt).getTime();
    if (timeSinceUpdate > config.staleThresholdMs) {
      isStale = true;
    }
  }
  // Detect orphaned runs: all tasks resolved but no terminal event
  // (process likely crashed before writing RUN_COMPLETED).
  if (status === "pending" && tasks.length > 0 && !tasks.some((t) => t.status === "requested")) {
    isStale = true;
  }

  // Driver liveness (UX-R3 wave 3): the lock verdict (run.lock + pid), promoted
  // to "live" for a non-terminal run with FRESH journal activity — the honest
  // in-progress signal in an environment where run.lock is never written (see
  // deriveLivenessFromActivity). Gated on !isStale so the all-resolved-orphan
  // rule above still reads as no-live-driver; terminal runs keep the lock verdict.
  const lockLiveness = await getDriverLiveness(runPath);
  // §15.1 (AC-83/86): "scheduled" takes precedence over the no-live-driver
  // fallback AND over activity-derived "live" (a sleeping run is not actively
  // progressing) — but a genuinely live lock still wins (deriveScheduledLiveness).
  const scheduledLiveness = scheduledDetected
    ? deriveScheduledLiveness(lockLiveness, newestEvent)
    : null;
  const driver: DriverLiveness =
    scheduledLiveness ??
    (runNonTerminal && isStale !== true
      ? deriveLivenessFromActivity(lockLiveness, updatedAt, config.activeThresholdMs ?? config.staleThresholdMs)
      : lockLiveness);

  // UX-R3 §14.5 (AC-59): answered-but-unapplied detection. The observer's
  // approve action writes result.json (value.approvedBy "observer-dashboard")
  // + one EFFECT_RESOLVED, but never runs the driver. So on a non-terminal run
  // with no live driver, an observer-recorded breakpoint sits on disk "awaiting
  // resume": keep the card in Needs-you (amber-gray recorded state) instead of
  // letting it slide silently to Stalled. Derived from disk so a page refresh
  // still shows it, until a real resume consumes it (driver goes live or the
  // run terminates → this clears). Only the FIRST such breakpoint is surfaced.
  let recordedAwaitingResume = false;
  let recordedBreakpointEffectId: string | undefined;
  const noLiveDriver = driver === "orphaned" || driver === "none";
  if (runNonTerminal && noLiveDriver) {
    const resolvedBreakpointIds = tasks
      .filter((t) => t.kind === "breakpoint" && t.status === "resolved")
      .map((t) => t.effectId);
    if (resolvedBreakpointIds.length > 0) {
      const recordedChecks = await Promise.all(
        resolvedBreakpointIds.map((id) =>
          readJsonSafe<Record<string, unknown>>(
            path.join(runPath, "tasks", id, "result.json"),
            null
          )
        )
      );
      for (let i = 0; i < resolvedBreakpointIds.length; i++) {
        const r = recordedChecks[i];
        const value =
          r && typeof r === "object"
            ? (r.value as Record<string, unknown> | undefined)
            : undefined;
        if (value?.approvedBy === "observer-dashboard") {
          recordedAwaitingResume = true;
          recordedBreakpointEffectId = resolvedBreakpointIds[i];
          break;
        }
      }
    }
  }

  let duration: number | undefined;
  if (createdAt && (runCompleted || runFailed)) {
    const endTs = (runCompleted || runFailed)!.ts;
    duration = new Date(endTs).getTime() - new Date(createdAt).getTime();
  } else if (createdAt && lastEvent) {
    duration =
      new Date(lastEvent.ts).getTime() - new Date(createdAt).getTime();
  }

  return {
    runId: createdPayload.runId || path.basename(runPath),
    processId:
      createdPayload.processId ||
      (runJson?.processId as string) ||
      "unknown",
    status,
    createdAt,
    updatedAt,
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
    pendingBreakpoints,
    isStale,
    waitingKind,
    driver,
    sleepWakeAt,
    recordedAwaitingResume,
    recordedBreakpointEffectId,
    _journalFileCount: journalResult.fileCount,
  };
}

/**
 * Read a single effect's task definition (tasks/<effectId>/task.json) — the
 * same file every parser path above reads for kind/title/metadata. Exposed so
 * the approve-breakpoint server action can check the effect's kind BEFORE
 * committing a result (review round 3 blocker: the action must never resolve a
 * non-breakpoint effect). Returns null when the file is missing or unreadable.
 */
export async function readTaskDefinition(
  runPath: string,
  effectId: string
): Promise<Record<string, unknown> | null> {
  const taskDef = await readJsonSafe<Record<string, unknown>>(
    path.join(runPath, "tasks", effectId, "task.json"),
    null
  );
  return taskDef ?? null;
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

  // Extract breakpoint payload for breakpoint tasks via the shared §13.1
  // resolver (input.json > taskDef.inputs > metadata.payload, per field).
  // When no source carries a question, the payload carries the honest
  // last-resort copy flagged with questionSource: "fallback" (AC-32).
  const kind = (taskDef?.kind as TaskKind) || "agent";
  let breakpointPayload: import("@/types").BreakpointPayload | undefined;
  if (kind === "breakpoint") {
    breakpointPayload = resolveBreakpointPayload(taskDef, input);
  }

  // Determine error status from result or journal
  const resolvedPayload = resolvedEvent?.payload as Record<string, unknown> | undefined;
  const isError = result
    ? (result.status === "error")
    : (resolvedPayload?.status === "error");

  const detail: TaskDetail = {
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
  detail.babysitterCheckpoint = await parseBabysitterCheckpoint(runPath, detail);
  return detail;
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
  // Failed-step derivation (mirror parseRunDir L361-393): the requested-payload
  // label/stepId per effect + the first/last effect that resolved with error,
  // and the RUN_FAILED error payload.
  const requestedInfo = new Map<string, { label?: string; stepId?: string; taskId?: string }>();
  let firstFailedEffectId: string | undefined;
  let lastFailedError: { name?: string; message?: string; stack?: string } | undefined;
  let runFailedError: { name?: string; message?: string; stack?: string } | undefined;
  // §15.1: newest journal event type/kind for sleeping-forever-run detection.
  let newestType: string | undefined;
  let newestKind: string | undefined;
  // Newest payload label/stepId — feeds parseSleepWakeAt for scheduled runs.
  let newestLabel: string | undefined;
  let newestStepId: string | undefined;

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
      // Files are sorted ascending, so the last processed event is the newest.
      newestType = event.type;
      const newestPayload = event.payload as Record<string, unknown>;
      newestKind = newestPayload.kind as string | undefined;
      newestLabel = newestPayload.label as string | undefined;
      newestStepId = newestPayload.stepId as string | undefined;
      if (event.type === "EFFECT_REQUESTED") {
        taskCount++;
        const data = event.payload as Record<string, unknown>;
        const effectId = data.effectId as string;
        const kind = (data.kind as string) || "agent";
        requestedEffects.push({ effectId, kind });
        requestedInfo.set(effectId, {
          // Mirror parseRunDir: label defaults to taskId when absent.
          label: (data.label as string) || (data.taskId as string),
          stepId: data.stepId as string | undefined,
          taskId: data.taskId as string | undefined,
        });
        if (data.kind === "breakpoint") {
          requestedBreakpoints.add(effectId);
          breakpointEffectIds.add(effectId);
        }
      }
      if (event.type === "EFFECT_RESOLVED") {
        completedTasks++;
        const data = event.payload as Record<string, unknown>;
        resolvedEffects.add(data.effectId as string);
        if (data.status === "error") {
          if (!firstFailedEffectId) firstFailedEffectId = data.effectId as string;
          // Keep the LAST errored effect's error (mirror parseRunDir fallback).
          lastFailedError = data.error as typeof lastFailedError;
        }
      }
      if (event.type === "RUN_COMPLETED") status = "completed";
      if (event.type === "RUN_FAILED") {
        status = "failed";
        runFailedError = (event.payload as Record<string, unknown>).error as typeof runFailedError;
      }
    }

    if (status === "pending" && taskCount > 0) status = "waiting";
  }

  // Count pending breakpoints (requested but not yet resolved).
  // Also check result.json — approve delegates to SDK commitEffectResult,
  // which writes result.json and appends EFFECT_RESOLVED, but the two writes
  // are not atomic (and older-dashboard runs may lack the journal event), so
  // the journal alone may lag behind.
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

      // Read task.json + input.json per pending breakpoint — both feed the
      // shared §13.1 resolver (input.json > taskDef.inputs > metadata.payload).
      const bpFactories = pendingBpIds.map(
        (effectId) => async () => ({
          taskDef: await readJsonSafe<Record<string, unknown>>(
            path.join(runPath, "tasks", effectId, "task.json"),
            null
          ),
          input: await readJsonSafe<Record<string, unknown>>(
            path.join(runPath, "tasks", effectId, "input.json"),
            undefined
          ),
        })
      );
      const bpResults = await batchAllSettled(bpFactories);

      // Use the first pending breakpoint with a REAL on-disk question
      for (let i = 0; i < pendingBpIds.length; i++) {
        const result = bpResults[i];
        const files = result.status === "fulfilled" ? result.value : null;
        if (files) {
          const resolved = resolveBreakpointPayload(files.taskDef, files.input);
          if (resolved.questionSource !== "fallback") {
            breakpointQuestion = resolved.question;
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

  // Detect staleness for waiting or pending runs. Config's staleThresholdMs also
  // bounds the in-progress liveness window below (one documented source).
  const nonTerminal = status === "waiting" || status === "pending";
  const config = await getConfig();

  // §15.1 (AC-83/84): sleeping forever-run — newest event is an unresolved
  // `sleep` effect → idle-healthy "scheduled", never flagged stale (mirrors
  // parseRunDir so the board full-run and the digest badges agree).
  const newestEvent = { type: newestType, kind: newestKind };
  const scheduledDetected = nonTerminal && isSleepingScheduled(newestEvent);
  // §15.1 (AC-84/85): the wake time encoded in the sleep effect's label/stepId
  // (`sleep:<ISO>`). Mirrors parseRunDir L457-468.
  const sleepWakeAt = scheduledDetected
    ? parseSleepWakeAt(newestLabel, newestStepId) ?? undefined
    : undefined;

  // Failure details (mirror parseRunDir L367-393): prefer RUN_FAILED's error,
  // else the last errored EFFECT_RESOLVED.
  let failureMessage: string | undefined;
  if (runFailedError) {
    failureMessage = runFailedError.message || runFailedError.stack || undefined;
  }
  if (!failureMessage && lastFailedError) {
    failureMessage = lastFailedError.message || lastFailedError.stack || undefined;
  }
  // Failed step (mirror parseRunDir L361-365): the first errored effect's title
  // (task.json) || label || stepId. Reading a single task.json is cheap and
  // keeps the list card in sync with the run-detail page.
  let failedStep: string | undefined;
  if (firstFailedEffectId) {
    const info = requestedInfo.get(firstFailedEffectId);
    const taskDef = await readJsonSafe<Record<string, unknown>>(
      path.join(runPath, "tasks", firstFailedEffectId, "task.json"),
      null
    );
    failedStep =
      (taskDef?.title as string) || info?.label || info?.stepId || undefined;
  }

  let isStale: boolean | undefined;
  if (nonTerminal && updatedAt && !scheduledDetected) {
    const timeSinceUpdate = Date.now() - new Date(updatedAt).getTime();
    if (timeSinceUpdate > config.staleThresholdMs) {
      isStale = true;
    }
  }

  // Detect orphaned runs: all effects resolved but no terminal event
  if (status === "waiting" && taskCount > 0 && completedTasks >= taskCount) {
    isStale = true;
  }

  // Driver liveness (UX-R3 wave 3): lock verdict promoted to "live" for a
  // non-terminal run with fresh journal activity — the honest in-progress
  // signal (see deriveLivenessFromActivity). Mirrors parseRunDir so the board
  // (full run) and the badges (digest) agree. Gated on !isStale. §15.1:
  // "scheduled" (sleeping) wins over both the no-driver fallback and "live".
  const lockLiveness = await getDriverLiveness(runPath);
  const scheduledLiveness = scheduledDetected
    ? deriveScheduledLiveness(lockLiveness, newestEvent)
    : null;
  const driver: DriverLiveness =
    scheduledLiveness ??
    (nonTerminal && isStale !== true
      ? deriveLivenessFromActivity(lockLiveness, updatedAt, config.activeThresholdMs ?? config.staleThresholdMs)
      : lockLiveness);

  // UX-R3 §14.5 (AC-59): observer-recorded-but-unapplied breakpoint detection
  // (mirror parseRunDir L516-545). On a non-terminal run with no live driver,
  // scan resolved breakpoints' result.json for value.approvedBy ===
  // "observer-dashboard" — only the FIRST such breakpoint is surfaced.
  let recordedAwaitingResume = false;
  let recordedBreakpointEffectId: string | undefined;
  const noLiveDriver = driver === "orphaned" || driver === "none";
  if (nonTerminal && noLiveDriver && breakpointEffectIds.size > 0) {
    const resolvedBreakpointIds = [...breakpointEffectIds].filter((id) =>
      resolvedEffects.has(id)
    );
    if (resolvedBreakpointIds.length > 0) {
      const recordedChecks = await Promise.all(
        resolvedBreakpointIds.map((id) =>
          readJsonSafe<Record<string, unknown>>(
            path.join(runPath, "tasks", id, "result.json"),
            null
          )
        )
      );
      for (let i = 0; i < resolvedBreakpointIds.length; i++) {
        const r = recordedChecks[i];
        const value =
          r && typeof r === "object"
            ? (r.value as Record<string, unknown> | undefined)
            : undefined;
        if (value?.approvedBy === "observer-dashboard") {
          recordedAwaitingResume = true;
          recordedBreakpointEffectId = resolvedBreakpointIds[i];
          break;
        }
      }
    }
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
    driver,
    failedStep,
    failureMessage,
    sleepWakeAt,
    recordedAwaitingResume,
    recordedBreakpointEffectId,
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
