import { formatDuration, formatTimestamp } from "@/lib/utils";
import type { TaskDetail, TaskEffect } from "@/types";

// Step colors for the timeline bar — neon gradient cycle
const STEP_COLORS = [
  "bg-primary",       // magenta
  "bg-secondary",     // neon cyan
  "bg-success",       // neon green
  "bg-warning",       // sun yellow
  "bg-error",         // hot red
  "bg-primary/60",    // magenta light
  "bg-secondary/60",  // cyan light
  "bg-success/60",    // green light
];

function getStepColor(index: number): string {
  return STEP_COLORS[index % STEP_COLORS.length];
}

/**
 * Compute effective wall-clock duration for a task.
 * When task.duration is 0 (e.g. startedAt === finishedAt from task:post),
 * fall back to requestedAt -> resolvedAt wall-clock time.
 * For still-running tasks (no resolvedAt), use Date.now().
 */
function getEffectiveDuration(t: TaskEffect): number {
  if (t.duration && t.duration > 0) return t.duration;
  const start = t.requestedAt ? new Date(t.requestedAt).getTime() : 0;
  if (!start) return 0;
  const end = t.resolvedAt
    ? new Date(t.resolvedAt).getTime()
    : (t.status === "requested" ? Date.now() : start);
  return Math.max(end - start, 0);
}

/**
 * Compute the overall run duration from the earliest requestedAt
 * to the latest resolvedAt across all tasks.
 * Falls back to Date.now() for any task still in "requested" state.
 */
function computeTimelineDuration(tasks: TaskEffect[]): number {
  if (tasks.length === 0) return 0;
  let earliest = Infinity;
  let latest = -Infinity;
  for (const t of tasks) {
    const reqTime = new Date(t.requestedAt).getTime();
    if (reqTime < earliest) earliest = reqTime;
    const endTime = t.resolvedAt
      ? new Date(t.resolvedAt).getTime()
      : (t.status === "requested" ? Date.now() : reqTime);
    if (endTime > latest) latest = endTime;
  }
  return Math.max(latest - earliest, 0);
}

interface TimingPanelProps {
  task: TaskDetail | null;
  runDuration?: number;
  /** All tasks in the run — needed for the cascading timeline */
  allTasks?: TaskEffect[];
}

