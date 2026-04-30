import { StreamEvent } from "./use-event-stream";
interface UseSmartPollingOptions {
    interval?: number;
    sseFilter?: (event: StreamEvent) => boolean;
    enabled?: boolean;
    /** When true, suppress SSE-triggered refetches (used during catch-up mode). */
    suppressSseRefetch?: boolean;
}
export declare function useSmartPolling<T>(url: string, options?: UseSmartPollingOptions): {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};
export {};
