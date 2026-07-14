"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { approveBreakpoint } from "@/app/actions/approve-breakpoint";
import {
  BREAKPOINT_ORPHANED_RECORDED_CONFIRMATION,
  BREAKPOINT_RECORDED_AWAITING_RESUME_CHIP,
} from "@/lib/breakpoint-payload";
import { RunIterateCommand } from "@/components/breakpoint/run-iterate-command";
import type { TaskDetail } from "@/types";

interface BreakpointApprovalProps {
  task: TaskDetail;
  runId: string;
  /**
   * UX-R2 §13.4 (AC-45): the run has no live driver (driver "orphaned" or
   * "none"). The write path is IDENTICAL either way — only the post-submit
   * confirmation copy + chip color change (UX-R3 §14.5 AC-59/AC-61), to be
   * honest that the recorded answer takes effect only when the run is resumed.
   */
  orphaned?: boolean;
  /**
   * UX-R3 §14.5 (AC-62): when this observer already recorded an answer for the
   * effect (present on disk, run not yet resumed), the panel enters OVERWRITE
   * mode — it renders even though the task reads "resolved", shows the existing
   * answer, and the submit relabels to "Overwrite answer". Submitting rewrites
   * the single result.json (the action guards against a second journal entry).
   */
  recordedAnswer?: string;
}

export function BreakpointApproval({
  task,
  runId,
  orphaned = false,
  recordedAnswer,
}: BreakpointApprovalProps) {
  const [customAnswer, setCustomAnswer] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const options = task.breakpoint?.options || [];
  const isWaiting = task.status === "requested";
  const overwriteMode = recordedAnswer !== undefined;

  // Render for a waiting breakpoint OR when re-answering an already-recorded
  // one (overwrite mode). A genuinely resolved breakpoint with no observer
  // record renders nothing (unchanged behavior).
  if (!isWaiting && !overwriteMode) return null;

  function handleApprove(answer: string) {
    if (!answer.trim()) return;

    setResult(null);
    startTransition(async () => {
      const res = await approveBreakpoint(runId, task.effectId, answer);
      setResult(res);
    });
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleApprove(customAnswer);
  }

  // Submit copy — UX-R3 §14.5 AC-58: never "Approve"/"Approving"; the observer
  // RECORDS a decision, it does not perform one. Overwrite mode relabels.
  const submitIdleLabel = overwriteMode ? "Overwrite answer" : "Record answer";
  const submitPendingLabel = overwriteMode ? "Overwriting..." : "Recording...";

  return (
    <div data-testid="breakpoint-approval" className="space-y-4">
      {/* UX-R3 §14.5 / AC-62: the answer already on disk, shown before any
          re-answer so the operator overwrites knowingly (never a silent
          second answer). */}
      {overwriteMode && (
        <p
          data-testid="bp-recorded-answer"
          className="text-xs leading-snug text-foreground-muted"
        >
          Recorded answer:{" "}
          <span className="font-semibold text-foreground break-words">
            {recordedAnswer}
          </span>
        </p>
      )}

      {/* UX-R3 §14.5 / AC-60: on a no-live-driver run the resume command is
          stated here as copyable, INERT text — the observer never runs it. */}
      {orphaned && <RunIterateCommand runId={runId} />}

      {/* Option buttons */}
      {options.length > 0 && (
        <div data-testid="breakpoint-options" className="space-y-2">
          <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
            Choose an option
          </label>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <Button
                key={option}
                variant="neon"
                size="sm"
                disabled={isPending}
                onClick={() => handleApprove(option)}
                data-testid={`option-btn-${option}`}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Free-text input */}
      <form onSubmit={handleCustomSubmit} className="space-y-2">
        <label
          htmlFor="custom-answer"
          className="text-xs font-medium text-foreground-muted uppercase tracking-wider"
        >
          {options.length > 0 ? "Or provide a custom answer" : "Provide an answer"}
        </label>
        <div className="flex gap-2">
          <input
            id="custom-answer"
            data-testid="custom-answer-input"
            type="text"
            value={customAnswer}
            onChange={(e) => setCustomAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={isPending}
            className={cn(
              "flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm",
              "placeholder:text-foreground-muted/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isPending || !customAnswer.trim()}
            data-testid="approve-btn"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {submitPendingLabel}
              </>
            ) : (
              submitIdleLabel
            )}
          </Button>
        </div>
      </form>

      {/* Result feedback */}
      {result &&
        (result.success ? (
          orphaned ? (
            // UX-R3 §14.5 / AC-59 + AC-61: a no-driver run is NOT done — the
            // answer is recorded on disk but applied to nothing until a resume.
            // Amber-gray (--status-stalled), never green (--status-ok=done),
            // and the copy never implies a publish/approval happened.
            <div
              data-testid="approval-result"
              className="rounded-lg border border-status-stalled/30 bg-status-stalled-muted p-3 flex flex-col gap-1 text-sm text-status-stalled"
            >
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" focusable="false" />
                {BREAKPOINT_RECORDED_AWAITING_RESUME_CHIP}
              </span>
              <span className="text-xs leading-snug">
                {BREAKPOINT_ORPHANED_RECORDED_CONFIRMATION}
              </span>
            </div>
          ) : (
            // Live-driver run: today's behavior — the run will advance and the
            // card moves normally, so the green "done" confirmation is honest.
            <div
              data-testid="approval-result"
              className="rounded-lg border border-success/30 bg-success-muted p-3 flex items-center gap-2 text-sm text-success"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Breakpoint approved successfully. The dashboard will update automatically.</span>
            </div>
          )
        ) : (
          <div
            data-testid="approval-result"
            className="rounded-lg border border-error/30 bg-error-muted p-3 flex items-center gap-2 text-sm text-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{result.error || "An unknown error occurred"}</span>
          </div>
        ))}
    </div>
  );
}
