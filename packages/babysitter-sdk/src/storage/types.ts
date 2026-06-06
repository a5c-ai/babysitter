import { Stats } from "fs";

export type JsonRecord = Record<string, unknown>;

export interface RunEntrypointMetadata {
  importPath: string;
  exportName?: string;
}

export interface RunMetadata extends JsonRecord {
  runId: string;
  request: string;
  processId: string;
  sdkVersion?: string;
  harness?: string;
  nested?: {
    parentRunId: string;
    parentEffectId?: string;
    parentInvocationKey?: string;
    sessionId?: string;
    shareSession?: boolean;
  };
  entrypoint: RunEntrypointMetadata;
  processPath?: string;
  processRevision?: string;
  processCodeHash?: string;
  layoutVersion: string;
  createdAt: string;
  completionProof?: string;
  prompt?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface CreateRunDirOptions {
  runsRoot: string;
  runId: string;
  request: string;
  processId?: string;
  harness?: string;
  nested?: {
    parentRunId: string;
    parentEffectId?: string;
    parentInvocationKey?: string;
    sessionId?: string;
    shareSession?: boolean;
  };
  entrypoint?: {
    importPath: string;
    exportName?: string;
  };
  processPath?: string;
  processRevision?: string;
  layoutVersion?: string;
  inputs?: unknown;
  extraMetadata?: Record<string, unknown>;
  prompt?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
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
  sdkVersion?: string;
  data: JsonRecord;
  checksum?: string;
}

export interface StoredTaskResult {
  schemaVersion: string;
  effectId: string;
  taskId: string;
  invocationKey: string;
  sdkVersion?: string;
  status: "ok" | "error" | "cancelled";
  result?: unknown;
  value?: unknown;
  resultRef?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
    data?: unknown;
  };
  reason?: string;
  stdoutRef?: string;
  stderrRef?: string;
  startedAt?: string;
  finishedAt?: string;
  metadata?: JsonRecord;
}
