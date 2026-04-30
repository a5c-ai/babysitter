import { StreamEvent } from "@/hooks/use-event-stream";
interface EventStreamContextValue {
    connected: boolean;
    lastEvent: StreamEvent | null;
    error: string | null;
}
export declare function EventStreamProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useEventStreamContext(): EventStreamContextValue;
export {};
