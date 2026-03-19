'use client';
import { useSmartPolling } from './use-smart-polling';
import { Run } from '@/types';

interface ProjectRunsResponse {
  runs: Run[];
  totalCount: number;
  project: string;
}

interface UseProjectRunsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  sort?: 'status' | 'activity';
  enabled?: boolean;
}

export function useProjectRuns(
  projectName: string,
  options: UseProjectRunsOptions = {}
) {
  const { limit = 10, offset = 0, search = '', status = '', sort = 'status', enabled = true } = options;
  const params = new URLSearchParams();
  params.set('project', projectName);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (sort && sort !== 'status') params.set('sort', sort);

  const url = `/api/runs?${params.toString()}`;

  const { data, loading, error, refresh } = useSmartPolling<ProjectRunsResponse>(
    url,
    {
      interval: 5000,
      sseFilter: () => true, // Any run update could affect this project
      enabled
    }
  );

  return {
    runs: enabled && data ? data.runs : [],
    totalCount: enabled && data ? data.totalCount : 0,
    loading,
    error,
    refresh
  };
}
