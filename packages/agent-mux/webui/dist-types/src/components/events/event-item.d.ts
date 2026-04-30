import type { JournalEvent } from "@/types";
interface EventItemProps {
    event: JournalEvent;
    onClick?: () => void;
}
export declare const EventItem: import("react").NamedExoticComponent<EventItemProps>;
export {};
