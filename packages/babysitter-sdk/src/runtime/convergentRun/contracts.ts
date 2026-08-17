import crypto from "node:crypto";
import { z } from "zod";
import type { HookResult } from "../../hooks/types";
import type { JournalEvent, RunMetadata } from "../../storage/types";

export const CONVERGENT_RUN_STATE_DIR = "run-create-convergent-v1";
export const HOOK_NOT_STARTED_FILE = "hook-not-started.json";
export const HOOK_MAY_HAVE_STARTED_FILE = "hook-may-have-started.json";
export const COMPLETION_FILE = "completion.json";

const SHA256 = /^[a-f0-9]{64}$/;

export type ConvergentRunProcess = {
  readonly processId: string;
  readonly importPath: string;
  readonly exportName?: string;
};

export type CreateRunConvergentOptions = {
  readonly runsDir: string;
  readonly runId: string;
  readonly request: string;
  readonly process: ConvergentRunProcess;
  readonly inputsPath: string;
  readonly canonicalInputSha256: string;
  readonly processSnapshotPath: string;
  readonly processSnapshotHash: string;
  readonly replacementSessionId: string;
  readonly expectedRunJsonSha256?: string;
  readonly prompt?: string;
  readonly harness?: string;
  readonly processRevision?: string;
  readonly lockOwner?: string;
  readonly logger?: (message: string) => void;
};

export type CreateRunConvergentResult = {
  readonly completionMarkerPath: string;
  readonly completionMarkerSelfHash: string;
  readonly hookResultSha256: string;
  readonly hookStatus: "completed-success" | "completed-failure";
  readonly runCreatedEventSha256: string;
  readonly runCreatedEventUlid: string;
  readonly runId: string;
  readonly runJsonSha256: string;
};

export type ConvergentRunContext = {
  readonly event: JournalEvent;
  readonly metadata: RunMetadata;
  readonly runDir: string;
  readonly runJsonSha256: string;
};

export const boundaryMarkerSchema = z.object({
  canonicalInputSha256: z.string().regex(SHA256),
  processSnapshotHash: z.string().regex(SHA256),
  processSnapshotPath: z.string().min(1),
  replacementSessionId: z.string().min(1),
  runCreatedEventSha256: z.string().regex(SHA256),
  runCreatedEventUlid: z.string().min(1),
  runId: z.string().min(1),
  runJsonSha256: z.string().regex(SHA256),
  schema: z.literal("babysitter-run-create-hook-boundary/v1"),
  selfHash: z.string().regex(SHA256),
}).strict();

export const completionMarkerSchema = z.object({
  canonicalInputSha256: z.string().regex(SHA256),
  hook: z.object({
    resultSha256: z.string().regex(SHA256),
    status: z.enum(["completed-success", "completed-failure"]),
  }).strict(),
  process: z.object({
    snapshotHash: z.string().regex(SHA256),
    snapshotPath: z.string().min(1),
  }).strict(),
  replacementSessionId: z.string().min(1),
  runCreated: z.object({
    eventSha256: z.string().regex(SHA256),
    ulid: z.string().min(1),
  }).strict(),
  runId: z.string().min(1),
  runJsonSha256: z.string().regex(SHA256),
  schema: z.literal("babysitter-run-create-completion/v1"),
  selfHash: z.string().regex(SHA256),
}).strict();

export type BoundaryMarker = z.infer<typeof boundaryMarkerSchema>;
export type CompletionMarker = z.infer<typeof completionMarkerSchema>;

export function sha256(bytes: Buffer | string): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return JSON.stringify(value);
    case "object":
      if (Array.isArray(value)) {
        return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
      }
      {
        const record = z.record(z.string(), z.unknown()).parse(value);
        return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
      }
    default:
      throw new TypeError("Canonical JSON only accepts JSON values");
  }
}

export function withoutSelfHash(marker: BoundaryMarker | CompletionMarker): Record<string, unknown> {
  const { selfHash: _selfHash, ...preimage } = marker;
  return preimage;
}

export function runCreatedEventSha256(event: JournalEvent): string {
  return sha256(canonicalJson({
    data: event.data,
    filename: event.filename,
    recordedAt: event.recordedAt,
    seq: event.seq,
    type: event.type,
    ulid: event.ulid,
  }));
}

export function hookResultProjection(result: HookResult): Record<string, unknown> {
  return {
    error: result.error ?? null,
    executedHooks: result.executedHooks.map((hook) => ({
      exitCode: hook.exitCode ?? null,
      hookLocation: hook.hookLocation,
      hookName: hook.hookName,
      hookPath: hook.hookPath,
      status: hook.status,
    })),
    hookType: "on-run-start",
    output: result.output ?? null,
    success: result.success,
  };
}

export function hookStatus(result: HookResult): "completed-success" | "completed-failure" {
  return result.success ? "completed-success" : "completed-failure";
}

export function validateSha256(value: string, label: string): void {
  if (!SHA256.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 digest`);
  }
}
