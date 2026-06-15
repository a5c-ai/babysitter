/**
 * GAP-REMOTE-001: Daemon JSONL logging.
 *
 * Appends structured JSON lines to a daemon activation log file.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

export type DaemonLogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface DaemonLogEntry {
  timestamp: string;
  event: string;
  level?: DaemonLogLevel;
  schemaVersion?: string;
  sampled?: boolean;
  sequence?: number;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  data?: Record<string, unknown>;
}

export interface DaemonLogPolicy {
  minLevel?: DaemonLogLevel;
  eventAllowList?: readonly string[];
  eventDenyList?: readonly string[];
  sampleRate?: number;
  maxBytes?: number;
  maxFiles?: number;
  schemaVersion?: string;
}

const DEFAULT_SCHEMA_VERSION = "2026.05.daemon-log-v1";
const LEVEL_RANK: Record<DaemonLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

function shouldWriteEntry(entry: DaemonLogEntry, policy?: DaemonLogPolicy): boolean {
  if (!policy) return true;

  if (policy.eventAllowList && !policy.eventAllowList.includes(entry.event)) {
    return false;
  }
  if (policy.eventDenyList?.includes(entry.event)) {
    return false;
  }

  const minLevel = policy.minLevel;
  if (minLevel) {
    const entryLevel = entry.level ?? "info";
    if (LEVEL_RANK[entryLevel] < LEVEL_RANK[minLevel]) {
      return false;
    }
  }

  const sampleRate = policy.sampleRate;
  if (sampleRate !== undefined) {
    if (sampleRate <= 0) return false;
    if (sampleRate < 1 && deterministicSample(entry, sampleRate) === false) {
      return false;
    }
  }

  return true;
}

function deterministicSample(entry: DaemonLogEntry, sampleRate: number): boolean {
  const key = `${entry.timestamp}:${entry.event}:${entry.correlationId ?? ""}:${entry.traceId ?? ""}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash / 0xffffffff < sampleRate;
}

async function rotateIfNeeded(logPath: string, nextLineBytes: number, policy?: DaemonLogPolicy): Promise<void> {
  const maxBytes = policy?.maxBytes ?? 0;
  if (maxBytes <= 0) return;

  let currentSize = 0;
  try {
    currentSize = (await fs.stat(logPath)).size;
  } catch {
    return;
  }
  if (currentSize + nextLineBytes <= maxBytes) return;

  const maxFiles = Math.max(1, policy?.maxFiles ?? 1);
  for (let index = maxFiles - 1; index >= 1; index--) {
    const from = `${logPath}.${index}`;
    const to = `${logPath}.${index + 1}`;
    await fs.rename(from, to).catch(() => {});
  }
  await fs.rename(logPath, `${logPath}.1`).catch(() => {});
}

export async function appendDaemonLog(
  logDir: string,
  entry: DaemonLogEntry,
  policy?: DaemonLogPolicy,
): Promise<void> {
  if (!shouldWriteEntry(entry, policy)) return;

  await fs.mkdir(logDir, { recursive: true });
  const logPath = path.join(logDir, "daemon.jsonl");
  const serializedEntry: DaemonLogEntry = {
    ...entry,
    ...(policy?.schemaVersion && !entry.schemaVersion
      ? { schemaVersion: policy.schemaVersion }
      : {}),
    ...(policy?.sampleRate !== undefined ? { sampled: true } : {}),
  };
  if (policy && !serializedEntry.schemaVersion) {
    serializedEntry.schemaVersion = DEFAULT_SCHEMA_VERSION;
  }
  const line = JSON.stringify(serializedEntry) + "\n";
  await rotateIfNeeded(logPath, Buffer.byteLength(line), policy);
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
