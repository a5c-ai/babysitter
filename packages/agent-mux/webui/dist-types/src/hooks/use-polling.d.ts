interface UsePollingOptions {
    interval?: number;
    enabled?: boolean;
}
export declare function usePolling<T>(url: string, options?: UsePollingOptions): {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
};
export {};
