import * as path from "node:path";
import { appendEvent } from "../../storage/journal";
import { writeFileAtomic } from "../../storage/atomic";
import { INPUTS_FILE } from "../../storage/paths";
import { readRunMetadata, writeRunMetadata } from "../../storage/runFiles";
import type { JsonRecord, RunMetadata } from "../../storage/types";
import { withRunLock } from "../../storage/lock";
import { hashProcessCodeFile } from "../../runtime/processCodeHash";

export interface AssignProcessOptions {
  runDir: string;
  processId: string;
  importPath: string;
  exportName?: string;
  processRevision?: string;
  force?: boolean;
  request?: string;
  prompt?: string;
  inputs?: unknown;
  additionalMetadata?: JsonRecord;
  owner: string;
  /** Return without changing the run when the target is no longer bare. */
  requireBare?: boolean;
}

export interface AssignProcessResult {
  metadata: RunMetadata;
  previousEntrypoint: RunMetadata["entrypoint"];
}

/**
 * Attach a process to an existing run and record the transition in the journal.
 * The caller can use requireBare for adoption paths that must not race with a
 * separate process assignment.
 */
export async function assignProcessToRun(
  options: AssignProcessOptions,
): Promise<AssignProcessResult | undefined> {
  return withRunLock(options.runDir, options.owner, async () => {
    const current = await readRunMetadata(options.runDir);
    const isBareRun = current.entrypoint.importPath === "bare-run";
    if (!isBareRun && options.requireBare) return undefined;
    if (!isBareRun && !options.force) {
      throw new Error(
        `Run already has a process assigned (entrypoint: ${current.entrypoint.importPath}).`,
      );
    }

    const previousEntrypoint = { ...current.entrypoint };
    current.entrypoint = {
      importPath: options.importPath,
      exportName: options.exportName,
    };
    current.processPath = options.importPath;
    current.processId = options.processId;
    current.processCodeHash = await hashProcessCodeFile(options.importPath);
    if (options.processRevision !== undefined) {
      current.processRevision = options.processRevision;
    }
    if (options.request !== undefined) current.request = options.request;
    if (options.prompt !== undefined) current.prompt = options.prompt;
    if (options.additionalMetadata) Object.assign(current, options.additionalMetadata);

    await writeRunMetadata(options.runDir, current);
    if (options.inputs !== undefined) {
      await writeFileAtomic(
        path.join(options.runDir, INPUTS_FILE),
        `${JSON.stringify(options.inputs, null, 2)}\n`,
      );
    }

    await appendEvent({
      runDir: options.runDir,
      eventType: "PROCESS_ASSIGNED",
      event: {
        processId: options.processId,
        entrypoint: current.entrypoint,
        previousEntrypoint,
        force: options.force ?? false,
        ...(options.prompt !== undefined ? { prompt: options.prompt } : {}),
        ...(options.inputs !== undefined ? { inputsRef: INPUTS_FILE } : {}),
        ...(current.processCodeHash ? { processCodeHash: current.processCodeHash } : {}),
      },
    });

    return { metadata: current, previousEntrypoint };
  });
}
