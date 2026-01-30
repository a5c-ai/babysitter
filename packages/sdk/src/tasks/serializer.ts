import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { writeTaskDefinition, writeTaskResult } from "../storage/tasks";
import { JsonRecord, StoredTaskResult } from "../storage/types";
import { getTasksDir } from "../storage/paths";
import { TaskDef, TaskSerializerContext } from "./types";
import { writeFileAtomic } from "../storage/atomic";
import type { SerializedEffectError } from "../runtime/types";

export const TASK_SCHEMA_VERSION = "2026.01.tasks-v1";
export const RESULT_SCHEMA_VERSION = "2026.01.results-v1";

const BLOB_THRESHOLD_BYTES = 1024 * 1024; // 1 MiB

export interface SerializeTaskDefinitionOptions extends TaskSerializerContext {
  task: TaskDef;
  inputs?: unknown;
}

export interface SerializeTaskResultOptions extends TaskSerializerContext {
  payload: TaskResultPayload;
}

export interface TaskResultPayload {
  status: "ok" | "error";
  result?: unknown;
  error?: SerializedErrorPayload;
  stdout?: string;
  stderr?: string;
  stdoutRef?: string;
  stderrRef?: string;
  startedAt?: string;
  finishedAt?: string;
  metadata?: JsonRecord;
}

export type SerializedErrorPayload = SerializedEffectError | JsonRecord | undefined;

export interface SerializeTaskDefinitionResult {
  taskRef: string;
  inputsRef?: string;
  serialized: SerializedTaskDefinition;
}

export interface SerializeTaskResultOutput {
  resultRef: string;
  stdoutRef?: string;
  stderrRef?: string;
  serialized: StoredTaskResult;
}

export interface SerializedTaskDefinition extends JsonRecord {
  schemaVersion: string;
  effectId: string;
  taskId: string;
  invocationKey: string;
  stepId?: string;
  kind: string;
  title?: string;
  description?: string;
  labels?: string[];
  inputs?: unknown;
  inputsRef?: string;
  io?: JsonRecord;
  node?: JsonRecord;
  breakpoint?: JsonRecord;
  orchestratorTask?: JsonRecord;
  sleep?: JsonRecord;
  metadata?: JsonRecord;
}

export async function serializeAndWriteTaskDefinition(
  options: SerializeTaskDefinitionOptions
): Promise<SerializeTaskDefinitionResult> {
  const serialized = await serializeTaskDefinition(options);
  const taskRef = await writeTaskDefinition(options.runDir, options.effectId, serialized);
  return {
    taskRef,
    inputsRef: serialized.inputsRef,
    serialized,
  };
}

export async function serializeTaskDefinition(
  options: SerializeTaskDefinitionOptions
): Promise<SerializedTaskDefinition> {
  const normalized = normalizeTaskDef(options.task);
  const serialized: SerializedTaskDefinition = {
    schemaVersion: TASK_SCHEMA_VERSION,
    effectId: options.effectId,
    taskId: options.taskId,
    invocationKey: options.invocationKey,
    stepId: options.stepId,
    kind: normalized.kind,
    title: normalized.title,
    description: normalized.description,
    labels: normalized.labels,
    io: normalized.io,
    node: normalized.node,
    breakpoint: normalized.breakpoint,
    orchestratorTask: normalized.orchestratorTask,
    sleep: normalized.sleep,
    metadata: normalized.metadata,
  };

  if (options.inputs !== undefined) {
    const spill = await maybeSpillLargeValue({
      runDir: options.runDir,
      effectId: options.effectId,
      name: "inputs",
      value: options.inputs,
    });
    serialized.inputs = spill.value;
    serialized.inputsRef = spill.ref;
  }

  return serialized;
}

export async function serializeAndWriteTaskResult(
  options: SerializeTaskResultOptions
): Promise<SerializeTaskResultOutput> {
  const serialized = await serializeTaskResult(options);
  const { resultRef, stdoutRef, stderrRef } = await writeTaskResult({
    runDir: options.runDir,
    effectId: options.effectId,
    result: serialized,
    stdout: options.payload.stdout,
    stderr: options.payload.stderr,
  });
  return {
    resultRef,
    stdoutRef,
    stderrRef,
    serialized,
  };
}

