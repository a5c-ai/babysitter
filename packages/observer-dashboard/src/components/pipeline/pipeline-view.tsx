"use client";
import { useMemo, useState, memo } from "react";
import { StepCard } from "./step-card";
import { ParallelGroup } from "./parallel-group";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { SessionPill } from "@/components/shared/session-pill";
import { TruncatedId } from "@/components/shared/truncated-id";
import { formatDuration, friendlyProcessName } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Run, TaskEffect } from "@/types";
import { ChevronRight, Clock, Layers, ChevronDown } from "lucide-react";
import Link from "next/link";

/** Threshold in ms -- tasks requested within this window are considered parallel */
const PARALLEL_THRESHOLD_MS = 100;

/**
 * A pipeline entry is either a single task or a group of tasks
 * that were requested in parallel.
 */
type PipelineEntry =
  | { type: "single"; task: TaskEffect }
  | { type: "parallel"; tasks: TaskEffect[] };

/**
 * Detect parallel task groups.
 *
 * Two tasks are considered parallel when they share the same stepId prefix
 * (the portion before the first `.`) OR their requestedAt timestamps are
 * within PARALLEL_THRESHOLD_MS of each other.
 *
 * The algorithm walks the task list (sorted by requestedAt) and greedily
 * merges adjacent tasks that satisfy either condition into a group.
 */
function groupParallelTasks(tasks: TaskEffect[]): PipelineEntry[] {
  if (tasks.length === 0) return [];

  const sorted = [...tasks].sort(
    (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
  );

  const entries: PipelineEntry[] = [];
  let currentGroup: TaskEffect[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = sorted[i];

    const prevTime = new Date(prev.requestedAt).getTime();
    const currTime = new Date(curr.requestedAt).getTime();
    const timeDelta = Math.abs(currTime - prevTime);

    const prevStepPrefix = prev.stepId.split(".")[0];
    const currStepPrefix = curr.stepId.split(".")[0];
    const sameStepPrefix = prevStepPrefix === currStepPrefix;

    if (sameStepPrefix || timeDelta <= PARALLEL_THRESHOLD_MS) {
      currentGroup.push(curr);
    } else {
      // Flush the accumulated group
      if (currentGroup.length === 1) {
        entries.push({ type: "single", task: currentGroup[0] });
      } else {
        entries.push({ type: "parallel", tasks: currentGroup });
      }
      currentGroup = [curr];
    }
  }

  // Flush remaining group
  if (currentGroup.length === 1) {
    entries.push({ type: "single", task: currentGroup[0] });
  } else {
    entries.push({ type: "parallel", tasks: currentGroup });
  }

  return entries;
}

interface PipelineViewProps {
  run: Run;
  selectedEffectId: string | null;
  onSelectEffect: (effectId: string) => void;
  runStatus?: string;
}

const INITIAL_TASK_LIMIT = 20;

export const PipelineView = memo(function PipelineView({ run, selectedEffectId, onSelectEffect, runStatus }: PipelineViewProps) {
  const effectiveStatus = runStatus ?? run.status;
  const isReviewMode = effectiveStatus === "completed" || effectiveStatus === "failed";
  const isRunning = effectiveStatus === "requested" || effectiveStatus === "waiting";
  const progress = run.totalTasks > 0 ? Math.round((run.completedTasks / run.totalTasks) * 100) : 0;
  const [showAllTasks, setShowAllTasks] = useState(false);

  const pipelineEntries = useMemo(() => groupParallelTasks(run.tasks), [run.tasks]);
  const hasMore = pipelineEntries.length > INITIAL_TASK_LIMIT;
  const visibleEntries = showAllTasks || !hasMore ? pipelineEntries : pipelineEntries.slice(0, INITIAL_TASK_LIMIT);

  return (
    <div data-testid="pipeline-view" className="flex flex-col h-full">
      {/* Header with breadcrumb — sticky so it's always visible */}
      <div className="shrink-0 sticky top-0 z-20 border-b border-border p-4 pb-3 bg-card/95 backdrop-blur-sm">
        {/* Breadcrumb navigation — prominent for easy back-navigation */}
        <nav data-testid="pipeline-breadcrumb" className="flex items-center gap-1.5 mb-2 text-sm">
          <Link href="/" className="text-foreground-muted hover:text-primary transition-colors font-semibold">
            Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-foreground-muted/50" />
          <span className="text-foreground-secondary font-semibold">
            {run.projectName || friendlyProcessName(run.processId)}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-foreground-muted/50" />
          <TruncatedId id={run.runId} chars={4} className="text-foreground font-medium" />
          <StatusBadge status={run.status} className="ml-1" />
        </nav>
        <div className="flex items-center gap-4 text-xs text-foreground-muted mb-3">
          <SessionPill sessionId={run.sessionId} active={run.status === "waiting"} />
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {run.completedTasks}/{run.totalTasks} tasks
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(run.duration)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={progress} glow={isRunning} />
          </div>
          <span className="text-xs leading-tight text-foreground-muted tabular-nums shrink-0">{progress}%</span>
        </div>
      </div>

      {/* Step list */}
      <ScrollArea className="flex-1 relative">
        {/* Subtle top gradient for depth — brand magenta/cyan */}
        <div className="sticky top-0 z-10 h-3 bg-gradient-to-b from-primary/[0.06] via-secondary/[0.03] to-transparent pointer-events-none" />
        <div className="flex flex-col gap-2 px-4 pb-4">
          {(() => {
            let stepCounter = 0;
            return visibleEntries.map((entry) => {
              if (entry.type === "single") {
                stepCounter++;
                return (
                  <StepCard
                    key={entry.task.effectId}
                    task={entry.task}
                    runId={run.runId}
                    onSelect={onSelectEffect}
                    isSelected={selectedEffectId === entry.task.effectId}
                    defaultExpanded={isReviewMode}
                    stepNumber={stepCounter}
                  />
                );
              }

              // Parallel group — all share the same step number
              stepCounter++;
              const groupKey = entry.tasks.map((t) => t.effectId).join("|");
              return (
                <ParallelGroup key={groupKey} count={entry.tasks.length}>
                  {entry.tasks.map((task) => (
                    <StepCard
                      key={task.effectId}
                      task={task}
                      runId={run.runId}
                      onSelect={onSelectEffect}
                      isSelected={selectedEffectId === task.effectId}
                      defaultExpanded={isReviewMode}
                      stepNumber={stepCounter}
                    />
                  ))}
                </ParallelGroup>
              );
            });
          })()}
          {hasMore && !showAllTasks && (
            <button
              data-testid="show-all-tasks-btn"
              onClick={() => setShowAllTasks(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-md border border-border bg-background-secondary/50 py-2 text-xs text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show all {pipelineEntries.length} tasks
            </button>
          )}
          {run.tasks.length === 0 && (
            <div className="text-sm text-foreground-muted text-center py-8">No tasks yet</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
