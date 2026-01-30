/**
 * Data fetching hooks for the Process Library Catalog
 *
 * These hooks provide React Query-like patterns for data fetching
 * without adding external dependencies.
 */

import * as React from 'react';
import type {
  AgentListItem,
  AgentDetail,
  SkillListItem,
  SkillDetail,
  ProcessListItem,
  ProcessDetail,
  DomainListItem,
  DomainDetail,
  SpecializationListItem,
  SpecializationDetail,
  SearchResultItem,
  AnalyticsResponse,
  PaginationMeta,
  ApiResponse,
} from '@/lib/api/types';

// =============================================================================
// TYPES
// =============================================================================

export interface UseQueryOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

export interface UsePaginatedQueryResult<T> extends UseQueryResult<T[]> {
  pagination: PaginationMeta | undefined;
  hasMore: boolean;
  loadMore: () => void;
}

export interface CatalogQueryParams {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  domain?: string;
  specialization?: string;
  category?: string;
  expertise?: string;
}

// =============================================================================
// BASE HOOKS
// =============================================================================

/**
 * Base hook for fetching data from an API endpoint
 */
export function useQuery<T>(
  endpoint: string,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const { enabled = true, refetchInterval, initialData, onSuccess, onError } = options;

  const [data, setData] = React.useState<T | undefined>(initialData);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(enabled);

  // Memoize callbacks to prevent infinite loops
  const onSuccessRef = React.useRef(onSuccess);
  const onErrorRef = React.useRef(onError);
  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: ApiResponse<T> = await response.json();

      if (!json.success && json.error) {
        throw new Error(json.error.message);
      }

      setData(json.data);
      onSuccessRef.current?.(json.data as T);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      onErrorRef.current?.(errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, enabled]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch interval
  React.useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== undefined && error === null,
    refetch: fetchData,
  };
}

/**
 * Hook for paginated API endpoints
 */
export function usePaginatedQuery<T>(
  baseEndpoint: string,
  params: CatalogQueryParams = {},
  options: UseQueryOptions<T[]> = {}
): UsePaginatedQueryResult<T> {
  const [pagination, setPagination] = React.useState<PaginationMeta | undefined>();
  const [allData, setAllData] = React.useState<T[]>([]);

  // Memoize params to prevent infinite loops from object recreation
  const memoizedParams = React.useMemo(
    () => ({
      limit: params.limit,
      offset: params.offset,
      sort: params.sort,
      order: params.order,
      domain: params.domain,
      specialization: params.specialization,
      category: params.category,
      expertise: params.expertise,
    }),
    [
      params.limit,
      params.offset,
      params.sort,
      params.order,
      params.domain,
      params.specialization,
      params.category,
      params.expertise,
    ]
  );

  const buildEndpoint = React.useCallback(() => {
    const searchParams = new URLSearchParams();

    if (memoizedParams.limit) searchParams.set('limit', memoizedParams.limit.toString());
    if (memoizedParams.offset) searchParams.set('offset', memoizedParams.offset.toString());
    if (memoizedParams.sort) searchParams.set('sort', memoizedParams.sort);
    if (memoizedParams.order) searchParams.set('order', memoizedParams.order);
    if (memoizedParams.domain) searchParams.set('domain', memoizedParams.domain);
    if (memoizedParams.specialization) searchParams.set('specialization', memoizedParams.specialization);
    if (memoizedParams.category) searchParams.set('category', memoizedParams.category);
    if (memoizedParams.expertise) searchParams.set('expertise', memoizedParams.expertise);

    const queryString = searchParams.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }, [baseEndpoint, memoizedParams]);

  const queryResult = useQuery<T[]>(buildEndpoint(), {
    ...options,
    onSuccess: (data) => {
      setAllData(data);
      options.onSuccess?.(data);
    },
  });

  // Extract pagination from response (need to re-fetch to get meta)
  React.useEffect(() => {
    const fetchPagination = async () => {
      try {
        const response = await fetch(buildEndpoint());
        const json = await response.json();
        if (json.meta) {
          setPagination(json.meta);
        }
      } catch {
        // Pagination extraction failed silently
      }
    };
    fetchPagination();
  }, [buildEndpoint]);

  const loadMore = React.useCallback(() => {
    if (!pagination?.hasMore) return;
    // This would need state management for cumulative loading
    // For now, just refetch with updated offset
  }, [pagination]);

  return {
    ...queryResult,
    data: allData.length > 0 ? allData : queryResult.data,
    pagination,
    hasMore: pagination?.hasMore ?? false,
    loadMore,
  };
}

// =============================================================================
// CATALOG DATA HOOKS
// =============================================================================

/**
 * Hook for fetching agents list
 */
export function useAgents(params: CatalogQueryParams = {}) {
  return usePaginatedQuery<AgentListItem>('/api/agents', params);
}

/**
 * Hook for fetching a single agent by slug/name
 */
export function useAgent(slug: string, options: UseQueryOptions<AgentDetail> = {}) {
  return useQuery<AgentDetail>(`/api/agents/${encodeURIComponent(slug)}`, {
    enabled: Boolean(slug),
    ...options,
  });
}

/**
 * Hook for fetching skills list
 */
export function useSkills(params: CatalogQueryParams = {}) {
  return usePaginatedQuery<SkillListItem>('/api/skills', params);
}

/**
 * Hook for fetching a single skill by slug/name
 */
export function useSkill(slug: string, options: UseQueryOptions<SkillDetail> = {}) {
  return useQuery<SkillDetail>(`/api/skills/${encodeURIComponent(slug)}`, {
    enabled: Boolean(slug),
    ...options,
  });
}

