import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../utils";

export function getProcessOutputDir(workDir: string): string {
  return path.join(workDir, ".a5c", "processes");
}

/** @deprecated Use getProcessOutputDir instead */
export function getGeneratedProcessPath(workDir: string): string {
  return getProcessOutputDir(workDir);
}

export function normalizeReportedPath(candidate: string, workspace?: string): string {
  const trimmed = candidate.trim().replace(/^['"`]|['"`]$/g, "");
  if (path.isAbsolute(trimmed)) {
    return path.resolve(trimmed);
  }
  return path.resolve(workspace ?? process.cwd(), trimmed);
}

export function extractMentionedProcessPaths(text: string, workspace?: string): string[] {
  const patterns = [
    /([A-Za-z]:[\\/][^\r\n"'`]+?\.m?js)\b/g,
    /((?:\.{0,2}[\\/]|\/)[^\r\n"'`]+?\.m?js)\b/g,
    /\b([A-Za-z0-9_.\-\\/]+generated-process\.m?js)\b/g,
    /\b(\.a5c[\\/]processes[\\/][A-Za-z0-9_.-]+\.m?js)\b/g,
  ];

  const matches = new Set<string>();
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1];
      if (raw) {
        matches.add(normalizeReportedPath(raw, workspace));
      }
    }
  }

  return [...matches];
}

const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 60_000;

export async function waitForProcessFile(
  filePath: string,
  timeoutMs: number = POLL_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fs.access(filePath);
      return;
    } catch {
      // keep polling
    }
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new BabysitterRuntimeError(
    "ProcessFileTimeoutError",
    `Process file was not created within ${timeoutMs / 1_000}s: ${filePath}`,
    {
      category: ErrorCategory.External,
      nextSteps: [
        "Check harness output for errors",
        "Ensure the harness can write to the workspace directory",
      ],
    },
  );
}
