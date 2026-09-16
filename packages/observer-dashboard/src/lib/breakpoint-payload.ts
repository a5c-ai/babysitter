/**
 * Breakpoint payload resolution — UX-R2 §13.1 (question-shape fix).
 *
 * v6 `ctx.breakpoint` writes the breakpoint's question/title/options/context
 * into `tasks/<effectId>/task.json → metadata.payload.*` (evidence run
 * demo-client-project/01KWE8RYQEHJ7BATR3V88AQVSD: payload keys
 * [context, expert, question, tags, title], multi-line question, NO
 * input.json). SDK 6.0.2 writes them under `task.json → .breakpoint.*` instead
 * (evidence run 01KWRJGED9BEE39SSPMH0M4JE3/01KWS6QP63XWADWW6N7HBGQ3GH:
 * breakpoint keys [breakpointId, expert, options, question, tags], metadata
 * null, NO input.json). Older shapes carry the fields in `input.json` or
 * directly under `taskDef.inputs`. This module is the ONE shared resolver used
 * by all three parser extraction sites (task list, task detail, digest
 * batch-read).
 *
 * Precedence per field:
 *   input.json > taskDef.inputs > taskDef.breakpoint > metadata.payload.
 * The first source that carries a field wins; fields resolve INDEPENDENTLY
 * (a title from the payload may accompany a question from inputs).
 *
 * Pure module (no fs) so client components may import the fallback copy.
 */

import type {
  BreakpointPayload,
  BreakpointQuestionSource,
} from "@/types/breakpoint";

/**
 * Honest last-resort question when NO source carries a question (AC-32).
 * Exact copy per SPEC §13.1 — never a bare "Approval required" that implies
 * a generic approval.
 */
export const BREAKPOINT_NO_QUESTION_FALLBACK =
  "Approval required: this breakpoint has no question text on disk.";

/**
 * UX-R2 §13.4 read-only clarity — exact copy (these strings are spec, not
 * suggestions). The contract line is always visible at the top of every
 * breakpoint answer panel (board card AND run-detail): recording an answer is
 * the observer's ONLY write path, and the panel says so out loud (AC-43).
 */
export const BREAKPOINT_READONLY_CONTRACT =
  "The observer is read-only, except this single action: recording your breakpoint answer.";

/**
 * §13.4 orphaned semantics line (replaces the old "an answer won't be applied
 * until the run is resumed" hint): with no live driver attached, the answer is
 * recorded on disk NOW and takes effect only when the run is resumed (AC-44).
 */
export const BREAKPOINT_ORPHANED_SEMANTICS =
  "Recorded to disk. Nothing runs until you resume:";

/**
 * §13.4 post-submit confirmation shown after answering an orphaned run's
 * breakpoint — honest about the deferred effect of the write (AC-45).
 */
export const BREAKPOINT_ORPHANED_RECORDED_CONFIRMATION =
  "Answer recorded. It will be applied when the run is resumed.";

/**
 * UX-R3 §14.5 (AC-59) — the amber-gray (--status-stalled) chip shown on a
 * no-live-driver run after the answer is recorded but not yet applied. NOT
 * green (--status-ok = done); the run is not done until it is resumed.
 */
export const BREAKPOINT_RECORDED_AWAITING_RESUME_CHIP =
  "Answer recorded, awaiting resume";

/**
 * UX-R3 §14.5 (AC-59) — body copy under the recorded chip on the board's
 * answered-but-unapplied card. Honest about the deferred effect: nothing was
 * published; the publish step runs when the orchestrator resumes.
 */
export const BREAKPOINT_RECORDED_AWAITING_RESUME_BODY =
  "Written to the run; the publish step runs when the orchestrator resumes. Nothing was published yet.";

/**
 * Review round 3 (first-answer-stands): the SDK commit path refuses a second
 * answer for a resolved effect, so the UI never offers an overwrite. Shown
 * next to a recorded answer instead of any re-answer affordance.
 */
export const BREAKPOINT_FIRST_ANSWER_STANDS =
  "The first recorded answer stands. Breakpoint answers cannot be overwritten.";

/**
 * Review round 3 (first-answer-stands): post-submit copy when the SDK
 * reports the effect was already resolved (someone else answered first, or a
 * double submit). No change was recorded — never a success toast implying one.
 */
export const BREAKPOINT_ALREADY_ANSWERED =
  "Already answered, first answer stands. This submit recorded nothing.";

/** Parser-resolved payload: questionSource is always present (AC-32 flag). */
export interface ResolvedBreakpointPayload extends BreakpointPayload {
  questionSource: BreakpointQuestionSource;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Resolve a breakpoint's question/title/options/context from the four
 * on-disk sources, in precedence order (UX-R2 §13.1).
 *
 * @param taskDef parsed `tasks/<effectId>/task.json` (or null when missing)
 * @param input   parsed `tasks/<effectId>/input.json` (or undefined when missing)
 */
export function resolveBreakpointPayload(
  taskDef: Record<string, unknown> | null | undefined,
  input?: Record<string, unknown> | null
): ResolvedBreakpointPayload {
  const metadata = asRecord(taskDef?.metadata);
  const sources: Array<{
    source: BreakpointQuestionSource;
    fields: Record<string, unknown> | undefined;
  }> = [
    { source: "input", fields: asRecord(input) },
    { source: "taskDefInputs", fields: asRecord(taskDef?.inputs) },
    // SDK 6.0.2 ctx.breakpoint writes question/options under task.json →
    // .breakpoint. It ranks ABOVE metadata.payload: the .breakpoint block is
    // the task definition's own first-party record of the breakpoint (written
    // by the SDK that raised it), while metadata.payload is orchestrator-
    // attached annotation that may lag or mirror it. It ranks BELOW
    // input.json/taskDef.inputs, which remain the explicit per-invocation
    // inputs and therefore the most specific sources.
    { source: "taskDefBreakpoint", fields: asRecord(taskDef?.breakpoint) },
    { source: "metadataPayload", fields: asRecord(metadata?.payload) },
  ];

  let question: string | undefined;
  let questionSource: BreakpointQuestionSource = "fallback";
  let title: string | undefined;
  let options: string[] | undefined;
  let context: BreakpointPayload["context"];

  for (const { source, fields } of sources) {
    if (!fields) continue;
    if (question === undefined && isNonEmptyString(fields.question)) {
      question = fields.question;
      questionSource = source;
    }
    if (title === undefined && isNonEmptyString(fields.title)) {
      title = fields.title;
    }
    if (options === undefined && Array.isArray(fields.options)) {
      options = fields.options as string[];
    }
    if (context === undefined && fields.context !== undefined) {
      context = fields.context as BreakpointPayload["context"];
    }
  }

  return {
    question: question ?? BREAKPOINT_NO_QUESTION_FALLBACK,
    questionSource,
    // Same title chain as before the fix, extended with the payload source:
    // resolved title, else the task definition's own title, else "Breakpoint".
    title:
      title ??
      (isNonEmptyString(taskDef?.title) ? (taskDef!.title as string) : "Breakpoint"),
    options,
    context,
  };
}
