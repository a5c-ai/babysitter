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
import { warnIfICloudDrivePath } from "./icloudWarning";
import { withSdkVersion } from "../sdkVersion";

const GITIGNORE_CONTENT = `state/\ntasks/*/artifacts/\nblobs/\norphaned/\n`;

const MINIMAL_PACKAGE_JSON = JSON.stringify({ type: "module" }, null, 2) + "\n";

/**
 * Ensure the parent of runsRoot (typically `.a5c/`) has a package.json with
 * `"type": "module"` so that process files can use ESM imports.  Only creates
 * the file when it does not already exist -- never overwrites.
 */
async function ensureParentPackageJson(runsRoot: string): Promise<void> {
  const parentDir = path.dirname(runsRoot);
  const pkgPath = path.join(parentDir, "package.json");
  try {
    await fs.access(pkgPath);
    // Already exists -- leave it alone.
  } catch {
    // Does not exist -- create a minimal ESM-enabling package.json.
    await fs.mkdir(parentDir, { recursive: true });
    await writeFileAtomic(pkgPath, MINIMAL_PACKAGE_JSON);
  }
}

export async function createRunDir(options: CreateRunDirOptions) {
  const runDir = getRunDir(options.runsRoot, options.runId);
  await warnIfICloudDrivePath(runDir);
  await fs.mkdir(runDir, { recursive: true });
  await ensureParentPackageJson(options.runsRoot);
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
    ...(options.harness !== undefined ? { harness: options.harness } : {}),
    ...(options.nested ? { nested: options.nested } : {}),
    entrypoint,
    processPath: entrypoint.importPath,
    processRevision: options.processRevision,
    layoutVersion,
    createdAt,
    ...(options.prompt !== undefined ? { prompt: options.prompt } : {}),
    ...(options.inputSchema !== undefined ? { inputSchema: options.inputSchema } : {}),
    ...(options.outputSchema !== undefined ? { outputSchema: options.outputSchema } : {}),
  };
  if (options.extraMetadata) {
    Object.assign(metadata, options.extraMetadata);
  }
  await writeFileAtomic(
    path.join(runDir, RUN_METADATA_FILE),
    JSON.stringify(withSdkVersion(metadata), null, 2) + "\n",
  );
  if (options.inputs !== undefined) {
    await writeFileAtomic(path.join(runDir, INPUTS_FILE), JSON.stringify(options.inputs, null, 2) + "\n");
  }
  return { runDir, metadata };
}

function resolveEntrypoint(options: CreateRunDirOptions): RunEntrypointMetadata {
  if (options.entrypoint?.importPath) {
    return {
      importPath: options.entrypoint.importPath,
      exportName: options.entrypoint.exportName,
    };
  }
  const importPath = options.processPath ?? "./process.js";
  return {
    importPath,
    exportName: "process",
  };
}
