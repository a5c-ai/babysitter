"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Hand, CheckCircle2 } from "lucide-react";
import { useTaskDetail } from "@/hooks/use-run-detail";
import { BreakpointApproval } from "@/components/breakpoint/breakpoint-approval";
import { RunIterateCommand } from "@/components/breakpoint/run-iterate-command";
import {
  BREAKPOINT_NO_QUESTION_FALLBACK,
  BREAKPOINT_ORPHANED_SEMANTICS,
  BREAKPOINT_READONLY_CONTRACT,
  BREAKPOINT_RECORDED_AWAITING_RESUME_CHIP,
  BREAKPOINT_RECORDED_AWAITING_RESUME_BODY,
} from "@/lib/breakpoint-payload";
import { ActionHint } from "@/components/dashboard/run-list";
import type { BoardRun } from "@/components/kanban/column-model";

/**
 * Needs-you card expansion — SPEC-vibekanban §5 (F2 lesson: never a blind
 * Approve). Renders the FULL breakpoint question (not truncated), one chip per
 * BreakpointPayload option, the driver-aware informing hint (reused ActionHint:
 * "No live driver — resume to answer" vs "Answer in terminal" + copy-run-id),
 * and an expandable Answer section that mounts the EXISTING BreakpointApproval
 * component unchanged — approveBreakpoint stays the ONLY write path.
 *
 * The option payload comes from the existing task-detail endpoint via
 * useTaskDetail (GET only; the board invents no approval affordance the
 * run-detail page doesn't already have).
 */

/**
 * Design-QA (major): the shared ActionHint cluster is `shrink-0 flex` sized
 * for the wide flat-list rows — at the 280px board column it overflowed the
 * card by ~120px. This container-scoped override lets the cluster shrink and
 * wrap INSIDE the card without touching the shared component (run-list.tsx
 * list-view rendering is unchanged). Also imported by kanban-card.tsx for the
 * Orphaned-column hint.
 */
export const ACTION_HINT_FIT_CLASS =
  "flex min-w-0 max-w-full " +
  "[&_[data-testid=run-action-hint]]:min-w-0 " +
  "[&_[data-testid=run-action-hint]]:max-w-full " +
  "[&_[data-testid=run-action-hint]]:shrink " +
  "[&_[data-testid=run-action-hint]]:flex-wrap";

export interface KanbanBreakpointPanelProps {
  run: BoardRun;
}

