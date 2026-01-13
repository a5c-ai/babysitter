import { Stats } from "fs";

export type JsonRecord = Record<string, unknown>;

export interface RunEntrypointMetadata {
  importPath: string;
  exportName: string;
}

export interface RunMetadata extends JsonRecord {
  runId: string;
  request: string;
  processId: string;
  entrypoint: RunEntrypointMetadata;
  processPath?: string;
  processRevision?: string;
  layoutVersion: string;
  createdAt: string;
}

export interface CreateRunDirOptions {
  runsRoot: string;
  runId: string;
  request: string;
  processId?: string;
  entrypoint?: {
    importPath: string;
    exportName?: string;
  };
  processPath?: string;
  processRevision?: string;
  layoutVersion?: string;
  inputs?: unknown;
  extraMetadata?: Record<string, unknown>;
}

export interface AppendEventOptions {
  runDir: string;
  event: JsonRecord;
  eventType: string;
}

export interface AppendEventResult {
  seq: number;
  ulid: string;
  filename: string;
  checksum: string;
  path: string;
  recordedAt: string;
}

export interface SnapshotStateOptions {
  runDir: string;
  state: JsonRecord;
  journalHead?: {
    seq: number;
    ulid: string;
  };
}

export interface StoreTaskArtifactsOptions {
  runDir: string;
  effectId: string;
  task?: JsonRecord;
  result?: JsonRecord;
  artifacts?: Array<{ name: string; data: Buffer | string }>;
}

export interface DiskUsageReport {
  totalBytes: number;
  journalBytes: number;
  tasksBytes: number;
  blobsBytes: number;
  stateBytes: number;
}

export interface OrphanedBlobInfo {
  hash: string;
  bytes: number;
  path: string;
}

export interface RunLockInfo {
  pid: number;
  owner: string;
  acquiredAt: string;
}

export type FileStatGetter = (path: string) => Promise<Stats>;

export interface JournalEvent {
  seq: number;
  ulid: string;
  filename: string;
  path: string;
  type: string;
  recordedAt: string;
  data: JsonRecord;
  checksum?: string;
}

export interface StoredTaskResult {
  schemaVersion: string;
  effectId: string;
  taskId: string;
  invocationKey: string;
  status: "ok" | "error";
  result?: unknown;
  value?: unknown;
  resultRef?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    data?: unknown;
  };
  stdoutRef?: string;
  stderrRef?: string;
  startedAt?: string;
  finishedAt?: string;
  metadata?: JsonRecord;
}
