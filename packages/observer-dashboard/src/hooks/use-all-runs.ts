"use client";
import { useMemo } from "react";
import { useSmartPolling } from "./use-smart-polling";
import type { LightRun, RunsListResponse } from "@/lib/services/run-query-service";

/**
 * §15.4 counting substrate: fetch the FULL-RUN list the KPI tiles, banner and
 * filter pills reconcile against. The digest pipeline (per-project summaries)
 * lacks `recordedAwaitingResume` and mixes three hidden scopes, so it cannot
 * agree with the board columns (§15.1). This hook gives the dashboard the same
 * full runs the board sees, so every surface derives from ONE classifier.
 *
 * Same endpoint + params as the board's own fetch (all-runs, limit 500) so the
 * two pipelines observe identical data; same SSE refetch filter. Read-only GET.
 */
const ALL_RUNS_FETCH_LIMIT = 500;

export function useAllRuns(suppressSseRefetch = false) {
  const params = new URLSearchParams({
    status: "",
    sort: "status",
    limit: String(ALL_RUNS_FETCH_LIMIT),
    offset: "0",
    search: "",
  });
  const url = `/api/runs?${params.toString()}`;

  const { data, loading, error } = useSmartPolling<RunsListResponse>(url, {
    sseFilter: (event) => event.type === "update" || event.type === "new-run",
    suppressSseRefetch,
  });

  const runs = useMemo<LightRun[]>(() => data?.runs ?? [], [data]);
  const totalCount = data?.totalCount ?? runs.length;

  return { runs, totalCount, loading, error };
}
