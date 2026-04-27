import { CheckCircle2, XCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { Run } from "@/types";

interface OutcomeBannerProps {
  run: Run;
}

export function OutcomeBanner({ run }: OutcomeBannerProps) {
  if (run.status === "completed") {
    return (
      <div data-testid="outcome-banner" data-status="completed" className="bg-success-muted border-b-2 border-success/30 px-5 py-4 shadow-glow-success">
        <div className="flex items-center gap-3 text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0 drop-shadow-[var(--drop-glow-success)]" />
          <span className="text-base font-medium">
            Completed in {formatDuration(run.duration)}
          </span>
        </div>
      </div>
    );
  }

  if (run.status === "failed") {
    const failedTask = run.tasks.find((t) => t.status === "error");

    // Determine step name: prefer task-level label, then run-level failedStep, then "process error" for run-level failures
    const stepName = failedTask?.label || run.failedStep || (run.failureMessage ? "process error" : "unknown step");

    // Determine error message: prefer task-level error, then run-level failure message from RUN_FAILED event
    const rawErrorMessage = failedTask?.error?.message || run.failureMessage || "An error occurred";

    // Format the error message — if it looks like JSON, try to extract the most relevant part
    let errorMessage = rawErrorMessage;
    if (rawErrorMessage.startsWith("{") || rawErrorMessage.startsWith("[")) {
      try {
        const parsed = JSON.parse(rawErrorMessage);
        errorMessage = parsed.message || parsed.error || parsed.reason || rawErrorMessage;
      } catch {
        // Not valid JSON, use as-is
      }
    }

    return (
      <div data-testid="outcome-banner" data-status="failed" className="bg-error-muted border-b-2 border-error/30 px-5 py-4 shadow-glow-error">
        <div className="flex items-center gap-3 text-error">
          <XCircle className="h-5 w-5 shrink-0 drop-shadow-[var(--drop-glow-error)]" />
          <span className="text-base font-medium">
            Failed at step: {stepName} &mdash; {errorMessage}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
