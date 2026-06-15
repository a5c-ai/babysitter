import { promises as fs } from "fs";
import path from "path";
import { getTasksDir } from "./paths";
import { JsonRecord, StoredTaskResult } from "./types";
import { writeFileAtomic } from "./atomic";
import { withSdkVersion } from "../sdkVersion";

function resolveTaskPath(runDir: string, effectId: string, relative: string) {
  return path.join(getTasksDir(runDir), effectId, relative);
}

export async function writeTaskDefinition(runDir: string, effectId: string, taskDef: JsonRecord) {
  const taskDir = path.join(getTasksDir(runDir), effectId);
  await fs.mkdir(taskDir, { recursive: true });
  const taskPath = path.join(taskDir, "task.json");
  await writeFileAtomic(taskPath, JSON.stringify(withSdkVersion(taskDef), null, 2) + "\n");
  return path.relative(runDir, taskPath).replace(/\\/g, "/");
}

export async function readTaskDefinition(runDir: string, effectId: string): Promise<JsonRecord | undefined> {
  const taskPath = resolveTaskPath(runDir, effectId, "task.json");
  try {
    const raw = await fs.readFile(taskPath, "utf8");
    return JSON.parse(raw) as JsonRecord;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export async function readTaskResult(
  runDir: string,
  effectId: string,
  resultRef?: string
): Promise<StoredTaskResult | undefined> {
  const resolvedPath = resultRef
    ? path.isAbsolute(resultRef)
      ? resultRef
      : path.join(runDir, resultRef)
    : resolveTaskPath(runDir, effectId, "result.json");
  try {
    const raw = await fs.readFile(resolvedPath, "utf8");
    return JSON.parse(raw) as StoredTaskResult;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export interface WriteTaskResultOptions {
  runDir: string;
  effectId: string;
  result: StoredTaskResult;
  stdout?: string;
  stderr?: string;
}

export async function writeTaskResult(options: WriteTaskResultOptions) {
  const taskDir = path.join(getTasksDir(options.runDir), options.effectId);
  await fs.mkdir(taskDir, { recursive: true });
  const resultPath = path.join(taskDir, "result.json");
  const relativeResultPath = path.relative(options.runDir, resultPath).replace(/\\/g, "/");

  const stdoutRef = await writeTextIfProvided(options.runDir, options.effectId, "stdout.log", options.stdout);
  const stderrRef = await writeTextIfProvided(options.runDir, options.effectId, "stderr.log", options.stderr);

  if (stdoutRef && !options.result.stdoutRef) {
    options.result.stdoutRef = stdoutRef;
  }
  if (stderrRef && !options.result.stderrRef) {
    options.result.stderrRef = stderrRef;
  }

  await writeFileAtomic(resultPath, JSON.stringify(withSdkVersion(options.result), null, 2) + "\n");

  return {
    resultRef: relativeResultPath,
    stdoutRef,
    stderrRef,
  };
}

async function writeTextIfProvided(
  runDir: string,
  effectId: string,
  filename: string,
  contents?: string
): Promise<string | undefined> {
  if (typeof contents !== "string") return undefined;
  const filePath = resolveTaskPath(runDir, effectId, filename);
  await writeFileAtomic(filePath, contents);
  return path.relative(runDir, filePath).replace(/\\/g, "/");
}
