"use server";

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { monotonicFactory } from "ulid";
import { findRunDir } from "@/lib/path-resolver";
import { getVersionInfo } from "@/lib/version-info";

export interface ApproveBreakpointResult {
  success: boolean;
  error?: string;
}

const nextUlid = monotonicFactory();

/**
 * Determine the next journal sequence number by scanning existing files.
 */
async function getNextJournalSeq(journalDir: string): Promise<number> {
  try {
    const files = await fs.readdir(journalDir);
    let max = 0;
    for (const f of files) {
      const seqStr = f.split(".")[0];
      const seq = Number(seqStr);
      if (Number.isFinite(seq) && seq > max) max = seq;
    }
    return max + 1;
  } catch {
    // Journal dir may not exist yet — seq 1
    return 1;
  }
}

/**
 * Write an EFFECT_RESOLVED journal entry using the same format as the
 * babysitter SDK: SHA-256 checksum of the JSON payload (without checksum)
 * serialized as `JSON.stringify(payload, null, 2) + "\n"`.
 */
async function appendJournalEntry(
  runDir: string,
  effectId: string,
  now: string,
): Promise<void> {
  const journalDir = path.join(runDir, "journal");
  await fs.mkdir(journalDir, { recursive: true });

  const seq = await getNextJournalSeq(journalDir);
  const ulid = nextUlid();
  const filename = `${seq.toString().padStart(6, "0")}.${ulid}.json`;

  // SDK-native entries carry a top-level `sdkVersion` (after `data`, before
  // `checksum`) with the installed babysitter version. Reuse the detection in
  // version-info (cached `babysitter --version`); omit the field rather than
  // forge a value when detection fails ("N/A"/non-semver).
  const detected = getVersionInfo().babysitter;
  const sdkVersion = /^\d+\.\d+\.\d+/.test(detected) ? detected : undefined;

  const eventPayload = {
    type: "EFFECT_RESOLVED",
    recordedAt: now,
    data: {
      effectId,
      status: "ok",
      resultRef: `tasks/${effectId}/result.json`,
      startedAt: now,
      finishedAt: now,
    },
    // Key order matters only for human diffing, not the checksum — but keep
    // it identical to SDK-written entries: type, recordedAt, data, sdkVersion.
    ...(sdkVersion !== undefined ? { sdkVersion } : {}),
  };

  const contents = JSON.stringify(eventPayload, null, 2) + "\n";
  const checksum = crypto.createHash("sha256").update(contents).digest("hex");
  const payloadWithChecksum = JSON.stringify({ ...eventPayload, checksum }, null, 2) + "\n";

  await fs.writeFile(path.join(journalDir, filename), payloadWithChecksum, "utf-8");
}

/**
 * Server Action: approve a breakpoint by writing both the result.json AND
 * an EFFECT_RESOLVED journal entry. This ensures the SDK's state machine
 * recognizes the resolution on the next `run:iterate` (the SDK auto-rebuilds
 * its state cache when it detects journal head mismatch).
 *
 * Previous implementation only wrote result.json, leaving the journal
 * untouched — the SDK never knew the breakpoint was resolved, causing runs
 * to stay stuck in "Waiting" state permanently.
 */
export async function approveBreakpoint(
  runId: string,
  effectId: string,
  answer: string,
): Promise<ApproveBreakpointResult> {
  // --- Validate inputs ---
  if (!runId || typeof runId !== "string") {
    return { success: false, error: "Missing or invalid runId" };
  }
  if (!effectId || typeof effectId !== "string") {
    return { success: false, error: "Missing or invalid effectId" };
  }
  if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
    return { success: false, error: "Answer cannot be empty" };
  }

  // Sanitize IDs to prevent path traversal
  const idPattern = /^[a-zA-Z0-9_\-]+$/;
  if (!idPattern.test(runId) || !idPattern.test(effectId)) {
    return { success: false, error: "Invalid characters in runId or effectId" };
  }

  try {
    // --- Resolve the run directory ---
    const found = await findRunDir(runId);
    if (!found) {
      return { success: false, error: `Run not found: ${runId}` };
    }
    const runDir = found.runDir;

    // --- Verify the task directory exists ---
    const taskDir = path.join(runDir, "tasks", effectId);
    try {
      await fs.access(taskDir);
    } catch {
      return { success: false, error: `Task directory not found: ${effectId}` };
    }

    // --- Double-answer guard (UX-R3 §14.5 / AC-62) ---
    // If THIS observer already recorded an answer for the effect (result.json
    // carries approvedBy "observer-dashboard") and the run has not consumed it
    // yet, a second submit is an OVERWRITE, not a new decision: rewrite the
    // single result.json but do NOT append a second EFFECT_RESOLVED journal
    // entry. This keeps the write path byte-identical to a first record for a
    // fresh breakpoint (AC-63: exactly one result.json + one EFFECT_RESOLVED)
    // while making a re-answer overwrite rather than stack.
    const resultPath = path.join(taskDir, "result.json");
    let alreadyRecordedByObserver = false;
    try {
      const existingRaw = await fs.readFile(resultPath, "utf-8");
      const existing = JSON.parse(existingRaw) as { value?: { approvedBy?: unknown } };
      alreadyRecordedByObserver = existing?.value?.approvedBy === "observer-dashboard";
    } catch {
      // No prior result.json (or unreadable) — this is a fresh record.
    }

    // --- Write result.json (SDK-compatible format) ---
    const now = new Date().toISOString();
    const resultPayload = {
      status: "ok",
      value: {
        // `approved` is the field the babysitter runtime reads to distinguish an
        // approval from a rejection. Omitting it made the run treat the resolution
        // as a rejection (D1). Explicitly mark the survey/breakpoint as approved.
        approved: true,
        answer: answer.trim(),
        approvedAt: now,
        approvedBy: "observer-dashboard",
      },
      startedAt: now,
      finishedAt: now,
    };
    await fs.writeFile(resultPath, JSON.stringify(resultPayload, null, 2), "utf-8");

    // --- Append EFFECT_RESOLVED journal entry (only on a fresh record) ---
    // This is the critical piece that was missing: without a journal entry,
    // the SDK's state machine never knows the breakpoint was resolved and
    // the run stays stuck in "Waiting" forever. On an overwrite of an answer
    // this observer already recorded, the journal entry exists already — do
    // not append a second one (AC-62: overwrite, not stack).
    if (!alreadyRecordedByObserver) {
      await appendJournalEntry(runDir, effectId, now);
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
