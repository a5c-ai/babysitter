/** Return true when err represents a "file/directory not found" filesystem error. */
export declare function isNotFoundError(err: unknown): boolean;
export interface WatchSource {
    path: string;
    depth: number;
    label?: string;
}
export interface KanbanConfig {
    sources: WatchSource[];
    port: number;
    pollInterval: number;
    theme: "dark" | "light";
    staleThresholdMs: number;
    recentCompletionWindowMs: number;
    retentionDays: number;
    hiddenProjects: string[];
}
export type ObserverConfig = KanbanConfig;
export declare function invalidateConfigCache(): void;
export declare function writeConfig(data: {
    sources: WatchSource[];
    pollInterval?: number;
    theme?: string;
    staleThresholdMs?: number;
    recentCompletionWindowMs?: number;
    retentionDays?: number;
    hiddenProjects?: string[];
}): Promise<void>;
export declare function getConfig(): Promise<KanbanConfig>;
