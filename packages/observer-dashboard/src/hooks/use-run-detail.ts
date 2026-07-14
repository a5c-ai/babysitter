"use client";
import { useMemo, useRef } from "react";
import { useSmartPolling } from "./use-smart-polling";
import type { RunDetailResponse, TaskDetailResponse, RunStatus } from "@/types";

// Poll intervals by run status:
// - Active/waiting runs change frequently, poll every 3s
// - Completed/failed runs are static, poll every 30s (just in case of late events)
const POLL_ACTIVE = 3000;
const POLL_COMPLETED = 30000;

function getIntervalForStatus(status: RunStatus | undefined): number {
  if (!status) return POLL_ACTIVE;
  return status === "completed" || status === "failed"
    ? POLL_COMPLETED
    : POLL_ACTIVE;
}

export function useRunDetail(runId: string, intervalOverride?: number) {
  // Track last known run status to adapt poll interval.
  // useRef avoids triggering re-render; the interval change takes effect
  // on the next useSmartPolling dependency cycle.
  const lastStatusRef = useRef<RunStatus | undefined>(undefined);

  const adaptiveInterval = intervalOverride ?? getIntervalForStatus(lastStatusRef.current);

  const { data, loading, error, refresh } = useSmartPolling<RunDetailResponse>(
    `/api/runs/${runId}?maxEvents=50`,
    {
      interval: adaptiveInterval,
      sseFilter: (event) =>
        event.runId === runId || (event.runIds?.includes(runId) ?? false)
    }
  );

  const run = data?.run || null;

  // Update status ref so next render picks up the adaptive interval.
  // When status transitions (e.g. "waiting" -> "completed"), the interval
  // changes from 3s to 30s, and useSmartPolling restarts its timer.
  if (run && run.status !== lastStatusRef.current) {
    lastStatusRef.current = run.status;
  }

  // Detect if any breakpoint tasks are waiting for approval
  const hasBreakpointWaiting = useMemo(() => {
    if (!run) return false;
    return run.tasks.some(
      (t) => t.kind === "breakpoint" && t.status === "requested"
    );
  }, [run]);

  return {
    run,
    loading,
    error,
    refresh,
    hasBreakpointWaiting,
  };
}

export function useTaskDetail(runId: string, effectId: string | null) {
  const { data, loading, error } = useSmartPolling<TaskDetailResponse>(
    effectId ? `/api/runs/${runId}/tasks/${effectId}` : "",
    {
      enabled: !!effectId,
      interval: 5000,
      sseFilter: (event) =>
        event.runId === runId || (event.runIds?.includes(runId) ?? false),
    }
  );
  return {
    task: data?.task || null,
    loading,
    error,
  };
}
