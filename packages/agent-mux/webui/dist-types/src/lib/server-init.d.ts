import { EventEmitter } from "events";
import { type WatcherEvent } from "./watcher";
export declare const serverEvents: EventEmitter<[never]>;
export declare const SSE_DEBOUNCE_MS = 500;
export interface BatchedRunChangedEvent {
    type: "run-changed";
    runIds: string[];
    runDirs: string[];
}
export declare function resetDebounceState(): void;
/**
 * Enqueue a run-changed event into the leading-edge debounce.
 *
 * Behaviour:
 *  1. If no window is open, emit immediately (leading edge) and open window.
 *  2. If window is already open, collect the runDir and reset the 500ms timer
 *     (trailing flush).
 */
export declare function enqueueRunChanged(event: WatcherEvent): void;
export declare function ensureInitialized(): Promise<void>;
export declare function shutdownServer(): Promise<void>;
export declare function getInitStatus(): {
    initialized: boolean;
    hasCleanup: boolean;
    serverEventListeners: number;
};
