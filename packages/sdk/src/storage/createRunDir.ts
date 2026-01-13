import { promises as fs } from "fs";
import path from "path";
import { CreateRunDirOptions, RunEntrypointMetadata, RunMetadata } from "./types";
import {
  DEFAULT_LAYOUT_VERSION,
  INPUTS_FILE,
  RUN_METADATA_FILE,
  getRunDir,
  getJournalDir,
  getTasksDir,
  getBlobsDir,
  getStateDir,
  ORPHANED_DIR,
  PROCESS_DIR,
} from "./paths";
import { writeFileAtomic } from "./atomic";
import { getClockIsoString } from "./clock";

const GITIGNORE_CONTENT = `state/\ntasks/*/artifacts/\nblobs/\norphaned/\n`;

export async function createRunDir(options: CreateRunDirOptions) {
  const runDir = getRunDir(options.runsRoot, options.runId);
  await fs.mkdir(runDir, { recursive: true });
  await Promise.all([
    fs.mkdir(getJournalDir(runDir), { recursive: true }),
    fs.mkdir(getTasksDir(runDir), { recursive: true }),
    fs.mkdir(getBlobsDir(runDir), { recursive: true }),
    fs.mkdir(getStateDir(runDir), { recursive: true }),
    fs.mkdir(path.join(runDir, ORPHANED_DIR), { recursive: true }),
    fs.mkdir(path.join(runDir, PROCESS_DIR), { recursive: true }),
  ]);
  await writeFileAtomic(path.join(runDir, ".gitignore"), GITIGNORE_CONTENT);

  const layoutVersion = options.layoutVersion ?? DEFAULT_LAYOUT_VERSION;
  const entrypoint = resolveEntrypoint(options);
  const createdAt = getClockIsoString();
  const metadata: RunMetadata = {
    runId: options.runId,
    request: options.request,
    processId: options.processId ?? options.request ?? options.runId,
    entrypoint,
    processPath: entrypoint.importPath,
    processRevision: options.processRevision,
    layoutVersion,
    createdAt,
  };
  if (options.extraMetadata) {
    Object.assign(metadata, options.extraMetadata);
  }
  await writeFileAtomic(path.join(runDir, RUN_METADATA_FILE), JSON.stringify(metadata, null, 2) + "\n");
  if (options.inputs !== undefined) {
    await writeFileAtomic(path.join(runDir, INPUTS_FILE), JSON.stringify(options.inputs, null, 2) + "\n");
  }
  return { runDir, metadata };
}

function resolveEntrypoint(options: CreateRunDirOptions): RunEntrypointMetadata {
  if (options.entrypoint?.importPath) {
    return {
      importPath: options.entrypoint.importPath,
      exportName: options.entrypoint.exportName ?? "process",
    };
  }
  const importPath = options.processPath ?? "./process.js";
  return {
    importPath,
    exportName: "process",
  };
}
