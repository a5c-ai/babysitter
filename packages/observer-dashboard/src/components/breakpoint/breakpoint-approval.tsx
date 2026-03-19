"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { approveBreakpoint } from "@/app/actions/approve-breakpoint";
import type { TaskDetail } from "@/types";

interface BreakpointApprovalProps {
  task: TaskDetail;
  runId: string;
}

export function BreakpointApproval({ task, runId }: BreakpointApprovalProps) {
  const [customAnswer, setCustomAnswer] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const options = task.breakpoint?.options || [];
  const isWaiting = task.status === "requested";

  // Don't render for non-waiting breakpoints
  if (!isWaiting) return null;

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

  return (
    <div data-testid="breakpoint-approval" className="space-y-4">
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
                Approving...
              </>
            ) : (
              "Approve"
            )}
          </Button>
        </div>
      </form>

      {/* Result feedback */}
      {result && (
        <div
          data-testid="approval-result"
          className={cn(
            "rounded-lg border p-3 flex items-center gap-2 text-sm",
            result.success
              ? "border-success/30 bg-success-muted text-success"
              : "border-error/30 bg-error-muted text-error"
          )}
        >
          {result.success ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Breakpoint approved successfully. The dashboard will update automatically.</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{result.error || "An unknown error occurred"}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