/**
 * Hook for fetching processes list
 */
export function useProcesses(params: CatalogQueryParams = {}) {
  return usePaginatedQuery<ProcessListItem>('/api/processes', params);
}

/**
 * Hook for fetching a single process by ID
 */
export function useProcess(id: string | number, options: UseQueryOptions<ProcessDetail> = {}) {
  return useQuery<ProcessDetail>(`/api/processes/${id}`, {
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Hook for fetching domains list
 */
export function useDomains(params: CatalogQueryParams = {}) {
  return usePaginatedQuery<DomainListItem>('/api/domains', params);
}

/**
 * Hook for fetching a single domain by slug
 */
export function useDomain(slug: string, options: UseQueryOptions<DomainDetail> = {}) {
  return useQuery<DomainDetail>(`/api/domains/${encodeURIComponent(slug)}`, {
    enabled: Boolean(slug),
    ...options,
  });
}

/**
 * Hook for fetching specializations list
 */
export function useSpecializations(params: CatalogQueryParams = {}) {
  return usePaginatedQuery<SpecializationListItem>('/api/specializations', params);
}

/**
 * Hook for fetching a single specialization by slug
 */
export function useSpecialization(slug: string, options: UseQueryOptions<SpecializationDetail> = {}) {
  return useQuery<SpecializationDetail>(`/api/specializations/${encodeURIComponent(slug)}`, {
    enabled: Boolean(slug),
    ...options,
  });
}

// =============================================================================
// SEARCH HOOKS
// =============================================================================

export interface SearchParams {
  query: string;
  type?: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
  limit?: number;
}

/**
 * Hook for searching the catalog
 */
export function useSearch(params: SearchParams, options: UseQueryOptions<SearchResultItem[]> = {}) {
  // Memoize params to prevent infinite loops from object recreation
  const memoizedParams = React.useMemo(
    () => ({
      query: params.query,
      type: params.type,
      limit: params.limit,
    }),
    [params.query, params.type, params.limit]
  );

  const buildEndpoint = React.useCallback(() => {
    const searchParams = new URLSearchParams();

    if (memoizedParams.query) searchParams.set('q', memoizedParams.query);
    if (memoizedParams.type) searchParams.set('type', memoizedParams.type);
    if (memoizedParams.limit) searchParams.set('limit', memoizedParams.limit.toString());

    return `/api/search?${searchParams.toString()}`;
  }, [memoizedParams]);

  return useQuery<SearchResultItem[]>(buildEndpoint(), {
    enabled: Boolean(memoizedParams.query && memoizedParams.query.trim().length > 0),
    ...options,
  });
}

/**
 * Debounced search hook for real-time search experiences
 */
export function useDebouncedSearch(
  params: SearchParams,
  delay: number = 300,
  options: UseQueryOptions<SearchResultItem[]> = {}
) {
  const [debouncedQuery, setDebouncedQuery] = React.useState(params.query);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(params.query);
    }, delay);

    return () => clearTimeout(timer);
  }, [params.query, delay]);

  return useSearch({ ...params, query: debouncedQuery }, options);
}

// =============================================================================
// ANALYTICS HOOKS
// =============================================================================

/**
 * Hook for fetching dashboard analytics
 */
export function useAnalytics(options: UseQueryOptions<AnalyticsResponse> = {}) {
  return useQuery<AnalyticsResponse>('/api/analytics', options);
}

// =============================================================================
// ENTITY DETAIL HOOKS (Unified)
// =============================================================================

type EntityType = 'agent' | 'skill' | 'process' | 'domain' | 'specialization';

/**
 * Generic hook for fetching entity details
 */
export function useEntityDetail<T>(
  type: EntityType,
  identifier: string | number,
  options: UseQueryOptions<T> = {}
) {
  const endpoint = React.useMemo(() => {
    switch (type) {
      case 'agent':
        return `/api/agents/${encodeURIComponent(String(identifier))}`;
      case 'skill':
        return `/api/skills/${encodeURIComponent(String(identifier))}`;
      case 'process':
        return `/api/processes/${identifier}`;
      case 'domain':
        return `/api/domains/${encodeURIComponent(String(identifier))}`;
      case 'specialization':
        return `/api/specializations/${encodeURIComponent(String(identifier))}`;
      default:
        return '';
    }
  }, [type, identifier]);

  return useQuery<T>(endpoint, {
    enabled: Boolean(identifier),
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  data: TData | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

/**
 * Hook for mutation operations (POST/PUT/DELETE)
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const [data, setData] = React.useState<TData | undefined>();
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Memoize callbacks to prevent infinite loops
  const optionsRef = React.useRef(options);
  React.useEffect(() => {
    optionsRef.current = options;
  });

  // Memoize mutation function to prevent infinite loops
  const mutationFnRef = React.useRef(mutationFn);
  React.useEffect(() => {
    mutationFnRef.current = mutationFn;
  });

  const reset = React.useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  const mutate = React.useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFnRef.current(variables);
        setData(result);
        optionsRef.current.onSuccess?.(result, variables);
        optionsRef.current.onSettled?.(result, null, variables);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        optionsRef.current.onError?.(errorObj, variables);
        optionsRef.current.onSettled?.(undefined, errorObj, variables);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    mutate,
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== undefined && error === null,
    reset,
  };
}

/**
 * Hook for triggering reindex
 */
export function useReindex(options: UseMutationOptions<void, { force?: boolean }> = {}) {
  return useMutation(
    async (variables) => {
      const response = await fetch('/api/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error?.message || 'Reindex failed');
      }
    },
    options
  );
}