export async function serializeTaskResult(
  options: SerializeTaskResultOptions
): Promise<StoredTaskResult> {
  const serialized: StoredTaskResult = {
    schemaVersion: RESULT_SCHEMA_VERSION,
    effectId: options.effectId,
    taskId: options.taskId,
    invocationKey: options.invocationKey,
    status: options.payload.status,
    result: undefined,
    resultRef: undefined,
    error: normalizeError(options.payload.error),
    stdoutRef: options.payload.stdoutRef,
    stderrRef: options.payload.stderrRef,
    startedAt: options.payload.startedAt,
    finishedAt: options.payload.finishedAt,
    metadata: options.payload.metadata ? stableClone(options.payload.metadata) : undefined,
  };

  if (options.payload.status === "ok") {
    const spill = await maybeSpillLargeValue({
      runDir: options.runDir,
      effectId: options.effectId,
      name: "result",
      value: options.payload.result,
    });
    serialized.result = spill.value;
    serialized.value = spill.value;
    serialized.resultRef = spill.ref;
  } else {
    serialized.error = normalizeError(options.payload.error);
  }

  return serialized;
}

function normalizeTaskDef(task: TaskDef) {
  if (!task || typeof task !== "object") {
    throw new Error("Task serializer requires a TaskDef object");
  }
  if (!task.kind || typeof task.kind !== "string") {
    throw new Error("TaskDef.kind must be a non-empty string");
  }
  return {
    kind: task.kind,
    title: typeof task.title === "string" ? task.title : undefined,
    description: typeof task.description === "string" ? task.description : undefined,
    labels: normalizeLabels(task.labels),
    io: normalizeJson(task.io),
    node: normalizeJson(task.node),
    breakpoint: normalizeJson(task.breakpoint),
    orchestratorTask: normalizeJson(task.orchestratorTask),
    sleep: normalizeJson(task.sleep),
    metadata: normalizeJson(task.metadata),
  };
}

function normalizeLabels(labels?: string[]) {
  if (!Array.isArray(labels) || labels.length === 0) return undefined;
  const trimmed = labels
    .filter((value): value is string => typeof value === "string")
    .map((label) => label.trim())
    .filter(Boolean);
  if (!trimmed.length) return undefined;
  const unique = Array.from(new Set(trimmed));
  unique.sort((a, b) => a.localeCompare(b));
  return unique;
}

function normalizeJson(value: unknown): JsonRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  if (Array.isArray(value)) {
    return undefined;
  }
  return stableClone(value as JsonRecord);
}

async function maybeSpillLargeValue(options: {
  runDir: string;
  effectId: string;
  name: string;
  value: unknown;
}): Promise<{ value?: unknown; ref?: string }> {
  if (options.value === undefined) {
    return {};
  }
  const clone = stableClone(options.value);
  const json = JSON.stringify(clone, null, 2) + "\n";
  if (Buffer.byteLength(json, "utf8") <= BLOB_THRESHOLD_BYTES) {
    return { value: clone };
  }
  const blobDir = path.join(getTasksDir(options.runDir), options.effectId, "blobs");
  await fs.mkdir(blobDir, { recursive: true });
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  const blobPath = path.join(blobDir, `${options.name}-${hash}.json`);
  await fs.mkdir(path.dirname(blobPath), { recursive: true });
  await writeFileAtomic(blobPath, json);
  return {
    ref: toRunRelative(options.runDir, blobPath),
  };
}

function toRunRelative(runDir: string, absolutePath: string): string {
  const relative = path.relative(runDir, absolutePath);
  return relative.split(path.sep).join("/");
}

function stableClone<T>(value: T): T {
  if (Array.isArray(value)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value.map((entry: unknown) => stableClone(entry)) as T;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value as JsonRecord).sort((a, b) => a.localeCompare(b));
    const clone: JsonRecord = {};
    for (const key of entries) {
      const child = (value as JsonRecord)[key];
      clone[key] = stableClone(child);
    }
    return clone as T;
  }
  return value;
}

function normalizeError(error: SerializedErrorPayload): SerializedErrorPayload {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  return stableClone(error);
}
