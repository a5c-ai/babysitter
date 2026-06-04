import path from "node:path";

const TASKS_DIR = "tasks";
const BLOBS_DIR = "blobs";
const STATE_DIR = "state";
const STATE_FILE = "state.json";

export function getTasksDir(runDir: string): string {
  return path.join(runDir, TASKS_DIR);
}

export function getBlobsDir(runDir: string): string {
  return path.join(runDir, BLOBS_DIR);
}

export function getStateDir(runDir: string): string {
  return path.join(runDir, STATE_DIR);
}

export function getStateFile(runDir: string): string {
  return path.join(getStateDir(runDir), STATE_FILE);
}
