/**
 * Local run-file utilities for genty-runtime.
 *
 * Reads run metadata from the standard on-disk layout without importing
 * from @a5c-ai/babysitter-sdk.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { RunMetadata } from "../types/sdk";

const RUN_METADATA_FILE = "run.json";

export async function readRunMetadata(runDir: string): Promise<RunMetadata> {
  const metadataPath = path.join(runDir, RUN_METADATA_FILE);
  const raw = await fs.readFile(metadataPath, "utf8");
  return JSON.parse(raw) as RunMetadata;
}

export function getRunDir(runsRoot: string, runId: string): string {
  return path.join(runsRoot, runId);
}
