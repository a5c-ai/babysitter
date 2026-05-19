import * as path from "node:path";
import { readRunMetadata, writeRunMetadata } from "../../storage/runFiles";
import { appendEvent } from "../../storage/journal";
import { withRunLock } from "../../storage/lock";
import type { ParsedArgs } from "./types";
import { collapseDoubledA5cRuns, resolveRunDir } from "./args";
import {
  formatResolvedEntrypoint,
  logVerbose,
  parseEntrypointSpecifier,
  validateProcessEntrypoint,
} from "./runSupport";
import { USAGE } from "./usage";
import { hashProcessCodeFile } from "../../runtime/processCodeHash";

export async function handleRunAssignProcess(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error("run:assign-process requires a <runDir> positional argument");
    console.error(USAGE);
    return 1;
  }

  if (!parsed.entrySpecifier) {
    console.error("--entry is required for run:assign-process");
    console.error(USAGE);
    return 1;
  }

  let entrypoint: { importPath: string; exportName?: string };
  try {
    entrypoint = parseEntrypointSpecifier(parsed.entrySpecifier);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const runsDir = collapseDoubledA5cRuns(path.resolve(parsed.runsDir));
  const runDir = resolveRunDir(runsDir, parsed.runDirArg);
  const absoluteImportPath = path.resolve(entrypoint.importPath);
  const resolvedEntry = formatResolvedEntrypoint(absoluteImportPath, entrypoint.exportName);

  logVerbose("run:assign-process", parsed, {
    runDir,
    entry: resolvedEntry,
    processId: parsed.processId,
    force: parsed.sessionForce,
    dryRun: parsed.dryRun,
    json: parsed.json,
  });

  let metadata;
  try {
    metadata = await readRunMetadata(runDir);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      const message = `Run directory not found: ${runDir}`;
      if (parsed.json) {
        console.log(JSON.stringify({ error: "RUN_NOT_FOUND", message }));
      } else {
        console.error(message);
      }
      return 1;
    }
    throw error;
  }

  const isBareRun = metadata.entrypoint.importPath === "bare-run";
  if (!isBareRun && !parsed.sessionForce) {
    const message = `Run already has a process assigned (entrypoint: ${metadata.entrypoint.importPath}). Use --force to override.`;
    if (parsed.json) {
      console.log(JSON.stringify({ error: "PROCESS_ALREADY_ASSIGNED", message, currentEntrypoint: metadata.entrypoint }));
    } else {
      console.error(message);
    }
    return 1;
  }

  try {
    await validateProcessEntrypoint(absoluteImportPath, entrypoint.exportName);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const processId = parsed.processId ?? metadata.processId;

  if (parsed.dryRun) {
    const summary = {
      dryRun: true,
      runDir,
      runId: metadata.runId,
      entry: resolvedEntry,
      processId,
      previousEntrypoint: metadata.entrypoint,
      force: parsed.sessionForce ?? false,
    };
    if (parsed.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(`[run:assign-process] dry-run runDir=${runDir} entry=${resolvedEntry} processId=${processId}`);
    }
    return 0;
  }

  await withRunLock(runDir, "run:assign-process", async () => {
    const current = await readRunMetadata(runDir);
    const previousEntrypoint = { ...current.entrypoint };

    current.entrypoint = {
      importPath: absoluteImportPath,
      exportName: entrypoint.exportName,
    };
    current.processPath = absoluteImportPath;
    current.processId = processId;
    current.processCodeHash = await hashProcessCodeFile(absoluteImportPath);
    if (parsed.processRevision) {
      current.processRevision = parsed.processRevision;
    }

    await writeRunMetadata(runDir, current);

    await appendEvent({
      runDir,
      eventType: "PROCESS_ASSIGNED",
      event: {
        processId,
        entrypoint: current.entrypoint,
        previousEntrypoint,
        force: parsed.sessionForce ?? false,
        ...(current.processCodeHash ? { processCodeHash: current.processCodeHash } : {}),
      },
    });
  });

  const updatedMetadata = await readRunMetadata(runDir);
  if (parsed.json) {
    console.log(JSON.stringify({
      runId: updatedMetadata.runId,
      runDir,
      entry: resolvedEntry,
      processId,
      previousEntrypoint: metadata.entrypoint,
      assigned: true,
    }, null, 2));
  } else {
    console.log(`[run:assign-process] runId=${updatedMetadata.runId} runDir=${runDir} entry=${resolvedEntry} processId=${processId}`);
  }
  return 0;
}
