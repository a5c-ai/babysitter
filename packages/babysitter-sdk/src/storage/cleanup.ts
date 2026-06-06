import { promises as fs } from "fs";
import path from "path";
import { DiskUsageReport, OrphanedBlobInfo } from "./types";
import { getBlobsDir, getRunDir, getJournalDir, getTasksDir, getStateDir } from "./paths";

async function dirSize(dir: string): Promise<number> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await dirSize(full);
      } else if (entry.isFile()) {
        const stat = await fs.stat(full);
        total += stat.size;
      }
    }
    return total;
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") return 0;
    throw error;
  }
}

export async function getDiskUsage(runsRoot: string, runId: string): Promise<DiskUsageReport> {
  const runDir = getRunDir(runsRoot, runId);
  const [journal, tasks, blobs, state] = await Promise.all([
    dirSize(getJournalDir(runDir)),
    dirSize(getTasksDir(runDir)),
    dirSize(getBlobsDir(runDir)),
    dirSize(getStateDir(runDir)),
  ]);
  const total = journal + tasks + blobs + state;
  return { totalBytes: total, journalBytes: journal, tasksBytes: tasks, blobsBytes: blobs, stateBytes: state };
}

export async function findOrphanedBlobs(runsRoot: string, runId: string): Promise<OrphanedBlobInfo[]> {
  const runDir = getRunDir(runsRoot, runId);
  const blobsDir = getBlobsDir(runDir);
  const referenced = new Set<string>();
  const tasksDir = getTasksDir(runDir);
  try {
    const effects = await fs.readdir(tasksDir, { withFileTypes: true });
    for (const effectEntry of effects) {
      if (!effectEntry.isDirectory()) continue;
      const artifactsPath = path.join(tasksDir, effectEntry.name, "artifacts.json");
      try {
        const data = await fs.readFile(artifactsPath, "utf8");
        const artifacts = JSON.parse(data) as Array<{ storedAt: string }>;
        for (const artifact of artifacts) {
          if (artifact.storedAt.startsWith("blobs/")) {
            referenced.add(path.basename(artifact.storedAt));
          }
        }
      } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code !== "ENOENT") throw err;
      }
    }
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw err;
  }

  const orphaned: OrphanedBlobInfo[] = [];
  try {
    const blobs = await fs.readdir(blobsDir, { withFileTypes: true });
    for (const blob of blobs) {
      if (!blob.isFile()) continue;
      if (!referenced.has(blob.name)) {
        const full = path.join(blobsDir, blob.name);
        const stat = await fs.stat(full);
        orphaned.push({ hash: blob.name, bytes: stat.size, path: `blobs/${blob.name}` });
      }
    }
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code !== "ENOENT") throw err;
  }

  return orphaned;
}
