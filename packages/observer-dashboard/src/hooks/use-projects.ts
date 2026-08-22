'use client';
import { useSmartPolling } from './use-smart-polling';
import { ProjectSummary } from '@/types';

interface ProjectsResponse {
  projects: ProjectSummary[];
  recentCompletionWindowMs?: number;
}

export function useProjects(interval: number = 5000, suppressSseRefetch: boolean = false) {
  const { data, loading, error, refresh } = useSmartPolling<ProjectsResponse>(
    '/api/runs?mode=projects',
    {
      interval,
      sseFilter: (event) => event.type === 'update' || event.type === 'new-run',
      suppressSseRefetch,
    }
  );
  return {
    projects: data?.projects || [],
    recentCompletionWindowMs: data?.recentCompletionWindowMs ?? 14400000,
    loading,
    error,
    refresh
  };
}
