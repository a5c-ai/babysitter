/**
 * Local filesystem helpers for reading run metadata and state.
 *
 * These replace the direct SDK imports (readRunMetadata, readStateCache,
 * readTaskDefinition, readTaskResult) with provider-agnostic filesystem
 * operations.  The path conventions match the babysitter-sdk layout.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { JsonRecord } from "../types";

const RUN_METADATA_FILE = "run.json";
const STATE_DIR = "state";
const STATE_FILE = "state.json";

export interface RunMetadata {
  runId: string;
  processId: string;
  createdAt: string;
  prompt?: string;
  entrypoint: { importPath: string; exportName?: string };
  [key: string]: unknown;
}

export interface StateCacheSnapshot {
  effectsByInvocation: Record<string, unknown>;
  pendingEffectsByKind: Record<string, number>;
  [key: string]: unknown;
}

export async function readRunMetadata(runDir: string): Promise<RunMetadata> {
  const metadataPath = path.join(runDir, RUN_METADATA_FILE);
  const raw = await fs.readFile(metadataPath, "utf8");
  return JSON.parse(raw) as RunMetadata;
}

export async function readStateCache(runDir: string): Promise<StateCacheSnapshot | null> {
  const stateFile = path.join(runDir, STATE_DIR, STATE_FILE);
  try {
    const raw = await fs.readFile(stateFile, "utf8");
    return JSON.parse(raw) as StateCacheSnapshot;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function readTaskDefinition(runDir: string, effectId: string): Promise<JsonRecord> {
  const taskPath = path.join(runDir, "tasks", effectId, "task.json");
  const raw = await fs.readFile(taskPath, "utf8");
  return JSON.parse(raw) as JsonRecord;
}

export async function readTaskResult(runDir: string, effectId: string): Promise<unknown> {
  const resultPath = path.join(runDir, "tasks", effectId, "result.json");
  try {
    const raw = await fs.readFile(resultPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
