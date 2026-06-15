/**
 * Local journal read/write utilities for genty-runtime.
 *
 * These are genty-owned implementations that replicate the subset of SDK
 * storage functions needed by runtime modules (observability, cost tracking).
 * They operate on the same on-disk layout as the SDK journal but do not
 * import from @a5c-ai/babysitter-sdk.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { JournalEvent, JsonRecord, AppendEventResult } from "../types/sdk";
import { nextUlid } from "../utils/ulid";

// ── Constants ────────────────────────────────────────────────────────────

const JOURNAL_DIR = "journal";
const RUN_METADATA_FILE = "run.json";

function getJournalDir(runDir: string): string {
  return path.join(runDir, JOURNAL_DIR);
}

function formatSeq(seq: number): string {
  return seq.toString().padStart(6, "0");
}

// ── Serialised append queue (prevents concurrent writes to the same run) ─

const appendQueues = new Map<string, Promise<void>>();

async function withAppendQueue<T>(runDir: string, op: () => Promise<T>): Promise<T> {
  const key = path.resolve(runDir);
  const prev = appendQueues.get(key) ?? Promise.resolve();
  const next = prev
    .catch(() => {
      /* swallow previous failure so queue keeps moving */
    })
    .then(op);
  const tail = next.then(
    () => undefined,
    () => undefined,
  );
  appendQueues.set(key, tail);
  try {
    return await next;
  } finally {
    if (appendQueues.get(key) === tail) {
      appendQueues.delete(key);
    }
  }
}

// ── Write ────────────────────────────────────────────────────────────────

async function getExistingSeqs(journalDir: string): Promise<number[]> {
  try {
    const entries = await fs.readdir(journalDir);
    return entries
      .map((name) => Number(name.split(".")[0]))
      .filter((n) => Number.isFinite(n));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw error;
  }
}

export interface AppendEventOptions {
  runDir: string;
  eventType: string;
  event: JsonRecord;
}

export async function appendEvent(opts: AppendEventOptions): Promise<AppendEventResult> {
  return withAppendQueue(opts.runDir, async () => {
    const journalDir = getJournalDir(opts.runDir);
    await fs.mkdir(journalDir, { recursive: true });
    const seqs = await getExistingSeqs(journalDir);
    const seq = (seqs.length ? Math.max(...seqs) : 0) + 1;
    const ulid = nextUlid();
    const filename = `${formatSeq(seq)}.${ulid}.json`;
    const recordedAt = new Date().toISOString();

    const eventPayload = {
      type: opts.eventType,
      recordedAt,
      data: opts.event,
    };
    const contents = JSON.stringify(eventPayload, null, 2) + "\n";
    const checksum = crypto.createHash("sha256").update(contents).digest("hex");
    const payloadWithChecksum = JSON.stringify({ ...eventPayload, checksum }, null, 2) + "\n";
    const targetPath = path.join(journalDir, filename);
    await fs.writeFile(targetPath, payloadWithChecksum, "utf8");
    return { seq, ulid, filename, checksum, path: targetPath, recordedAt };
  });
}

// ── Read ─────────────────────────────────────────────────────────────────

function parseJournalFilename(filename: string): { seq: number; ulid: string } {
  const [seqPart, ulidPart] = filename.replace(/\.json$/i, "").split(".");
  const seq = Number(seqPart);
  if (!Number.isFinite(seq) || !ulidPart) {
    throw new Error(`Invalid journal filename: ${filename}`);
  }
  return { seq, ulid: ulidPart };
}

interface ParsedJournalFile {
  type?: string;
  recordedAt?: string;
  sdkVersion?: string;
  data?: JsonRecord;
  checksum?: string;
}

export async function loadJournal(runDir: string): Promise<JournalEvent[]> {
  const journalDir = getJournalDir(runDir);
  try {
    const entries = await fs.readdir(journalDir);
    const sorted = entries.filter((name) => name.endsWith(".json")).sort();
    const events: JournalEvent[] = [];
    for (const file of sorted) {
      const { seq, ulid } = parseJournalFilename(file);
      const fullPath = path.join(journalDir, file);
      const contents = await fs.readFile(fullPath, "utf8");
      let raw: ParsedJournalFile;
      try {
        raw = JSON.parse(contents) as ParsedJournalFile;
      } catch (error) {
        const parseError = new Error(
          `Failed to parse journal file ${fullPath}: ${(error as Error).message}`,
        );
        (parseError as NodeJS.ErrnoException).code = "JOURNAL_PARSE_FAILED";
        throw parseError;
      }
      events.push({
        seq,
        ulid,
        filename: file,
        path: fullPath,
        type: raw.type ?? "UNKNOWN",
        recordedAt: typeof raw.recordedAt === "string" ? raw.recordedAt : new Date().toISOString(),
        sdkVersion: typeof raw.sdkVersion === "string" ? raw.sdkVersion : undefined,
        data: raw.data ?? {},
        checksum: typeof raw.checksum === "string" ? raw.checksum : undefined,
      });
    }
    return events;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw error;
  }
}
