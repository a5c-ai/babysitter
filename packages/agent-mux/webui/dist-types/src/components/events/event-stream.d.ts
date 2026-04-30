import type { JournalEvent } from "@/types";
interface EventStreamProps {
    events: JournalEvent[];
    onEventClick?: (event: JournalEvent) => void;
}
export declare const EventStream: import("react").NamedExoticComponent<EventStreamProps>;
export {};
