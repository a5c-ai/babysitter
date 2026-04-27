"use client";
import { useState, useEffect, memo } from "react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/shared/status-badge";
import { KindBadge } from "@/components/shared/kind-badge";
import { formatDuration } from "@/lib/utils";
import { TruncatedId } from "@/components/shared/truncated-id";
import type { TaskEffect } from "@/types";
import { ChevronDown, Clock, Hand } from "lucide-react";

interface StepCardProps {
  task: TaskEffect;
  runId: string;
  onSelect: (effectId: string) => void;
  isSelected: boolean;
  defaultExpanded?: boolean;
  /** 1-based step number for display */
  stepNumber?: number;
}

export const StepCard = memo(function StepCard({ task, runId: _runId, onSelect, isSelected, defaultExpanded = false, stepNumber }: StepCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isRunning = task.status === "requested";
  const isBreakpointWaiting = task.kind === "breakpoint" && task.status === "requested";
  const borderColor = isBreakpointWaiting ? "border-l-warning shadow-step-inset-warning" :
                      task.status === "resolved" ? "border-l-success" :
                      task.status === "error" ? "border-l-error" :
                      isRunning ? "border-l-info shadow-step-inset-cyan" : "border-l-pending/30";

  // Live elapsed time counter for running tasks
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    if (!isRunning || !task.requestedAt) {
      return;
    }

    // Calculate initial elapsed time
    const calculateElapsed = () => {
      const requestedTime = new Date(task.requestedAt).getTime();
      const now = Date.now();
      return now - requestedTime;
    };

    // Set initial value
    setElapsedMs(calculateElapsed());

    // Update every second
    const interval = setInterval(() => {
      setElapsedMs(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, task.requestedAt]);

  return (
    <div
      data-testid={`step-card-${task.effectId}`}
      data-status={task.status}
      data-selected={String(isSelected)}
      className={cn(
        "w-full text-left rounded-lg border border-card-border bg-card transition-all duration-150",
        "hover:bg-[var(--card-hover)] border-l-[3px]",
        borderColor,
        isSelected && "border-l-primary bg-primary-muted shadow-step-selected",
        isBreakpointWaiting && "animate-breakpoint-glow"
      )}
    >
      <button
        onClick={() => onSelect(task.effectId)}
        className="w-full text-left p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isBreakpointWaiting ? (
              <Hand className="h-3.5 w-3.5 text-warning animate-pulse-dot shrink-0 drop-shadow-[var(--drop-glow-warning)]" />
            ) : isRunning ? (
              <div className="h-2 w-2 rounded-full bg-info animate-pulse-dot shrink-0 shadow-step-running-dot" />
            ) : null}
            {stepNumber && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-background-tertiary text-xs font-mono text-foreground-muted flex items-center justify-center">
                {stepNumber}
              </span>
            )}
            <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <KindBadge kind={task.kind} />
            <StatusBadge status={task.status} />
          </div>
        </div>
        {isBreakpointWaiting ? (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-warning">
            <Hand className="h-3 w-3 shrink-0 drop-shadow-[var(--drop-glow-warning-sm)]" />
            <span className="font-medium">Your approval is needed</span>
            <span className="font-mono text-warning animate-pulse">{formatDuration(elapsedMs)}</span>
          </div>
        ) : (task.duration || isRunning) ? (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-foreground-muted">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">
              {isRunning ? (
                <span className="animate-pulse font-mono text-info/80">running {formatDuration(elapsedMs)}...</span>
              ) : (
                <span className="font-mono">{formatDuration(task.duration)}</span>
              )}
            </span>
          </div>
        ) : null}
      </button>

      {/* Expand/collapse toggle */}
      <div className="flex items-center border-t border-card-border">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="flex items-center justify-center px-3 py-2 text-foreground-muted hover:text-primary hover:bg-primary-muted rounded-b-lg transition-colors w-full"
          aria-label={expanded ? "Collapse details" : "Expand details"}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", !expanded && "-rotate-90")} />
        </button>
      </div>

      {/* Expanded detail */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 text-xs text-foreground-muted space-y-1.5 border-t border-card-border">
            <div className="flex items-center gap-2 pt-2">
              <span className="text-foreground-secondary font-medium">Step:</span>
              <TruncatedId id={task.stepId} chars={4} />
            </div>
            {task.duration != null && (
              <div className="flex items-center gap-2">
                <span className="text-foreground-secondary font-medium">
                  {task.kind === "breakpoint" ? "Approval time:" : "Duration:"}
                </span>
                <span>{formatDuration(task.duration)}</span>
              </div>
            )}
            {task.requestedAt && (
              <div className="flex items-center gap-2">
                <span className="text-foreground-secondary font-medium">Requested:</span>
                <span>{new Date(task.requestedAt).toLocaleTimeString()}</span>
              </div>
            )}
            {task.resolvedAt && (
              <div className="flex items-center gap-2">
                <span className="text-foreground-secondary font-medium">Resolved:</span>
                <span>{new Date(task.resolvedAt).toLocaleTimeString()}</span>
              </div>
            )}
            {task.error && (
              <div className="mt-2 rounded bg-error-muted p-2 text-error">
                <span className="font-medium">{task.error.name}:</span> {task.error.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
