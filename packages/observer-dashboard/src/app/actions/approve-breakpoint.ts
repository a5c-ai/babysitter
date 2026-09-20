"use server";

// Deep subpath import (the SDK publishes no "exports" map, so dist paths are
// the supported deep-import surface): pulls only the commit-path module graph,
// not the SDK root export whose graph reaches the dist harness modules and
// optional adapter packages. The server webpack build additionally
// externalizes every @a5c-ai/babysitter-sdk specifier (see next.config.mjs),
// so this stays a runtime require against the installed package.
import { commitEffectResult } from "@a5c-ai/babysitter-sdk/dist/runtime/commitEffectResult";
import path from "node:path";
import { findRunDir } from "@/lib/path-resolver";
import { parseJournalDir, readTaskDefinition } from "@/lib/parser";

export interface ApproveBreakpointResult {
  success: boolean;
  error?: string;
  /**
   * UX-R3 §14.5 (AC-62): true when the SDK refused the commit because the
   * effect is already resolved. The first recorded answer stands — nothing was
   * written by this call, so the UI must not present it as a change.
   */
  alreadyResolved?: boolean;
}

/**
 * Server Action: record a breakpoint answer for a run.
 *
 * This action remains the ONE sanctioned run-write in the observer dashboard
 * (everything else is strictly read-only), but it no longer hand-writes
 * tasks/<effectId>/result.json or journal entries itself. It delegates to the
 * babysitter SDK's supported commit path, `commitEffectResult`, which:
 *
 * - serializes the run mutation under the SDK's run lock (no journal-sequence
 *   races between near-simultaneous submits),
 * - applies the SDK's own enforcement (unknown/already-resolved effects and
 *   the runtime task.completed hook policy) BEFORE any result/journal
 *   emission. NOTE: the SDK does NOT enforce breakpoint-kind — that guard
 *   lives HERE (fail closed, see below), and breakpoint-kind-only
 *   enforcement is this action's own responsibility,
 * - writes the result and the EFFECT_RESOLVED journal event in the SDK's
 *   canonical format and rebuilds the state cache, so the run resumes on the
 *   next `run:iterate` without this action forging SDK internals.
 *
 * Double-answer semantics (UX-R3 §14.5 / AC-62): the SDK refuses a second
 * commit for an already-resolved effect, which guarantees there is never a
 * duplicate EFFECT_RESOLVED entry. We surface that refusal as the existing
 * "already recorded" success flow (the first answer stands) rather than an
 * error. Any other SDK rejection (enforcement, unknown effect, policy) is
 * returned as { success: false, error } so the UI reports it honestly —
 * never a silent success.
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

    // --- Breakpoint-only guard (review rounds 3+4, blocker) ---
    // This action is the observer's breakpoint answer path ONLY — a
    // shell/agent/node effect must never be completable from the dashboard.
    // The guard FAILS CLOSED (round 4 blocker): the SDK's commitEffectResult
    // validates that the effect exists and is unresolved but does NOT enforce
    // breakpoint-kind, so falling through on missing metadata would let a
    // pending non-breakpoint effect be resolved as an approval. Two
    // independent checks must BOTH pass before the commit call:
    //
    // 1. tasks/<effectId>/task.json (the same file the dashboard parser
    //    reads) must exist, be readable, and declare kind === "breakpoint".
    //    Missing/unreadable/malformed metadata is a rejection, never a
    //    fall-through.
    const taskDef = await readTaskDefinition(runDir, effectId);
    if (taskDef === null) {
      return {
        success: false,
        error:
          "task definition missing or unreadable — refusing to resolve (breakpoint answers only)",
      };
    }
    if (taskDef.kind !== "breakpoint") {
      return { success: false, error: "not a breakpoint effect" };
    }

    // 2. The authoritative journal-derived effect record — the same
    //    EFFECT_REQUESTED record commitEffectResult will resolve — must be a
    //    breakpoint: kind === "breakpoint" (with taskId === "__sdk.breakpoint"
    //    accepted as corroboration when the record carries no kind). A task
    //    file that disagrees with the journal never passes the guard.
    const journalEvents = await parseJournalDir(path.join(runDir, "journal"));
    const requestedRecord = journalEvents.find(
      (e) =>
        e.type === "EFFECT_REQUESTED" &&
        (e.payload as Record<string, unknown>).effectId === effectId,
    );
    if (!requestedRecord) {
      return {
        success: false,
        error: `no EFFECT_REQUESTED journal record for effect ${effectId} — refusing to resolve`,
      };
    }
    const recordPayload = requestedRecord.payload as Record<string, unknown>;
    const recordKind = recordPayload.kind;
    const recordTaskId = recordPayload.taskId;
    const journalSaysBreakpoint =
      recordKind === "breakpoint" ||
      (recordKind == null && recordTaskId === "__sdk.breakpoint");
    if (!journalSaysBreakpoint) {
      return {
        success: false,
        error: "not a breakpoint effect (journal EFFECT_REQUESTED record)",
      };
    }

    const now = new Date().toISOString();
    const trimmed = answer.trim();

    try {
      await commitEffectResult({
        runDir,
        effectId,
        result: {
          status: "ok",
          value: {
            // `approved` is the field the babysitter runtime reads to
            // distinguish an approval from a rejection (D1).
            approved: true,
            // Canonical SDK BreakpointResult fields: process code reads
            // result.response (and some flows read result.feedback).
            response: trimmed,
            feedback: trimmed,
            // UI alias kept for existing observer surfaces that render the
            // recorded answer.
            answer: trimmed,
            approvedAt: now,
            approvedBy: "observer-dashboard",
          },
          startedAt: now,
          finishedAt: now,
        },
      });
    } catch (commitErr: unknown) {
      const msg = commitErr instanceof Error ? commitErr.message : String(commitErr);
      // AC-62: the SDK rejects a second commit for an already-resolved effect.
      // That is the double-answer flow, not a failure — but nothing was
      // written either: the first recorded answer stands. Flag it so the UI
      // can say so honestly instead of implying a change was recorded.
      if (/already resolved/i.test(msg)) {
        return { success: true, alreadyResolved: true };
      }
      // Every other SDK rejection (unknown effect, enforcement/policy,
      // signed/protected breakpoint) is surfaced honestly to the UI.
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
