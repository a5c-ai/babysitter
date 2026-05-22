/**
 * GAP-REMOTE-001: Daemon JSONL logging.
 *
 * Appends structured JSON lines to a daemon activation log file.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

export interface DaemonLogEntry {
  timestamp: string;
  event: string;
  data?: Record<string, unknown>;
}

export async function appendDaemonLog(
  logDir: string,
  entry: DaemonLogEntry,
): Promise<void> {
  await fs.mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, "daemon.jsonl");
  const line = JSON.stringify(entry) + "\n";
  await fs.appendFile(logPath, line, "utf-8");
}

export async function readDaemonLog(
  logDir: string,
): Promise<DaemonLogEntry[]> {
  const logPath = path.join(logDir, "daemon.jsonl");
  try {
    const content = await fs.readFile(logPath, "utf-8");
    return content
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as DaemonLogEntry);
  } catch {
    return [];
  }
}
