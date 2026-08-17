import { promises as fs } from "node:fs";
import path from "node:path";
import { loadJournal } from "../../storage/journal";
import { INPUTS_FILE, RUN_METADATA_FILE } from "../../storage/paths";
import { readRunMetadata } from "../../storage/runFiles";
import type { JournalEvent, RunMetadata } from "../../storage/types";
import { type CompletionMarker, type ConvergentRunContext, type CreateRunConvergentOptions, sha256 } from "./contracts";
import { classifyMarkers } from "./markerValidation";
import { pathExists } from "./durable";

const RUN_DIRECTORIES = ["journal", "tasks", "blobs", "state", "orphaned", "process"] as const;
const RUN_FILES = [".gitignore", RUN_METADATA_FILE, INPUTS_FILE] as const;

export type ConvergentRunClassification =
  | { readonly kind: "ABSENT" }
  | { readonly kind: "PRE_JOURNAL_EXACT"; readonly metadata: RunMetadata; readonly runDir: string; readonly runJsonSha256: string }
  | { readonly kind: "JOURNALED_PRE_HOOK_PROVEN"; readonly context: ConvergentRunContext }
  | { readonly kind: "JOURNALED_HOOK_FINALIZATION_UNKNOWN" }
  | { readonly kind: "CREATED_COMPLETE"; readonly context: ConvergentRunContext; readonly completion: CompletionMarker }
  | { readonly kind: "COMPLETION_MARKER_DIVERGED" }
  | { readonly kind: "PARTIAL_UNKNOWN" };

export async function classifyConvergentRun(options: CreateRunConvergentOptions): Promise<ConvergentRunClassification> {
  const runDir = path.resolve(options.runsDir, options.runId);
  if (!(await pathExists(runDir))) return { kind: "ABSENT" };
  if (!(await hasExactRunLayout(runDir))) return { kind: "PARTIAL_UNKNOWN" };

  const existing = await readExistingRun(runDir, options);
  if (existing === null) return { kind: "PARTIAL_UNKNOWN" };
  const journal = await readExactJournal(runDir);
  if (journal === null) return { kind: "PARTIAL_UNKNOWN" };
  if (journal.length === 0) {
    return {
      kind: "PRE_JOURNAL_EXACT",
      metadata: existing.metadata,
      runDir,
      runJsonSha256: existing.runJsonSha256,
    };
  }
  if (journal.length !== 1 || journal[0]?.type !== "RUN_CREATED" || !(await hasNoTasks(runDir))) {
    return { kind: "PARTIAL_UNKNOWN" };
  }

  const event = journal[0];
  if (!matchesRunCreatedEvent(event, existing.metadata, options)) return { kind: "PARTIAL_UNKNOWN" };
  const context: ConvergentRunContext = {
    event,
    metadata: existing.metadata,
    runDir,
    runJsonSha256: existing.runJsonSha256,
  };
  return await classifyMarkers(context, options);
}

async function hasExactRunLayout(runDir: string): Promise<boolean> {
  const entries = await fs.readdir(runDir, { withFileTypes: true });
  const names = new Set(entries.map((entry) => entry.name));
  const allowed = new Set([...RUN_DIRECTORIES, ...RUN_FILES, "run.lock"]);
  if (entries.some((entry) => !allowed.has(entry.name))) return false;
  if (RUN_DIRECTORIES.some((name) => !names.has(name)) || RUN_FILES.some((name) => !names.has(name))) return false;
  for (const name of RUN_DIRECTORIES) {
    const entry = entries.find((candidate) => candidate.name === name);
    if (!entry?.isDirectory()) return false;
  }
  return true;
}

async function readExistingRun(runDir: string, options: CreateRunConvergentOptions): Promise<{
  readonly metadata: RunMetadata;
  readonly runJsonSha256: string;
} | null> {
  try {
    const runJson = await fs.readFile(path.join(runDir, RUN_METADATA_FILE));
    const inputs = await fs.readFile(path.join(runDir, INPUTS_FILE));
    const snapshot = await fs.readFile(options.processSnapshotPath);
    const metadata = await readRunMetadata(runDir);
    const runJsonSha256 = sha256(runJson);
    if (options.expectedRunJsonSha256 !== undefined && options.expectedRunJsonSha256 !== runJsonSha256) return null;
    if (!inputs.equals(await fs.readFile(options.inputsPath))) return null;
    if (sha256(snapshot) !== options.processSnapshotHash) return null;
    if (!matchesMetadata(metadata, runDir, options)) return null;
    return { metadata, runJsonSha256 };
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

function matchesMetadata(metadata: RunMetadata, runDir: string, options: CreateRunConvergentOptions): boolean {
  const entryImport = path.posix.normalize(path.relative(runDir, options.process.importPath).replace(/\\/g, "/"));
  return metadata.runId === options.runId
    && metadata.request === options.request
    && metadata.processId === options.process.processId
    && metadata.processCodeHash === options.processSnapshotHash
    && metadata.entrypoint.importPath === entryImport
    && metadata.entrypoint.exportName === options.process.exportName
    && metadata.prompt === options.prompt;
}

async function readExactJournal(runDir: string): Promise<readonly JournalEvent[] | null> {
  try {
    const names = await fs.readdir(path.join(runDir, "journal"));
    if (names.some((name) => !/^\d{6}\.[A-Za-z0-9]+\.json$/.test(name))) return null;
    const events = await loadJournal(runDir);
    return events.length === names.length ? events : null;
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
}

async function hasNoTasks(runDir: string): Promise<boolean> {
  const entries = await fs.readdir(path.join(runDir, "tasks"));
  return entries.length === 0;
}

function matchesRunCreatedEvent(event: JournalEvent, metadata: RunMetadata, options: CreateRunConvergentOptions): boolean {
  return event.data.runId === options.runId
    && event.data.processId === metadata.processId
    && event.data.inputsRef === INPUTS_FILE
    && JSON.stringify(event.data.entrypoint) === JSON.stringify(metadata.entrypoint)
    && event.data.processCodeHash === metadata.processCodeHash
    && event.data.prompt === options.prompt;
}
