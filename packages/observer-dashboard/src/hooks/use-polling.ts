"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { resilientFetch } from "@/lib/fetcher";

interface UsePollingOptions {
  interval?: number;
  enabled?: boolean;
}

export function usePolling<T>(
  url: string,
  options: UsePollingOptions = {}
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
  const { interval = 2000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled && !!url);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const result = await resilientFetch<T>(url, { signal: abortRef.current.signal });
    if (!result.ok) {
      if (result.error.isAborted) return;
      if (mountedRef.current) {
        setError(result.error.message);
        setLoading(false);
      }
      return;
    }
    if (mountedRef.current) {
      setData(result.data);
      setError(null);
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || !url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchData();
    const id = setInterval(fetchData, interval);

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      clearInterval(id);
    };
  }, [fetchData, interval, enabled, url]);

  return { data, loading, error, refresh: fetchData };
}
