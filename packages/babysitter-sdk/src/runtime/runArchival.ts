/**
 * GAP-RUN-002: Run Archival and Restore.
 *
 * Provides primitives for archiving completed runs to compressed files,
 * restoring them, and managing archive manifests.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createGzip, createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArchiveManifest {
  /** Run ID of the archived run. */
  runId: string;
  /** ISO timestamp when the archive was created. */
  archivedAt: string;
  /** Original run directory path. */
  originalDir: string;
  /** Path to the archive file. */
  archivePath: string;
  /** Size of the compressed archive in bytes. */
  compressedSize: number;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Archive a run directory by creating a compressed .json.gz file and a manifest.
 * Collects all JSON files in the run directory recursively into a single archive.
 */
export async function archiveRun(
  runDir: string,
  archiveDir: string,
): Promise<ArchiveManifest> {
  // Read run.json to get the runId
  const runMetaPath = path.join(runDir, 'run.json');
  const runMeta = JSON.parse(await fs.readFile(runMetaPath, 'utf8')) as { runId: string };
  const runId = runMeta.runId;

  // Ensure archive directory exists
  await fs.mkdir(archiveDir, { recursive: true });

  // Collect all files in the run directory
  const files = await collectFiles(runDir);
  const archiveData: Record<string, string> = {};

  for (const filePath of files) {
    const relativePath = path.relative(runDir, filePath);
    const content = await fs.readFile(filePath, 'utf8');
    archiveData[relativePath] = content;
  }

  // Write compressed archive
  const archiveFileName = `${runId}.archive.json.gz`;
  const archivePath = path.join(archiveDir, archiveFileName);

  const jsonBuffer = Buffer.from(JSON.stringify(archiveData), 'utf8');
  const tempPath = archivePath + '.tmp';

  await fs.writeFile(tempPath, jsonBuffer);

  // Compress
  await pipeline(
    createReadStream(tempPath),
    createGzip(),
    createWriteStream(archivePath),
  );

  await fs.unlink(tempPath);

  const stat = await fs.stat(archivePath);

  // Write manifest
  const manifest: ArchiveManifest = {
    runId,
    archivedAt: new Date().toISOString(),
    originalDir: runDir,
    archivePath,
    compressedSize: stat.size,
  };

  const manifestPath = path.join(archiveDir, `${runId}.manifest.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return manifest;
}

/**
 * Restore an archive to a target directory.
 */
export async function restoreRun(
  archivePath: string,
  targetDir: string,
): Promise<void> {
  await fs.mkdir(targetDir, { recursive: true });

  // Decompress
  const tempPath = archivePath + '.restore.tmp';
  await pipeline(
    createReadStream(archivePath),
    createGunzip(),
    createWriteStream(tempPath),
  );

  const archiveData = JSON.parse(await fs.readFile(tempPath, 'utf8')) as Record<string, string>;
  await fs.unlink(tempPath);

  // Write files
  for (const [relativePath, content] of Object.entries(archiveData)) {
    const fullPath = path.join(targetDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
  }
}

/**
 * List all archives in a directory by reading manifest files.
 */
export async function listArchives(archiveDir: string): Promise<ArchiveManifest[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(archiveDir);
  } catch {
    return [];
  }

  const manifests: ArchiveManifest[] = [];

  for (const entry of entries) {
    if (entry.endsWith('.manifest.json')) {
      const manifestPath = path.join(archiveDir, entry);
      const content = await fs.readFile(manifestPath, 'utf8');
      manifests.push(JSON.parse(content) as ArchiveManifest);
    }
  }

  return manifests.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function collectFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await collectFiles(fullPath)));
    } else {
      result.push(fullPath);
    }
  }

  return result;
}
