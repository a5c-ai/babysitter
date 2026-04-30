import { EventEmitter } from "events";
export declare const watcherEvents: EventEmitter<[never]>;
export type WatcherEventType = "run-changed" | "new-run" | "error";
export interface WatcherEvent {
    type: WatcherEventType;
    runDir: string;
    error?: Error;
}
export declare function initWatcher(): Promise<() => void>;
export declare function getWatcherStats(): {
    activeWatchers: number;
    watchedPaths: string[];
    pendingDebounces: number;
};
