import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { AppendEventOptions, AppendEventResult, JournalEvent, JsonRecord } from "./types";
import { getJournalDir } from "./paths";
import { writeFileAtomic } from "./atomic";
import { nextUlid } from "./ulids";
import { getClockIsoString } from "./clock";

function formatSeq(seq: number) {
  return seq.toString().padStart(6, "0");
}

async function getExistingSeqs(journalDir: string) {
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

export async function appendEvent(opts: AppendEventOptions): Promise<AppendEventResult> {
  const journalDir = getJournalDir(opts.runDir);
  await fs.mkdir(journalDir, { recursive: true });
  const seqs = await getExistingSeqs(journalDir);
  const seq = (seqs.length ? Math.max(...seqs) : 0) + 1;
  const ulid = nextUlid();
  const filename = `${formatSeq(seq)}.${ulid}.json`;
  const recordedAt = getClockIsoString();
  const eventPayload: JsonRecord = {
    type: opts.eventType,
    recordedAt,
    data: opts.event,
  };
  const contents = JSON.stringify(eventPayload, null, 2) + "\n";
  const checksum = crypto.createHash("sha256").update(contents).digest("hex");
  const payloadWithChecksum = JSON.stringify({ ...eventPayload, checksum }, null, 2) + "\n";
  const targetPath = path.join(journalDir, filename);
  await writeFileAtomic(targetPath, payloadWithChecksum);
  return { seq, ulid, filename, checksum, path: targetPath, recordedAt };
}

function parseJournalFilename(filename: string) {
  const [seqPart, ulidPart] = filename.replace(/\.json$/i, "").split(".");
  const seq = Number(seqPart);
  if (!Number.isFinite(seq) || !ulidPart) {
    throw new Error(`Invalid journal filename: ${filename}`);
  }
  return { seq, ulid: ulidPart };
}

export async function loadJournal(runDir: string): Promise<JournalEvent[]> {
  const journalDir = getJournalDir(runDir);
  try {
    const entries = await fs.readdir(journalDir);
    const sorted = entries
      .filter((name) => name.endsWith(".json"))
      .sort();
    const events: JournalEvent[] = [];
    for (const file of sorted) {
      const { seq, ulid } = parseJournalFilename(file);
      const fullPath = path.join(journalDir, file);
      const raw = await parseJournalFile(fullPath);
      events.push({
        seq,
        ulid,
        filename: file,
        path: fullPath,
        type: raw.type ?? "UNKNOWN",
        recordedAt: typeof raw.recordedAt === "string" ? raw.recordedAt : getClockIsoString(),
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

interface ParsedJournalFile {
  type?: string;
  recordedAt?: string;
  data?: JsonRecord;
  checksum?: string;
}

async function parseJournalFile(fullPath: string): Promise<ParsedJournalFile> {
  const contents = await fs.readFile(fullPath, "utf8");
  try {
    return JSON.parse(contents) as ParsedJournalFile;
  } catch (error) {
    const parseError = new Error(`Failed to parse journal file ${fullPath}: ${(error as Error).message}`);
    (parseError as NodeJS.ErrnoException).code = "JOURNAL_PARSE_FAILED";
    (parseError as NodeJS.ErrnoException).path = fullPath;
    throw parseError;
  }
}
