export interface StreamEvent {
    type: string;
    runId?: string;
    /** Batched runIds from leading-edge debounce (SSE broadcast level). */
    runIds?: string[];
    status?: string;
    timestamp?: number;
}
type EventCallback = (event: StreamEvent) => void;
export declare function subscribe(callback: EventCallback): () => void;
export declare function useEventStream(): {
    connected: boolean;
    lastEvent: StreamEvent | null;
    error: string | null;
};
export {};