export function TimingPanel({ task, runDuration, allTasks }: TimingPanelProps) {
  if (!task) return <div className="p-4 text-sm text-foreground-muted">Select a task to view timing</div>;

  const effectiveDuration = getEffectiveDuration(task as TaskEffect);

  const rows = [
    { label: "Requested", value: formatTimestamp(task.requestedAt) },
    { label: "Resolved", value: formatTimestamp(task.resolvedAt) },
    { label: "Duration", value: formatDuration(effectiveDuration) },
  ];

  // Show startedAt/finishedAt only if they differ from requestedAt/resolvedAt
  const hasExecTiming = task.startedAt && task.finishedAt &&
    (task.startedAt !== task.requestedAt || task.finishedAt !== task.resolvedAt);

  if (hasExecTiming) {
    rows.push(
      { label: "Exec Started", value: formatTimestamp(task.startedAt) },
      { label: "Exec Finished", value: formatTimestamp(task.finishedAt) },
    );
  }

  // Build cascading timeline segments from all tasks
  const sortedTasks = allTasks
    ? [...allTasks].sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime())
    : [];

  // Compute timeline duration from earliest requestedAt to latest resolvedAt
  // instead of relying solely on the passed-in runDuration prop
  const timelineDuration = sortedTasks.length > 0
    ? computeTimelineDuration(sortedTasks)
    : (runDuration || 0);
  const effectiveRunDuration = timelineDuration > 0 ? timelineDuration : (runDuration || 0);

  // Compute the earliest requestedAt timestamp for offset calculations
  const earliestTime = sortedTasks.length > 0
    ? new Date(sortedTasks[0].requestedAt).getTime()
    : 0;

  // Calculate each task's position and width relative to total timeline
  const segments = sortedTasks.map((t, i) => {
    const dur = getEffectiveDuration(t);
    if (!effectiveRunDuration || effectiveRunDuration <= 0) {
      return { taskId: t.effectId, start: 0, width: 0, color: getStepColor(i), title: t.title, duration: dur };
    }
    // Position based on wall-clock offset from earliest task
    const taskStart = new Date(t.requestedAt).getTime();
    const startPct = Math.min(((taskStart - earliestTime) / effectiveRunDuration) * 100, 100);
    const widthPct = Math.min((dur / effectiveRunDuration) * 100, 100 - startPct);
    return {
      taskId: t.effectId,
      start: startPct,
      width: widthPct,
      color: getStepColor(i),
      title: t.title,
      duration: dur,
    };
  });

  // Compute idle gap segments between consecutive tasks
  const idleSegments: { start: number; width: number; duration: number }[] = [];
  if (segments.length > 1) {
    for (let i = 0; i < segments.length - 1; i++) {
      const currentEnd = segments[i].start + segments[i].width;
      const nextStart = segments[i + 1].start;
      const gapWidth = nextStart - currentEnd;
      if (gapWidth > 0.5) { // Only show gaps > 0.5% of timeline
        const gapDuration = (gapWidth / 100) * effectiveRunDuration;
        idleSegments.push({ start: currentEnd, width: gapWidth, duration: gapDuration });
      }
    }
  }
  const totalIdleDuration = idleSegments.reduce((sum, g) => sum + g.duration, 0);

  // Current task's segment
  const currentIdx = sortedTasks.findIndex((t) => t.effectId === task.effectId);
  const currentSegment = currentIdx >= 0 ? segments[currentIdx] : null;

  return (
    <div className="p-4">
      <div className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="text-xs text-foreground-muted">{label}</span>
              <span className="font-mono text-sm text-foreground">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cascading timeline bar showing all steps */}
      {effectiveRunDuration > 0 && segments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-foreground-muted">Run Timeline</span>
            <span className="font-mono text-foreground">{formatDuration(effectiveRunDuration)}</span>
          </div>

          {/* Full timeline bar with neon gradient fill */}
          <div className="w-full h-4 bg-muted/30 rounded-full overflow-hidden relative">
            {segments.map((seg) => (
              <div
                key={seg.taskId}
                className={`absolute top-0 h-full ${seg.color} transition-all duration-300 ${
                  seg.taskId === task.effectId ? "opacity-100 ring-1 ring-primary/50 z-10" : "opacity-60"
                }`}
                style={{
                  left: `${seg.start}%`,
                  width: `${Math.max(seg.width, 0.5)}%`,
                }}
                title={`${seg.title}: ${formatDuration(seg.duration)} (${seg.width.toFixed(1)}%)`}
              />
            ))}
            {idleSegments.map((gap, i) => (
              <div
                key={`idle-${i}`}
                className="absolute top-0 h-full bg-idle-stripes opacity-40"
                style={{
                  left: `${gap.start}%`,
                  width: `${Math.max(gap.width, 0.5)}%`,
                }}
                title={`Idle: ${formatDuration(gap.duration)} (${gap.width.toFixed(1)}%)`}
              />
            ))}
          </div>

          {/* Current step info — neon percentage label when significant */}
          {currentSegment && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-sm ${currentSegment.color}`} />
                <span className="text-foreground-secondary">
                  Step {currentIdx + 1}/{sortedTasks.length}
                </span>
              </div>
              <span className={`font-mono ${currentSegment.width >= 25 ? "text-primary neon-text-subtle" : "text-foreground"}`}>
                {currentSegment.width.toFixed(1)}% of total
              </span>
            </div>
          )}

          {/* Step legend (compact) */}
          {segments.length > 1 && (
            <div className="mt-3 space-y-1">
              {segments.map((seg, i) => (
                <div
                  key={seg.taskId}
                  className={`flex items-center gap-2 text-xs leading-tight ${
                    seg.taskId === task.effectId ? "text-foreground" : "text-foreground-muted"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-sm shrink-0 ${seg.color}`} />
                  <span className="truncate flex-1">{i + 1}. {seg.title}</span>
                  <span className={`font-mono shrink-0 ${seg.width >= 25 ? "text-warning" : ""}`}>{formatDuration(seg.duration)}</span>
                </div>
              ))}
              {totalIdleDuration > 0 && (
                <div className="flex items-center gap-2 text-xs leading-tight text-foreground-muted">
                  <div className="w-2 h-2 rounded-sm shrink-0 bg-idle-stripes border border-border" />
                  <span className="truncate flex-1">Idle / Wait</span>
                  <span className="font-mono shrink-0">{formatDuration(totalIdleDuration)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
