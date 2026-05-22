import { promises as fs } from "fs";
import path from "path";
import { emitRuntimeMetric } from "./instrumentation";
import type { ProcessLogger } from "./types";

export interface WorkDirLeakWarning {
  runDir: string;
  workDir: string;
  entries: string[];
}

export async function checkRunWorkDirLeak(
  runDir: string,
  logger: ProcessLogger | undefined,
  phase: string,
): Promise<WorkDirLeakWarning | null> {
  const workDir = path.join(runDir, "work");
  let entries: string[];
  try {
    entries = await fs.readdir(workDir);
  } catch (error) {
    if (isNotFound(error)) return null;
    emitRuntimeMetric(logger, "run.workdir_leak_check", {
      status: "error",
      phase,
      runDir,
      workDir,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  const visibleEntries = entries.filter((entry) => entry !== ".gitkeep").sort();
  if (visibleEntries.length === 0) return null;

  const warning = {
    runDir,
    workDir,
    entries: visibleEntries,
  };
  emitRuntimeMetric(logger, "run.workdir_leak", {
    status: "warning",
    phase,
    runDir,
    workDir,
    entryCount: visibleEntries.length,
    entries: visibleEntries,
    message: "Non-empty run work directory detected. Use /tmp/<descriptive-name>/ for subagent scratch clones; the SDK will not delete this directory automatically.",
  });
  console.warn(
    `[babysitter] Non-empty run work directory detected at ${workDir}: ${visibleEntries.join(", ")}. ` +
      "Use /tmp/<descriptive-name>/ for subagent scratch clones; not deleting automatically.",
  );
  return warning;
}

function isNotFound(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as NodeJS.ErrnoException).code === "ENOENT");
}
