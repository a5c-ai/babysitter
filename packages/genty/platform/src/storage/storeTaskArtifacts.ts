import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { writeFileAtomic } from "./atomic";
import { getBlobsDir, getTasksDir } from "./paths";
import type { StoreTaskArtifactsOptions } from "./types";

const ARTIFACT_SPILL_THRESHOLD = 512 * 1024;

async function writeArtifact(targetPath: string, data: Buffer | string) {
  await writeFileAtomic(targetPath, data);
}

function hashBuffer(data: Buffer | string) {
  const buf = typeof data === "string" ? Buffer.from(data) : data;
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function storeTaskArtifacts(options: StoreTaskArtifactsOptions) {
  const taskDir = path.join(getTasksDir(options.runDir), options.effectId);
  await fs.mkdir(taskDir, { recursive: true });

  if (options.task) {
    await writeFileAtomic(path.join(taskDir, "task.json"), JSON.stringify(options.task, null, 2) + "\n");
  }
  if (options.result) {
    await writeFileAtomic(path.join(taskDir, "result.json"), JSON.stringify(options.result, null, 2) + "\n");
  }

  const savedArtifacts: Array<{ name: string; storedAt: string }> = [];
  for (const artifact of options.artifacts ?? []) {
    const data = typeof artifact.data === "string" ? Buffer.from(artifact.data) : artifact.data;
    if (data.length > ARTIFACT_SPILL_THRESHOLD) {
      const hash = hashBuffer(data);
      const blobPath = path.join(getBlobsDir(options.runDir), hash);
      try {
        await fs.access(blobPath);
      } catch {
        await writeArtifact(blobPath, data);
      }
      savedArtifacts.push({ name: artifact.name, storedAt: `blobs/${hash}` });
      continue;
    }

    const artifactDir = path.join(taskDir, "artifacts");
    await fs.mkdir(artifactDir, { recursive: true });
    const filePath = path.join(artifactDir, artifact.name);
    await writeArtifact(filePath, data);
    savedArtifacts.push({
      name: artifact.name,
      storedAt: `tasks/${options.effectId}/artifacts/${artifact.name}`,
    });
  }

  await writeFileAtomic(path.join(taskDir, "artifacts.json"), JSON.stringify(savedArtifacts, null, 2) + "\n");
  return savedArtifacts;
}