export function KanbanBreakpointPanel({ run }: KanbanBreakpointPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // The pending breakpoint this card is waiting on — derived from the DIGEST
  // (perf slimming: the list payload no longer carries tasks[]). The digest
  // already exposes pendingBreakpoints (count) + breakpointEffectId (the first
  // pending breakpoint's effectId, regardless of question), which is exactly
  // what this panel needs (same gating as use-run-detail's hasBreakpointWaiting).
  const hasPending = (run.pendingBreakpoints ?? 0) > 0;

  // UX-R3 §14.5 (AC-59): answered-but-unapplied mode — the observer recorded an
  // answer (disk-derived on the run) but the run is not yet resumed, so there
  // is no longer a pending breakpoint. The card stays in Needs-you and shows the
  // amber-gray recorded state (never green, never gone).
  const recordedMode = !hasPending && run.recordedAwaitingResume === true;

  // Full BreakpointPayload (question/options + recorded result) from the
  // existing task-detail endpoint. Enabled for the pending breakpoint OR, in
  // recorded mode, the recorded breakpoint effect.
  const activeEffectId = hasPending
    ? run.breakpointEffectId ?? null
    : recordedMode
      ? run.recordedBreakpointEffectId ?? null
      : null;
  const { task } = useTaskDetail(run.runId, activeEffectId);

  if (!hasPending && !recordedMode) {
    // Legacy run shapes (pendingBreakpoints heuristics) without a pending
    // breakpoint, and no observer-recorded answer awaiting resume: nothing
    // actionable to show on-card.
    return null;
  }

  // -------------------------------------------------------------------------
  // UX-R3 §14.5 (AC-59/AC-60/AC-62) — answered-but-unapplied recorded state.
  // The card stays in Needs-you but flips to the amber-gray recorded chip
  // (NOT green): the answer is on disk, applied to nothing until a resume.
  // -------------------------------------------------------------------------
  if (recordedMode) {
    const recordedQuestion =
      run.breakpointQuestion ||
      task?.breakpoint?.question ||
      BREAKPOINT_NO_QUESTION_FALLBACK;
    const recordedValue = task?.result?.value as
      | { answer?: unknown }
      | undefined;
    const recordedAnswer =
      typeof recordedValue?.answer === "string" ? recordedValue.answer : "";

    return (
      <div
        data-testid="kanban-bp-panel"
        data-recorded="true"
        className="relative z-10 mt-1 flex flex-col gap-2 rounded-md border border-status-stalled/30 bg-status-stalled-muted p-2"
      >
        {/* Amber-gray recorded chip — never green: the run is not done until a
            resume applies the answer (AC-59). */}
        <div className="flex items-center gap-1.5" data-status-badge>
          <CheckCircle2
            className="h-3.5 w-3.5 text-status-stalled"
            aria-hidden="true"
            focusable="false"
          />
          <span
            data-testid="kanban-bp-recorded-chip"
            className="text-[10px] font-bold text-status-stalled uppercase tracking-wider"
          >
            {BREAKPOINT_RECORDED_AWAITING_RESUME_CHIP}
          </span>
        </div>

        {/* Honest body copy — nothing was published yet. */}
        <p
          data-testid="kanban-bp-recorded-body"
          className="text-[11px] leading-snug text-foreground-muted"
        >
          {BREAKPOINT_RECORDED_AWAITING_RESUME_BODY}
        </p>

        {/* The question that was answered (context). */}
        <p className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap break-words">
          {recordedQuestion}
        </p>

        {/* The recorded answer (AC-62: shown before any overwrite). */}
        {recordedAnswer && (
          <p
            data-testid="kanban-bp-recorded-answer"
            className="text-[11px] leading-snug text-foreground-muted"
          >
            Recorded answer:{" "}
            <span className="font-semibold text-foreground break-words">
              {recordedAnswer}
            </span>
          </p>
        )}

        {/* Copyable, inert resume command (AC-60) — the observer never runs it. */}
        <RunIterateCommand runId={run.runId} />

        {/* Overwrite control (AC-62): re-answering overwrites the single
            result.json (no second answer/journal entry), never stacks. */}
        <button
          type="button"
          data-testid="kanban-bp-overwrite-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 self-start rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" aria-hidden="true" focusable="false" />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden="true" focusable="false" />
          )}
          Overwrite answer
        </button>
        {expanded &&
          (task ? (
            <div className="[&_form>div]:flex-col [&_form>div]:items-stretch [&_[data-testid=custom-answer-input]]:min-w-0">
              <BreakpointApproval
                task={task}
                runId={run.runId}
                orphaned
                recordedAnswer={recordedAnswer}
              />
            </div>
          ) : (
            <p className="text-xs text-foreground-muted italic">
              Loading breakpoint details…
            </p>
          ))}
      </div>
    );
  }

  // Full question, never truncated (AC-14): prefer the run-level question the
  // parser extracted, then the task effect's, then the fetched payload's.
  // Honest last resort (UX-R2 §13.1 AC-32/AC-34): when no question exists in
  // any on-disk source, say so — never a bare "Approval required".
  const question =
    run.breakpointQuestion ||
    task?.breakpoint?.question ||
    BREAKPOINT_NO_QUESTION_FALLBACK;
  // UX-R3 §14.3 (AC-55): options are no longer rendered as informative chips
  // here (de-dup) — they surface exactly once as the neutral answer buttons
  // inside BreakpointApproval below, so the panel reads them off `task` there.
  // Breakpoint title (UX-R2 §13.1 / AC-33): the resolved payload title (e.g.
  // metadata.payload.title "Gate 1 — …") renders as the panel heading when it
  // carries real information (the parser's generic "Breakpoint" default and
  // the SDK's literal "breakpoint" task title add nothing over the label).
  const rawTitle = task?.breakpoint?.title;
  const title =
    rawTitle && rawTitle.toLowerCase() !== "breakpoint" ? rawTitle : undefined;

  // §13.4: no live driver attached (same predicate as run-list isOrphaned) —
  // the honest orphaned-semantics hint renders BEFORE any interaction and the
  // post-submit confirmation switches to the "recorded now" copy (AC-44/45).
  const orphaned = run.driver === "orphaned" || run.driver === "none";

  return (
    // relative z-10 lifts the whole decision surface above the card's
    // stretched overlay link so chips/toggle/approval are interactive
    // (RunRow a11y-nested-interactive-copy-btn pattern).
    <div
      data-testid="kanban-bp-panel"
      className="relative z-10 mt-1 flex flex-col gap-2 rounded-md border border-warning/30 bg-warning-muted p-2"
    >
      {/* "NEEDS YOU" label + full question (§5: the human decision on-card).
          UX-R2 §13.3/AC-46: the alarm label uses the theme-aware
          --status-attention token (gold; darkened ≥4.5:1 ink in light mode). */}
      <div className="flex items-center gap-1.5" data-status-badge>
        <Hand
          className="h-3.5 w-3.5 text-status-attention animate-pulse-dot"
          aria-hidden="true"
          focusable="false"
        />
        <span
          data-testid="kanban-bp-needsyou-label"
          className="text-[10px] font-bold text-status-attention uppercase tracking-wider"
        >
          Needs you
        </span>
      </div>
      {/* §13.4/AC-43: the read-only contract line — always visible at the top
          of the answer panel, above any input. Exact copy from the SPEC. */}
      <p
        data-testid="bp-readonly-contract"
        className="text-[11px] leading-snug text-foreground-muted"
      >
        {BREAKPOINT_READONLY_CONTRACT}
      </p>
      {/* Breakpoint heading from the resolved payload title (UX-R2 §13.1
          AC-33: e.g. metadata.payload.title "Gate 1 — …"). */}
      {title && (
        <p
          data-testid="kanban-bp-title"
          className="text-xs font-semibold text-foreground break-words"
        >
          {title}
        </p>
      )}
      <p className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap break-words">
        {question}
      </p>

      {/* UX-R3 §14.3 / AC-55 (owner gate 2026-07-06, option a): the informative
          gold option chips are REMOVED (de-dup). The options render exactly
          ONCE — as the neutral buttons inside the expandable answer panel below
          (BreakpointApproval). The card above shows title + question +
          semantics only, never a second copy of the options. */}

      {/* §13.4/AC-44: on an orphaned/no-driver run the honest semantics line
          is visible BEFORE any interaction — recorded now, applied on resume.
          Live-driver runs keep today's behavior (no extra hint). */}
      {orphaned && (
        <p
          data-testid="bp-orphaned-semantics"
          className="text-[11px] leading-snug font-medium text-status-stalled"
        >
          {BREAKPOINT_ORPHANED_SEMANTICS}
        </p>
      )}

      {/* Driver-aware informing hint, identical to the banner/flat-list
          pattern: orphaned/none => "No live driver — resume to answer" +
          copy-run-id; live => "Answer in terminal". */}
      <div className={ACTION_HINT_FIT_CLASS}>
        <ActionHint run={run} />
      </div>

      {/* Expandable Answer section mounting the existing BreakpointApproval
          (the ONLY write path) — never a blind approve. */}
      <button
        type="button"
        data-testid="kanban-bp-answer-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1 self-start rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" aria-hidden="true" focusable="false" />
        ) : (
          <ChevronDown className="h-3 w-3" aria-hidden="true" focusable="false" />
        )}
        Answer
      </button>
      {expanded &&
        (task ? (
          // Design-QA (blocker): at the 280px column the shared approval's
          // input+Approve row cannot fit — the submit button clipped at the
          // card edge. Container-scoped override stacks the button below the
          // input on the board only; BreakpointApproval itself (and its
          // run-detail row layout) is unchanged — still the ONLY write path.
          <div className="[&_form>div]:flex-col [&_form>div]:items-stretch [&_[data-testid=custom-answer-input]]:min-w-0">
            <BreakpointApproval task={task} runId={run.runId} orphaned={orphaned} />
          </div>
        ) : (
          <p className="text-xs text-foreground-muted italic">
            Loading breakpoint details…
          </p>
        ))}
    </div>
  );
}
