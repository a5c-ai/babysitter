import { memo } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import { TruncatedId } from "@/components/shared/truncated-id";
import type { JournalEvent } from "@/types";

const typeConfig: Record<string, { variant: "success" | "error" | "info" | "warning" | "default"; label: string }> = {
  RUN_CREATED: { variant: "info", label: "Created" },
  EFFECT_REQUESTED: { variant: "default", label: "Requested" },
  EFFECT_RESOLVED: { variant: "success", label: "Resolved" },
  RUN_COMPLETED: { variant: "success", label: "Completed" },
  RUN_FAILED: { variant: "error", label: "Failed" },
};

const kindColors: Record<string, string> = {
  agent: "bg-primary/15 text-primary",
  shell: "bg-secondary/15 text-secondary",
  breakpoint: "bg-warning/15 text-warning",
  node: "bg-info/15 text-info",
  skill: "bg-success/15 text-success",
  sleep: "bg-foreground-muted/15 text-foreground-muted",
};

interface EventItemProps {
  event: JournalEvent;
  onClick?: () => void;
}

export const EventItem = memo(function EventItem({ event, onClick }: EventItemProps) {
  const config = typeConfig[event.type] || typeConfig.EFFECT_REQUESTED;
  const payload = event.payload as Record<string, unknown>;
  const label = (payload.label as string) || "";
  const effectId = (payload.effectId as string) || "";
  const kind = (payload.kind as string) || "";
  const status = (payload.status as string) || "";
  const processId = (payload.processId as string) || "";
  const stepId = (payload.stepId as string) || "";
  const taskId = (payload.taskId as string) || "";

  // Compute duration from startedAt/finishedAt in resolved payloads
  const startedAt = payload.startedAt as string | undefined;
  const finishedAt = payload.finishedAt as string | undefined;
  const resolvedDuration =
    startedAt && finishedAt
      ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
      : undefined;

  return (
    <button
      data-testid={`event-item-${event.seq}`}
      data-event-type={event.type}
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-primary-muted/40 rounded transition-all duration-150"
    >
      {/* Primary line */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs leading-tight text-secondary shrink-0 tabular-nums w-12 text-right">
          {formatRelativeTime(event.ts)}
        </span>
        <Badge variant={config.variant} className="text-xs leading-tight shrink-0">
          {config.label}
        </Badge>

        {event.type === "EFFECT_REQUESTED" && (
          <>
            <span className="text-xs text-foreground truncate font-medium">{label || "Task"}</span>
            {kind && (
              <span className={cn("rounded px-1.5 py-0.5 text-xs leading-tight font-medium shrink-0", kindColors[kind] || "bg-muted text-foreground-muted")}>
                {kind}
              </span>
            )}
          </>
        )}

        {event.type === "EFFECT_RESOLVED" && (
          <>
            {label && <span className="text-xs text-foreground truncate font-medium">{label}</span>}
            {!label && effectId && <TruncatedId id={effectId} chars={4} className="text-foreground-secondary" />}
            <span className={cn(
              "inline-block h-2 w-2 rounded-full shrink-0",
              status === "ok" ? "bg-success shadow-[0_0_4px_var(--success)]" : status === "error" ? "bg-error shadow-[0_0_4px_var(--error)]" : "bg-foreground-muted"
            )} />
            {resolvedDuration != null && resolvedDuration > 0 && (
              <span className="text-xs leading-tight font-mono text-foreground-muted shrink-0">{formatDuration(resolvedDuration)}</span>
            )}
          </>
        )}

        {event.type === "RUN_CREATED" && processId && (
          <span className="text-xs text-foreground-secondary truncate">{processId}</span>
        )}

        {event.type === "RUN_COMPLETED" && (
          <span className="text-xs text-success truncate">Run finished successfully</span>
        )}

        {event.type === "RUN_FAILED" && (
          <span className="text-xs text-error truncate">Run failed</span>
        )}

        {/* Fallback for unknown types */}
        {!["EFFECT_REQUESTED", "EFFECT_RESOLVED", "RUN_CREATED", "RUN_COMPLETED", "RUN_FAILED"].includes(event.type) && (
          label ? (
            <span className="text-xs text-foreground-secondary truncate">{label}</span>
          ) : effectId ? (
            <TruncatedId id={effectId} chars={4} className="text-foreground-secondary" />
          ) : null
        )}
      </div>

      {/* Secondary metadata line */}
      {(stepId || taskId) && (
        <div className="flex items-center gap-2 mt-0.5 ml-14 text-xs leading-tight text-foreground-muted">
          {stepId && <span className="font-mono truncate">step: {stepId}</span>}
          {taskId && <span className="font-mono truncate">task: {taskId}</span>}
        </div>
      )}
    </button>
  );
});
