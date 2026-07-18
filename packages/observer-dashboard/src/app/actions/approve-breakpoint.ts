"use server";

// Deep subpath import (the SDK publishes no "exports" map, so dist paths are
// the supported deep-import surface): pulls only the commit-path module graph,
// not the SDK root export whose graph reaches the dist harness modules and
// optional adapter packages. The server webpack build additionally
// externalizes every @a5c-ai/babysitter-sdk specifier (see next.config.mjs),
// so this stays a runtime require against the installed package.
import { commitEffectResult } from "@a5c-ai/babysitter-sdk/dist/runtime/commitEffectResult";
import { findRunDir } from "@/lib/path-resolver";
import { readTaskDefinition } from "@/lib/parser";

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
 * - applies the SDK's own enforcement (unknown/already-resolved effects,
 *   runtime task.completed hook policy, and any current or future
 *   signed/protected-breakpoint checks) BEFORE any result/journal emission,
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

    // --- Breakpoint-only guard (review round 3, blocker) ---
    // This action is the observer's breakpoint answer path ONLY. Read the
    // effect's own task definition (the same tasks/<effectId>/task.json the
    // dashboard parser reads) and refuse to resolve any non-breakpoint effect
    // through it — a shell/agent/node effect must never be completable from
    // the dashboard. A missing task.json falls through to the SDK commit
    // path, which rejects unknown effects with its own honest message.
    const taskDef = await readTaskDefinition(runDir, effectId);
    if (taskDef && taskDef.kind !== "breakpoint") {
      return { success: false, error: "not a breakpoint effect" };
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
