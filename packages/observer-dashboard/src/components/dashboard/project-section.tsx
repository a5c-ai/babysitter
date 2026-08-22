"use client";
import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { RunCard } from "./run-card";
import { VirtualizedRunList } from "./virtualized-run-list";
import { PaginationControls } from "./pagination-controls";
import { ProjectSearchInput } from "./project-search-input";
import { useProjectRuns } from "@/hooks/use-project-runs";
import type { Run } from "@/types";

interface ProjectSectionProps {
  projectName: string;
  runs: Run[];
  selectedIndex?: number;
  defaultExpanded?: boolean;
  statusFilter?: string;
  enabled?: boolean;
}

const PAGE_SIZE = 10;

export function ProjectSection({
  projectName,
  runs: _initialRuns,
  selectedIndex,
  defaultExpanded: _defaultExpanded = false,
  statusFilter,
  enabled = true,
}: ProjectSectionProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { runs: fetchedRuns, totalCount, loading } = useProjectRuns(
    projectName,
    {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search,
      status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
      enabled,
    }
  );

  // Use fetched runs
  const displayRuns = fetchedRuns;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div>
      <ProjectSearchInput
        onSearch={handleSearch}
        placeholder="Search by run ID, process, task, or error..."
        className="mb-3"
      />
      {loading && displayRuns.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : displayRuns.length === 0 ? (
        <div className="text-xs text-foreground-muted text-center py-4">
          No runs found
        </div>
      ) : (
        <VirtualizedRunList
          runs={displayRuns}
          maxHeight={600}
          renderItem={(run, i) => (
            <RunCard run={run} selected={i === selectedIndex} />
          )}
        />
      )}
      <PaginationControls
        currentPage={page}
        totalItems={totalCount}
        itemsPerPage={PAGE_SIZE}
        onPageChange={handlePageChange}
        className="mt-3"
      />
    </div>
  );
}
