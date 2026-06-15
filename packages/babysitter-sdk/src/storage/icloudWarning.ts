import { promises as fs } from "fs";
import path from "path";

const ICLOUD_DRIVE_MARKER = "/Library/Mobile Documents/com~apple~CloudDocs";
const warnedPaths = new Set<string>();

type WarningOutput = Pick<NodeJS.WriteStream, "write">;

function normalizePathForMatch(inputPath: string): string {
  return inputPath.replace(/\\/g, "/").replace(/\/+$/, "");
}

function getICloudWarningKey(candidatePath: string): string {
  const normalized = normalizePathForMatch(candidatePath);
  const markerIndex = normalized.indexOf(ICLOUD_DRIVE_MARKER);
  if (markerIndex === -1) {
    return normalized;
  }
  return normalized.slice(0, markerIndex + ICLOUD_DRIVE_MARKER.length);
}

function isICloudDrivePath(candidatePath: string): boolean {
  const normalized = normalizePathForMatch(candidatePath);
  return normalized === ICLOUD_DRIVE_MARKER || normalized.includes(`${ICLOUD_DRIVE_MARKER}/`);
}

async function resolveExistingAncestorRealPath(inputPath: string): Promise<string | undefined> {
  let current = path.resolve(inputPath);
  let reachedFilesystemRoot = false;
  while (!reachedFilesystemRoot) {
    try {
      return await fs.realpath(current);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        return undefined;
      }
      const parent = path.dirname(current);
      if (parent === current) {
        reachedFilesystemRoot = true;
      } else {
        current = parent;
      }
    }
  }
  return undefined;
}

export async function detectICloudDrivePath(inputPath: string): Promise<string | undefined> {
  const realAncestor = await resolveExistingAncestorRealPath(inputPath);
  const candidates = [
    realAncestor,
    path.resolve(inputPath),
    inputPath,
  ].filter((candidate): candidate is string => typeof candidate === "string" && candidate.trim() !== "");

  return candidates.find((candidate) => isICloudDrivePath(candidate));
}

export async function warnIfICloudDrivePath(
  inputPath: string,
  output: WarningOutput = process.stderr,
): Promise<boolean> {
  const matchedPath = await detectICloudDrivePath(inputPath);
  if (!matchedPath) {
    return false;
  }

  const dedupeKey = getICloudWarningKey(matchedPath);
  if (warnedPaths.has(dedupeKey)) {
    return true;
  }
  warnedPaths.add(dedupeKey);

  const message = [
    "",
    "!!! WARNING: Babysitter state is inside iCloud Drive.",
    `Path: ${path.resolve(inputPath)}`,
    "iCloud sync can race .a5c journal writes and produce duplicate or conflicting journal events.",
    "Recommendation: move the project or set BABYSITTER_STATE_DIR/BABYSITTER_RUNS_DIR outside iCloud Drive.",
    "Known issue: github.com/a5c-ai/babysitter/issues/77",
    "",
  ].join("\n");
  output.write(`${message}\n`);
  return true;
}

export function __resetICloudDriveWarningCacheForTests(): void {
  warnedPaths.clear();
}
