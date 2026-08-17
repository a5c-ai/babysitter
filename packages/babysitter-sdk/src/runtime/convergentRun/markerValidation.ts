import { promises as fs } from "node:fs";
import path from "node:path";
import {
  COMPLETION_FILE,
  CONVERGENT_RUN_STATE_DIR,
  HOOK_MAY_HAVE_STARTED_FILE,
  HOOK_NOT_STARTED_FILE,
  boundaryMarkerSchema,
  canonicalJson,
  completionMarkerSchema,
  runCreatedEventSha256,
  sha256,
  withoutSelfHash,
  type BoundaryMarker,
  type CompletionMarker,
  type ConvergentRunContext,
  type CreateRunConvergentOptions,
} from "./contracts";
import { pathExists, readPrivateFile, requireMode } from "./durable";
import type { ConvergentRunClassification } from "./classify";

export async function classifyMarkers(
  context: ConvergentRunContext,
  options: CreateRunConvergentOptions,
): Promise<ConvergentRunClassification> {
  const markerDirectory = path.join(context.runDir, "state", CONVERGENT_RUN_STATE_DIR);
  if (!(await pathExists(markerDirectory))) return { kind: "JOURNALED_HOOK_FINALIZATION_UNKNOWN" };
  try {
    await requireMode(markerDirectory, 0o700);
  } catch (error) {
    if (error instanceof Error) return { kind: "PARTIAL_UNKNOWN" };
    throw error;
  }
  const entries = new Set(await fs.readdir(markerDirectory));
  const boundaryPath = path.join(markerDirectory, HOOK_NOT_STARTED_FILE);
  const mayHaveStartedPath = path.join(markerDirectory, HOOK_MAY_HAVE_STARTED_FILE);
  const completionPath = path.join(markerDirectory, COMPLETION_FILE);
  const hasBoundary = await pathExists(boundaryPath);
  const hasMayHaveStarted = await pathExists(mayHaveStartedPath);
  const hasCompletion = await pathExists(completionPath);
  if (hasCompletion) {
    if (hasBoundary || !hasMayHaveStarted || entries.size !== 2) return { kind: "COMPLETION_MARKER_DIVERGED" };
    const completion = await readCompletion(completionPath);
    if (completion === null || !matchesCompletion(completion, context, options)) return { kind: "COMPLETION_MARKER_DIVERGED" };
    return { kind: "CREATED_COMPLETE", context, completion };
  }
  if (hasBoundary && !hasMayHaveStarted && entries.size === 1) {
    const boundary = await readBoundary(boundaryPath);
    return boundary !== null && matchesBoundary(boundary, context, options)
      ? { kind: "JOURNALED_PRE_HOOK_PROVEN", context }
      : { kind: "PARTIAL_UNKNOWN" };
  }
  return { kind: "JOURNALED_HOOK_FINALIZATION_UNKNOWN" };
}

async function readBoundary(markerPath: string): Promise<BoundaryMarker | null> {
  try {
    const bytes = await readPrivateFile(markerPath);
    const parsed = boundaryMarkerSchema.safeParse(JSON.parse(bytes.toString("utf8")));
    if (
      !parsed.success
      || !bytes.equals(canonicalMarkerBytes(parsed.data))
      || parsed.data.selfHash !== sha256(canonicalJson(withoutSelfHash(parsed.data)))
    ) return null;
    return parsed.data;
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

async function readCompletion(markerPath: string): Promise<CompletionMarker | null> {
  try {
    const bytes = await readPrivateFile(markerPath);
    const parsed = completionMarkerSchema.safeParse(JSON.parse(bytes.toString("utf8")));
    if (
      !parsed.success
      || !bytes.equals(canonicalMarkerBytes(parsed.data))
      || parsed.data.selfHash !== sha256(canonicalJson(withoutSelfHash(parsed.data)))
    ) return null;
    return parsed.data;
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

function canonicalMarkerBytes(marker: BoundaryMarker | CompletionMarker): Buffer {
  return Buffer.from(`${JSON.stringify(marker, null, 2)}\n`, "utf8");
}

function matchesBoundary(marker: BoundaryMarker, context: ConvergentRunContext, options: CreateRunConvergentOptions): boolean {
  return marker.runId === options.runId
    && marker.canonicalInputSha256 === options.canonicalInputSha256
    && marker.processSnapshotHash === options.processSnapshotHash
    && marker.processSnapshotPath === path.resolve(options.processSnapshotPath)
    && marker.replacementSessionId === options.replacementSessionId
    && marker.runJsonSha256 === context.runJsonSha256
    && marker.runCreatedEventUlid === context.event.ulid
    && marker.runCreatedEventSha256 === runCreatedEventSha256(context.event);
}

function matchesCompletion(marker: CompletionMarker, context: ConvergentRunContext, options: CreateRunConvergentOptions): boolean {
  return marker.runId === options.runId
    && marker.canonicalInputSha256 === options.canonicalInputSha256
    && marker.process.snapshotHash === options.processSnapshotHash
    && marker.process.snapshotPath === path.resolve(options.processSnapshotPath)
    && marker.replacementSessionId === options.replacementSessionId
    && marker.runJsonSha256 === context.runJsonSha256
    && marker.runCreated.ulid === context.event.ulid
    && marker.runCreated.eventSha256 === runCreatedEventSha256(context.event);
}
