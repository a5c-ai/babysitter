/**
 * Programmatic Task CRUD (GAP-TOOLS-014).
 *
 * Harness-owned task inspection helpers for interactive/runtime tooling.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { JsonRecord } from "../storage/types";

export interface TaskSummary {
  effectId: string;
  taskId: string;
  kind: string;
  title?: string;
  status: "requested" | "resolved" | "unknown";
  labels?: string[];
  requestedAt?: string;
  resolvedAt?: string;
}

export interface TaskDetail extends TaskSummary {
  definition: JsonRecord;
  result?: JsonRecord;
}

export interface ListTasksOptions {
  status?: "requested" | "resolved" | "all";
}

export async function listTasks(
  runDir: string,
  options: ListTasksOptions = {},
): Promise<TaskSummary[]> {
  const { status = "all" } = options;
  const tasksDir = path.join(runDir, "tasks");

  let entries: string[];
  try {
    entries = await fs.readdir(tasksDir);
  } catch {
    return [];
  }

  const summaries: TaskSummary[] = [];

  for (const effectId of entries) {
    const taskDir = path.join(tasksDir, effectId);
    const stat = await fs.stat(taskDir).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const taskDefPath = path.join(taskDir, "task.json");
    const resultPath = path.join(taskDir, "result.json");

    let definition: JsonRecord | undefined;
    let result: JsonRecord | undefined;

    try {
      const raw = await fs.readFile(taskDefPath, "utf-8");
      definition = JSON.parse(raw) as JsonRecord;
    } catch {
      continue;
    }

    try {
      const raw = await fs.readFile(resultPath, "utf-8");
      result = JSON.parse(raw) as JsonRecord;
    } catch {
      // No result yet.
    }

    const taskStatus = result ? "resolved" : "requested";
    if (status !== "all" && status !== taskStatus) continue;

    summaries.push({
      effectId,
      taskId: (definition.taskId as string) ?? effectId,
      kind: (definition.kind as string) ?? "unknown",
      title: definition.title as string | undefined,
      status: taskStatus,
      labels: Array.isArray(definition.labels) ? (definition.labels as string[]) : undefined,
      requestedAt: definition.requestedAt as string | undefined,
      resolvedAt: result?.resolvedAt as string | undefined,
    });
  }

  return summaries;
}

export async function readTask(
  runDir: string,
  effectId: string,
): Promise<TaskDetail | null> {
  const taskDir = path.join(runDir, "tasks", effectId);

  let definition: JsonRecord;
  try {
    const raw = await fs.readFile(path.join(taskDir, "task.json"), "utf-8");
    definition = JSON.parse(raw) as JsonRecord;
  } catch {
    return null;
  }

  let result: JsonRecord | undefined;
  try {
    const raw = await fs.readFile(path.join(taskDir, "result.json"), "utf-8");
    result = JSON.parse(raw) as JsonRecord;
  } catch {
    // No result yet.
  }

  return {
    effectId,
    taskId: (definition.taskId as string) ?? effectId,
    kind: (definition.kind as string) ?? "unknown",
    title: definition.title as string | undefined,
    status: result ? "resolved" : "requested",
    labels: Array.isArray(definition.labels) ? (definition.labels as string[]) : undefined,
    requestedAt: definition.requestedAt as string | undefined,
    resolvedAt: result?.resolvedAt as string | undefined,
    definition,
    result,
  };
}

export async function readTaskStdout(
  runDir: string,
  effectId: string,
): Promise<string | null> {
  try {
    return await fs.readFile(path.join(runDir, "tasks", effectId, "stdout.txt"), "utf-8");
  } catch {
    return null;
  }
}

export async function readTaskStderr(
  runDir: string,
  effectId: string,
): Promise<string | null> {
  try {
    return await fs.readFile(path.join(runDir, "tasks", effectId, "stderr.txt"), "utf-8");
  } catch {
    return null;
  }
}

export async function countTasks(
  runDir: string,
): Promise<{ total: number; requested: number; resolved: number }> {
  const all = await listTasks(runDir, { status: "all" });
  const requested = all.filter((task) => task.status === "requested").length;
  const resolved = all.filter((task) => task.status === "resolved").length;
  return { total: all.length, requested, resolved };
}
